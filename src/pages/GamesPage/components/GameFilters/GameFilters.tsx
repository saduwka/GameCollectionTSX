import React, { useState } from "react";
import { fetchRandomGame } from "../../../../services/games/fetchGames";
import { getUserDevices } from "../../../../services/collection/collectionService";
import { useNavigate } from "react-router-dom";
import styles from "./GameFilters.module.css";

interface GameFiltersProps {
  filter: "random" | "popular" | "rating";
  setFilter: (filter: "random" | "popular" | "rating") => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedGenreId: string; // Может быть списком через запятую
  setSelectedGenreId: (id: string) => void;
  selectedPlatformId: string;
  setSelectedPlatformId: (id: string) => void;
  selectedPlaytime: string;
  setSelectedPlaytime: (range: string) => void;
  genres: { id: string; name: string }[];
  platforms: { id: string; name: string }[];
}

const PLAYTIME_OPTIONS = [
  { label: "Any Length", value: "" },
  { label: "Short (< 10h)", value: "0,10" },
  { label: "Medium (10-30h)", value: "10,30" },
  { label: "Long (30-100h)", value: "30,100" },
  { label: "Epic (100h+)", value: "100,500" },
];

const GameFilters: React.FC<GameFiltersProps> = ({
  filter,
  setFilter,
  selectedYear,
  setSelectedYear,
  selectedGenreId,
  setSelectedGenreId,
  selectedPlatformId,
  setSelectedPlatformId,
  selectedPlaytime,
  setSelectedPlaytime,
  genres,
  platforms,
}) => {
  const navigate = useNavigate();
  const [isRolling, setIsRolling] = useState(false);

  const years = Array.from(
    { length: new Date().getFullYear() - 1979 },
    (_, i) => (1980 + i).toString()
  ).reverse();

  const handleGenreToggle = (genreId: string) => {
    const currentGenres = selectedGenreId ? selectedGenreId.split(",") : [];
    const index = currentGenres.indexOf(genreId);
    
    if (index > -1) {
      currentGenres.splice(index, 1);
    } else {
      currentGenres.push(genreId);
    }
    
    setSelectedGenreId(currentGenres.join(","));
  };

  const handleSurpriseMe = async () => {
    setIsRolling(true);
    // Имитация рулетки
    setTimeout(async () => {
      let platform = selectedPlatformId;
      
      // Если платформа не выбрана вручную, пробуем использовать приставки пользователя
      if (!platform) {
        try {
          const userDevices = await getUserDevices();
          if (userDevices.length > 0) {
            platform = userDevices.join(",");
          }
        } catch (err) {
          console.error("Error fetching user devices for surprise:", err);
        }
      }

      const game = await fetchRandomGame({
        year: selectedYear,
        genre: selectedGenreId,
        platform: platform
      });
      setIsRolling(false);
      if (game) {
        navigate(`/game/${game.id}`);
      } else {
        alert("No games found with these filters!");
      }
    }, 1500);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.topRow}>
        <div className={styles.buttonGroup}>
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
            Top Rated
          </button>
        </div>

        <button 
          className={`${styles.surpriseButton} ${isRolling ? styles.rolling : ""}`}
          onClick={handleSurpriseMe}
          disabled={isRolling}
        >
          {isRolling ? "🎲 Rolling..." : "✨ Surprise Me!"}
        </button>
      </div>

      <div className={styles.selectGroup}>
        <div className={styles.filterItem}>
          <label>Year</label>
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
        </div>

        <div className={styles.filterItem}>
          <label>Platform</label>
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

        <div className={styles.filterItem}>
          <label>Playtime</label>
          <select
            className={styles.selectFilter}
            value={selectedPlaytime}
            onChange={(e) => setSelectedPlaytime(e.target.value)}
          >
            {PLAYTIME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.genreSection}>
        <label className={styles.genreLabel}>Genres (Multiselect):</label>
        <div className={styles.genreChips}>
          {genres.map((genre) => {
            const isActive = selectedGenreId.split(",").includes(genre.id.toString());
            return (
              <button
                key={genre.id}
                className={`${styles.genreChip} ${isActive ? styles.activeChip : ""}`}
                onClick={() => handleGenreToggle(genre.id.toString())}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameFilters;
