import { absoluteUrl } from "./sitemap.mjs";

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";

const countTags = (html, pattern) => [...html.matchAll(pattern)].length;

export const stripShellSeo = (html) =>
  html
    .replace(/<title\b[^>]*\bdata-seo-shell="true"[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*\bdata-seo-shell="true"[^>]*\/?>/gi, "");

export const validatePrerenderedHtml = (html, route) => {
  const titles = [...html.matchAll(/<title\b[^>]*>([^<]*)<\/title>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  const descriptions = [...html.matchAll(/<meta\b[^>]*\bname="description"[^>]*>/gi)];
  const canonicals = [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)];
  const ogTitles = [...html.matchAll(/<meta\b[^>]*\bproperty="og:title"[^>]*>/gi)];
  const ogUrls = [...html.matchAll(/<meta\b[^>]*\bproperty="og:url"[^>]*>/gi)];
  const expectedCanonical = absoluteUrl(route);
  const single = [
    ["og:description", /<meta\b[^>]*\bproperty="og:description"[^>]*>/gi],
    ["og:type", /<meta\b[^>]*\bproperty="og:type"[^>]*>/gi],
    ["og:site_name", /<meta\b[^>]*\bproperty="og:site_name"[^>]*>/gi],
    ["twitter:card", /<meta\b[^>]*\bname="twitter:card"[^>]*>/gi],
    ["twitter:title", /<meta\b[^>]*\bname="twitter:title"[^>]*>/gi],
    ["twitter:description", /<meta\b[^>]*\bname="twitter:description"[^>]*>/gi],
  ];

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
  if (ogUrls.length !== 1 || attr(ogUrls[0][0], "content") !== expectedCanonical) {
    throw new Error("og:url must match the canonical url");
  }
  for (const [label, pattern] of single) {
    const found = countTags(html, pattern);
    if (found !== 1) throw new Error(`expected one ${label}, found ${found}`);
  }
  if (countTags(html, /<meta\b[^>]*\bproperty="og:image"[^>]*>/gi) > 1) {
    throw new Error("expected at most one og:image");
  }
  if (countTags(html, /<meta\b[^>]*\bname="twitter:image"[^>]*>/gi) > 1) {
    throw new Error("expected at most one twitter:image");
  }
  if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i.test(html)) throw new Error("missing h1");
  if (html.includes("api.rawg.io") || /[?&]key=/.test(html)) {
    throw new Error("prerendered html contains an API key or upstream RAWG url");
  }
};
