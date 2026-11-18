import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { homeDisclosures } from "../app/site-disclosures.mjs";

const read = (path, encoding = "utf8") => readFile(new URL(path, import.meta.url), encoding);

test("homepage displays the two TREC disclosures in a noticeable footer block", async () => {
  const home = await read("../site/index.html");
  const footer = home.match(/<footer>[\s\S]*?<\/footer>/)?.[0] ?? "";
  assert.equal((footer.match(/data-home-disclosures="true"/g) ?? []).length, 1);
  assert.ok(footer.indexOf("footer-broker") < footer.indexOf("compliance-links"));
  for (const document of homeDisclosures) {
    assert.ok(footer.includes(`href="${document.href}"`));
    assert.ok(footer.includes(`>${document.title}</a>`));
    const source = await read(`../public${document.href}`, null);
    const published = await read(`../site${document.href}`, null);
    assert.equal(source.subarray(0, 5).toString(), "%PDF-");
    assert.deepEqual(published, source, "published PDFs must preserve their original bytes");
  }
  const css = await read("../site/assets/site.css");
  assert.match(css, /\.compliance-links a\{[^}]*font-size:16px/);
  assert.match(css, /\.compliance-links a\{[^}]*overflow-wrap:anywhere/);
});

test("does not add the homepage-only disclosures to blog pages", async () => {
  const pages = [await read("../site/blog/index.html")];
  for (const name of await readdir(new URL("../site/blog/", import.meta.url), { withFileTypes: true })) {
    if (name.isDirectory()) pages.push(await read(`../site/blog/${name.name}/index.html`));
  }
  for (const page of pages) {
    assert.doesNotMatch(page, /compliance-links|data-home-disclosures/);
    for (const document of homeDisclosures) assert.ok(!page.includes(document.href));
  }
});
