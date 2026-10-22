import {
  buildUpstreamUrl,
  cacheControl,
  isAllowedPath,
  publicCacheUrl,
  scrubPayload,
} from "./proxy";
import { handleTonight } from "./tonight/handleTonight";

export interface Env {
  RAWG_API_KEY: string;
  ALLOWED_ORIGINS: string;
}

const corsHeaders = (request: Request, allowedOrigins: string): Record<string, string> => {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = allowedOrigins.split(",").map((entry) => entry.trim()).includes(origin);
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
};

const json = (body: unknown, status: number, headers: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });

const withCors = (response: Response, cors: Record<string, string>) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(cors)) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
};

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_ORIGINS ?? "");
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (request.method !== "GET") return new Response(null, { status: 405, headers: cors });

    const incoming = new URL(request.url);
    if (incoming.pathname === "/tonight") {
      return withCors(await handleTonight(request, env, ctx), cors);
    }
    if (!isAllowedPath(incoming.pathname)) return json({ error: "not_found" }, 404, cors);
    if (!env.RAWG_API_KEY) return json({ error: "upstream_unavailable" }, 502, cors);

    const upstream = buildUpstreamUrl(incoming.pathname, incoming.searchParams, env.RAWG_API_KEY);
    const cacheKey = new Request(publicCacheUrl(incoming.origin, incoming.pathname, upstream).toString(), {
      method: "GET",
    });
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached, cors);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(upstream, { signal: AbortSignal.timeout(10_000) });
    } catch {
      console.error(`rawg unavailable ${incoming.pathname}`);
      return json({ error: "upstream_unavailable" }, 502, cors);
    }
    if (!upstreamResponse.ok) {
      console.error(`rawg ${upstreamResponse.status} ${incoming.pathname}`);
      return json({ error: "upstream_error" }, upstreamResponse.status, cors);
    }

    let payload: unknown;
    try {
      payload = scrubPayload(JSON.parse(await upstreamResponse.text()), env.RAWG_API_KEY, incoming.origin);
    } catch {
      console.error(`rawg unavailable ${incoming.pathname}`);
      return json({ error: "upstream_unavailable" }, 502, cors);
    }

    const body = JSON.stringify(payload);
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl(incoming.pathname),
    });
    ctx.waitUntil(cache.put(cacheKey, new Response(body, { status: 200, headers })).catch(() => undefined));
    return withCors(new Response(body, { status: 200, headers }), cors);
  },
} satisfies ExportedHandler<Env>;
