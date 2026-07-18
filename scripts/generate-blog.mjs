import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDirectory = path.join(root, "content", "blog");
const publicMediaDirectory = path.join(root, "public", "blog-media");
const siteDirectory = path.join(root, "site");
const blogDirectory = path.join(siteDirectory, "blog");
const siteMediaDirectory = path.join(siteDirectory, "blog-media");
const origin = "https://amyzhouhomes.net";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseFrontmatter(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing frontmatter in ${filename}`);

  const data = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const property = lines[index].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!property) continue;
    const [, key, rawValue] = property;
    let value = rawValue.trim();

    if (/^[>|][+-]?$/.test(value)) {
      const folded = value.startsWith(">");
      const parts = [];
      while (index + 1 < lines.length && /^(?:\s{2,}|\t)/.test(lines[index + 1])) {
        index += 1;
        parts.push(lines[index].replace(/^(?:\s{2}|\t)/, ""));
      }
      data[key] = parts.join(folded ? " " : "\n").trim();
      continue;
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1); }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replaceAll("''", "'");
    } else if (value === "true" || value === "false") {
      value = value === "true";
    } else if (value === "null" || value === "~") {
      value = null;
    }
    data[key] = value;
  }

  return { data, content: source.slice(match[0].length) };
}

function renderInline(value) {
  const renderText = (text) => escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let output = "";
  let cursor = 0;

  for (const match of value.matchAll(linkPattern)) {
    output += renderText(value.slice(cursor, match.index));
    const href = match[2];
    if (/^(?:https?:\/\/|\/|#)/i.test(href) && !href.includes("..")) {
      const external = /^https?:\/\//i.test(href);
      output += `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${renderText(match[1])}</a>`;
    } else {
      output += renderText(match[0]);
    }
    cursor = match.index + match[0].length;
  }
  return output + renderText(value.slice(cursor));
}

function renderMarkdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let listType = "";
  let listItems = [];

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length) output.push(`<${listType}>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${listType}>`);
    listType = "";
    listItems = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const fence = line.match(/^```([A-Za-z0-9_-]*)\s*$/);
    if (fence) {
      flushParagraph();
      flushList();
      const code = [];
      while (index + 1 < lines.length && !/^```\s*$/.test(lines[index + 1])) {
        index += 1;
        code.push(lines[index]);
      }
      if (index + 1 < lines.length) index += 1;
      output.push(`<pre><code${fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered ?? ordered)[1]);
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      output.push(`<blockquote><p>${renderInline(quote[1])}</p></blockquote>`);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return output.join("\n");
}

