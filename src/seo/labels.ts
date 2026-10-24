import { genres } from "../../scripts/publicLinks.mjs";

const bySlug = new Map(genres.map((genre) => [genre.slug, genre]));
const byName = new Map(genres.map((genre) => [genre.en.toLowerCase(), genre]));

export const localizedGenre = (name: string, english: boolean, slug?: string) => {
  const known = (slug && bySlug.get(slug)) || byName.get(name.toLowerCase());
  if (!known) return english ? name : "";
  return english ? known.en : known.ru;
};

const TAGS: Record<string, { ru: string; en: string }> = {
  singleplayer: { ru: "один игрок", en: "Singleplayer" },
  multiplayer: { ru: "несколько игроков", en: "Multiplayer" },
  "co-op": { ru: "кооператив", en: "Co-op" },
  "local-co-op": { ru: "кооператив на диване", en: "Local co-op" },
  "online-co-op": { ru: "сетевой кооператив", en: "Online co-op" },
  atmospheric: { ru: "атмосфера", en: "Atmospheric" },
  story: { ru: "сюжет", en: "Story" },
  "story-rich": { ru: "сильный сюжет", en: "Story rich" },
  exploration: { ru: "исследование", en: "Exploration" },
  "open-world": { ru: "открытый мир", en: "Open world" },
  relaxing: { ru: "спокойная", en: "Relaxing" },
  difficult: { ru: "сложная", en: "Difficult" },
  horror: { ru: "хоррор", en: "Horror" },
  "great-soundtrack": { ru: "саундтрек", en: "Great soundtrack" },
  short: { ru: "короткая", en: "Short" },
  linear: { ru: "линейная", en: "Linear" },
  fantasy: { ru: "фэнтези", en: "Fantasy" },
  "science-fiction": { ru: "фантастика", en: "Science fiction" },
  comedy: { ru: "комедия", en: "Comedy" },
  stealth: { ru: "стелс", en: "Stealth" },
  "first-person": { ru: "от первого лица", en: "First person" },
  "third-person": { ru: "от третьего лица", en: "Third person" },
};

export const localizedTag = (slug: string | undefined, name: string, english: boolean) => {
  const known = slug ? TAGS[slug] : undefined;
  if (known) return english ? known.en : known.ru;
  return english ? name : "";
};

const ESRB: Record<string, string> = {
  everyone: "everyone",
  "everyone 10+": "everyone-10-plus",
  "everyone-10-plus": "everyone-10-plus",
  teen: "teen",
  mature: "mature",
  "adults only": "adults-only",
  "adults-only": "adults-only",
  "rating pending": "rating-pending",
  "rating-pending": "rating-pending",
};

export const esrbKey = (value: string) => ESRB[value.toLowerCase()] || "";

export const formatRelease = (value: string, language: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(language.startsWith("en") ? "en" : "ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const gamesCountLabel = (count: number, language: string) => {
  const formatted = new Intl.NumberFormat(language.startsWith("en") ? "en" : "ru").format(count);
  if (language.startsWith("en")) return `${formatted} games`;
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${formatted} игр`;
  if (last > 1 && last < 5) return `${formatted} игры`;
  if (last === 1) return `${formatted} игра`;
  return `${formatted} игр`;
};
