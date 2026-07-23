import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function waitForServer(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
  throw new Error("Lead API did not start");
}

test("stores valid same-origin leads and rejects cross-origin submissions", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "amy-leads-"));
  const database = path.join(directory, "leads.sqlite3");
  const port = 18788;
  const process = spawn("/usr/bin/python3", [path.join(root, "server/lead_api.py")], {
    env: {
      ...globalThis.process.env,
      LEAD_DATABASE: database,
      LEAD_HASH_SALT_FILE: path.join(directory, "hash-salt"),
      LEAD_PORT: String(port),
    },
    stdio: "ignore",
  });

  try {
    await waitForServer(`http://127.0.0.1:${port}/api/leads`);
    const payload = {
      name: "测试客户",
      contact: "wechat-example",
      intent: "自住",
      timeframe: "3至6个月",
      message: "希望了解 Katy",
      consent: true,
      website: "",
      startedAt: Date.now() - 4000,
    };

    const rejected = await fetch(`http://127.0.0.1:${port}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      body: JSON.stringify(payload),
    });
    assert.equal(rejected.status, 403);

    const accepted = await fetch(`http://127.0.0.1:${port}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://amyzhouhomes.net" },
      body: JSON.stringify(payload),
    });
    assert.equal(accepted.status, 201);
    assert.deepEqual(await accepted.json(), { ok: true });

    const exported = spawnSync(
      "/usr/bin/python3",
      [path.join(root, "server/export_leads.py")],
      { env: { ...globalThis.process.env, LEAD_DATABASE: database }, encoding: "utf8" },
    );
    assert.equal(exported.status, 0);
    assert.match(exported.stdout, /测试客户/);
    assert.match(exported.stdout, /wechat-example/);
    assert.doesNotMatch(exported.stdout, /ip_hash/);
  } finally {
    process.kill("SIGTERM");
    await rm(directory, { recursive: true, force: true });
  }
});
