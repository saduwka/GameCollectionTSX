const GAME_HREF = /href="(?:https:\/\/gamecollection-ff71a\.web\.app)?\/game\/(\d+)\//g;
const SITEMAP_LOC = /<loc>[^<]*\/game\/(\d+)\//g;

export const gameIdsInHtml = (html) => new Set([...html.matchAll(GAME_HREF)].map((match) => match[1]));

export const gameIdsInSitemap = (xml) => new Set([...xml.matchAll(SITEMAP_LOC)].map((match) => match[1]));

export const sameGameIds = (left, right) =>
  left.size === right.size && [...left].every((id) => right.has(id));
