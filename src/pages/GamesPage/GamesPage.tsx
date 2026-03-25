import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchGames } from "../../services/games/fetchGames";
import { getGenres } from "../../services/games/getGenres";
import { getPlatforms } from "../../services/platforms/getPlatformsList";
import GameCard from "../../components/GameCard/GameCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameFilters from "./components/GameFilters/GameFilters";
import styles from "./GamesPage.module.css";
import type { Game } from "../../types/game";

const GamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filter = (searchParams.get("filter") as "random" | "popular" | "rating") || "random";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedYear = searchParams.get("year") || "";
  const selectedGenreId = searchParams.get("genre") || "";
  const selectedPlatformId = searchParams.get("platform") || "";

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [platforms, setPlatforms] = useState<{ id: string; name: string }[]>([]);

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
    const fetchMetadata = async () => {
      try {
        const [genresList, platformsList] = await Promise.all([
          getGenres(),
          getPlatforms()
        ]);
        setGenres(genresList);
        setPlatforms(platformsList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  const getGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let ordering = "";
      if (filter === "popular") {
        ordering = "-added";
      } else if (filter === "rating") {
        ordering = "-rating";
      }

      const gamesData = await fetchGames(
        currentPage,
        ordering,
        selectedYear,
        selectedGenreId,
        selectedPlatformId
      );

      let resultGames = gamesData.games;
      if (filter === "random") {
        // Note: RAWG doesn't have a true 'random' ordering, so we shuffle on client side
        // but it will reshuffle on every page change/filter change.
        resultGames = [...resultGames].sort(() => Math.random() - 0.5);
      }

      setGames(resultGames);
      setHasMore(gamesData.nextPageUrl !== null);
    } catch (err) {
      setError("Failed to fetch games. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filter, currentPage, selectedYear, selectedGenreId, selectedPlatformId]);

  useEffect(() => {
    getGames();
  }, [getGames]);

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.gamesPage}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Games List</h1>
        
        <GameFilters
          filter={filter}
          setFilter={(f) => updateParams({ filter: f, page: 1 })}
          selectedYear={selectedYear}
          setSelectedYear={(y) => updateParams({ year: y, page: 1 })}
          selectedGenreId={selectedGenreId}
          setSelectedGenreId={(g) => updateParams({ genre: g, page: 1 })}
          selectedPlatformId={selectedPlatformId}
          setSelectedPlatformId={(p) => updateParams({ platform: p, page: 1 })}
          genres={genres}
          platforms={platforms}
        />

        <LoadingErrorMessage
          loading={loading}
          error={error}
          noResults={!loading && !error && games.length === 0}
        />

        {!loading && !error && games.length > 0 && (
          <div className={styles.gamesList}>
            {games.map((game) => (
              <Link 
                key={game.id} 
                to={selectedPlatformId ? `/game/${game.id}/${selectedPlatformId}` : `/game/${game.id}`} 
                className={styles.gameCardContainer}
              >
                <GameCard game={game} />
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            <span className={styles.pageNumber}>{currentPage}</span>
            {hasMore && (
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                className={styles.paginationButton}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
