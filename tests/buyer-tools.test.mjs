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

test("homepage exports five accessible tabs and preserves existing homepage content", async () => {
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.equal((html.match(/data-buyer-tab=/g) || []).length, 5);
  assert.equal((html.match(/data-buyer-panel=/g) || []).length, 5);
  const basic = html.slice(html.indexOf('id="buyer-panel-basic"'), html.indexOf('id="buyer-panel-mortgage"'));
  assert.doesNotMatch(basic, /data-mortgage-form/);
  const mortgage = html.slice(html.indexOf('id="buyer-panel-mortgage"'), html.indexOf('id="buyer-panel-areas"'));
  assert.match(mortgage, /data-mortgage-form/);
  assert.match(html, /德州购房工具箱/);
  assert.doesNotMatch(html, /01 \/ 认识休斯顿/);
  assert.match(html, /本地计算 · 不上传数据/);
  assert.match(html, /默认值仅为演示/);
  assert.match(html, /action="\/api\/leads"/);
  assert.match(html, /2026-09-29-eb5-texas-new-immigrants-buy-or-rent/);
  assert.equal((html.match(/class="video-playlist"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="(?:services|schools)"/);
  assert.doesNotMatch(html, /查看生活区图文介绍|02 \/ 华人生活区|03 \/ 学区选择/);
  assert.match(html, /href="#buyer-panel-areas"/);
  assert.match(html, /href="#buyer-panel-schools"/);
  assert.match(html, /02 \/ 视频解读/);
  assert.match(html, /03 \/ 服务流程/);
  assert.match(html, /04 \/ 房产博客/);
  assert.equal((html.match(/class="buyer-card buyer-resource"/g) || []).length, 3);
  assert.match(html, /TITLE COMPANY/);
  assert.match(html, /咨询产权公司/);
  assert.doesNotMatch(html, /联系人资料待补充/);
  for (const key of ["basic", "mortgage", "areas", "schools", "resources"]) {
    assert.match(html, new RegExp(`id="buyer-panel-${key}" aria-labelledby="buyer-tab-${key}"`));
  }
  for (const asset of ["buyer-tools.css", "buyer-tools.js"]) {
    assert.equal(await readFile(new URL(`../public/${asset}`, import.meta.url), "utf8"), await readFile(new URL(`../site/${asset}`, import.meta.url), "utf8"));
    assert.ok(html.includes(`/${asset}?v=20260929-4`));
  }
});

test("crime and safety card includes the city and county resources with clear labels", async () => {
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const card = html.match(/<article class="buyer-card"><span class="buyer-eyebrow">SAFETY<\/span>.*?<\/article>/s)?.[0];
  assert.ok(card);
  const links = [...card.matchAll(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">([^<]+)<span/g)];
  assert.deepEqual(links.map(([, href, label]) => [href, label]), [
    ["https://www.houstontx.gov/police/cs/index-2.htm", "休斯顿警局犯罪查询"],
    ["https://www.sugarlandtx.gov/619/Crime-Map", "糖城 Sugar Land · 犯罪地图"],
    ["https://www.cityofkaty.com/government/city-departments/police-department/records-and-communications", "Katy · 警局记录申请"],
    ["https://hcsop2c.cad.hctx.net/", "Cypress · Harris County 事件查询"],
    ["https://www.fulsheartexas.gov/about-us/departments-h-z/police/crime-reports/racial-profiling-reports", "Fulshear · 警局年报"],
    ["https://www.richmondtx.gov/departments/police-department/support-services", "Richmond · 警局记录申请"],
    ["https://www.fortbendcountytx.gov/government/departments/sheriff-s-office/information/criminal-statistics", "Fort Bend County · 犯罪地图"],
  ]);
  assert.match(card, /邮寄地址上的城市名不等于市界/);
  assert.match(card, /无记录不等于无风险/);
});

test("public homepage describes address lookup tools in search metadata and visible content", async () => {
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>休斯顿房产经纪 Amy Zhou｜买房查询工具<\/title>/);
  const descriptions = [...html.matchAll(/<meta name="description" content="([^"]+)"/g)];
  assert.equal(descriptions.length, 1);
  const description = descriptions[0][1];
  assert.match(description, /按房屋地址查学区、周边治安记录、FEMA 洪水风险和供水单位/);
  assert.match(description, /房贷计算器估算月供/);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)[1])["@graph"];
  assert.equal(graph.find((node) => node["@type"] === "WebSite").description, description);
  assert.match(graph.find((node) => node["@type"] === "RealEstateAgent").description, /中文自住买房/);
  assert.match(html, /<link rel="canonical" href="https:\/\/amyzhouhomes\.net\/"/);
  assert.match(html, /<h2 id="buyer-tools-title">休斯顿买房<span>查询工具箱<\/span><\/h2>/);
  assert.match(html, /href="\/blog\/2026-07-20-houston-homebuyer-research-tools\/">阅读休斯顿买房查询指南/);
  assert.match(html, /<h3>休斯顿学区查询<\/h3>/);
  assert.match(html, /href="https:\/\/tea\.texas\.gov\/families-and-students\/school-district-locator\/school-district-locator"/);
});

test("move-in card distinguishes water district lookup from city utility signup", async () => {
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const card = html.match(/<article class="buyer-card"><span class="buyer-eyebrow">MOVE-IN ESSENTIALS<\/span>.*?<\/article>/s)?.[0];
  assert.ok(card);
  const links = [...card.matchAll(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">([^<]+)<span/g)];
  assert.deepEqual(links.map(([, href, label]) => [href, label]), [
    ["https://www.puc.texas.gov/industry/water/utilities/map.aspx", "德州供水与污水服务区地图"],
    ["https://houstonpublicworks.org/utility-billing", "休斯顿市 · 供水开通"],
    ["https://www.sugarlandtx.gov/320/StartCancel-Water-and-Garbage-Recycling-", "糖城 Sugar Land · 市供水开通"],
    ["https://www.cityofkaty.com/residents/utilities-services", "Katy · 市供水开通"],
    ["https://www.tceq.texas.gov/gis/iwudview.html", "Cypress · 按地址查水务区（MUD）"],
    ["https://www.fulsheartexas.gov/about-us/departments-h-z/utility-billing/forms", "Fulshear · 市供水开通表格"],
    ["https://www.richmondtx.gov/departments/customer-service/start-cancel-utility-services", "Richmond · 市供水开通及服务范围"],
    ["https://www.powertochoose.org/", "电力方案比较 · Power to Choose"],
    ["https://move.centerpointenergy.com/", "CenterPoint 燃气开通"],
  ]);
  assert.match(card, /完整地址查供水服务区/);
  assert.match(card, /邮寄地址上的城市名不代表由该市供水/);
});

test("calculator keeps input local and renders no user-supplied HTML", async () => {
  const script = await readFile(new URL("../public/buyer-tools.js", import.meta.url), "utf8");
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|eval\s*\(/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /aria-selected/);
});
