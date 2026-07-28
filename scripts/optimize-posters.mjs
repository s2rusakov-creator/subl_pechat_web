/**
 * Poster intake pipeline.
 *
 *   npm run posters
 *
 * Reads whatever is in ./posters (the drop folder, git-ignored), writes
 * optimised WebP into public/posters, and merges catalogue entries into
 * src/data/posters.json.
 *
 * Why it exists: the source art arrives as ~2 MB PNGs — 62 MB for one batch,
 * which is unusable on a phone and has no business being in git. This is the
 * only step between "designer exported files" and "the shop has them".
 *
 * Safe to re-run. Existing entries are matched by image path and keep every
 * hand-written field (title, desc, alt, category); only genuinely new files
 * are appended. Nothing is ever deleted.
 */
import { readdir, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "posters";
const OUT = path.join("public", "posters");
const DATA = path.join("src", "data", "posters.json");

// One 900px-wide file covers every slot on the site: the grid renders at
// ~280px, the product page at 480px, the hero panel at ~400px. That is a
// ~1.9x buffer for retina without shipping a second set of files.
const MAX_WIDTH = 900;
const QUALITY = 82;

const INPUT_RE = /\.(png|jpe?g|webp|tiff?)$/i;

/** Filename → category. First match wins, so order matters. */
const CATEGORY_RULES = [
  [/dragon|castle|warrior|samurai|ninja|robot|humanoid/i, "Fantasy"],
  [/spaceship|saturn|nebula|galaxy|milky|andromeda|carina|planet|space/i, "Space"],
  [/raptor|f-22|jet|uh-60|helicopter/i, "Aviation"],
  [/dubai|tokyo|skyline|manhattan|marina|city|cyberpunk|street/i, "Cities"],
  // "ferr?ari" because an earlier export was spelled "Ferari" with one r.
  [/911|bugatti|ducati|ferr?ari|kawasaki|lamborghini|mclaren|rolls|porsche/i, "Cars"],
  [/nature|fuji|fjord|northern|alpine|mountain|ocean|yacht|sailing|eagle|lion|wolf|forest|desert|island/i, "Nature"],
];

function categoryFor(name) {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(name)) return cat;
  return null; // unknown — reported, never guessed
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Export-tool suffixes to drop, so a re-export lands on the same slug as the
 * file it replaces instead of creating a duplicate catalogue entry.
 *
 * Deliberately an explicit list, not a pattern like /v\d+$/ — that would turn
 * "Ducati Panigale V4" into "Ducati Panigale". Only add words here that can
 * never be part of a real poster name.
 */
const EXPORT_SUFFIX = /[-_ ]+(clean|cleaned|final|edited|edit|copy|no-?watermark|nowm)$/i;

/** "Ferari SF90 Spider-clean.png" → "Ferari SF90 Spider", spaces collapsed. */
function titleFrom(file) {
  let name = path.basename(file, path.extname(file)).replace(/\s+/g, " ").trim();
  // repeat: handles stacked suffixes such as "foo-clean-final"
  while (EXPORT_SUFFIX.test(name)) name = name.replace(EXPORT_SUFFIX, "").trim();
  return name;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  let files;
  try {
    files = (await readdir(SRC)).filter((f) => INPUT_RE.test(f)).sort();
  } catch {
    console.error(`No ./${SRC} folder — drop the exported artwork there first.`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.error(`./${SRC} has no images.`);
    process.exit(1);
  }

  await mkdir(OUT, { recursive: true });
  const data = JSON.parse(await readFile(DATA, "utf8"));
  const byImg = new Map(data.posters.map((p) => [p.img, p]));

  const added = [];
  const updated = [];
  const uncategorised = [];
  const portraitWarnings = [];
  let srcBytes = 0;
  let outBytes = 0;

  for (const file of files) {
    const src = path.join(SRC, file);
    const title = titleFrom(file);
    const slug = slugify(title);
    const outFile = path.join(OUT, `${slug}.webp`);
    const webPath = `/posters/${slug}.webp`;

    const image = sharp(src);
    const meta = await image.metadata();

    // The whole site frames posters at 3:4. A landscape source would be
    // centre-cropped to 41% of its width, so it is skipped outright rather
    // than quietly mangled — superseded exports left in the drop folder must
    // not silently reach the catalogue.
    if (meta.width > meta.height) {
      portraitWarnings.push(`${file} (${meta.width}x${meta.height})`);
      continue;
    }

    await image
      .resize({ width: Math.min(MAX_WIDTH, meta.width), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outFile);

    srcBytes += (await stat(src)).size;
    outBytes += (await stat(outFile)).size;

    const existing = byImg.get(webPath);
    if (existing) {
      updated.push(title);
      continue; // image refreshed; every hand-written field left alone
    }

    const category = categoryFor(file);
    if (!category) uncategorised.push(file);

    data.posters.push({
      title,
      category: category || "TODO",
      img: webPath,
      alt: `${title} — metal poster printed in Dubai`,
      desc: "TODO — write a real description before publishing.",
    });
    added.push(`${title} → ${category || "TODO"}`);
  }

  // Keep the category list in step with what the posters actually use.
  const used = [...new Set(data.posters.map((p) => p.category))].filter((c) => c !== "TODO");
  const order = ["Space", "Nature", "Cars", "Cities", "Fantasy", "Aviation"];
  data.categories = [
    ...order.filter((c) => used.includes(c)),
    ...used.filter((c) => !order.includes(c)).sort(),
  ];

  await writeFile(DATA, JSON.stringify(data, null, 2) + "\n");

  console.log(`\nConverted ${files.length} file(s): ${kb(srcBytes)} → ${kb(outBytes)} ` +
    `(${(100 - (outBytes / srcBytes) * 100).toFixed(0)}% smaller)`);
  console.log(`Catalogue: ${added.length} added, ${updated.length} image(s) refreshed, ` +
    `${data.posters.length} total`);
  if (added.length) console.log("\nAdded:\n  " + added.join("\n  "));
  if (uncategorised.length) {
    console.log(`\n⚠ No category rule matched — set these by hand in ${DATA}:\n  ` +
      uncategorised.join("\n  "));
  }
  if (portraitWarnings.length) {
    console.log(`\n⚠ SKIPPED — landscape source, and the site frames posters 3:4. ` +
      `Delete these from ./${SRC} once you have a portrait version:\n  ` +
      portraitWarnings.join("\n  "));
  }
  const todo = data.posters.filter((p) => String(p.desc).startsWith("TODO")).length;
  if (todo) console.log(`\n${todo} poster(s) still need a description.`);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
