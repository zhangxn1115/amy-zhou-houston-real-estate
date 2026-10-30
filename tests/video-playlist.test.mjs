import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("homepage contains one live uploads playlist, not a fixed video grid", async () => {
  const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const section = html.slice(html.indexOf('<section class="videos section"'), html.indexOf('<section class="process section"'));
  assert.equal((section.match(/<iframe\b/g) || []).length, 1);
  assert.doesNotMatch(section, /video-card|video-grid|video-thumbnails|autoplay=1/);
  assert.match(section, /data-video-playlist="UU1ymf6PCQwnLL8-ETiPteHw"/);
  const iframe = section.match(/<iframe\b[^>]*>/)?.[0];
  assert.ok(iframe);
  assert.match(iframe, /data-video-src="https:\/\/www.youtube.com\/embed\/videoseries\?list=UU1ymf6PCQwnLL8-ETiPteHw/);
  assert.doesNotMatch(iframe, /\ssrc=/);
  assert.match(iframe, /referrerPolicy="strict-origin-when-cross-origin"/i);
  assert.match(iframe, /loading="lazy"/);
  assert.match(section, /href="https:\/\/www.youtube.com\/playlist\?list=UU1ymf6PCQwnLL8-ETiPteHw"/);
  assert.match(html, /video-playlist.css\?v=20261029-1/);
  assert.equal(await readFile(new URL("../public/video-playlist.css", import.meta.url), "utf8"), await readFile(new URL("../site/video-playlist.css", import.meta.url), "utf8"));
});

test("playlist remains deferred until near the viewport", async () => {
  const script = await readFile(new URL("../public/video-lazy.js", import.meta.url), "utf8");
  const video = { src: "", dataset: { videoSrc: "https://www.youtube.com/embed/videoseries?list=UU1ymf6PCQwnLL8-ETiPteHw" } };
  let callback, observed;
  const unobserved = [];
  class Observer {
    constructor(fn) { callback = fn; }
    observe(value) { observed = value; }
    unobserve(value) { unobserved.push(value); }
  }
  vm.runInNewContext(script, {
    document: { querySelectorAll: (selector) => selector.startsWith("iframe") ? [video] : [] },
    window: { IntersectionObserver: Observer }, IntersectionObserver: Observer,
  });
  assert.equal(observed, video);
  assert.equal(video.src, "");
  callback([{ target: video, isIntersecting: false }]);
  assert.equal(video.src, "");
  callback([{ target: video, isIntersecting: true }]);
  assert.equal(video.src, video.dataset.videoSrc);
  assert.deepEqual(unobserved, [video]);
});