function safeAssetUrl(value, fallback = "/og.png") {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (/^https:\/\//i.test(candidate)) return candidate;
  if (/^\/[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(candidate) && !candidate.includes("..")) return candidate;
  return fallback;
}

function safeVideoUrl(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(candidate) ? candidate : "";
}

function normalizeSlug(filename) {
  const slug = filename.replace(/\.md$/i, "").toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid blog filename: ${filename}. Use lowercase letters, numbers and hyphens.`);
  }
  return slug;
}

function parseDate(value, filename) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date in ${filename}`);
  return date;
}

function textExcerpt(content) {
  return content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

function readingMinutes(content) {
  const chineseCharacters = (content.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (content.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil((chineseCharacters + latinWords * 2) / 450));
}

function displayDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(date);
}

function absoluteUrl(value) {
  return value.startsWith("https://") ? value : `${origin}${value}`;
}

function localeButton() {
  return '<button type="button" class="locale-toggle" data-locale-control="true" aria-label="切换为繁体中文"><span class="active">简</span><i></i><span>繁</span></button>';
}

function pageHead({ title, description, canonical, image, type = "website" }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const imageUrl = escapeHtml(absoluteUrl(image));
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:site_name" content="Amy Zhou 休斯顿房产经纪">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${imageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${imageUrl}">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/blog.css?v=20260718-1">
  <script src="/analytics.js" defer></script>
  <script src="/locale.js" defer></script>
</head>`;
}

function siteHeader() {
  return `<header class="blog-header">
    <a class="blog-logo" href="/" aria-label="Amy Zhou 首页">
      <img src="/amy-zhou-homes-logo.png" alt="Amy Zhou Homes" width="768" height="512">
    </a>
    <nav aria-label="博客导航">
      <a href="/">网站首页</a>
      <a href="/blog/" aria-current="page">房产博客</a>
      <a href="/#contact">欢迎咨询</a>
    </nav>
  </header>`;
}

function siteFooter() {
  return `<footer class="blog-footer">
    <div><strong>AMY ZHOU</strong><span>HOUSTON REAL ESTATE</span></div>
    <p>为全球华人家庭提供休斯顿房产服务</p>
    <p>Texas Real Estate Sales Agent · License #839083</p>
  </footer>`;
}

async function loadPosts() {
  await mkdir(contentDirectory, { recursive: true });
  const filenames = (await readdir(contentDirectory)).filter((filename) => filename.endsWith(".md"));
  const posts = [];

  for (const filename of filenames) {
    const source = await readFile(path.join(contentDirectory, filename), "utf8");
    const { data, content } = parseFrontmatter(source, filename);
    if (data.draft === true) continue;

    const slug = normalizeSlug(filename);
    const date = parseDate(data.date, filename);
    const updated = data.updated ? parseDate(data.updated, filename) : date;
    const title = String(data.title ?? "").trim();
    if (!title) throw new Error(`Missing title in ${filename}`);

    const excerpt = String(data.excerpt ?? textExcerpt(content)).trim();
    posts.push({
      slug,
      title,
      excerpt,
      category: String(data.category ?? "休斯顿房产").trim(),
      cover: safeAssetUrl(data.cover),
      coverAlt: String(data.cover_alt ?? title).trim(),
      youtube: safeVideoUrl(data.youtube),
      featured: data.featured === true,
      date,
      updated,
      dateIso: date.toISOString(),
      updatedIso: updated.toISOString(),
      dateLabel: displayDate(date),
      readingMinutes: readingMinutes(content),
      body: renderMarkdown(content),
    });
  }

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function renderCards(posts) {
  if (!posts.length) return '<p class="blog-empty">第一篇文章正在准备中，欢迎稍后再来。</p>';
  return posts.map((post) => `<article class="blog-card">
    <a class="blog-card-image" href="/blog/${post.slug}/">
      <img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.coverAlt)}" loading="lazy" decoding="async">
    </a>
    <div class="blog-card-copy">
      <p class="blog-card-meta"><span>${escapeHtml(post.category)}</span><time datetime="${post.dateIso}">${post.dateLabel}</time></p>
      <h2><a href="/blog/${post.slug}/">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.excerpt)}</p>
      <a class="blog-read-link" href="/blog/${post.slug}/">阅读全文 <span>↗</span></a>
    </div>
  </article>`).join("\n");
}

function renderIndex(posts) {
  const title = "休斯顿房产博客｜Amy Zhou 房市、社区与学区指南";
  const description = "Amy Zhou 的休斯顿中文房产博客，分享大休斯顿房市动态、热门社区、优质学区、新房探访和买房知识。";
  return `${pageHead({ title, description, canonical: `${origin}/blog/`, image: "/og.png" })}
<body>
  <a class="skip-link" href="#blog-content">跳到博客内容</a>
  ${siteHeader()}
  <main id="blog-content">
    <section class="blog-hero">
      <p class="blog-eyebrow">AMY'S HOUSTON NOTES</p>
      <h1>休斯顿房产<br><em>观察与指南。</em></h1>
      <p>从房市趋势、社区生活到学区与买房流程，用中文分享值得长期参考的休斯顿置业信息。</p>
    </section>
    <section class="blog-list-section" aria-labelledby="latest-posts">
      <div class="blog-section-heading">
        <p>PROPERTY JOURNAL</p>
        <h2 id="latest-posts">最新文章</h2>
        <span>共 ${posts.length} 篇</span>
      </div>
      <div class="blog-grid">${renderCards(posts)}</div>
    </section>
    <section class="blog-consult">
      <div><p>LET'S TALK</p><h2>有具体的置业问题？</h2><span>欢迎通过微信或邮件与 Amy 中文沟通。</span></div>
      <a href="/#contact">欢迎咨询 <span>↗</span></a>
    </section>
  </main>
  ${siteFooter()}
  ${localeButton()}
