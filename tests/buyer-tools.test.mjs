import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateMortgage } from "../public/buyer-tools.js";

const example = { price: 400000, downPercent: 20, rate: 6.5, years: 30, taxRate: 2.5, insurance: 2400, hoa: 1200, pmi: 0 };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .01, `${actual} differs from ${expected}`);

test("mortgage includes principal/interest, tax, insurance, HOA and PMI", () => {
  const result = calculateMortgage(example);
  near(result.payment, 2022.617675);
  near(result.principal, 320000);
  near(result.downPayment, 80000);
  near(result.tax, 833.333333);
  near(result.insurance, 200);
  near(result.hoa, 100);
  near(result.total, 3155.951008);
  near(calculateMortgage({ ...example, pmi: 120 }).total, result.total + 120);
});

test("zero interest and all-cash cases remain finite", () => {
  near(calculateMortgage({ ...example, rate: 0 }).payment, 320000 / 360);
  const cash = calculateMortgage({ ...example, downPercent: 100, pmi: 80 });
  assert.equal(cash.payment, 0);
  assert.equal(cash.pmi, 0);
  near(cash.total, 1133.333333);
  assert.ok(Number.isFinite(calculateMortgage({ ...example, rate: .0000001 }).total));
});

test("rejects empty, malformed, negative and out-of-range input", () => {
  for (const value of [NaN, Infinity, -1, "", "400000", "<script>alert(1)</script>"]) {
    assert.throws(() => calculateMortgage({ ...example, price: value }), RangeError);
  }
  for (const changes of [{ downPercent: 101 }, { rate: 31 }, { price: 0 }, { years: 0 }, { years: 1.5 }, { taxRate: -1 }, { insurance: -1 }, { pmi: 100001 }]) {
    assert.throws(() => calculateMortgage({ ...example, ...changes }), RangeError);
  }
});

test("homepage exports four accessible tabs and preserves existing homepage content", async () => {
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.equal((html.match(/data-buyer-tab=/g) || []).length, 4);
  assert.equal((html.match(/data-buyer-panel=/g) || []).length, 4);
  assert.match(html, /德州购房工具箱/);
  assert.doesNotMatch(html, /01 \/ 认识休斯顿/);
  assert.match(html, /本地计算 · 不上传数据/);
  assert.match(html, /默认值仅为演示/);
  assert.match(html, /action="\/api\/leads"/);
  assert.match(html, /2026-09-29-eb5-texas-new-immigrants-buy-or-rent/);
  assert.equal((html.match(/<article class="video-card"/g) || []).length, 6);
  assert.match(html, /id="services"/);
  assert.match(html, /id="schools"/);
  for (const key of ["basic", "areas", "schools", "resources"]) {
    assert.match(html, new RegExp(`id="buyer-panel-${key}" aria-labelledby="buyer-tab-${key}"`));
  }
  for (const asset of ["buyer-tools.css", "buyer-tools.js"]) {
    assert.equal(await readFile(new URL(`../public/${asset}`, import.meta.url), "utf8"), await readFile(new URL(`../site/${asset}`, import.meta.url), "utf8"));
    assert.ok(html.includes(`/${asset}?v=20260929-1`));
  }
});

test("calculator keeps input local and renders no user-supplied HTML", async () => {
  const script = await readFile(new URL("../public/buyer-tools.js", import.meta.url), "utf8");
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|eval\s*\(/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /aria-selected/);
});
