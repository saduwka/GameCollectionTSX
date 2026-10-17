import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const RAWG_API_KEY = defineSecret("RAWG_API_KEY");
const RAWG_BASE = "https://api.rawg.io/api";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

const PATH_ALLOW = [
  /^\/games$/,
  /^\/games\/\d+$/,
  /^\/games\/\d+\/(screenshots|movies|additions|game-series|stores)$/,
  /^\/platforms$/,
  /^\/platforms\/\d+$/,
  /^\/platforms\/lists\/parents$/,
  /^\/genres$/,
];

const LIST_PATHS = [
  /^\/games$/,
  /^\/platforms$/,
  /^\/genres$/,
  /^\/platforms\/lists\/parents$/,
  /^\/games\/\d+\/(screenshots|movies|additions|game-series|stores)$/,
];

const PARAM_ALLOW = new Set([
  "page",
  "page_size",
  "ordering",
  "search",
  "dates",
  "genres",
  "platforms",
  "developers",
  "tags",
  "playtime",
  "metacritic",
  "search_precise",
  "search_exact",
]);

const hits = new Map<string, number[]>();

const clientIp = (forwarded: string | undefined, fallback: string | undefined) => {
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return fallback || "unknown";
};

const withinRateLimit = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
};

const normalizePath = (requestPath: string) => {
  const withoutQuery = requestPath.split("?")[0] || "/";
  const stripped = withoutQuery.replace(/\/api\/rawg(?=\/|$)/, "");
  if (!stripped) return "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
};

const queryValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
};

const scrubSecrets = (value: unknown, key: string): unknown => {
  if (typeof value === "string") {
    if (!value.includes(key)) return value;
    try {
      const parsed = new URL(value);
      parsed.searchParams.delete("key");
      return `${parsed.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return value.split(key).join("");
    }
  }
  if (Array.isArray(value)) return value.map((item) => scrubSecrets(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, scrubSecrets(item, key)])
    );
  }
  return value;
};

const cacheControl = (path: string) => {
  if (/^\/games\/\d+(\/|$)/.test(path)) {
    return "public, max-age=86400, s-maxage=86400";
  }
  return "public, max-age=3600, s-maxage=21600";
};

export const rawgProxy = onRequest(
  {
    region: "europe-west1",
    secrets: [RAWG_API_KEY],
    timeoutSeconds: 15,
    maxInstances: 5,
    invoker: "public",
  },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return;
    }

    const path = normalizePath(req.path || "/");
    if (!PATH_ALLOW.some((pattern) => pattern.test(path))) {
      res.status(404).end();
      return;
    }

    const ip = clientIp(req.get("x-forwarded-for"), req.ip);
    if (!withinRateLimit(ip)) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }

    const url = new URL(RAWG_BASE + path);
    for (const [key, value] of Object.entries(req.query)) {
      const text = queryValue(value);
      if (PARAM_ALLOW.has(key) && text !== null) url.searchParams.set(key, text);
    }

    const isList = LIST_PATHS.some((pattern) => pattern.test(path));
    if (isList || url.searchParams.has("page_size")) {
      const parsed = Number(url.searchParams.get("page_size") ?? 20);
      const pageSize = Number.isFinite(parsed) ? parsed : 20;
      url.searchParams.set("page_size", String(Math.min(Math.max(pageSize, 1), 40)));
    }
    url.searchParams.set("key", RAWG_API_KEY.value());

    try {
      const upstream = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!upstream.ok) {
        console.error(`rawg ${upstream.status} ${path}`);
        res.status(upstream.status).json({ error: "upstream_error" });
        return;
      }
      const key = RAWG_API_KEY.value();
      const payload = scrubSecrets(JSON.parse(await upstream.text()), key);
      res.set("Cache-Control", cacheControl(path));
      res.set("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(payload));
    } catch {
      console.error(`rawg unavailable ${path}`);
      res.status(502).json({ error: "upstream_unavailable" });
    }
  }
);
