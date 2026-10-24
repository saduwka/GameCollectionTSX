import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { genreName } from "../src/services/games/normalizeGame";
import { isSafeCandidate } from "../src/services/recommendations/safeCandidate";

describe("genre labels", () => {
  it("prints a genre name for both a string and a RAWG object", () => {
    assert.equal(genreName("Action"), "Action");
    assert.equal(genreName({ id: 4, name: "Action", slug: "action" }), "Action");
    assert.equal(genreName(undefined), "");
  });
});

describe("safe candidates", () => {
  it("drops adult tags, adult titles, and thin ratings", () => {
    assert.equal(isSafeCandidate({ name: "Portal", tags: ["nsfw"], ratings_count: 400 }, { minRatings: 30 }), false);
    assert.equal(isSafeCandidate({ name: "Portal", tags: ["puzzle"], ratings_count: 3 }, { minRatings: 30 }), false);
    assert.equal(isSafeCandidate({ name: "Knightly Passions (Adult Game)", tags: [], ratings_count: 80 }, { minRatings: 30 }), false);
    assert.equal(isSafeCandidate({ name: "Hades", tags: ["roguelike"], ratings_count: 400 }, { minRatings: 30 }), true);
  });
});
