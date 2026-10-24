import type { FC } from "react";
import { useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameCard from "../../components/GameCard/GameCard";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { itemListJsonLd } from "../../components/JsonLd/JsonLd";
import RawgCredit from "../../components/RawgCredit/RawgCredit";
import { RAWG_DETAIL_STALE_TIME, RAWG_LIST_STALE_TIME } from "../../services/rawgCache";
import {
  getPlatformDetails,
  getGamesForPlatform
} from "../../services/platforms/getPlatformDetails";
import { getGenres } from "../../services/games/getGenres";
import { normalizeGame } from "../../services/games/normalizeGame";
import { isSafeCandidate, MIN_RATINGS } from "../../services/recommendations/safeCandidate";
import type { Game, Platform } from "../../types/game";
import { gamesCountLabel, localizedGenre } from "../../seo/labels";
import { collections } from "../../data/collections";
import { collectionPath, gamesPath, genrePath, platformsPath } from "../../seo/canonicalUrl";
import styles from "./PlatformDetails.module.scss";

const PlatformPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  const selectedGenre = searchParams.get("genre") || "";
  const ordering = searchParams.get("ordering") || "-added";
  const page = parseInt(searchParams.get("page") || "1");

  const updateParams = useCallback((newParams: Record<string, string | number>) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  const { data: platformDetails, isLoading: loadingPlatform, error: platformError } = useQuery<Platform>({
    queryKey: ["platform", id],
    queryFn: () => getPlatformDetails(id!),
    enabled: !!id,
    staleTime: RAWG_DETAIL_STALE_TIME,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
    staleTime: RAWG_DETAIL_STALE_TIME,
  });

  const { data: gamesData, isLoading: loadingGames, error: gamesError } = useQuery({
    queryKey: ["platformGames", id, page, selectedGenre, ordering],
    queryFn: () => getGamesForPlatform(id!, page, selectedGenre, ordering),
    enabled: !!id,
    staleTime: RAWG_LIST_STALE_TIME,
  });

  const games = (gamesData?.results || [])
    .map((raw: Parameters<typeof normalizeGame>[0]) => normalizeGame(raw))
    .filter((game: Game) => isSafeCandidate(game, { minRatings: MIN_RATINGS }));
  const hasMore = !!gamesData?.next;

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ genre: e.target.value, page: 1 });
  };

  const handleOrderingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ ordering: e.target.value, page: 1 });
  };

  if (loadingPlatform) {
    return (
      <LoadingErrorMessage
        loading={true}
        error={null}
        noResults={false}
        message={t('common.loading')}
      />
    );
  }

  if (platformError || gamesError) {
    return (
      <LoadingErrorMessage
        loading={false}
        error={((platformError || gamesError) as Error).message}
        noResults={false}
        message={t('common.error')}
      />
    );
  }

  return (
    <div className={styles.platformPage} data-seo-ready={!loadingGames && games.length > 0 && platformDetails?.name ? "true" : "false"}>
      <PageMeta
        title={platformDetails?.name || t('platforms_page.title')}
        description={
          platformDetails?.name
            ? `${platformDetails.name} — ${t('platforms_page.description')}`
            : undefined
        }
        image={platformDetails?.image_background || platformDetails?.image || undefined}
      />
      {games.length > 0 && <JsonLd data={itemListJsonLd(games)} />}
      <nav className={styles.crumbs}>
        <Link to={platformsPath()}>{t("platforms_page.title")}</Link>
        <Link to={gamesPath()}>{t("common.games")}</Link>
      </nav>
      <button
        className={styles.backButton}
        onClick={() => window.history.back()}
      >
        {t('platform_details.go_back')}
      </button>

      <div className={styles.heroSection}>
        {(platformDetails?.image_background || platformDetails?.image) && (
          <img 
            src={platformDetails.image_background || platformDetails.image || undefined} 
            alt="" 
            className={styles.heroBg}
            width={1280}
            height={720}
          />
        )}
        <div className={styles.heroOverlay}>
          <div className={styles.heroTitleGroup}>
            <h1 className={styles.heading}>{t("platform_details.play_on", { name: platformDetails?.name })}</h1>
            <div className={styles.quickStats}>
              {platformDetails?.year_start && <span>{t('platform_details.release', { year: platformDetails.year_start })}</span>}
              {platformDetails?.games_count ? <span>{gamesCountLabel(platformDetails.games_count, i18n.language)}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <nav className={styles.crumbs}>
        {collections.slice(0, 5).map((collection) => (
          <Link key={collection.slug} to={collectionPath(collection.slug)}>
            {i18n.language.startsWith("en") ? collection.title.en : collection.title.ru}
          </Link>
        ))}
        <Link to={genrePath("action")}>{localizedGenre("Action", i18n.language.startsWith("en"), "action")}</Link>
        <Link to={genrePath("adventure")}>{localizedGenre("Adventure", i18n.language.startsWith("en"), "adventure")}</Link>
        <Link to={genrePath("role-playing-games-rpg")}>{localizedGenre("RPG", i18n.language.startsWith("en"), "role-playing-games-rpg")}</Link>
      </nav>

      <div className={styles.gamesHeader}>
        <h2 className={styles.sectionHeading}>{t('platform_details.best_games')}</h2>

        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="genre-select" className={styles.filterLabel}>{t('platform_details.filter_genre')}</label>
            <select
              id="genre-select"
              value={selectedGenre}
              onChange={handleGenreChange}
              className={styles.filterSelect}
            >
              <option value="">{t('catalog.filters.all_genres')}</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {localizedGenre(genre.name, i18n.language.startsWith("en"), genre.slug) || genre.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="ordering-select" className={styles.filterLabel}>{t('platform_details.sort_by')}</label>
            <select
              id="ordering-select"
              value={ordering}
              onChange={handleOrderingChange}
              className={styles.filterSelect}
            >
              <option value="-added">{t('catalog.filters.sort_popular')}</option>
              <option value="-rating">{t('catalog.filters.sort_rating')}</option>
              <option value="-released">{t('catalog.filters.sort_released')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.gameList}>
        {games.map((game: Game) => (
          <Link to={`/game/${game.id}/${id}`} key={game.id} className={styles.gameCardWrapper}>
            <GameCard game={game} />
          </Link>
        ))}
        {games.length === 0 && !loadingGames && (
          <p className={styles.noGames}>{t('platform_details.no_games')}</p>
        )}
      </div>

      {hasMore && (
        <div className={styles.loadMoreButton}>
          <button
            onClick={() => updateParams({ page: page + 1 })}
            disabled={loadingGames}
          >
            {loadingGames ? t('common.loading') : t('platform_details.load_more')}
          </button>
        </div>
      )}
      <RawgCredit />
    </div>
  );
};

export default PlatformPage;
