import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { canonicalPathname } from "./canonicalPath.mjs";
import { collectionSlugs, pinnedGameIds } from "./collectionIndex.mjs";
import { CATALOG_PAGES, GAME_LIMIT, GENRE_PAGES, genres, platforms } from "./publicLinks.mjs";
import { absoluteUrl, sitemapDocuments } from "./sitemap.mjs";
import { stripShellSeo, validatePrerenderedHtml } from "./prerenderHtml.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_FILE = path.join(ROOT, "cache/rawg/urls.json");
const DIST = path.join(ROOT, "dist");
const PREVIEW_ORIGIN = "http://127.0.0.1:4173";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/faq",
  "/games",
  "/platforms",
  ...collectionSlugs.map((slug) => `/collections/${slug}/`),
  ...genres.map((genre) => `/genre/${genre.slug}`),
  ...platforms.map((platform) => `/platform/${platform.id}`),
  ...genres.flatMap((genre) =>
    Array.from({ length: GENRE_PAGES - 1 }, (_, index) => `/genre/${genre.slug}/page/${index + 2}`),
  ),
];
// GAME_LIMIT is 300. The game budget is 9 minutes, and further pages would be thin RAWG copies.
const GAME_BUDGET_MS = 9 * 60 * 1000;

const readProxyUrl = async () => {
  const fromProcess = process.env.RAWG_PROXY_URL?.trim() || process.env.VITE_RAWG_PROXY_URL?.trim();
  if (fromProcess) return fromProcess.replace(/\/$/, "");
  try {
    const envFile = await readFile(path.join(ROOT, ".env"), "utf8");
    const line = envFile.split("\n").find((entry) => entry.startsWith("VITE_RAWG_PROXY_URL="));
    const value = line?.slice("VITE_RAWG_PROXY_URL=".length).trim();
    if (value) return value.replace(/\/$/, "");
  } catch {
    // URL cache can be reused without the proxy
  }
  throw new Error("VITE_RAWG_PROXY_URL is missing from the environment");
};

const rawg = async (proxyUrl, pathname) => {
  const response = await fetch(`${proxyUrl}${pathname}`);
  if (!response.ok) throw new Error(`RAWG ${pathname} failed: ${response.status}`);
  return response.json();
};

const toCard = (raw) => ({
  id: raw.id,
  name: raw.name,
  description: "",
  background_image: raw.background_image || "",
  rating: raw.rating ?? 0,
  playtime: raw.playtime || 0,
  added: raw.added ?? 0,
  platforms: (raw.platforms || []).map((item) => ({
    platform: {
      id: item.platform.id,
      name: item.platform.name,
      slug: item.platform.slug || "",
    },
  })),
  released: raw.released || "Unknown",
  genres: (raw.genres || []).map((genre) => genre.name),
  coverUrl: raw.background_image || "",
  screenshots: [],
  trailers: [],
  stores: [],
  parentPlatforms: [],
  tags: [],
});

const pinCards = async (cards, proxyUrl) => {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const missing = pinnedGameIds.filter((id) => !byId.has(id));
  if (missing.length) {
    const details = await Promise.all(missing.map((id) => rawg(proxyUrl, `/games/${id}`).catch(() => null)));
    for (const raw of details) {
      if (raw?.id) byId.set(raw.id, toCard(raw));
    }
  }
  const pinned = pinnedGameIds.map((id) => byId.get(id)).filter(Boolean);
  const rest = cards.filter((card) => !pinnedGameIds.includes(card.id));
  return [...pinned, ...rest].slice(0, GAME_LIMIT);
};

const loadRoutes = async () => {
  const catalogFile = path.join(ROOT, "cache/rawg/catalog.json");
  try {
    const cached = JSON.parse(await readFile(CACHE_FILE, "utf8"));
    const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
    const ids = catalog.games?.map((game) => game.id) ?? [];
    const coversPins = pinnedGameIds.every((id) => ids.includes(id));
    if (
      cached.games?.length === GAME_LIMIT &&
      ids.length === GAME_LIMIT &&
      ids.every((id, index) => id === cached.games[index]) &&
      coversPins
    ) {
      await writeFile(path.join(DIST, "catalog.json"), JSON.stringify(catalog));
      return cached;
    }
  } catch {
    // cache is created on the first successful fetch
  }

  const proxyUrl = await readProxyUrl();
  const gamePages = Array.from({ length: CATALOG_PAGES }, (_, index) => index + 1);
  const lists = await Promise.all(
    gamePages.map((page) => rawg(proxyUrl, `/games?ordering=-added&page_size=20&page=${page}`)),
  );
  const cards = await pinCards(lists.flatMap((page) => page.results ?? []).map(toCard), proxyUrl);
  const routes = {
    games: cards.map((game) => game.id),
    platforms: platforms.map((platform) => platform.id),
    genres: genres.map((genre) => genre.slug),
  };

  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(routes, null, 2));
  const catalog = JSON.stringify({ games: cards });
  await writeFile(catalogFile, catalog);
  await writeFile(path.join(DIST, "catalog.json"), catalog);
  return routes;
};

const routeList = (routes) => {
  const pages = Math.ceil(routes.games.length / 20);
  const catalogPages = Array.from({ length: Math.max(0, pages - 1) }, (_, index) => `/games/page/${index + 2}`);
  return [...STATIC_ROUTES, ...catalogPages, ...routes.games.map((id) => `/game/${id}`)].map((route) => canonicalPathname(route));
};

const outputFile = (route) => {
  if (route === "/") return path.join(DIST, "index.html");
  return path.join(DIST, route.replace(/^\//, "").replace(/\/$/, ""), "index.html");
};

const waitForPreview = async () => {
  const started = Date.now();
  let lastError = "no response";
  while (Date.now() - started < 20000) {
    try {
      const response = await fetch(PREVIEW_ORIGIN);
      if (response.ok) return;
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`vite preview did not start: ${lastError}`);
};

const preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
  cwd: ROOT,
  stdio: "inherit",
});

try {
  const shell = await readFile(path.join(DIST, "index.html"), "utf8");
  if (!shell.includes('<div id="root"></div>')) {
    throw new Error("dist/index.html is already prerendered. Run vite build before this script.");
  }
  await writeFile(path.join(DIST, "spa.html"), shell);

  const routes = routeList(await loadRoutes());
  // Keep the Vite shell in place until every other URL is captured.
  const ordered = [...routes.filter((route) => route !== "/"), "/"];
  const startedAt = Date.now();
  await waitForPreview();
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ru-RU" });
  const failures = [];
  const written = [];

  for (const route of ordered) {
    if (route.startsWith("/game/") && Date.now() - startedAt > GAME_BUDGET_MS) {
      console.log(`skipped ${route}: game budget`);
      continue;
    }
    const page = await context.newPage();
    try {
      await page.goto(`${PREVIEW_ORIGIN}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForSelector('[data-seo-ready="true"]', { timeout: 45000 });
      await page.waitForSelector(`html[data-seo-applied="${absoluteUrl(route)}"]`, { timeout: 10000 });
      await page.waitForSelector("h1", { timeout: 10000 });
      const html = stripShellSeo(await page.content());
      validatePrerenderedHtml(html, route);
      const file = outputFile(route);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, html);
      written.push(route);
      console.log(`prerendered ${route}`);
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`failed ${route}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  const documents = sitemapDocuments(written);
  await Promise.all(
    Object.entries(documents).map(([name, body]) => writeFile(path.join(DIST, name), body)),
  );

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`prerendered ${routes.length} urls`);
  }
} finally {
  preview.kill("SIGTERM");
}
