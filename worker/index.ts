/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

function securityPolicy(url: URL, nonce?: string): string {
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const scriptSources = nonce
    ? [`'nonce-${nonce}'`, "'strict-dynamic'", "'self'"]
    : ["'self'", "'unsafe-inline'"];
  const styleSources = nonce ? ["'self'", `'nonce-${nonce}'`] : ["'self'", "'unsafe-inline'"];
  const connectSources = ["'self'"];

  if (isLocal) {
    scriptSources.push("'unsafe-eval'");
    styleSources.push("'unsafe-inline'");
    connectSources.push("ws://localhost:*", "ws://127.0.0.1:*");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src ${styleSources.join(" ")}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(url.protocol === "https:" && !isLocal ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function addSecurityHeaders(response: Response, url: URL, contentSecurityPolicy?: string): Response {
  const secured = new Response(response.body, response);

  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("X-Frame-Options", "DENY");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  secured.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  );
  secured.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  secured.headers.set("X-XSS-Protection", "0");
  secured.headers.set("X-DNS-Prefetch-Control", "off");
  secured.headers.delete("Server");
  secured.headers.delete("X-Powered-By");

  if (url.protocol === "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    secured.headers.set("Strict-Transport-Security", "max-age=31536000");
  }
  if (contentSecurityPolicy) {
    secured.headers.set("Content-Security-Policy", contentSecurityPolicy);
  }

  return secured;
}

function secureResponse(response: Response, url: URL): Response {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("text/html")) {
    return addSecurityHeaders(response, url);
  }

  if (typeof HTMLRewriter === "undefined") {
    return addSecurityHeaders(response, url, securityPolicy(url));
  }

  const nonce = createNonce();
  const rewritten = new HTMLRewriter()
    .on("script", {
      element(element) {
        element.setAttribute("nonce", nonce);
      },
    })
    .on("style", {
      element(element) {
        element.setAttribute("nonce", nonce);
      },
    })
    .transform(response);

  return addSecurityHeaders(rewritten, url, securityPolicy(url, nonce));
}

function isSensitivePath(url: URL): boolean {
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const rawPath = url.pathname.toLowerCase();
  let path = rawPath;

  try {
    path = decodeURIComponent(rawPath);
  } catch {
    return true;
  }

  if (/%2e/i.test(rawPath)) return true;

  const blockedFiles = new Set([
    "/package.json",
    "/package-lock.json",
    "/pnpm-lock.yaml",
    "/pnpm-workspace.yaml",
    "/tsconfig.json",
    "/vite.config.ts",
    "/next.config.ts",
    "/drizzle.config.ts",
    "/eslint.config.mjs",
    "/postcss.config.mjs",
    "/readme.md",
  ]);
  if (blockedFiles.has(path)) return true;

  const alwaysBlockedPrefixes = ["/.env", "/.git", "/.openai"];
  if (alwaysBlockedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }

  if (!isLocal) {
    const sourcePrefixes = [
      "/app",
      "/build",
      "/db",
      "/dist",
      "/drizzle",
      "/examples",
      "/node_modules",
      "/tests",
      "/worker",
    ];
    if (sourcePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return true;
    }
  }

  return false;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (isSensitivePath(url)) {
      return addSecurityHeaders(
        new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
        url,
      );
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return secureResponse(response, url);
    }

    const response = await handler.fetch(request, env, ctx);
    return secureResponse(response, url);
  },
};

export default worker;
