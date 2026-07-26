import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

test("renders the realtor site with defensive response headers", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    env,
    context,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const policy = response.headers.get("content-security-policy") ?? "";
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /frame-src https:\/\/www\.youtube\.com https:\/\/www\.youtube-nocookie\.com/);
  assert.match(policy, /https:\/\/www\.googletagmanager\.com/);
  assert.match(policy, /https:\/\/www\.google-analytics\.com/);

  const html = await response.text();
  const leadScript = await readFile(new URL("../public/lead-form.js", import.meta.url), "utf8");
  assert.match(html, /<title>休斯顿房产经纪 Amy Zhou/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /src="\/analytics\.js"/);
  assert.match(html, /property="og:title" content="休斯顿房产经纪 Amy Zhou"/);
  assert.match(html, /amy-zhou-wechat-share\.jpg/);
  assert.match(html, /favicon\.png/);
  assert.match(html, /favicon-32\.png/);
  assert.match(html, /favicon-16\.png/);
  assert.match(html, /apple-touch-icon\.png/);
  assert.match(html, /name="baidu-site-verification" content="codeva-Hb26Im9o4q"/);
  assert.match(html, /中文沟通｜休斯顿自住、投资、优质学区与社区置业服务/);
  assert.doesNotMatch(html, /href="tel:/);
  assert.match(html, /href="mailto:ningimeng12@gmail\.com"/);
  assert.match(html, /youtube-nocookie\.com\/embed\/videoseries\?list=UU1ymf6PCQwnLL8-ETiPteHw/);
  assert.match(html, /href="\/blog\/">阅读房产博客/);
  assert.match(html, /class="hero-latest"/);
  assert.match(html, /为什么我觉得休斯顿适合养老/);
  assert.match(html, /class="portrait-actions"/);
  assert.match(html, /class="hero-consult-button"/);
  assert.match(html, /class="hero-consult-row"/);
  assert.match(html, /在线咨询/);
  assert.doesNotMatch(html, /class="lead-fab"/);
  assert.match(html, /id="lead-dialog"/);
  assert.match(html, /action="\/api\/leads"/);
  assert.match(html, /name="website"/);
  assert.match(html, /option value="通勤"/);
  assert.match(html, /option value="学区"/);
  assert.match(html, /option value="投资"/);
  assert.match(html, /input(?=[^>]*name="name")(?=[^>]*maxLength="10")[^>]*>/);
  assert.match(html, /input(?=[^>]*name="contact")(?=[^>]*maxLength="30")[^>]*>/);
  assert.match(html, /最多5个汉字或10个英文字符/);
  assert.match(html, /textarea[^>]*maxLength="100"/);
  assert.match(html, /src="\/lead-form\.js"/);
  assert.match(leadScript, /addEventListener\("click", openDialog\)/);
  assert.doesNotMatch(leadScript, /setTimeout\(openDialog/);
  assert.ok(html.indexOf("License No. 839083") < html.indexOf("了解休斯顿房市"));
  assert.doesNotMatch(html, /youtube-nocookie\.com\/embed\/vpIqfneYAhk/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("blocks source, configuration, and secret paths", async () => {
  const worker = await loadWorker();
  const paths = [
    "/.env",
    "/.git/config",
    "/.openai/hosting.json",
    "/package.json",
    "/pnpm-lock.yaml",
  ];

  for (const path of paths) {
    const response = await worker.fetch(new Request(`http://localhost${path}`), env, context);
    assert.equal(response.status, 404, `${path} must not be public`);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  }
});
