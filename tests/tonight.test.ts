import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scrubPayload } from "../workers/rawg-proxy/src/proxy.ts";
import { assemblePool, handleTonight } from "../workers/rawg-proxy/src/tonight/handleTonight.ts";
import {
  RECIPES,
  composeTonight,
  poolCacheKey,
  rankTonight,
  type RawListGame,
  type TonightGame,
} from "../src/services/recommendations/tonightScore.ts";

const fixture = (count: number, moodTags: string[], extra: Partial<RawListGame> = {}): RawListGame[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Game ${index + 1}`,
    slug: `game-${index + 1}`,
    background_image: "https://media.example/cover.jpg",
    playtime: 3,
    rating: 4.4,
    ratings_count: 200 + index,
    metacritic: 85,
    genres: [{ slug: "adventure" }],
    tags: moodTags.map((slug) => ({ slug, language: "eng" })),
    platforms: [{ platform: { id: 4 } }],
    ...extra,
  }));

describe("tonight pool", () => {
  it("keeps at least 30 games for every mood from fixtures", () => {
    for (const mood of ["calm", "deep", "finish", "coop"] as const) {
      const tags = mood === "deep" ? ["story-rich"] : mood === "finish" ? ["short"] : mood === "coop" ? ["co-op"] : ["relaxing"];
      const pool = assemblePool(fixture(40, tags), RECIPES[mood]);
      assert.ok(pool.length >= 30, mood);
    }
  });

  it("drops nsfw tags and thin ratings", () => {
    const raw = [
      ...fixture(2, ["relaxing"]),
      { ...fixture(1, ["relaxing", "nsfw"])[0], id: 90, ratings_count: 400 },
      { ...fixture(1, ["relaxing"])[0], id: 91, ratings_count: 12 },
    ];
    const pool = assemblePool(raw, RECIPES.calm);
    assert.equal(pool.some((game) => game.id === 90 || game.id === 91), false);
  });

  it("removes excluded ids and only penalizes seen ids", () => {
    const pool = assemblePool(fixture(10, ["relaxing"]), RECIPES.calm) as TonightGame[];
    const ranked = rankTonight(pool, RECIPES.calm, 120, { exclude: [1], seen: [2] });
    assert.equal(ranked.some((game) => game.id === 1), false);
    const seen = ranked.find((game) => game.id === 2);
    const fresh = ranked.find((game) => game.id === 3);
    assert.ok(seen && fresh);
    assert.ok(seen.score < fresh.score);
  });

  it("uses the same cache key regardless of platform order", () => {
    assert.equal(poolCacheKey("calm", [187, 4]), poolCacheKey("calm", [4, 187]));
  });

  it("drops horror from calm, keeps only co-op, and skips a long session at 30 minutes", () => {
    const horror = assemblePool(
      [{ ...fixture(1, ["relaxing", "horror"])[0], id: 7, ratings_count: 400 }],
      RECIPES.calm,
    );
    assert.equal(horror.length, 0);

    const coop = assemblePool(
      [
        { ...fixture(1, ["co-op"])[0], id: 8 },
        { ...fixture(1, ["competitive"])[0], id: 9, ratings_count: 400 },
      ],
      RECIPES.coop,
    );
    assert.deepEqual(coop.map((game) => game.id), [8]);

    const long = assemblePool(
      [{ ...fixture(1, ["story-rich"], { playtime: 30 })[0], id: 11 }],
      RECIPES.deep,
    );
    const ranked = rankTonight(long, RECIPES.deep, 30, { exclude: [], seen: [] });
    assert.equal(ranked.length, 0);
  });

  it("drops a shelf game that is not on the selected platform", () => {
    const n64 = { id: 83, name: "Ocarina", status: "Backlog", tags: ["short"], playtime: 7, platforms: [83] };
    const pc = { id: 4, name: "On PC", status: "Backlog", tags: ["short"], playtime: 7, platforms: [4] };
    const onPc = composeTonight([], [n64, pc], "finish", 300, [4]);
    assert.deepEqual(onPc.games.map((game) => game.id), [4]);
    const open = composeTonight([], [n64], "finish", 300, []);
    assert.equal(open.games[0]?.id, 83);
    const unknown = composeTonight([], [{ ...n64, id: 99, platforms: undefined }], "finish", 300, [4]);
    assert.equal(unknown.games.length, 0);
  });

  it("rejects bad params and strips upstream secrets", async () => {
    const bad = await handleTonight(
      new Request("https://playhub.test/tonight?mood=nope&time=120"),
      { RAWG_API_KEY: "secret-key" },
      { waitUntil: () => undefined },
    );
    assert.equal(bad.status, 400);
    const body = JSON.stringify(scrubPayload({ next: "https://api.rawg.io/api/games?key=secret-key" }, "secret-key", "https://playhub.test"));
    assert.equal(body.includes("api.rawg.io"), false);
    assert.equal(body.includes("key="), false);
    assert.equal(body.includes("secret-key"), false);
  });
});
