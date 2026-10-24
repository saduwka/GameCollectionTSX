export const BLOCKED_TAGS = new Set([
  "nsfw",
  "sexual-content",
  "hentai",
  "adult",
  "erotic",
  "nudity",
]);

export const MIN_RATINGS = 30;

const ADULT_NAME = /\b(adult game|18\+|hentai)\b/i;

type Tag = string | { slug?: string };
type Esrb = string | { slug?: string; name?: string } | null | undefined;

const tagSlug = (tag: Tag) => (typeof tag === "string" ? tag : tag.slug || "");

const esrbText = (esrb: Esrb) => {
  if (!esrb) return "";
  if (typeof esrb === "string") return esrb;
  return esrb.slug || esrb.name || "";
};

export const isSafeCandidate = (
  game: {
    name?: string;
    tags?: Tag[];
    esrb_rating?: Esrb;
    ratings_count?: number | null;
  },
  options?: { minRatings?: number },
) => {
  const tags = (game.tags ?? []).map(tagSlug);
  if (tags.some((tag) => BLOCKED_TAGS.has(tag))) return false;
  if (/adults-only|adults only/i.test(esrbText(game.esrb_rating))) return false;
  if (game.name && ADULT_NAME.test(game.name)) return false;
  if (options?.minRatings != null && (game.ratings_count ?? 0) < options.minRatings) return false;
  return true;
};
