import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDirectories = [
  path.join(root, "public", "blog-media"),
  path.join(root, "public", "areas"),
  path.join(root, "site", "blog-media"),
  path.join(root, "site", "areas"),
];
const sourceExtensions = new Set([".jpg", ".jpeg", ".png"]);
const responsiveWidths = [480, 800, 1200];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    else if (sourceExtensions.has(path.extname(entry.name).toLowerCase())) files.push(entryPath);
  }
  return files;
}

async function optimizeImage(filename) {
  const extension = path.extname(filename).toLowerCase();
  const before = (await stat(filename)).size;
  const input = await readFile(filename);
  let pipeline = sharp(input, { failOn: "warning" })
    .autoOrient()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });

  if (extension === ".jpg" || extension === ".jpeg") {
    pipeline = pipeline.jpeg({ quality: 74, mozjpeg: true });
  } else if (extension === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 });
  }

  const optimized = await pipeline.toBuffer();
  const rewriteThreshold = extension === ".png" ? 800 * 1024 : 500 * 1024;
  const shouldRewriteSource = before > rewriteThreshold && optimized.length < before;
  if (shouldRewriteSource) await writeFile(filename, optimized);
  const after = shouldRewriteSource ? optimized.length : before;
  console.log(`${path.relative(root, filename)}: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);

  for (const width of responsiveWidths) {
    const suffix = width === 1200 ? "" : `-${width}`;
    const webpFilename = `${filename.slice(0, -extension.length)}${suffix}.webp`;
    const webp = await sharp(input, { failOn: "warning" })
      .autoOrient()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72, effort: 5 })
      .toBuffer();
    await writeFile(webpFilename, webp);
    console.log(`${path.relative(root, webpFilename)}: ${Math.round(webp.length / 1024)} KB`);
  }
}

const files = [];
for (const directory of mediaDirectories) {
  try {
    files.push(...await collectFiles(directory));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
for (const filename of files) await optimizeImage(filename);
console.log(`Optimized ${files.length} source image${files.length === 1 ? "" : "s"} and generated responsive WebP files.`);
