import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("generates the blog index and SEO-ready article", async () => {
  const index = await read("../site/blog/index.html");
  const article = await read("../site/blog/2026-07-18-sugar-land-ryehill-price/index.html");
  const sitemap = await read("../site/sitemap.xml");

  assert.match(index, /Sugar Land RYEHILL小区最新房源信息/);
  assert.match(index, /rel="canonical" href="https:\/\/amyzhouhomes\.net\/blog\/"/);
  assert.match(index, /<style>:root\{--ink:/);
  assert.doesNotMatch(index, /rel="stylesheet" href="\/assets\/blog\.css/);
  assert.match(index, /style-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
  assert.match(index, /grid-template-columns:88px minmax\(0,1fr\) 88px/);
  assert.match(index, /\.article-author-qr\{grid-column:3;grid-row:1\/4/);
  const inlineStyle = index.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const declaredStyleHash = index.match(/style-src 'self' 'sha256-([A-Za-z0-9+/=]+)'/)?.[1] ?? "";
  assert.equal(createHash("sha256").update(inlineStyle).digest("base64"), declaredStyleHash);
  assert.match(index, /Content-Security-Policy/);
  assert.match(index, /object-src 'none'/);
  assert.match(article, /application\/ld\+json/);
  assert.match(article, /"@type":"BlogPosting"/);
  assert.match(article, /休斯顿房产经纪 Amy Zhou/);
  assert.match(article, /class="article-author-qr"/);
  assert.match(article, /Amy Zhou 微信二维码/);
  assert.match(article, /wechat-qr\.jpg/);
  assert.match(article, /rel="preload" href="\/blog-media\/_20260718140820_5_9\.webp" as="image" fetchpriority="high"/);
  assert.match(article, /<source srcset="\/blog-media\/_20260718140820_5_9\.webp" type="image\/webp">/);
  assert.match(article, /<meta name="keywords" content="[^"]*休斯顿华人房产经纪[^"]*休斯顿买房[^"]*休斯顿二手房/);
  assert.match(article, /<meta name="description" content="[^"]*休斯顿华人房产经纪[^"]*休斯顿购房[^"]*休斯顿新房[^"]*休斯顿看房/);
  assert.match(article, /"keywords":\["休斯顿华人房产经纪"/);
  assert.match(article, /"inLanguage":"zh-CN"/);
  const articleDeck = article.match(/<p class="article-deck">([^<]*)<\/p>/)?.[1] ?? "";
  assert.ok(articleDeck.length > 0);
  assert.match(articleDeck, /整理最新房源和优惠，陪你一起实地看房/);
  assert.doesNotMatch(articleDeck, /…$/);
  assert.doesNotMatch(article, /NEXT STEP|把信息变成适合您的选择/);
  assert.doesNotMatch(article, /<script>alert\(/);
  assert.match(sitemap, /https:\/\/amyzhouhomes\.net\/blog\/2026-07-18-sugar-land-ryehill-price\//);
  assert.match(sitemap, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.match(sitemap, /<image:loc>https:\/\/amyzhouhomes\.net\/blog-media\/_20260718140820_5_9\.jpg<\/image:loc>/);
});

test("ships a pinned Decap CMS admin configuration", async () => {
  const admin = await read("../site/admin/index.html");
  const config = await read("../site/admin/config.yml");

  assert.match(admin, /decap-cms@3\.14\.1/);
  assert.match(admin, /noindex, nofollow/);
  assert.match(config, /repo: zhangxn1115\/amy-zhou-houston-real-estate/);
  assert.match(config, /base_url: https:\/\/cms-auth\.amyzhouhomes\.net/);
  assert.match(config, /auth_endpoint: \/auth/);
  assert.match(config, /media_folder: public\/blog-media/);
  assert.match(config, /max_file_size: 12582912/);
  assert.match(config, /folder: content\/blog/);
  assert.match(config, /sortable_fields: \[date, title, category\]/);
  assert.match(config, /slug: "\{\{year\}\}-\{\{month\}\}-\{\{day\}\}-\{\{fields\.slug\}\}"/);
});

test("publishes a web-optimized copy of uploaded blog images", async () => {
  const source = await stat(new URL("../public/blog-media/_20260718140820_5_9.jpg", import.meta.url));
  const published = await stat(new URL("../site/blog-media/_20260718140820_5_9.jpg", import.meta.url));
  const webp = await stat(new URL("../site/blog-media/_20260718140820_5_9.webp", import.meta.url));

  assert.ok(published.size < source.size, "published image should be smaller than the CMS original");
  assert.ok(published.size < 1_500_000, "published image should be suitable for web delivery");
  assert.ok(webp.size < published.size, "modern browsers should receive an even smaller WebP cover");
});
