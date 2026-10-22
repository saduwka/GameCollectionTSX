export const RAWG_BASE = "https://api.rawg.io/api";

const PATH_ALLOW = [
  /^\/games$/,
  /^\/games\/\d+$/,
  /^\/games\/\d+\/(screenshots|movies|additions|game-series|stores)$/,
  /^\/platforms$/,
  /^\/platforms\/\d+$/,
  /^\/platforms\/lists\/parents$/,
  /^\/genres$/,
  /^\/tags$/,
  /^\/tonight$/,
];

const LIST_PATHS = [
  /^\/games$/,
  /^\/platforms$/,
  /^\/genres$/,
  /^\/tags$/,
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

export const isAllowedPath = (path: string) => PATH_ALLOW.some((pattern) => pattern.test(path));

export const cacheControl = (path: string) => {
  if (/^\/games\/\d+(\/|$)/.test(path)) {
    return "public, max-age=86400, s-maxage=86400";
  }
  return "public, max-age=3600, s-maxage=21600";
};

const clampPageSize = (value: string | null) => {
  const parsed = Number(value ?? 20);
  const pageSize = Number.isFinite(parsed) ? parsed : 20;
  return String(Math.min(Math.max(pageSize, 1), 40));
};

export const buildUpstreamUrl = (
  path: string,
  searchParams: Iterable<[string, string]>,
  apiKey: string,
) => {
  const url = new URL(RAWG_BASE + path);
  for (const [key, value] of searchParams) {
    if (PARAM_ALLOW.has(key)) url.searchParams.set(key, value);
  }

  const isList = LIST_PATHS.some((pattern) => pattern.test(path));
  if (isList || url.searchParams.has("page_size")) {
    url.searchParams.set("page_size", clampPageSize(url.searchParams.get("page_size")));
  }
  url.searchParams.set("key", apiKey);
  return url;
};

const rewriteString = (value: string, apiKey: string, workerOrigin: string) => {
  const mentionsRawg = value.includes(RAWG_BASE);
  const mentionsKey = apiKey.length > 0 && value.includes(apiKey);
  if (!mentionsRawg && !mentionsKey) return value;

  const candidate = mentionsRawg ? value.split(RAWG_BASE).join(workerOrigin) : value;
  try {
    const parsed = new URL(candidate);
    parsed.searchParams.delete("key");
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return apiKey ? candidate.split(apiKey).join("") : candidate;
  }
};

export const scrubPayload = (value: unknown, apiKey: string, workerOrigin: string): unknown => {
  if (typeof value === "string") return rewriteString(value, apiKey, workerOrigin);
  if (Array.isArray(value)) return value.map((item) => scrubPayload(item, apiKey, workerOrigin));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, scrubPayload(item, apiKey, workerOrigin)]),
    );
  }
  return value;
};

export const publicCacheUrl = (origin: string, path: string, upstream: URL) => {
  const cacheUrl = new URL(origin + path);
  for (const [key, value] of upstream.searchParams) {
    if (key !== "key") cacheUrl.searchParams.set(key, value);
  }
  return cacheUrl;
};
