import { cp, readFile, writeFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { VideoPlaylist } from "../app/VideoPlaylist";

// Preserve production's latest blog entries and hand-tuned styles; replace only
// the video section instead of re-exporting the entire homepage.
const file = new URL("../site/index.html", import.meta.url);
let html = await readFile(file, "utf8");
const start = html.indexOf('<section class="videos section" id="videos">');
const end = html.indexOf('<section class="process section"', start);
if (start < 0 || end < start) throw new Error("Cannot locate homepage video section");
html = html.slice(0, start) + renderToStaticMarkup(<VideoPlaylist />) + html.slice(end);
html = html.replace('frame-src https://www.youtube-nocookie.com;', 'frame-src https://www.youtube.com https://www.youtube-nocookie.com;');
html = html.replace(/<link\b[^>]*href="\/?video-playlist\.css[^\"]*"[^>]*\/?>(?:<\/link>)?/g, "");
html = html.replace("</head>", '<link rel="stylesheet" href="/video-playlist.css?v=20261029-1"/></head>');
await writeFile(file, html);
await cp(new URL("../public/video-playlist.css", import.meta.url), new URL("../site/video-playlist.css", import.meta.url));
console.log("Updated homepage to Amy's automatically maintained YouTube uploads playlist.");
