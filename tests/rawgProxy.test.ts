import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildUpstreamUrl,
  cacheControl,
  isAllowedPath,
  scrubPayload,
} from "../workers/rawg-proxy/src/proxy.ts";

const ORIGIN = "https://playhub-rawg.example.workers.dev";

describe("rawg proxy", () => {
  it("allows the paths the app calls and rejects the rest", () => {
    assert.equal(isAllowedPath("/games/3498/stores"), true);
    assert.equal(isAllowedPath("/platforms/lists/parents"), true);
    assert.equal(isAllowedPath("/games/3498"), true);
    assert.equal(isAllowedPath("/genres"), true);
    assert.equal(isAllowedPath("/users"), false);
    assert.equal(isAllowedPath("/games/3498/reddit"), false);
  });

  it("clamps list page_size and ignores a client key", () => {
    const url = buildUpstreamUrl(
      "/games",
      new URLSearchParams("page_size=100&key=client-key&search=zelda"),
      "server-key",
    );
    assert.equal(url.searchParams.get("page_size"), "40");
    assert.equal(url.searchParams.get("key"), "server-key");
    assert.equal(url.searchParams.get("search"), "zelda");
    assert.equal(url.searchParams.get("client-key"), null);
  });

  it("leaves page_size off a game detail request", () => {
    const url = buildUpstreamUrl("/games/3498", new URLSearchParams("key=client-key"), "server-key");
    assert.equal(url.searchParams.has("page_size"), false);
    assert.equal(url.searchParams.get("key"), "server-key");
  });

  it("rewrites next onto the worker origin and strips the key", () => {
    const payload = scrubPayload(
      {
        next: "https://api.rawg.io/api/games?key=server-key&page=2",
        previous: null,
        results: [{ name: "Halo", background_image: "https://media.rawg.io/media.jpg" }],
      },
      "server-key",
      ORIGIN,
    ) as { next: string; results: { background_image: string }[] };

    const next = new URL(payload.next);
    assert.equal(next.origin, ORIGIN);
    assert.equal(next.pathname, "/games");
    assert.equal(next.searchParams.get("page"), "2");
    assert.equal(next.searchParams.has("key"), false);
    assert.equal(payload.results[0].background_image, "https://media.rawg.io/media.jpg");
    assert.equal(JSON.stringify(payload).includes("server-key"), false);
    assert.equal(JSON.stringify(payload).includes("api.rawg.io"), false);
  });

  it("caches game details for a day and lists for an hour", () => {
    assert.match(cacheControl("/games/3498"), /max-age=86400/);
    assert.match(cacheControl("/games/3498/stores"), /max-age=86400/);
    assert.match(cacheControl("/games"), /max-age=3600, s-maxage=21600/);
    assert.match(cacheControl("/genres"), /max-age=3600, s-maxage=21600/);
  });
});
