import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absoluteUrl, sitemapDocuments } from "../scripts/sitemap.mjs";

describe("sitemap", () => {
  it("lists every prerendered url in the index children and keeps games separate", () => {
    const routes = ["/", "/about", "/collections/relax", "/genre/action", "/platform/4", "/game/1", "/game/2"];
    const documents = sitemapDocuments(routes);
    const locs = [...documents["sitemap-static.xml"].matchAll(/<loc>([^<]+)<\/loc>/g), ...documents["sitemap-games.xml"].matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1]);
    assert.deepEqual(locs.sort(), routes.map((route) => absoluteUrl(route)).sort());
    assert.equal(absoluteUrl("/collections/relax"), "https://gamecollection-ff71a.web.app/collections/relax/");
    assert.equal(absoluteUrl("/collections/relax/"), "https://gamecollection-ff71a.web.app/collections/relax/");
    assert.equal(absoluteUrl("/about"), "https://gamecollection-ff71a.web.app/about/");
    assert.equal(absoluteUrl("/game/1"), "https://gamecollection-ff71a.web.app/game/1/");
    assert.equal(absoluteUrl("/game/1/4"), "https://gamecollection-ff71a.web.app/game/1/4");
    assert.equal(absoluteUrl("/"), "https://gamecollection-ff71a.web.app/");
    assert.equal(documents["sitemap-static.xml"].includes("/game/"), false);
    assert.equal(documents["sitemap-games.xml"].includes("/about"), false);
    assert.match(documents["sitemap-index.xml"], /sitemap-static\.xml/);
    assert.match(documents["sitemap-index.xml"], /sitemap-games\.xml/);
    assert.equal(documents["sitemap-index.xml"].includes("lastmod"), false);
    assert.equal(documents["sitemap-static.xml"].includes("lastmod"), false);
  });
});
