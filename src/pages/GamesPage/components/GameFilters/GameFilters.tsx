import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { gamePath } from "../../../../seo/canonicalUrl";
import { fetchRandomGame } from "../../../../services/games/fetchGames";
import { getUserDevices } from "../../../../services/collection/collectionService";
import Opt from "../../../../components/ui/Opt";
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
  genres: { id: string; name: string; slug?: string }[];
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
    { label: t('catalog.filters.score_high'), value: "80" },
    { label: t('catalog.filters.score_top'), value: "90" },
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
      if (game) navigate(gamePath(game.id));
      else alert(t('catalog.filters.no_games_found'));
    }, 1500);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.topRow}>
        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>{t('catalog.filters.sort_label')}</span>
          <div className={styles.opts}>
            {SORT_OPTIONS.map((opt) => (
              <Opt key={opt.value} pressed={filter === opt.value} onClick={() => setFilter(opt.value)}>
                {opt.label}
              </Opt>
            ))}
          </div>
        </div>

        <div className={styles.metaRow}>
          {totalCount !== undefined && (
            <span className={styles.countBadge} aria-live="polite">
              {t('catalog.filters.results_label')}: <strong>{formatNumber(totalCount)}</strong>
            </span>
          )}
          {activeFilterCount > 0 && (
            <span className={styles.activeBadge}>
              {t('catalog.filters.active_filters')}: {activeFilterCount}
            </span>
          )}
          <button
            type="button"
            className={styles.collapseButton}
            onClick={() => setIsCollapsed((v) => !v)}
            aria-expanded={!isCollapsed}
            aria-controls="filters-body"
          >
            {isCollapsed ? t('catalog.filters.show_filters') : t('catalog.filters.hide_filters')}
          </button>
          <button
            type="button"
            className={`${styles.surpriseButton} ${isRolling ? styles.rolling : ""}`}
            onClick={handleSurpriseMe}
            disabled={isRolling}
          >
            {isRolling ? t('recommendations.refreshing') : t('catalog.filters.surprise_me')}
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
              <option value="">{t('catalog.filters.any')}</option>
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
              <option value="">{t('catalog.filters.any')}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="platform-select">{t('common.platforms')}</label>
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
            <span className={styles.rowLabel}>{t('catalog.filters.playtime')}</span>
            <div className={styles.opts}>
              {PLAYTIME_OPTIONS.map((opt) => (
                <Opt key={opt.value || "any"} pressed={selectedPlaytime === opt.value} onClick={() => setSelectedPlaytime(opt.value)}>
                  {opt.label}
                </Opt>
              ))}
            </div>
          </div>

          <div className={styles.filterItem}>
            <span className={styles.rowLabel}>Metacritic</span>
            <div className={styles.opts}>
              {METACRITIC_OPTIONS.map((opt) => (
                <Opt key={opt.value || "any"} pressed={selectedMetacritic === opt.value} onClick={() => setSelectedMetacritic(opt.value)}>
                  {opt.label}
                </Opt>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.genreSection}>
          <label className={styles.genreLabel}>{t('compare.genres_label')}</label>
          <div className={styles.genreChips}>
            {genres.map((genre) => {
              const isActive = selectedGenreId
                .split(",")
                .some((value) => value === genre.id.toString() || (!!genre.slug && value === genre.slug));
              return (
                <Opt key={genre.id} pressed={isActive} onClick={() => handleGenreToggle(genre.id.toString())}>
                  {genre.name}
                </Opt>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameFilters;
