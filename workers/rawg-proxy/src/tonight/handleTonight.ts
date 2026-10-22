import { RAWG_BASE, scrubPayload } from "../proxy";
import {
  RECIPES,
  filterPool,
  parseTonightQuery,
  poolCacheKey,
  rankTonight,
  toCandidate,
  type Mood,
  type RawListGame,
  type Recipe,
  type TonightGame,
} from "../../../../src/services/recommendations/tonightScore";

interface TonightEnv {
  RAWG_API_KEY: string;
}

const queryString = (recipeQuery: Recipe["queries"][number], platforms: number[]) => {
  const params = new URLSearchParams();
  if (recipeQuery.tags?.length) params.set("tags", recipeQuery.tags.join(","));
  if (recipeQuery.genres?.length) params.set("genres", recipeQuery.genres.join(","));
  if (recipeQuery.metacritic) params.set("metacritic", recipeQuery.metacritic);
  params.set("ordering", recipeQuery.ordering);
  if (platforms.length) params.set("platforms", platforms.join(","));
  params.set("page_size", "40");
  params.set("exclude_additions", "true");
  return params;
};

export const fetchRecipePages = async (
  recipe: Recipe,
  platforms: number[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
) => {
  const pages = await Promise.all(recipe.queries.map(async (recipeQuery) => {
    const url = new URL(`${RAWG_BASE}/games`);
    const params = queryString(recipeQuery, platforms);
    params.forEach((value, key) => url.searchParams.set(key, value));
    url.searchParams.set("key", apiKey);
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) return [] as RawListGame[];
      const payload = await response.json() as { results?: RawListGame[] };
      return payload.results ?? [];
    } catch {
      return [] as RawListGame[];
    }
  }));
  return pages.flat();
};

export const assemblePool = (rawGames: RawListGame[], recipe: Recipe) => {
  const unique = new Map<number, TonightGame>();
  for (const raw of rawGames) {
    const candidate = toCandidate(raw);
    if (!candidate || unique.has(candidate.id)) continue;
    unique.set(candidate.id, candidate);
  }
  return filterPool([...unique.values()], recipe);
};

const poolRequest = (mood: Mood, platforms: number[]) =>
  new Request(`https://tonight.internal/${poolCacheKey(mood, platforms)}`);

export const handleTonight = async (
  request: Request,
  env: TonightEnv,
  ctx: { waitUntil: (promise: Promise<unknown>) => void },
  fetchImpl: typeof fetch = fetch,
) => {
  const incoming = new URL(request.url);
  const parsed = parseTonightQuery(incoming.searchParams);
  if (!parsed) {
    return Response.json({ error: "bad_params" }, { status: 400 });
  }
  if (!env.RAWG_API_KEY) {
    return Response.json({ error: "upstream_unavailable" }, { status: 502 });
  }

  const cache = typeof caches === "undefined" ? null : caches.default;
  const cacheKey = poolRequest(parsed.mood, parsed.platforms);
  let pool: TonightGame[] | null = null;
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) {
    pool = await cached.json() as TonightGame[];
  } else {
    const raw = await fetchRecipePages(RECIPES[parsed.mood], parsed.platforms, env.RAWG_API_KEY, fetchImpl);
    pool = assemblePool(raw, RECIPES[parsed.mood]);
    if (pool.length === 0) {
      return Response.json({ error: "upstream_unavailable" }, { status: 502 });
    }
    if (cache) {
      const body = JSON.stringify(pool);
      ctx.waitUntil(cache.put(cacheKey, new Response(body, {
        headers: { "Cache-Control": "public, max-age=86400", "Content-Type": "application/json" },
      })).catch(() => undefined));
    }
  }

  const results = rankTonight(pool, RECIPES[parsed.mood], parsed.time, {
    exclude: parsed.exclude,
    seen: parsed.seen,
  });
  const payload = scrubPayload({
    generatedAt: new Date().toISOString(),
    pool: pool.length,
    results,
  }, env.RAWG_API_KEY, incoming.origin);
  return Response.json(payload);
};
