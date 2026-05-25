import React, { useState } from "react";
import { fetchRandomGame } from "../../../../services/games/fetchGames";
import { getUserDevices } from "../../../../services/collection/collectionService";
import { useNavigate } from "react-router-dom";
import styles from "./GameFilters.module.css";

export type SortKey =
  | "popular"
  | "rating"
  | "metacritic"
  | "released"
  | "new"
  | "name";

interface GameFiltersProps {
  filter: SortKey;
  setFilter: (filter: SortKey) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedYearTo: string;
  setSelectedYearTo: (year: string) => void;
  selectedGenreId: string; // CSV
  setSelectedGenreId: (id: string) => void;
  selectedPlatformId: string;
  setSelectedPlatformId: (id: string) => void;
  selectedPlaytime: string;
  setSelectedPlaytime: (range: string) => void;
  selectedMetacritic: string;
  setSelectedMetacritic: (m: string) => void;
  genres: { id: string; name: string }[];
  platforms: { id: string | number; name: string }[];
  totalCount?: number;
  activeFilterCount: number;
}

const PLAYTIME_OPTIONS = [
  { label: "Любая длина", value: "" },
  { label: "Короткая (< 10ч)", value: "0,10" },
  { label: "Средняя (10–30ч)", value: "10,30" },
  { label: "Длинная (30–100ч)", value: "30,100" },
  { label: "Эпик (100ч+)", value: "100,500" },
];

const METACRITIC_OPTIONS = [
  { label: "Любой Metacritic", value: "" },
  { label: "60+", value: "60" },
  { label: "70+", value: "70" },
  { label: "80+ (хорошие)", value: "80" },
  { label: "90+ (легендарные)", value: "90" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Популярные" },
  { value: "rating", label: "По рейтингу" },
  { value: "metacritic", label: "По Metacritic" },
  { value: "released", label: "По дате релиза" },
  { value: "new", label: "Новинки (добавлены)" },
  { value: "name", label: "По названию (A→Z)" },
];

const formatNumber = (n?: number): string => {
  if (n === undefined) return "";
  return n.toLocaleString("ru-RU");
};

const GameFilters: React.FC<GameFiltersProps> = ({
  filter,
  setFilter,
  selectedYear,
  setSelectedYear,
  selectedYearTo,
  setSelectedYearTo,
  selectedGenreId,
  setSelectedGenreId,
  selectedPlatformId,
  setSelectedPlatformId,
  selectedPlaytime,
  setSelectedPlaytime,
  selectedMetacritic,
  setSelectedMetacritic,
  genres,
  platforms,
  totalCount,
  activeFilterCount,
}) => {
  const navigate = useNavigate();
  const [isRolling, setIsRolling] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const years = Array.from(
    { length: new Date().getFullYear() - 1979 },
    (_, i) => (1980 + i).toString()
  ).reverse();

  const handleGenreToggle = (genreId: string) => {
    const currentGenres = selectedGenreId ? selectedGenreId.split(",") : [];
    const index = currentGenres.indexOf(genreId);
    if (index > -1) currentGenres.splice(index, 1);
    else currentGenres.push(genreId);
    setSelectedGenreId(currentGenres.join(","));
  };

  const handleSurpriseMe = async () => {
    setIsRolling(true);
    setTimeout(async () => {
      let platform = selectedPlatformId;
      if (!platform) {
        try {
          const userDevices = await getUserDevices();
          if (userDevices.length > 0) platform = userDevices.join(",");
        } catch (err) {
          console.error("Error fetching user devices for surprise:", err);
        }
      }
      const game = await fetchRandomGame({
        year: selectedYear,
        genre: selectedGenreId,
        platform: platform,
      });
      setIsRolling(false);
      if (game) navigate(`/game/${game.id}`);
      else alert("По этим фильтрам игр не нашлось!");
    }, 1500);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.topRow}>
        <div className={styles.sortGroup}>
          <label className={styles.sortLabel} htmlFor="sort-select">Сортировка:</label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.metaRow}>
          {totalCount !== undefined && (
            <span className={styles.countBadge} aria-live="polite">
              Найдено: <strong>{formatNumber(totalCount)}</strong>
            </span>
          )}
          {activeFilterCount > 0 && (
            <span className={styles.activeBadge}>
              Активных фильтров: {activeFilterCount}
            </span>
          )}
          <button
            type="button"
            className={styles.collapseButton}
            onClick={() => setIsCollapsed((v) => !v)}
            aria-expanded={!isCollapsed}
            aria-controls="filters-body"
          >
            {isCollapsed ? "▾ Показать фильтры" : "▴ Скрыть фильтры"}
          </button>
          <button
            type="button"
            className={`${styles.surpriseButton} ${isRolling ? styles.rolling : ""}`}
            onClick={handleSurpriseMe}
            disabled={isRolling}
          >
            {isRolling ? "🎲 Крутим..." : "✨ Удиви меня!"}
          </button>
        </div>
      </div>

      <div
        id="filters-body"
        className={`${styles.body} ${isCollapsed ? styles.bodyHidden : ""}`}
      >
        <div className={styles.selectGroup}>
          <div className={styles.filterItem}>
            <label htmlFor="year-from">Год от</label>
            <select
              id="year-from"
              className={styles.selectFilter}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Любой</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="year-to">Год до</label>
            <select
              id="year-to"
              className={styles.selectFilter}
              value={selectedYearTo}
              onChange={(e) => setSelectedYearTo(e.target.value)}
            >
              <option value="">Любой</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="platform-select">Платформа</label>
            <select
              id="platform-select"
              className={styles.selectFilter}
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
            >
              <option value="">Все платформы</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="playtime-select">Длительность</label>
            <select
              id="playtime-select"
              className={styles.selectFilter}
              value={selectedPlaytime}
              onChange={(e) => setSelectedPlaytime(e.target.value)}
            >
              {PLAYTIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="metacritic-select">Metacritic</label>
            <select
              id="metacritic-select"
              className={styles.selectFilter}
              value={selectedMetacritic}
              onChange={(e) => setSelectedMetacritic(e.target.value)}
            >
              {METACRITIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.genreSection}>
          <label className={styles.genreLabel}>Жанры (можно несколько):</label>
          <div className={styles.genreChips}>
            {genres.map((genre) => {
              const isActive = selectedGenreId
                .split(",")
                .includes(genre.id.toString());
              return (
                <button
                  key={genre.id}
                  type="button"
                  className={`${styles.genreChip} ${isActive ? styles.activeChip : ""}`}
                  onClick={() => handleGenreToggle(genre.id.toString())}
                  aria-pressed={isActive}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameFilters;