</body>
</html>`;
}

function renderArticle(post) {
  const canonical = `${origin}/blog/${post.slug}/`;
  const videoLink = post.youtube
    ? `<p class="article-video-link"><a href="${escapeHtml(post.youtube)}" target="_blank" rel="noopener noreferrer">观看相关 YouTube 视频 <span>↗</span></a></p>`
    : "";
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.cover),
    datePublished: post.dateIso,
    dateModified: post.updatedIso,
    mainEntityOfPage: canonical,
    author: { "@type": "Person", name: "Amy Zhou", url: origin },
    publisher: { "@type": "RealEstateAgent", name: "Amy Zhou Houston Real Estate", url: origin },
  }).replaceAll("<", "\\u003c");

  return `${pageHead({
    title: `${post.title}｜Amy Zhou 休斯顿房产博客`,
    description: post.excerpt,
    canonical,
    image: post.cover,
    type: "article",
  })}
<body>
  <script type="application/ld+json">${structuredData}</script>
  <a class="skip-link" href="#article-content">跳到文章内容</a>
  ${siteHeader()}
  <main id="article-content">
    <article class="article-shell">
      <a class="article-back" href="/blog/">← 返回房产博客</a>
      <header class="article-header">
        <p class="article-category">${escapeHtml(post.category)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="article-deck">${escapeHtml(post.excerpt)}</p>
        <div class="article-meta"><span>Amy Zhou</span><time datetime="${post.dateIso}">${post.dateLabel}</time><span>${post.readingMinutes} 分钟阅读</span></div>
      </header>
      <figure class="article-cover"><img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.coverAlt)}" width="1200" height="675"></figure>
      <div class="article-layout">
        <aside class="article-author">
          <img src="/amy-zhou.jpg" alt="休斯顿房产经纪 Amy Zhou" width="1280" height="1920">
          <strong>Amy Zhou</strong>
          <span>休斯顿房产经纪</span>
          <small>License No. 839083</small>
        </aside>
        <div class="article-body">${post.body}${videoLink}
          <div class="article-disclaimer">本文用于提供一般市场与社区信息，不构成法律、税务、贷款或投资建议。房源、学区边界与市场数据可能变化，请以相关机构及交易时的最新资料为准。</div>
        </div>
      </div>
    </article>
    <section class="article-cta"><div><p>NEXT STEP</p><h2>把信息变成适合您的选择。</h2></div><a href="/#contact">欢迎咨询 Amy <span>↗</span></a></section>
  </main>
  ${siteFooter()}
  ${localeButton()}
</body>
</html>`;
}

function renderSitemap(posts) {
  const urls = [
    { loc: `${origin}/`, lastmod: new Date().toISOString().slice(0, 10), priority: "1.0", frequency: "weekly" },
    { loc: `${origin}/blog/`, lastmod: posts[0]?.updatedIso.slice(0, 10) ?? new Date().toISOString().slice(0, 10), priority: "0.9", frequency: "weekly" },
    ...posts.map((post) => ({
      loc: `${origin}/blog/${post.slug}/`,
      lastmod: post.updatedIso.slice(0, 10),
      priority: "0.8",
      frequency: "monthly",
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeHtml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.frequency}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>\n`;
}

async function buildBlog() {
  const posts = await loadPosts();
  await rm(blogDirectory, { recursive: true, force: true });
  await mkdir(blogDirectory, { recursive: true });
  await mkdir(siteMediaDirectory, { recursive: true });
  await cp(publicMediaDirectory, siteMediaDirectory, { recursive: true, force: true });

  await writeFile(path.join(blogDirectory, "index.html"), renderIndex(posts));
  await writeFile(path.join(blogDirectory, "index.json"), JSON.stringify(posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    cover: post.cover,
    date: post.dateIso,
  })), null, 2));

  for (const post of posts) {
    const postDirectory = path.join(blogDirectory, post.slug);
    await mkdir(postDirectory, { recursive: true });
    await writeFile(path.join(postDirectory, "index.html"), renderArticle(post));
  }

  await writeFile(path.join(siteDirectory, "sitemap.xml"), renderSitemap(posts));
  console.log(`Generated ${posts.length} blog post${posts.length === 1 ? "" : "s"}.`);
}

await buildBlog();
