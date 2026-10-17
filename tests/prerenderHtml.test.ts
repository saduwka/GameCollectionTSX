import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripShellSeo, validatePrerenderedHtml } from "../scripts/prerenderHtml.mjs";

const title = "PlayHub — каталог игр, сравнение и рекомендации";

const page = (route = "/") => `<!DOCTYPE html><html><head>
<title data-seo-shell="true">${title}</title>
<title>${title}</title>
<meta data-seo-shell="true" name="description" content="shell description" />
<meta name="description" content="page description" />
<link rel="canonical" href="https://gamecollection-ff71a.web.app${route === "/" ? "/" : route}" />
<meta property="og:title" content="${title}" />
<meta property="og:url" content="https://gamecollection-ff71a.web.app${route === "/" ? "/" : route}" />
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

  it("rejects a localhost canonical and a missing h1", () => {
    const html = stripShellSeo(page()).replace(
      "https://gamecollection-ff71a.web.app/",
      "http://127.0.0.1:4173/"
    );
    assert.throws(() => validatePrerenderedHtml(html, "/"), /canonical/);
    assert.throws(() => validatePrerenderedHtml(html.replace(/<h1[\s\S]*?<\/h1>/, ""), "/"), /h1|canonical/);
  });
});
