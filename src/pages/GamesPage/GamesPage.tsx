// FILE: src/pages/GamesPage/GamesPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchGames } from "../../services/games/fetchGames";
import { getGenres } from "../../services/games/getGenres";
import { getPlatforms } from "../../services/platforms/getPlatformsList";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameFilters from "./components/GameFilters/GameFilters";
import styles from "./GamesPage.module.css";
import type { Game } from "../../types/game";

const STORAGE_KEY = "playhub_filters";

const GamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filter = (searchParams.get("filter") as "random" | "popular" | "rating") || "popular";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedYear = searchParams.get("year") || "";
  const selectedGenreId = searchParams.get("genre") || "";
  const selectedPlatformId = searchParams.get("platform") || "";
  const selectedDeveloperId = searchParams.get("developer") || "";
  const selectedTagId = searchParams.get("tag") || "";
  const selectedPlaytime = searchParams.get("playtime") || "";

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [platforms, setPlatforms] = useState<{ id: string | number; name: string }[]>([]);

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

  // Сохранение фильтров в localStorage
  useEffect(() => {
    const filters = {
      year: selectedYear,
      genre: selectedGenreId,
      platform: selectedPlatformId,
      playtime: selectedPlaytime
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [selectedYear, selectedGenreId, selectedPlatformId, selectedPlaytime]);

  // Восстановление фильтров при первом входе (если URL пустой)
  useEffect(() => {
    if (searchParams.toString() === "") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const newParams: Record<string, string> = {};
        if (parsed.year) newParams.year = parsed.year;
        if (parsed.genre) newParams.genre = parsed.genre;
        if (parsed.platform) newParams.platform = parsed.platform;
        if (parsed.playtime) newParams.playtime = parsed.playtime;
        if (Object.keys(newParams).length > 0) {
          setSearchParams(newParams);
        }
      }
    }
  }, []);

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
        selectedPlatformId,
        selectedDeveloperId,
        selectedTagId,
        selectedPlaytime
      );

      setGames(gamesData.games);
      setHasMore(gamesData.nextPageUrl !== null);
    } catch (err) {
      setError("Failed to fetch games. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filter, currentPage, selectedYear, selectedGenreId, selectedPlatformId, selectedDeveloperId, selectedTagId, selectedPlaytime]);

  useEffect(() => {
    getGames();
  }, [getGames]);

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchParams({ filter: "popular" });
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasAnyFilter = selectedYear || selectedGenreId || selectedPlatformId || selectedDeveloperId || selectedTagId || selectedPlaytime;

  return (
    <div className={styles.gamesPage}>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>Discover Games</h1>
          {hasAnyFilter && (
            <button className={styles.clearButton} onClick={handleClearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
        
        <GameFilters
          filter={filter}
          setFilter={(f) => updateParams({ filter: f, page: 1 })}
          selectedYear={selectedYear}
          setSelectedYear={(y) => updateParams({ year: y, page: 1 })}
          selectedGenreId={selectedGenreId}
          setSelectedGenreId={(g) => updateParams({ genre: g, page: 1 })}
          selectedPlatformId={selectedPlatformId}
          setSelectedPlatformId={(p) => updateParams({ platform: p, page: 1 })}
          selectedPlaytime={selectedPlaytime}
          setSelectedPlaytime={(range) => updateParams({ playtime: range, page: 1 })}
          genres={genres}
          platforms={platforms}
        />

        <LoadingErrorMessage
          loading={loading && games.length === 0}
          error={error}
          noResults={!loading && !error && games.length === 0}
        />

        {loading && games.length === 0 && (
          <div className={styles.gamesList}>
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        )}

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
