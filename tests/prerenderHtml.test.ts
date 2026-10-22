import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripShellSeo, validatePrerenderedHtml } from "../scripts/prerenderHtml.mjs";

const title = "PlayHub — каталог игр, сравнение и рекомендации";

const hrefFor = (route = "/") => `https://gamecollection-ff71a.web.app${route === "/" ? "/" : route}`;

const page = (route = "/") => `<!DOCTYPE html><html><head>
<title data-seo-shell="true">${title}</title>
<title>${title}</title>
<meta data-seo-shell="true" name="description" content="shell description" />
<meta name="description" content="page description" />
<link rel="canonical" href="${hrefFor(route)}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="page description" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="PlayHub" />
<meta property="og:url" content="${hrefFor(route)}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="page description" />
</head><body><h1>Home</h1></body></html>`;

describe("prerender html", () => {
  it("keeps the page title when it matches the shell title", () => {
    const html = stripShellSeo(page());
    const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((match) => match[1]);
    assert.deepEqual(titles, [title]);
    assert.equal(html.includes("shell description"), false);
    assert.equal(html.includes("page description"), true);
    assert.doesNotThrow(() => validatePrerenderedHtml(html, "/"));
  });

  it("rejects an empty description and a second canonical", () => {
    const empty = stripShellSeo(page()).replace('content="page description"', 'content=""');
    assert.throws(() => validatePrerenderedHtml(empty, "/"), /description/);
    const doubled = `${stripShellSeo(page())}<link rel="canonical" href="https://gamecollection-ff71a.web.app/games" />`;
    assert.throws(() => validatePrerenderedHtml(doubled, "/"), /canonical/);
  });

  it("requires the collection canonical to keep the trailing slash", () => {
    const route = "/collections/short-evening";
    const html = stripShellSeo(page(route));
    assert.throws(() => validatePrerenderedHtml(html, route), /canonical/);
    const slashed = html.replaceAll(
      "https://gamecollection-ff71a.web.app/collections/short-evening",
      "https://gamecollection-ff71a.web.app/collections/short-evening/",
    );
    assert.doesNotThrow(() => validatePrerenderedHtml(slashed, route));
  });

  it("rejects a localhost canonical and a missing h1", () => {
    const html = stripShellSeo(page()).replace(
      "https://gamecollection-ff71a.web.app/",
      "http://127.0.0.1:4173/"
    );
    assert.throws(() => validatePrerenderedHtml(html, "/"), /canonical/);
    assert.throws(() => validatePrerenderedHtml(html.replace(/<h1[\s\S]*?<\/h1>/, ""), "/"), /h1|canonical/);
  });
});
