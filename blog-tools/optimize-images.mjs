import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDirectory = path.join(root, "site", "blog-media");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    else if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) files.push(entryPath);
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
    pipeline = pipeline.jpeg({ quality: 72, mozjpeg: true });
  } else if (extension === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: 85 });
  } else if (extension === ".webp") {
    pipeline = pipeline.webp({ quality: 78, effort: 5 });
  } else if (extension === ".avif") {
    pipeline = pipeline.avif({ quality: 55, effort: 5 });
  }

  const optimized = await pipeline.toBuffer();
  if (optimized.length < before) await writeFile(filename, optimized);
  const after = Math.min(before, optimized.length);
  console.log(`${path.relative(root, filename)}: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);

  if (![".webp", ".avif"].includes(extension)) {
    const webpFilename = filename.slice(0, -extension.length) + ".webp";
    const webp = await sharp(input, { failOn: "warning" })
      .autoOrient()
      .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70, effort: 5 })
      .toBuffer();
    await writeFile(webpFilename, webp);
    console.log(`${path.relative(root, webpFilename)}: ${Math.round(webp.length / 1024)} KB`);
  }
}

const files = await collectFiles(mediaDirectory);
for (const filename of files) await optimizeImage(filename);
console.log(`Optimized ${files.length} blog image${files.length === 1 ? "" : "s"}.`);
