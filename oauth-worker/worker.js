const CMS_ORIGIN = "https://amyzhouhomes.net";
const OAUTH_ORIGIN = "https://cms-auth.amyzhouhomes.net";
const STATE_COOKIE = "amy_cms_oauth_state";

function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function securityHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...extra,
  };
}

function readCookie(request, name) {
  const cookie = request.headers.get("Cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function constantTimeEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function errorResponse(message, status = 400) {
  return new Response(message, {
    status,
    headers: securityHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
  });
}

function handleAuth(url, env) {
  if (url.searchParams.get("provider") !== "github") {
    return errorResponse("Invalid OAuth provider");
  }
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return errorResponse("OAuth service is not configured", 503);
  }

  const state = randomToken();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_OAUTH_ID);
  authorize.searchParams.set("redirect_uri", `${OAUTH_ORIGIN}/callback?provider=github`);
  authorize.searchParams.set("scope", env.GITHUB_REPO_PRIVATE === "1" ? "repo" : "public_repo");
  authorize.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: securityHeaders({
      Location: authorize.toString(),
      "Set-Cookie": `${STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    }),
  });
}

function callbackPage(token) {
  const nonce = randomToken(18);
  const successMessage = JSON.stringify(`authorization:github:success:${JSON.stringify({ token })}`).replaceAll("<", "\\u003c");
  const origin = JSON.stringify(CMS_ORIGIN);
  const html = `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>正在登录博客后台</title></head>
<body><p>正在完成 GitHub 登录，请稍候……</p>
<script nonce="${nonce}">
const targetOrigin=${origin};
const successMessage=${successMessage};
const receiveMessage=(event)=>{
  if(event.origin!==targetOrigin)return;
  window.opener?.postMessage(successMessage,targetOrigin);
  window.removeEventListener("message",receiveMessage,false);
};
window.addEventListener("message",receiveMessage,false);
window.opener?.postMessage("authorizing:github",targetOrigin);
</script></body></html>`;

  return new Response(html, {
    headers: securityHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`,
      "Set-Cookie": `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    }),
  });
}

async function handleCallback(request, url, env) {
  if (url.searchParams.get("provider") !== "github") {
    return errorResponse("Invalid OAuth provider");
  }
  if (url.searchParams.get("error")) {
    return errorResponse("GitHub authorization was cancelled");
  }

  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const cookieState = readCookie(request, STATE_COOKIE);
  if (!code || !constantTimeEqual(state, cookieState)) {
    return errorResponse("Invalid OAuth callback state");
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: `${OAUTH_ORIGIN}/callback?provider=github`,
    }),
  });
  const payload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || typeof payload.access_token !== "string" || !payload.access_token) {
    return errorResponse("GitHub token exchange failed", 502);
  }
  return callbackPage(payload.access_token);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.origin !== OAUTH_ORIGIN) return errorResponse("Invalid host", 403);
    if (url.pathname === "/auth") return handleAuth(url, env);
    if (url.pathname === "/callback") return handleCallback(request, url, env);
    if (url.pathname === "/") {
      return new Response("Amy Zhou CMS OAuth service is healthy", {
        headers: securityHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
      });
    }
    return errorResponse("Not found", 404);
  },
};

export default worker;
