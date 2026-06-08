import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fetchRandomGame } from "../../../../services/games/fetchGames";
import { getUserDevices } from "../../../../services/collection/collectionService";
import styles from "./GameFilters.module.scss";

interface GameFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedYearTo: string;
  setSelectedYearTo: (year: string) => void;
  selectedGenreId: string;
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isRolling, setIsRolling] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const years = Array.from(
    { length: new Date().getFullYear() - 1979 },
    (_, i) => (1980 + i).toString()
  ).reverse();

  const PLAYTIME_OPTIONS = [
    { label: t('catalog.filters.any_length'), value: "" },
    { label: t('catalog.filters.short'), value: "0,10" },
    { label: t('catalog.filters.medium'), value: "10,30" },
    { label: t('catalog.filters.long'), value: "30,100" },
    { label: t('catalog.filters.epic'), value: "100,500" },
  ];

  const METACRITIC_OPTIONS = [
    { label: t('catalog.filters.any_metacritic'), value: "" },
    { label: "60+", value: "60" },
    { label: "70+", value: "70" },
    { label: `80+ (${t('home.top_metacritic_subtitle').split(' ')[0].toLowerCase()})`, value: "80" },
    { label: `90+ (${t('home.indie_gems_title').split(' ')[0].toLowerCase()})`, value: "90" },
  ];

  const SORT_OPTIONS: { value: string; label: string }[] = [
    { value: "popular", label: t('catalog.filters.sort_popular') },
    { value: "rating", label: t('catalog.filters.sort_rating') },
    { value: "metacritic", label: t('catalog.filters.sort_metacritic') },
    { value: "released", label: t('catalog.filters.sort_released') },
    { value: "new", label: t('catalog.filters.sort_new') },
    { value: "name", label: t('catalog.filters.sort_name') },
  ];

  const formatNumber = (n?: number): string => {
    if (n === undefined) return "";
    return n.toLocaleString(i18n.language.startsWith('ru') ? "ru-RU" : "en-US");
  };

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
      else alert(t('catalog.filters.no_games_found'));
    }, 1500);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.topRow}>
        <div className={styles.sortGroup}>
          <label className={styles.sortLabel} htmlFor="sort-select">{t('catalog.filters.sort_name').split(' ')[0]}:</label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.metaRow}>
          {totalCount !== undefined && (
            <span className={styles.countBadge} aria-live="polite">
              {t('common.results').split(' ')[0]}: <strong>{formatNumber(totalCount)}</strong>
            </span>
          )}
          {activeFilterCount > 0 && (
            <span className={styles.activeBadge}>
              {t('catalog.filters.sort_new').split(' ')[0]} {t('common.games_plural_1').split(' ')[0]}: {activeFilterCount}
            </span>
          )}
          <button
            type="button"
            className={styles.collapseButton}
            onClick={() => setIsCollapsed((v) => !v)}
            aria-expanded={!isCollapsed}
            aria-controls="filters-body"
          >
            {isCollapsed ? `▾ ${t('catalog.filters.show_filters')}` : `▴ ${t('catalog.filters.hide_filters')}`}
          </button>
          <button
            type="button"
            className={`${styles.surpriseButton} ${isRolling ? styles.rolling : ""}`}
            onClick={handleSurpriseMe}
            disabled={isRolling}
          >
            {isRolling ? `🎲 ${t('recommendations.refreshing')}` : t('catalog.filters.surprise_me')}
          </button>
        </div>
      </div>

      <div
        id="filters-body"
        className={`${styles.body} ${isCollapsed ? styles.bodyHidden : ""}`}
      >
        <div className={styles.selectGroup}>
          <div className={styles.filterItem}>
            <label htmlFor="year-from">{t('compare.year_from')}</label>
            <select
              id="year-from"
              className={styles.selectFilter}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">{t('catalog.filters.any_length').split(' ')[0]}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="year-to">{t('compare.year_to')}</label>
            <select
              id="year-to"
              className={styles.selectFilter}
              value={selectedYearTo}
              onChange={(e) => setSelectedYearTo(e.target.value)}
            >
              <option value="">{t('catalog.filters.any_length').split(' ')[0]}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="platform-select">{t('common.platforms').slice(0, -1)}</label>
            <select
              id="platform-select"
              className={styles.selectFilter}
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
            >
              <option value="">{t('home.see_all')} {t('common.platforms')}</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="playtime-select">{t('compare.playtime_avg').split(' ')[1]}</label>
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
          <label className={styles.genreLabel}>{t('compare.genres_label')}</label>
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
