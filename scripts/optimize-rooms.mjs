/**
 * Interior intake pipeline.
 *
 *   npm run rooms
 *
 * Reads ./rooms (git-ignored drop folder), writes optimised WebP into
 * public/rooms, and merges entries into src/data/rooms.json, which the hero
 * slider reads. Adding an interior is: drop the file, run the command, write
 * one line of alt text.
 *
 * Two outputs per room, because the hero needs both:
 *   <name>.webp         full 16:9, desktop background
 *   <name>-mobile.webp  right-hand crop — on a phone the full frame renders
 *                       the panels too small to see, which is the whole point
 *                       of the shot.
 *
 * Safe to re-run: entries are matched by file name and keep their alt text.
 */
import { readdir, mkdir, readFile, writeFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "rooms";
const OUT = path.join("public", "rooms");
const DATA = path.join("src", "data", "rooms.json");

const MOBILE_CROP_FROM = 0.42;  // keep the right 58%, where the panels hang
const MOBILE_WIDTH = 900;
const QUALITY = 84;
const TARGET_RATIO = 16 / 9;
const MIN_WIDTH = 1400;

const INPUT_RE = /\.(png|jpe?g|webp|tiff?)$/i;

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  let files;
  try {
    files = (await readdir(SRC)).filter((f) => INPUT_RE.test(f)).sort();
  } catch {
    console.error(`No ./${SRC} folder — create it and drop the interiors there.`);
    process.exit(1);
  }
  if (!files.length) {
    console.error(`./${SRC} has no images.`);
    process.exit(1);
  }

  await mkdir(OUT, { recursive: true });

  let data = { rooms: [] };
  try {
    data = JSON.parse(await readFile(DATA, "utf8"));
  } catch {
    /* first run */
  }
  const byFile = new Map(data.rooms.map((r) => [r.file, r]));

  const added = [];
  const refreshed = [];
  const warnings = [];
  let srcBytes = 0;
  let outBytes = 0;

  for (const file of files) {
    const src = path.join(SRC, file);
    const name = slugify(path.basename(file, path.extname(file)));
    const meta = await sharp(src).metadata();

    // The hero crops to 16:9 on desktop. Anything squarer loses the top and
    // bottom of the room; anything wider loses the wall the panels are on.
    const ratio = meta.width / meta.height;
    if (Math.abs(ratio - TARGET_RATIO) > 0.06) {
      warnings.push(`${file} is ${meta.width}x${meta.height} (${ratio.toFixed(2)}:1) — the hero expects 16:9 (1.78:1)`);
    }
    if (meta.width < MIN_WIDTH) {
      warnings.push(`${file} is only ${meta.width}px wide — soft on a desktop hero, aim for ≥${MIN_WIDTH}px`);
    }

    await sharp(src).webp({ quality: QUALITY }).toFile(path.join(OUT, `${name}.webp`));
    await sharp(src)
      .extract({
        left: Math.round(meta.width * MOBILE_CROP_FROM),
        top: 0,
        width: Math.round(meta.width * (1 - MOBILE_CROP_FROM)),
        height: meta.height,
      })
      .resize({ width: MOBILE_WIDTH })
      .webp({ quality: QUALITY })
      .toFile(path.join(OUT, `${name}-mobile.webp`));

    srcBytes += (await stat(src)).size;
    for (const f of [`${name}.webp`, `${name}-mobile.webp`]) {
      outBytes += (await stat(path.join(OUT, f))).size;
    }

    if (byFile.has(name)) {
      refreshed.push(name);
      continue; // hand-written alt text left alone
    }
    data.rooms.push({
      file: name,
      alt: "TODO — name the posters on the wall and the room, e.g. \"Ferrari and Rolls-Royce metal posters in a Dubai living room\".",
    });
    added.push(name);
  }

  // Drop entries whose source file is gone, so a removed interior does not
  // leave the hero pointing at a missing image — and delete the WebP with it,
  // or dead files pile up in public/ and get deployed forever.
  const present = new Set(files.map((f) => slugify(path.basename(f, path.extname(f)))));
  const stale = data.rooms.filter((r) => !present.has(r.file)).map((r) => r.file);
  data.rooms = data.rooms.filter((r) => present.has(r.file));

  const orphans = [];
  for (const f of await readdir(OUT)) {
    const base = f.replace(/(-mobile)?\.webp$/, "");
    if (!f.endsWith(".webp") || present.has(base)) continue;
    await unlink(path.join(OUT, f));
    orphans.push(f);
  }

  await writeFile(DATA, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`\nConverted ${files.length} interior(s): ${kb(srcBytes)} → ${kb(outBytes)} ` +
    `(${(100 - (outBytes / srcBytes) * 100).toFixed(0)}% smaller)`);
  console.log(`Hero rooms: ${added.length} added, ${refreshed.length} refreshed, ${data.rooms.length} total`);
  if (added.length) console.log("\nAdded:\n  " + added.join("\n  "));
  if (stale.length) console.log(`\nRemoved (source gone):\n  ` + stale.join("\n  "));
  if (orphans.length) console.log(`Deleted orphaned files:\n  ` + orphans.join("\n  "));
  if (warnings.length) console.log(`\n⚠ ${warnings.join("\n⚠ ")}`);

  const todo = data.rooms.filter((r) => String(r.alt).startsWith("TODO")).length;
  if (todo) console.log(`\n${todo} room(s) still need alt text in ${DATA}.`);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
