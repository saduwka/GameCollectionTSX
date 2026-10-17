import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_FILE = path.join(ROOT, "cache/rawg/urls.json");
const DIST = path.join(ROOT, "dist");
const SITE_ORIGIN = "https://gamecollection-ff71a.web.app";
const PREVIEW_ORIGIN = "http://127.0.0.1:4173";

const STATIC_ROUTES = ["/", "/about", "/faq", "/games", "/platforms"];

const readRawgKey = async () => {
  const env = await readFile(path.join(ROOT, ".env"), "utf8");
  const line = env.split("\n").find((entry) => entry.startsWith("VITE_RAWG_API_KEY="));
  const key = line?.slice("VITE_RAWG_API_KEY=".length).trim();
  if (!key) throw new Error("VITE_RAWG_API_KEY is missing from .env");
  return key;
};

const rawg = async (key, pathname) => {
  const separator = pathname.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.rawg.io/api${pathname}${separator}key=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`RAWG ${pathname} failed: ${response.status}`);
  return response.json();
};

const loadRoutes = async () => {
  try {
    const cached = JSON.parse(await readFile(CACHE_FILE, "utf8"));
    if (cached.games?.length >= 50 && cached.platforms?.length >= 10 && cached.genres?.length >= 10) {
      return cached;
    }
  } catch {
    // cache is created on the first successful fetch
  }

  const key = await readRawgKey();
  const [firstPage, secondPage, platforms, genres] = await Promise.all([
    rawg(key, "/games?ordering=-added&page_size=40&page=1"),
    rawg(key, "/games?ordering=-added&page_size=40&page=2"),
    rawg(key, "/platforms?ordering=-games_count&page_size=10"),
    rawg(key, "/genres?page_size=10"),
  ]);

  const routes = {
    games: [...firstPage.results, ...secondPage.results].slice(0, 50).map((game) => game.id),
    platforms: platforms.results.slice(0, 10).map((platform) => platform.id),
    genres: genres.results.slice(0, 10).map((genre) => genre.slug).filter(Boolean),
  };

  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(routes, null, 2));
  return routes;
};

const routeList = (routes) => [
  ...STATIC_ROUTES,
  ...routes.genres.map((slug) => `/genre/${slug}`),
  ...routes.platforms.map((id) => `/platform/${id}`),
  ...routes.games.map((id) => `/game/${id}`),
];

const outputFile = (route) => {
  if (route === "/") return path.join(DIST, "index.html");
  return path.join(DIST, route.replace(/^\//, ""), "index.html");
};

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";

const sameText = (left, right) =>
  left.replaceAll("&nbsp;", " ").replaceAll("\u00a0", " ").replace(/\s+/g, " ").trim() ===
  right.replaceAll("&nbsp;", " ").replaceAll("\u00a0", " ").replace(/\s+/g, " ").trim();

// The Vite shell already has a generic title and description. React 19 leaves those
// tags in place when Helmet adds page tags, so drop only the shell copies.
const stripShellSeo = (html, shell) => {
  const shellHead = shell.slice(shell.indexOf("<head>") + 6, shell.indexOf("</head>"));
  const shellTitle = shellHead.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
  const shellMetas = [...shellHead.matchAll(/<meta\b[^>]*>/g)].map((match) => match[0]);

  return html.replace(/<title>[\s\S]*?<\/title>|<meta\b[^>]*>/g, (tag) => {
    if (tag.startsWith("<title>")) {
      const text = tag.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      return sameText(text, shellTitle) ? "" : tag;
    }

    const name = attr(tag, "name") || attr(tag, "property");
    if (!name || !(name === "description" || name.startsWith("og:") || name.startsWith("twitter:"))) {
      return tag;
    }

    const content = attr(tag, "content");
    const fromShell = shellMetas.some((meta) => {
      const shellName = attr(meta, "name") || attr(meta, "property");
      return shellName === name && sameText(attr(meta, "content"), content);
    });
    return fromShell ? "" : tag;
  });
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

const sitemap = (routes) => {
  const urls = routes
    .map((route) => `  <url><loc>${SITE_ORIGIN}${route === "/" ? "/" : route}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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

  const routes = routeList(await loadRoutes());
  // Keep the Vite shell in place until every other URL is captured.
  const ordered = [...routes.filter((route) => route !== "/"), "/"];
  await waitForPreview();
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ru-RU" });
  const failures = [];

  for (const route of ordered) {
    const page = await context.newPage();
    try {
      await page.goto(`${PREVIEW_ORIGIN}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForSelector('[data-seo-ready="true"]', { timeout: 45000 });
      await page.waitForSelector("h1", { timeout: 10000 });
      const html = stripShellSeo(await page.content(), shell);
      const file = outputFile(route);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, html);
      console.log(`prerendered ${route}`);
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`failed ${route}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  await writeFile(path.join(DIST, "sitemap.xml"), sitemap(routes));

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`prerendered ${routes.length} urls`);
  }
} finally {
  preview.kill("SIGTERM");
}
