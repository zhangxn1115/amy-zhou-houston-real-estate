import assert from "node:assert/strict";
import test from "node:test";
import worker from "../oauth-worker/worker.js";

const env = { GITHUB_OAUTH_ID: "test-client", GITHUB_OAUTH_SECRET: "test-secret", GITHUB_REPO_PRIVATE: "0" };

test("OAuth worker rejects invalid hosts and providers", async () => {
  const wrongHost = await worker.fetch(new Request("https://example.com/"), env);
  assert.equal(wrongHost.status, 403);

  const wrongProvider = await worker.fetch(new Request("https://cms-auth.amyzhouhomes.net/auth?provider=gitlab"), env);
  assert.equal(wrongProvider.status, 400);
  assert.equal(wrongProvider.headers.get("x-frame-options"), "DENY");
});

test("OAuth worker creates a scoped GitHub authorization request", async () => {
  const response = await worker.fetch(new Request("https://cms-auth.amyzhouhomes.net/auth?provider=github"), env);
  assert.equal(response.status, 302);
  assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly; Secure; SameSite=Lax/);

  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin, "https://github.com");
  assert.equal(location.pathname, "/login/oauth/authorize");
  assert.equal(location.searchParams.get("client_id"), "test-client");
  assert.equal(location.searchParams.get("scope"), "public_repo");
  assert.equal(location.searchParams.get("redirect_uri"), "https://cms-auth.amyzhouhomes.net/callback?provider=github");
  assert.ok((location.searchParams.get("state") ?? "").length >= 40);
});

test("OAuth worker rejects callbacks without a valid state cookie", async () => {
  const response = await worker.fetch(new Request("https://cms-auth.amyzhouhomes.net/callback?provider=github&code=test&state=wrong"), env);
  assert.equal(response.status, 400);
  assert.equal(await response.text(), "Invalid OAuth callback state");
});
