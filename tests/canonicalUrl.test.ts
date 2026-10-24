import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalPathname, canonicalUrl, collectionPath, gamePath } from "../src/seo/canonicalUrl";

const origin = "https://gamecollection-ff71a.web.app";

describe("canonical urls", () => {
  it("adds a trailing slash to prerendered paths and leaves the rest unchanged", () => {
    assert.equal(collectionPath("short-evening"), "/collections/short-evening/");
    assert.equal(gamePath(455597), "/game/455597/");
    assert.equal(canonicalPathname("/about"), "/about/");
    assert.equal(canonicalPathname("/about/"), "/about/");
    assert.equal(canonicalPathname("/games"), "/games/");
    assert.equal(canonicalPathname("/games/page/2"), "/games/page/2/");
    assert.equal(canonicalPathname("/genre/action/page/2"), "/genre/action/page/2/");
    assert.equal(canonicalPathname("/genre/action"), "/genre/action/");
    assert.equal(canonicalPathname("/platform/4"), "/platform/4/");
    assert.equal(canonicalPathname("/game/455597"), "/game/455597/");
    assert.equal(canonicalPathname("/"), "/");
    assert.equal(canonicalPathname("/game/1/4"), "/game/1/4");
    assert.equal(canonicalPathname("/search"), "/search");
    assert.equal(canonicalPathname("/collection"), "/collection");
    assert.equal(canonicalPathname("/collections/relax/?utm_source=telegram"), "/collections/relax/");
    assert.equal(canonicalUrl(origin, "/collections/coop-pc"), `${origin}/collections/coop-pc/`);
    assert.equal(canonicalUrl(origin, "/"), `${origin}/`);
  });
});
