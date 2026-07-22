"use client";

import { useEffect, useState } from "react";

const traditionalCharacters: Record<string, string> = {
  "为":"為","华":"華","产":"產","经":"經","纪":"紀","业":"業","务":"務",
  "专":"專","属":"屬","沟":"溝","诚":"誠","赖":"賴","买":"買","卖":"賣",
  "区":"區","长":"長","划":"劃","规":"規","赁":"賃","选":"選","关":"關",
  "系":"係","体":"體","验":"驗","进":"進","过":"過","与":"與","从":"從",
  "到":"到","这":"這","个":"個","复":"複","杂":"雜","变":"變","清":"清",
  "决":"決","择":"擇","说":"說","话":"話","资":"資","讯":"訊","国":"國",
  "陆":"陸","湾":"灣","无":"無","论":"論","获":"獲","节":"節","奏":"奏",
  "适":"適","实":"實","时":"時","户":"戶","筛":"篩","签":"簽","约":"約",
  "钥":"鑰","顾":"顧","问":"問","联":"聯","电":"電","邮":"郵","号":"號",
  "码":"碼","开":"開","发":"發","现":"現","阶":"階","备":"備","发":"發",
  "间":"間","万":"萬","层":"層","维":"維","护":"護","亲":"親","达":"達",
  "习":"習","书":"書","门":"門","见":"見","给":"給","统":"統","记":"記",
  "简":"簡","繁":"繁","宁":"寧","拥":"擁","别":"別","还":"還","钥":"鑰",
};

const phraseReplacements: Array<[string, string]> = [
  ["休斯顿", "休士頓"],
  ["房地产", "房地產"],
  ["学区房", "學區房"],
  ["优质", "優質"],
  ["了解", "瞭解"],
  ["个人", "個人"],
  ["体验", "體驗"],
  ["里程", "里程"],
];

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function toTraditional(value: string) {
  let result = value;
  for (const [simple, traditional] of phraseReplacements) {
    result = result.split(simple).join(traditional);
  }
  return Array.from(result, (character) => traditionalCharacters[character] ?? character).join("");
}

function applyLocale(locale: "simplified" | "traditional") {
  const root = document.querySelector("main");
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const parent = node.parentElement;
    if (parent && !parent.closest("[data-locale-control]")) {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue ?? "");
      const source = originalText.get(node) ?? "";
      node.nodeValue = locale === "traditional" ? toTraditional(source) : source;
    }
    node = walker.nextNode() as Text | null;
  }

  root.querySelectorAll("[aria-label],[title]").forEach((element) => {
    if (!originalAttributes.has(element)) {
      const values = new Map<string, string>();
      for (const name of ["aria-label", "title"]) {
        const value = element.getAttribute(name);
        if (value) values.set(name, value);
      }
      originalAttributes.set(element, values);
    }
    originalAttributes.get(element)?.forEach((source, name) => {
      element.setAttribute(name, locale === "traditional" ? toTraditional(source) : source);
    });
  });

  document.documentElement.lang = locale === "traditional" ? "zh-Hant" : "zh-CN";
}

function preferredLocale(): "simplified" | "traditional" {
  const saved = window.localStorage.getItem("amy-site-locale");
  if (saved === "traditional" || saved === "simplified") return saved;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((language) => /zh-(TW|HK|MO|Hant)/i.test(language))
    ? "traditional"
    : "simplified";
}

export function AutoLocale() {
  const [locale, setLocale] = useState<"simplified" | "traditional">("simplified");

  useEffect(() => {
    const detected = preferredLocale();
    applyLocale(detected);
    const update = window.setTimeout(() => setLocale(detected), 0);
    return () => window.clearTimeout(update);
  }, []);

  function toggleLocale() {
    const next = locale === "simplified" ? "traditional" : "simplified";
    window.localStorage.setItem("amy-site-locale", next);
    setLocale(next);
    applyLocale(next);
  }

  return (
    <button
      type="button"
      className="locale-toggle"
      data-locale-control
      onClick={toggleLocale}
      aria-label={locale === "simplified" ? "切换为繁体中文" : "切換為簡體中文"}
    >
      <span className={locale === "simplified" ? "active" : ""}>简</span>
      <i />
      <span className={locale === "traditional" ? "active" : ""}>繁</span>
    </button>
  );
}
