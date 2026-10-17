import type { CollectedGame } from "./collectionService";

export interface CollectionStats {
  total: number;
  playing: number;
  completed: number;
  backlog: number;
  wishlist: number;
  avgRating: string;
  totalHours: number;
  topGenres: string[];
  topGames: { name: string; image: string }[];
}

export const getCollectionStats = (collection: CollectedGame[]): CollectionStats => {
  const rated = collection.filter((game) => (game.rating || 0) > 0);
  const genreCounts: Record<string, number> = {};

  collection.forEach((game) => {
    (game.genres || []).forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const avgRating = rated.length
    ? (rated.reduce((acc, game) => acc + (game.rating || 0), 0) / rated.length).toFixed(1)
    : "N/A";

  return {
    total: collection.length,
    playing: collection.filter((game) => game.status === "Playing").length,
    completed: collection.filter((game) => game.status === "Completed").length,
    backlog: collection.filter((game) => game.status === "Backlog").length,
    wishlist: collection.filter((game) => game.status === "Wishlist").length,
    avgRating,
    totalHours: collection.reduce((acc, game) => acc + (game.hoursPlayed || 0), 0),
    topGenres,
    topGames: [...collection]
      .filter((game) => (game.rating || 0) > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3)
      .map((game) => ({ name: game.name, image: game.background_image })),
  };
};

export const rankBacklog = (
  collection: CollectedGame[],
  deviceNames: string[],
  topGenres: string[]
): CollectedGame[] => {
  const knownDevices = deviceNames.filter((name) => name && !name.startsWith("#"));
  const backlog = collection.filter((game) => game.status === "Backlog");
  const filtered = knownDevices.length
    ? backlog.filter((game) => matchesDevice(game.playingOn, knownDevices))
    : backlog;

  return [...filtered].sort((a, b) => {
    const ratingDelta = positiveRating(b) - positiveRating(a);
    if (ratingDelta !== 0) return ratingDelta;

    const genreDelta = genreScore(b, topGenres) - genreScore(a, topGenres);
    if (genreDelta !== 0) return genreDelta;

    return playtimeOf(a) - playtimeOf(b);
  });
};

const positiveRating = (game: CollectedGame) =>
  game.rating && game.rating > 0 ? game.rating : 0;

const genreScore = (game: CollectedGame, topGenres: string[]) =>
  (game.genres || []).some((genre) => topGenres.includes(genre)) ? 1 : 0;

const playtimeOf = (game: CollectedGame) =>
  typeof game.playtime === "number" ? game.playtime : Number.POSITIVE_INFINITY;

const matchesDevice = (playingOn: string | undefined, deviceNames: string[]) => {
  if (!playingOn) return true;
  const value = playingOn.toLowerCase();
  return deviceNames.some((name) => {
    const device = name.toLowerCase();
    return value.includes(device) || device.includes(value);
  });
};
