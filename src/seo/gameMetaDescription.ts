export interface GameMetaSource {
  id: number;
  name: string;
  released?: string | null;
  genres?: string[];
  platforms?: string[];
  metacritic?: number | null;
  playtime?: number | null;
  collectionTitle?: string;
}

const yearOf = (released?: string | null) => {
  const year = released?.slice(0, 4) ?? "";
  return /^\d{4}$/.test(year) ? year : "";
};

const list = (values: string[] | undefined, limit: number) =>
  (values ?? []).map((item) => item.trim()).filter(Boolean).slice(0, limit);

export const gameMetaDescription = (game: GameMetaSource, english: boolean) => {
  const year = yearOf(game.released);
  const genres = list(game.genres, 2);
  const platforms = list(game.platforms, 3);
  const title = year ? `${game.name} (${year})` : game.name;
  const head = genres.length ? `${title} — ${genres.join(", ")}.` : `${title}.`;
  const platformLine = platforms.length
    ? english
      ? ` Platforms: ${platforms.join(", ")}.`
      : ` Платформы: ${platforms.join(", ")}.`
    : "";
  const score = game.metacritic ? ` Metacritic ${game.metacritic}.` : "";
  const hours =
    game.playtime && game.playtime > 0 ? (english ? ` About ${game.playtime} h.` : ` Около ${game.playtime} ч.`) : "";
  const tail = english
    ? " How long it takes, where to play it, and similar games — Gamevening."
    : " Сколько времени займёт, на чём лучше играть и похожие игры — Gamevening.";
  const collection = game.collectionTitle
    ? english
      ? ` In the “${game.collectionTitle}” collection.`
      : ` В подборке «${game.collectionTitle}».`
    : "";
  return `${head}${platformLine}${score}${hours}${tail}${collection}`.replace(/\s+/g, " ").trim();
};

export const disambiguateDescriptions = (rows: { id: number; description: string }[]) => {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.description, (counts.get(row.description) ?? 0) + 1);
  return rows.map((row) =>
    (counts.get(row.description) ?? 0) > 1 ? `${row.description} #${row.id}` : row.description,
  );
};
