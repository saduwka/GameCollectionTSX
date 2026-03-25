import type { FC } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameCard from "../../components/GameCard/GameCard";
import {
  getPlatformDetails,
  getGamesForPlatform
} from "../../services/platforms/getPlatformDetails";
import { getGenres } from "../../services/games/getGenres";
import type { Genre } from "../../services/games/getGenres";
import styles from "./PlatformDetails.module.css";

const PlatformPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedGenre = searchParams.get("genre") || "";
  const ordering = searchParams.get("ordering") || "-added";
  const page = parseInt(searchParams.get("page") || "1");

  const [platformDetails, setPlatformDetails] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isFetching = useRef(false);

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

  useEffect(() => {
    const fetchPlatformDetails = async () => {
      setLoading(true);
      try {
        const platformData = await getPlatformDetails(id!);
        setPlatformDetails(platformData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchGenres = async () => {
      try {
        const genresData = await getGenres();
        setGenres(genresData);
      } catch (err: any) {
        console.error("Error fetching genres:", err);
      }
    };

    fetchPlatformDetails();
    fetchGenres();
  }, [id]);

  useEffect(() => {
    const fetchGames = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoadingMore(true);
      try {
        const gamesData = await getGamesForPlatform(id!, page, selectedGenre, ordering);

        if (gamesData.results.length === 0) {
          if (page === 1) setGames([]);
          setHasMore(false);
        } else {
          if (page === 1) {
            setGames(gamesData.results);
          } else {
            setGames((prevGames) => [...prevGames, ...gamesData.results]);
          }
          if (gamesData.results.length < 10) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
        }
      } catch (err: any) {
        setError(err.message);
        setHasMore(false);
      } finally {
        setLoadingMore(false);
        isFetching.current = false;
      }
    };

    fetchGames();
  }, [id, page, selectedGenre, ordering]);

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ genre: e.target.value, page: 1 });
  };

  const handleOrderingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ ordering: e.target.value, page: 1 });
  };

  if (loading) {
    return (
      <LoadingErrorMessage
        loading={true}
        error={null}
        noResults={false}
        message="Loading platform details..."
      />
    );
  }

  if (error) {
    return (
      <LoadingErrorMessage
        loading={false}
        error={error}
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
        Go Back
      </button>
      <h1 className={styles.heading}>{platformDetails.name}</h1>
      <p className={styles.platformDescription}>
        {platformDetails.description}
      </p>

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

      <h2 className={styles.heading}>Games</h2>
      <div className={styles.gameList}>
        {games.map((game) => (
          <Link to={`/game/${game.id}/${id}`} key={game.id}>
            <GameCard game={game} />
          </Link>
        ))}
        {games.length === 0 && !loadingMore && (
          <p className={styles.noGames}>No games found for this genre/platform.</p>
        )}
      </div>
      {hasMore && (
        <div className={styles.loadMoreButton}>
          <button
            onClick={() => updateParams({ page: page + 1 })}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlatformPage;
