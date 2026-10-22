import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gameIdsInHtml, gameIdsInSitemap, sameGameIds } from "../scripts/catalogCoverage.mjs";

describe("catalog coverage", () => {
  it("matches sitemap game ids with catalog page links", () => {
    const html = '<a href="/game/1/">One</a><a href="/games/page/2/">Next</a><a href="/game/2/">Two</a>';
    const xml = "<loc>https://gamecollection-ff71a.web.app/game/2/</loc><loc>https://gamecollection-ff71a.web.app/game/1/</loc>";
    assert.equal(sameGameIds(gameIdsInHtml(html), gameIdsInSitemap(xml)), true);
    assert.equal(sameGameIds(gameIdsInHtml(html), gameIdsInSitemap(`${xml}<loc>https://gamecollection-ff71a.web.app/game/3/</loc>`)), false);
  });
});
