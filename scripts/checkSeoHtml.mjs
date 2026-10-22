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

const firstChild = async (dir) => {
  const entries = await readdir(dir);
  for (const entry of entries) {
    if ((await stat(path.join(dir, entry))).isDirectory()) return entry;
  }
  return null;
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
