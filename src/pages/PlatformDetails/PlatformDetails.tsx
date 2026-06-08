import type { FC } from "react";
import { useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameCard from "../../components/GameCard/GameCard";
import YouTubeSection from "../../components/YouTubeSection/YouTubeSection";
import PageMeta from "../../components/PageMeta/PageMeta";
import {
  getPlatformDetails,
  getGamesForPlatform
} from "../../services/platforms/getPlatformDetails";
import { getGenres } from "../../services/games/getGenres";
import { getPlatformWiki } from "../../services/platforms/wikiService";
import { searchYouTubeVideos } from "../../services/media/youtubeService";
import { getConsoleFact } from "../../services/platforms/factService";
import type { Platform, Game } from "../../types/game";
import styles from './PlatformDetails.module.scss';

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
  });

  const funFact = platformDetails ? getConsoleFact(platformDetails.slug) : null;

  const { data: wikiData, isLoading: loadingWiki } = useQuery({
    queryKey: ["platformWiki", platformDetails?.name],
    queryFn: () => getPlatformWiki(platformDetails!.name),
    enabled: !!platformDetails?.name,
  });

  const { data: platformVideos, isLoading: loadingVideos } = useQuery({
    queryKey: ["platformVideos", platformDetails?.name, i18n.language],
    queryFn: async () => {
      const isRu = i18n.language.startsWith('ru');
      const lang = isRu ? 'ru' : 'en';
      const query = isRu
        ? `${platformDetails!.name} обзор прохождение`
        : `${platformDetails!.name} review walkthrough`;
      return await searchYouTubeVideos(query, 6, lang);
    },
    enabled: !!platformDetails?.name,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const { data: gamesData, isLoading: loadingGames, error: gamesError } = useQuery({
    queryKey: ["platformGames", id, page, selectedGenre, ordering],
    queryFn: () => getGamesForPlatform(id!, page, selectedGenre, ordering),
    enabled: !!id,
  });

  const games = gamesData?.results || [];
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
    <div className={styles.platformPage}>
      <PageMeta
        title={platformDetails?.name || t('platforms_page.title')}
        description={
          platformDetails?.name
            ? `${platformDetails.name} — ${t('platforms_page.description')}`
            : undefined
        }
        image={platformDetails?.image_background || platformDetails?.image || undefined}
      />
      <button
        className={styles.backButton}
        onClick={() => window.history.back()}
      >
        {t('platform_details.go_back')}
      </button>

      <div className={styles.heroSection}>
        {(platformDetails?.image_background || platformDetails?.image || wikiData?.thumbnail) && (
          <img 
            src={platformDetails?.image_background || platformDetails?.image || wikiData?.thumbnail} 
            alt="" 
            className={styles.heroBg} 
          />
        )}
        <div className={styles.heroOverlay}>
          <div className={styles.heroTitleGroup}>
            <h1 className={styles.heading}>{platformDetails?.name}</h1>
            <div className={styles.quickStats}>
              {platformDetails?.year_start && <span>{t('platform_details.release', { year: platformDetails.year_start })}</span>}
              {platformDetails?.games_count && <span>{t('platform_details.library', { count: platformDetails.games_count.toLocaleString() })}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.wikiSection}>
        {loadingWiki ? (
          <p>{t('common.loading')}</p>
        ) : wikiData ? (
          <div className={styles.wikiContent}>
            <div className={styles.wikiText}>
              <h2 className={styles.sectionHeading}>{t('platform_details.history')}</h2>
              <p>{wikiData.extract}</p>
              {wikiData.content_urls?.desktop.page && (
                <a 
                  href={wikiData.content_urls.desktop.page} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.wikiLink}
                >
                  {t('platform_details.read_more')}
                </a>
              )}
            </div>
            {wikiData.thumbnail && (
              <img src={wikiData.thumbnail} alt={wikiData.title} className={styles.wikiImage} />
            )}
          </div>
        ) : (
          <p className={styles.platformDescription}>{platformDetails?.description}</p>
        )}
      </div>

      {funFact && (
        <div className={styles.factBox}>
          <div className={styles.factIcon}>💡</div>
          <div className={styles.factText}>
            <h3>{t('platform_details.did_you_know')}</h3>
            <p>{funFact}</p>
          </div>
        </div>
      )}

      <YouTubeSection 
        title={`${platformDetails?.name} - ${t('platform_details.reviews_walkthroughs')}`}
        videos={platformVideos || []}
        loading={loadingVideos}
      />

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
                  {genre.name}
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
    </div>
  );
};

export default PlatformPage;
