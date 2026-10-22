import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collections } from "../src/data/collections";
import { collectionSlugs, platforms } from "../scripts/publicLinks.mjs";

describe("public links", () => {
  it("uses the same collection slugs as the editorial pages", () => {
    assert.deepEqual(collectionSlugs, collections.map((collection) => collection.slug));
    assert.equal(platforms.length, 10);
  });
});
