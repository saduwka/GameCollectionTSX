export interface DocumentMeta {
  title: string;
  description: string;
  url: string;
  type: "website" | "article";
  image?: string;
  noindex: boolean;
}

const SITE_NAME = "PlayHub";

const head = () => document.head;

const claim = (selector: string) => {
  const [keep, ...extra] = [...head().querySelectorAll(selector)];
  extra.forEach((node) => node.remove());
  return keep ?? null;
};

const own = (node: Element) => {
  node.removeAttribute("data-seo-shell");
  node.setAttribute("data-seo", "true");
};

const meta = (selector: string, attrs: Record<string, string>) => {
  const existing = claim(selector);
  const node = existing ?? document.createElement("meta");
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  own(node);
  if (!existing) head().appendChild(node);
};

const drop = (selector: string) => {
  head().querySelectorAll(selector).forEach((node) => node.remove());
};

export const syncDocumentMeta = ({ title, description, url, type, image, noindex }: DocumentMeta) => {
  const existingTitle = claim("title");
  const titleNode = existingTitle ?? document.createElement("title");
  titleNode.textContent = title;
  own(titleNode);
  if (!existingTitle) head().appendChild(titleNode);

  meta('meta[name="description"]', { name: "description", content: description });
  if (noindex) meta('meta[name="robots"]', { name: "robots", content: "noindex" });
  else drop('meta[name="robots"]');

  meta('meta[property="og:title"]', { property: "og:title", content: title });
  meta('meta[property="og:description"]', { property: "og:description", content: description });
  meta('meta[property="og:type"]', { property: "og:type", content: type });
  meta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
  meta('meta[property="og:url"]', { property: "og:url", content: url });
  if (image) meta('meta[property="og:image"]', { property: "og:image", content: image });
  else drop('meta[property="og:image"]');

  meta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: image ? "summary_large_image" : "summary",
  });
  meta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  meta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  if (image) meta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
  else drop('meta[name="twitter:image"]');

  const existingCanonical = claim('link[rel="canonical"]');
  const canonical = existingCanonical ?? document.createElement("link");
  canonical.setAttribute("rel", "canonical");
  canonical.setAttribute("href", url);
  own(canonical);
  if (!existingCanonical) head().appendChild(canonical);

  head().querySelectorAll("[data-seo-shell='true']").forEach((node) => node.remove());
  document.documentElement.setAttribute("data-seo-applied", url);
};
