import React from "react";
import styles from "./GameFilters.module.css";

interface GameFiltersProps {
  filter: "random" | "popular" | "rating";
  setFilter: (filter: "random" | "popular" | "rating") => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedGenreId: string;
  setSelectedGenreId: (id: string) => void;
  selectedPlatformId: string;
  setSelectedPlatformId: (id: string) => void;
  genres: { id: string; name: string }[];
  platforms: { id: string; name: string }[];
}

const GameFilters: React.FC<GameFiltersProps> = ({
  filter,
  setFilter,
  selectedYear,
  setSelectedYear,
  selectedGenreId,
  setSelectedGenreId,
  selectedPlatformId,
  setSelectedPlatformId,
  genres,
  platforms,
}) => {
  const years = Array.from(
    { length: new Date().getFullYear() - 1979 },
    (_, i) => (1980 + i).toString()
  ).reverse();

  return (
    <div className={styles.filters}>
      <div className={styles.buttonGroup}>
        <button
          className={filter === "random" ? styles.activeButton : ""}
          onClick={() => setFilter("random")}
        >
          Random
        </button>
        <button
          className={filter === "popular" ? styles.activeButton : ""}
          onClick={() => setFilter("popular")}
        >
          Popular
        </button>
        <button
          className={filter === "rating" ? styles.activeButton : ""}
          onClick={() => setFilter("rating")}
        >
          Rating
        </button>
      </div>

      <div className={styles.selectGroup}>
        <select
          className={styles.selectFilter}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          className={styles.selectFilter}
          value={selectedGenreId}
          onChange={(e) => setSelectedGenreId(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>

        <select
          className={styles.selectFilter}
          value={selectedPlatformId}
          onChange={(e) => setSelectedPlatformId(e.target.value)}
        >
          <option value="">All Platforms</option>
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GameFilters;
