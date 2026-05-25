import type { FC } from "react";
import { useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameCard from "../../components/GameCard/GameCard";
import YouTubeSection from "../../components/YouTubeSection/YouTubeSection";
import {
  getPlatformDetails,
  getGamesForPlatform
} from "../../services/platforms/getPlatformDetails";
import { getGenres } from "../../services/games/getGenres";
import { getPlatformWiki } from "../../services/platforms/wikiService";
import { searchYouTubeVideos } from "../../services/media/youtubeService";
import { getConsoleFact } from "../../services/platforms/factService";
import type { Platform, Game } from "../../types/game";
import styles from "./PlatformDetails.module.css";

const PlatformPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

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
    queryKey: ["platformVideos", platformDetails?.name],
    queryFn: async () => {
      const [reviewsRu, reviewsEn] = await Promise.all([
        searchYouTubeVideos(`${platformDetails!.name} обзор приставки`, 3),
        searchYouTubeVideos(`${platformDetails!.name} console review`, 3)
      ]);
      return [...reviewsRu, ...reviewsEn];
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
        message="Loading platform details..."
      />
    );
  }

  if (platformError || gamesError) {
    return (
      <LoadingErrorMessage
        loading={false}
        error={((platformError || gamesError) as Error).message}
        noResults={false}
        message="An error occurred while loading platform details."
      />
    );
  }

  return (
    <div className={styles.platformPage}>
      <button
        className={styles.backButton}
        onClick={() => window.history.back()}
      >
        ← Go Back
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
              {platformDetails?.year_start && <span>Release: {platformDetails.year_start}</span>}
              {platformDetails?.games_count && <span>Library: {platformDetails.games_count.toLocaleString()} games</span>}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.wikiSection}>
        {loadingWiki ? (
          <p>Loading historical data...</p>
        ) : wikiData ? (
          <div className={styles.wikiContent}>
            <div className={styles.wikiText}>
              <h2 className={styles.sectionHeading}>History & Overview</h2>
              <p>{wikiData.extract}</p>
              {wikiData.content_urls?.desktop.page && (
                <a 
                  href={wikiData.content_urls.desktop.page} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.wikiLink}
                >
                  Read more on Wikipedia →
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
            <h3>Did you know?</h3>
            <p>{funFact}</p>
          </div>
        </div>
      )}

      <YouTubeSection 
        title={`${platformDetails?.name} - Video Reviews & Documentaries`}
        videos={platformVideos || []}
        loading={loadingVideos}
      />

      <div className={styles.gamesHeader}>
        <h2 className={styles.sectionHeading}>Best Games</h2>

        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="genre-select" className={styles.filterLabel}>Filter by Genre:</label>
            <select
              id="genre-select"
              value={selectedGenre}
              onChange={handleGenreChange}
              className={styles.filterSelect}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="ordering-select" className={styles.filterLabel}>Sort by:</label>
            <select
              id="ordering-select"
              value={ordering}
              onChange={handleOrderingChange}
              className={styles.filterSelect}
            >
              <option value="-added">Popularity</option>
              <option value="-rating">Rating</option>
              <option value="-released">Release Date</option>
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
          <p className={styles.noGames}>No games found for this genre/platform.</p>
        )}
      </div>

      {hasMore && (
        <div className={styles.loadMoreButton}>
          <button
            onClick={() => updateParams({ page: page + 1 })}
            disabled={loadingGames}
          >
            {loadingGames ? "Loading..." : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlatformPage;

