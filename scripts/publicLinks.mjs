// 300 games is the prerender budget. Pages beyond this list would be thin copies of RAWG.
export const GAME_LIMIT = 300;
export const CATALOG_PAGE_SIZE = 20;
export const CATALOG_PAGES = GAME_LIMIT / CATALOG_PAGE_SIZE;

// A second genre page covers at most 40 games of that genre. If more than 20 of the
// 300 sitemap games belong to the genre, the rest are reached from /games/page/N/.
export const GENRE_PAGES = 2;

export const genres = [
  { slug: "action", ru: "Экшен", en: "Action" },
  { slug: "indie", ru: "Инди", en: "Indie" },
  { slug: "adventure", ru: "Приключения", en: "Adventure" },
  { slug: "role-playing-games-rpg", ru: "Ролевые", en: "RPG" },
  { slug: "strategy", ru: "Стратегии", en: "Strategy" },
  { slug: "shooter", ru: "Шутеры", en: "Shooter" },
  { slug: "casual", ru: "Казуальные", en: "Casual" },
  { slug: "simulation", ru: "Симуляторы", en: "Simulation" },
  { slug: "puzzle", ru: "Головоломки", en: "Puzzle" },
  { slug: "arcade", ru: "Аркады", en: "Arcade" },
];

export const platforms = [
  { id: 4, name: "PC" },
  { id: 171, name: "Web" },
  { id: 5, name: "macOS" },
  { id: 6, name: "Linux" },
  { id: 3, name: "iOS" },
  { id: 21, name: "Android" },
  { id: 18, name: "PlayStation 4" },
  { id: 7, name: "Nintendo Switch" },
  { id: 1, name: "Xbox One" },
  { id: 16, name: "PlayStation 3" },
];
