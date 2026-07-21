import { readFile, writeFile } from "node:fs/promises";

const sourcePath = process.argv[2] ?? "/tmp/amy-index.html";
const outputPath = process.argv[3] ?? "site/index.html";
const siteUrl = "https://amyzhouhomes.net";
const staticStylesheet = '<link rel="stylesheet" href="./assets/site.css?v=20260721-1"/>';

let html = await readFile(sourcePath, "utf8");

// Keep the fully rendered page and structured data, but remove vinext's
// server-navigation payload. GitHub Pages serves this site as static HTML.
html = html.replace(/<script(?![^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/g, "");
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*\/?>/g, "");
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*\/?>/g, "");
html = html.replaceAll("https://127.0.0.1:3000", siteUrl);
html = html.replaceAll('href="/favicon.svg"', 'href="./favicon.svg"');
html = html.replaceAll('href="/amy-zhou.jpg"', 'href="./amy-zhou.jpg"');
html = html.replaceAll('href="/wechat-qr.jpg"', 'href="./wechat-qr.jpg"');
html = html.replaceAll('src="/amy-zhou.jpg"', 'src="./amy-zhou.jpg"');
html = html.replaceAll('src="/amy-zhou-homes-logo.png"', 'src="./amy-zhou-homes-logo.png"');
html = html.replaceAll('src="/wechat-qr.jpg"', 'src="./wechat-qr.jpg"');
html = html.replaceAll('src="/areas/', 'src="./areas/');
html = html.replace(/ nonce="[^"]+"/g, "");
html = html.replace(
  '<meta charSet="utf-8"/>',
  '<meta charSet="utf-8"/><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' https://www.googletagmanager.com; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https://www.google-analytics.com https://www.googletagmanager.com; font-src \'self\' data:; connect-src \'self\' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com; frame-src https://www.youtube-nocookie.com; object-src \'none\'; base-uri \'self\'; form-action \'self\'; upgrade-insecure-requests"><meta name="referrer" content="strict-origin-when-cross-origin">'
);
html = html.replace(
  "</head>",
  `${staticStylesheet}<script src="./analytics.js" defer></script><script src="./locale.js" defer></script></head>`
);

if (!html.includes(staticStylesheet) || /href="\/assets\/index-[^"]+\.css"/.test(html)) {
  throw new Error("Static stylesheet export failed");
}

await writeFile(outputPath, html);
console.log(`Exported ${outputPath} for ${siteUrl}/`);
