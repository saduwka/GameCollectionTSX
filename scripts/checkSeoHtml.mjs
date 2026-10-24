import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://gamecollection-ff71a.web.app";

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const checkSeoHtml = (html, { minText = false } = {}) => {
  const problems = [];
  const titles = [...html.matchAll(/<title\b[^>]*>([^<]*)<\/title>/gi)].map((match) => match[1].trim()).filter(Boolean);
  const descriptions = [...html.matchAll(/<meta\b[^>]*\bname="description"[^>]*>/gi)];
  const canonicals = [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)];
  const h1s = [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
  const description = descriptions[0]?.[0].match(/\bcontent="([^"]*)"/)?.[1]?.trim() ?? "";
  const href = canonicals[0]?.[0].match(/\bhref="([^"]*)"/)?.[1] ?? "";

  if (titles.length !== 1) problems.push(`title ${titles.length}`);
  if (descriptions.length !== 1 || !description) problems.push("description");
  if (h1s.length !== 1) problems.push(`h1 ${h1s.length}`);
  if (canonicals.length !== 1 || !href.startsWith(ORIGIN) || href.includes("?")) problems.push(`canonical ${href}`);
  if (/name="robots"[^>]*content="[^"]*noindex/i.test(html)) problems.push("noindex");
  if (!/<a\b[^>]*\bhref="\/[^"]*"/i.test(html)) problems.push("links");
  if (minText && visibleText(html).length < 300) problems.push(`text ${visibleText(html).length}`);
  return problems;
};

const readHtml = (route) => {
  const file = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
  return readFile(file, "utf8");
};

const walkHtml = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkHtml(full)));
    else if (entry.name === "index.html" || entry.name === "spa.html") files.push(full);
  }
  return files;
};

const checkBrand = (html, file) => {
  const problems = [];
  const names = [...html.matchAll(/<meta\b[^>]*\bproperty="og:site_name"[^>]*>/gi)];
  const value = names[0]?.[0].match(/\bcontent="([^"]*)"/)?.[1] ?? "";
  if (names.length !== 1 || value !== "Gamevening") problems.push(`og:site_name ${names.length} ${value}`);
  const about = path.resolve(file) === path.join(DIST, "about", "index.html");
  if (!about && html.includes("PlayHub")) problems.push("PlayHub");
  if (about && !html.includes("PlayHub")) problems.push("about missing PlayHub");
  return problems;
};

const firstChild = async (dir) => {
  const entries = await readdir(dir);
  for (const entry of entries) {
    if ((await stat(path.join(dir, entry))).isDirectory()) return entry;
  }
  return null;
};

const descriptionOf = (html) =>
  html.match(/<meta\b[^>]*\bname="description"[^>]*\bcontent="([^"]*)"/i)?.[1] ??
  html.match(/<meta\b[^>]*\bcontent="([^"]*)"[^>]*\bname="description"/i)?.[1] ??
  "";

const assertGameDescriptions = async () => {
  const dir = path.join(DIST, "game");
  const ids = (await readdir(dir)).filter((entry) => /^\d+$/.test(entry));
  const rows = [];
  for (const id of ids) {
    const html = await readFile(path.join(dir, id, "index.html"), "utf8");
    rows.push({ id, description: descriptionOf(html) });
  }
  const counts = new Map();
  for (const row of rows) counts.set(row.description, (counts.get(row.description) ?? 0) + 1);
  const collisions = rows.filter((row) => counts.get(row.description) > 1);
  if (rows.length !== 300) throw new Error(`game descriptions ${rows.length}, expected 300`);
  if (collisions.length) {
    throw new Error(`duplicate game descriptions: ${collisions.map((row) => row.id).join(", ")}`);
  }
  const gta = rows.find((row) => row.id === "3498");
  if (!gta?.description.includes("Платформы:")) throw new Error("GTA V description has no platforms");
  const takesTwo = await readFile(path.join(dir, "455597", "index.html"), "utf8");
  if (!takesTwo.includes('href="/collections/coop-pc/"')) throw new Error("It Takes Two has no coop collection link");
};

const main = async () => {
  const gameId = await firstChild(path.join(DIST, "game"));
  const platformId = await firstChild(path.join(DIST, "platform"));
  const genre = await firstChild(path.join(DIST, "genre"));
  if (!gameId || !platformId || !genre) {
    throw new Error("dist is missing a prerendered game, platform, or genre page");
  }

  const pages = [
    ["/", false],
    ["/games", false],
    [`/game/${gameId}`, true],
    [`/platform/${platformId}`, true],
    [`/genre/${genre}`, true],
  ];
  const failures = [];
  for (const [route, minText] of pages) {
    const problems = checkSeoHtml(await readHtml(route), { minText });
    if (problems.length) failures.push(`${route}: ${problems.join(", ")}`);
    else console.log(`ok ${route}`);
  }
  for (const file of await walkHtml(DIST)) {
    const problems = checkBrand(await readFile(file, "utf8"), file);
    if (problems.length) failures.push(`${path.relative(DIST, file)}: ${problems.join(", ")}`);
  }
  await assertGameDescriptions();
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  }
};

const executed = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executed) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
