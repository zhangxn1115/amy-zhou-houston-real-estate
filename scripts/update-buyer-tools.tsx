import { readFile, writeFile, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { BuyerTools } from "../app/BuyerTools";

// Update only this module: preserve the published homepage's other sections,
// recent blog entries, images, and hand-tuned production styles.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "site/index.html");
let html = await readFile(file, "utf8");
const start = html.match(/<section\b[^>]*\bid="houston"[^>]*>/);
const end = html.indexOf('<section class="services section"', start?.index ?? 0);
if (start?.index === undefined || end < start.index) throw new Error("Cannot locate homepage toolkit boundaries");
const markup = renderToStaticMarkup(<BuyerTools />);
html = html.slice(0, start.index) + markup + html.slice(end);
html = html.replace(/<link\b[^>]*href="\.?\/?buyer-tools\.css[^\"]*"[^>]*\/?>(?:<\/link>)?/g, "");
html = html.replace(/<script\b[^>]*src="\.?\/?buyer-tools\.js[^\"]*"[^>]*><\/script>/g, "");
html = html.replace("</head>", '<link rel="stylesheet" href="/buyer-tools.css?v=20260929-2"/><script type="module" src="/buyer-tools.js?v=20260929-2"></script></head>');
// The expanded Chinese vocabulary needs the new locale asset despite long caching.
html = html.replace(/locale\.js\?v=[^"']+/g, "locale.js?v=20260929-2");
await writeFile(file, html);
for (const asset of ["buyer-tools.css", "buyer-tools.js"]) await cp(path.join(root, "public", asset), path.join(root, "site", asset));
console.log("Updated the homepage buyer toolkit and versioned static assets.");
