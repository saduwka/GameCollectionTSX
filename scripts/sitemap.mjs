import { absoluteUrl as originUrl } from "./canonicalPath.mjs";

export const SITE_ORIGIN = "https://gamecollection-ff71a.web.app";

export const absoluteUrl = (route) => originUrl(SITE_ORIGIN, route);

export const urlset = (routes) => {
  const urls = routes.map((route) => `  <url><loc>${absoluteUrl(route)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

export const sitemapIndex = (files) => {
  const entries = files.map((file) => `  <sitemap><loc>${SITE_ORIGIN}/${file}</loc></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
};

export const splitRoutes = (routes) => ({
  staticRoutes: routes.filter((route) => !route.startsWith("/game/")),
  gameRoutes: routes.filter((route) => route.startsWith("/game/")),
});

export const sitemapDocuments = (routes) => {
  const { staticRoutes, gameRoutes } = splitRoutes(routes);
  return {
    "sitemap-static.xml": urlset(staticRoutes),
    "sitemap-games.xml": urlset(gameRoutes),
    "sitemap-index.xml": sitemapIndex(["sitemap-static.xml", "sitemap-games.xml"]),
  };
};
