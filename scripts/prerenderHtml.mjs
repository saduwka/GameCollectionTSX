const SITE_ORIGIN = "https://gamecollection-ff71a.web.app";

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";

export const stripShellSeo = (html) =>
  html
    .replace(/<title\b[^>]*\bdata-seo-shell="true"[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*\bdata-seo-shell="true"[^>]*\/?>/gi, "");

export const validatePrerenderedHtml = (html, route) => {
  const titles = [...html.matchAll(/<title>([^<]*)<\/title>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  const descriptions = [...html.matchAll(/<meta\b[^>]*\bname="description"[^>]*>/gi)];
  const canonicals = [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)];
  const ogTitles = [...html.matchAll(/<meta\b[^>]*\bproperty="og:title"[^>]*>/gi)];
  const ogUrls = [...html.matchAll(/<meta\b[^>]*\bproperty="og:url"[^>]*>/gi)];
  const expectedCanonical = `${SITE_ORIGIN}${route === "/" ? "/" : route}`;

  if (titles.length !== 1) throw new Error(`expected one title, found ${titles.length}`);
  if (descriptions.length !== 1 || !attr(descriptions[0][0], "content").trim()) {
    throw new Error(`expected one description, found ${descriptions.length}`);
  }
  if (canonicals.length !== 1) throw new Error(`expected one canonical, found ${canonicals.length}`);
  if (attr(canonicals[0][0], "href") !== expectedCanonical) {
    throw new Error(`canonical must be ${expectedCanonical}`);
  }
  if (ogTitles.length !== 1 || !attr(ogTitles[0][0], "content")) {
    throw new Error("expected one og:title");
  }
  if (attr(ogUrls[0]?.[0] ?? "", "content") !== expectedCanonical) {
    throw new Error("og:url must match the canonical url");
  }
  if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i.test(html)) throw new Error("missing h1");
  if (html.includes("api.rawg.io") || /[?&]key=/.test(html)) {
    throw new Error("prerendered html contains an API key or upstream RAWG url");
  }
};
