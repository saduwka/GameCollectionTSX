import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { validatePrerenderedHtml } from "./prerenderHtml.mjs";
import { absoluteUrl } from "./sitemap.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PREVIEW = "http://127.0.0.1:4173";

const fileFor = (route) =>
  route === "/"
    ? path.join(DIST, "index.html")
    : path.join(DIST, route.replace(/^\//, "").replace(/\/$/, ""), "index.html");

const snapshot = () => {
  const metas = [...document.head.querySelectorAll("meta")];
  const named = (name) => metas.filter((node) => node.getAttribute("name") === name);
  const counts = (nodes, key) => {
    const map = {};
    for (const node of nodes) {
      const id = node.getAttribute(key);
      if (!id) continue;
      map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  };
  const crumbs = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => node.textContent ?? "")
    .find((text) => text.includes("BreadcrumbList"));
  return {
    title: document.title,
    titles: document.head.querySelectorAll("title").length,
    description: named("description")[0]?.getAttribute("content") ?? "",
    descriptions: named("description").length,
    canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    canonicals: document.head.querySelectorAll('link[rel="canonical"]').length,
    og: counts(metas.filter((node) => node.getAttribute("property")?.startsWith("og:")), "property"),
    twitter: counts(metas.filter((node) => (node.getAttribute("name") ?? "").startsWith("twitter:")), "name"),
    ogImage: metas.find((node) => node.getAttribute("property") === "og:image")?.getAttribute("content") ?? "",
    applied: document.documentElement.getAttribute("data-seo-applied"),
    shell: document.head.querySelectorAll("[data-seo-shell]").length,
    crumbs: crumbs ?? "",
  };
};

const assertSingle = (snap, label) => {
  const problems = [];
  if (snap.titles !== 1) problems.push(`titles ${snap.titles}`);
  if (snap.descriptions !== 1 || !snap.description) problems.push(`descriptions ${snap.descriptions}`);
  if (snap.canonicals !== 1 || snap.canonical !== snap.applied) problems.push(`canonical ${snap.canonical}`);
  if (snap.shell !== 0) problems.push(`shell ${snap.shell}`);
  for (const [key, count] of Object.entries({ ...snap.og, ...snap.twitter })) {
    if (count !== 1) problems.push(`${key} ${count}`);
  }
  for (const key of ["og:title", "og:description", "og:type", "og:site_name", "og:url", "twitter:card", "twitter:title", "twitter:description"]) {
    const group = key.startsWith("og:") ? snap.og : snap.twitter;
    if (group[key] !== 1) problems.push(`missing ${key}`);
  }
  if (problems.length) throw new Error(`${label}: ${problems.join(", ")}`);
};

const waitForPreview = async () => {
  const started = Date.now();
  while (Date.now() - started < 20000) {
    try {
      const response = await fetch(PREVIEW);
      if (response.ok) return;
    } catch {
      // preview is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("vite preview did not start");
};

const preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
  cwd: ROOT,
  stdio: "inherit",
});

try {
  const gameId = (await readdir(path.join(DIST, "game"))).find((entry) => /^\d+$/.test(entry));
  if (!gameId) throw new Error("dist has no prerendered game");
  const routes = ["/", "/collections/short-evening/", `/game/${gameId}`];
  for (const route of routes) validatePrerenderedHtml(await readFile(fileFor(route), "utf8"), route);
  const collectionHtml = await readFile(fileFor("/collections/short-evening/"), "utf8");
  const head = collectionHtml.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "";
  console.log("\n--- saved collection head ---");
  console.log(head.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, ""));

  await waitForPreview();
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: "ru-RU" });
  const open = async (route) => {
    await page.goto(`${PREVIEW}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector(`html[data-seo-applied="${absoluteUrl(route)}"]`, { timeout: 45000 });
    await page.waitForSelector("h1", { timeout: 45000 });
    const snap = await page.evaluate(snapshot);
    assertSingle(snap, route);
    if (snap.canonical !== absoluteUrl(route)) throw new Error(`${route} canonical ${snap.canonical}`);
    return snap;
  };

  const home = await open("/");
  if (home.ogImage) throw new Error("home kept an og:image");
  const collection = await open("/collections/short-evening/");
  if (!collection.crumbs.includes("/collections/short-evening/")) {
    throw new Error("breadcrumb is missing the slashed collection url");
  }
  if (collection.ogImage) throw new Error("collection kept an og:image");

  const gameHref = await page.locator('a[href^="/game/"]').first().getAttribute("href");
  if (!gameHref) throw new Error("collection has no game link");
  await page.locator('a[href^="/game/"]').first().click();
  await page.waitForFunction(
    (previous) => document.documentElement.getAttribute("data-seo-applied") !== previous,
    collection.applied,
  );
  await page.waitForSelector("h1");
  const game = await page.evaluate(snapshot);
  assertSingle(game, "game navigation");
  if (game.title === collection.title || game.description === collection.description) {
    throw new Error("game page kept the collection title or description");
  }
  if (!game.ogImage) throw new Error("game page has no og:image");
  if (!game.canonical.startsWith(`${absoluteUrl("/").replace(/\/$/, "")}/game/`)) {
    throw new Error(`game canonical ${game.canonical}`);
  }

  await page.goBack();
  await page.waitForFunction(
    (url) => document.documentElement.getAttribute("data-seo-applied") === url,
    collection.canonical,
  );
  const returned = await page.evaluate(snapshot);
  assertSingle(returned, "collection return");
  if (returned.title !== collection.title || returned.description !== collection.description || returned.canonical !== collection.canonical) {
    throw new Error("collection tags were not restored");
  }
  if (returned.ogImage) throw new Error("og:image remained after leaving the game");

  const directGame = await open(gameHref);
  if (!directGame.ogImage) throw new Error("direct game page has no og:image");
  console.log("\n--- rendered collection head ---");
  console.log(JSON.stringify({
    title: returned.title,
    description: returned.description,
    canonical: returned.canonical,
    og: returned.og,
    twitter: returned.twitter,
  }, null, 2));
  await browser.close();
  console.log("rendered seo ok");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  preview.kill("SIGTERM");
}
