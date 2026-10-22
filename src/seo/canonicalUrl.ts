import { canonicalPathname as normalizePath } from "../../scripts/canonicalPath.mjs";

export const canonicalPathname = (pathname: string) => normalizePath(pathname);

export const collectionPath = (slug: string) => canonicalPathname(`/collections/${slug}`);
export const gamePath = (id: number | string) => canonicalPathname(`/game/${id}`);
export const genrePath = (slug: string) => canonicalPathname(`/genre/${slug}`);
export const platformPath = (id: number | string) => canonicalPathname(`/platform/${id}`);
export const gamesPath = () => canonicalPathname("/games");
export const gamesPagePath = (page: number) =>
  page <= 1 ? gamesPath() : canonicalPathname(`/games/page/${page}`);
export const genrePagePath = (slug: string, page: number) =>
  page <= 1 ? genrePath(slug) : canonicalPathname(`/genre/${slug}/page/${page}`);
export const aboutPath = () => canonicalPathname("/about");
export const faqPath = () => canonicalPathname("/faq");
export const platformsPath = () => canonicalPathname("/platforms");

export const canonicalUrl = (origin: string, pathname: string) => `${origin}${canonicalPathname(pathname)}`;
