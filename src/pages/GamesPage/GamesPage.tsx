// FILE: src/pages/GamesPage/GamesPage.tsx
import React, { useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGames } from "../../services/games/fetchGames";
import { getGenres } from "../../services/games/getGenres";
import { getPlatforms } from "../../services/platforms/getPlatformsList";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameFilters from "./components/GameFilters/GameFilters";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from "./GamesPage.module.css";

const STORAGE_KEY = "playhub_filters";

export type SortKey =
  | "popular"
  | "rating"
  | "metacritic"
  | "released"
  | "new"
  | "name";

const ORDERING_MAP: Record<SortKey, string> = {
  popular: "-added",
  rating: "-rating",
  metacritic: "-metacritic",
  released: "-released",
  new: "-created",
  name: "name",
};

const GamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filter = (searchParams.get("filter") as SortKey) || "popular";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedYear = searchParams.get("year") || "";
  const selectedYearTo = searchParams.get("yearTo") || "";
  const selectedGenreId = searchParams.get("genre") || "";
  const selectedPlatformId = searchParams.get("platform") || "";
  const selectedDeveloperId = searchParams.get("developer") || "";
  const selectedTagId = searchParams.get("tag") || "";
  const selectedPlaytime = searchParams.get("playtime") || "";
  const selectedMetacritic = searchParams.get("metacritic") || "";

  // Queries
  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const list = await getPlatforms();
      return list.sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const ordering = ORDERING_MAP[filter] ?? "-added";

  const {
    data: gamesData,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "games",
      currentPage,
      ordering,
      selectedYear,
      selectedYearTo,
      selectedGenreId,
      selectedPlatformId,
      selectedDeveloperId,
      selectedTagId,
      selectedPlaytime,
      selectedMetacritic,
    ],
    queryFn: () =>
      fetchGames(
        currentPage,
        ordering,
        selectedYear,
        selectedGenreId,
        selectedPlatformId,
        selectedDeveloperId,
        selectedTagId,
        selectedPlaytime,
        selectedMetacritic,
        selectedYearTo
      ),
  });

  const games = gamesData?.games || [];
  const hasMore = gamesData?.nextPageUrl !== null;

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
      yearTo: selectedYearTo,
      genre: selectedGenreId,
      platform: selectedPlatformId,
      playtime: selectedPlaytime,
      metacritic: selectedMetacritic,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [selectedYear, selectedYearTo, selectedGenreId, selectedPlatformId, selectedPlaytime, selectedMetacritic]);

  // Восстановление фильтров при первом входе (если URL пустой)
  useEffect(() => {
    if (searchParams.toString() === "") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const newParams: Record<string, string> = {};
        if (parsed.year) newParams.year = parsed.year;
        if (parsed.yearTo) newParams.yearTo = parsed.yearTo;
        if (parsed.genre) newParams.genre = parsed.genre;
        if (parsed.platform) newParams.platform = parsed.platform;
        if (parsed.playtime) newParams.playtime = parsed.playtime;
        if (parsed.metacritic) newParams.metacritic = parsed.metacritic;
        if (Object.keys(newParams).length > 0) {
          setSearchParams(newParams);
        }
      }
    }
  }, [searchParams, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchParams({ filter: "popular" });
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasAnyFilter = !!(
    selectedYear ||
    selectedYearTo ||
    selectedGenreId ||
    selectedPlatformId ||
    selectedDeveloperId ||
    selectedTagId ||
    selectedPlaytime ||
    selectedMetacritic
  );

  const activeFilterCount =
    (selectedYear ? 1 : 0) +
    (selectedYearTo ? 1 : 0) +
    (selectedGenreId ? selectedGenreId.split(",").filter(Boolean).length : 0) +
    (selectedPlatformId ? 1 : 0) +
    (selectedDeveloperId ? 1 : 0) +
    (selectedTagId ? 1 : 0) +
    (selectedPlaytime ? 1 : 0) +
    (selectedMetacritic ? 1 : 0);

  return (
    <div className={styles.gamesPage}>
      <PageMeta
        title="Каталог игр"
        description="Большой каталог игр с фильтрами по жанру, платформе, году выхода и Metacritic. Найди свою следующую игру на PlayHub."
      />
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>Игры</h1>
          {hasAnyFilter && (
            <button className={styles.clearButton} onClick={handleClearFilters}>
              Сбросить фильтры
            </button>
          )}
        </div>
        
        <GameFilters
          filter={filter}
          setFilter={(f) => updateParams({ filter: f, page: 1 })}
          selectedYear={selectedYear}
          setSelectedYear={(y) => updateParams({ year: y, page: 1 })}
          selectedYearTo={selectedYearTo}
          setSelectedYearTo={(y) => updateParams({ yearTo: y, page: 1 })}
          selectedGenreId={selectedGenreId}
          setSelectedGenreId={(g) => updateParams({ genre: g, page: 1 })}
          selectedPlatformId={selectedPlatformId}
          setSelectedPlatformId={(p) => updateParams({ platform: p, page: 1 })}
          selectedPlaytime={selectedPlaytime}
          setSelectedPlaytime={(range) => updateParams({ playtime: range, page: 1 })}
          selectedMetacritic={selectedMetacritic}
          setSelectedMetacritic={(m) => updateParams({ metacritic: m, page: 1 })}
          genres={genres}
          platforms={platforms}
          totalCount={gamesData?.count}
          activeFilterCount={activeFilterCount}
        />

        <LoadingErrorMessage
          loading={loading && games.length === 0}
          error={isError ? (error as Error).message : null}
          noResults={!loading && !isError && games.length === 0}
        />

        {loading && games.length === 0 && (
          <div className={styles.gamesList}>
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !isError && games.length > 0 && (
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

        {!loading && !isError && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              Назад
            </button>
            <span className={styles.pageNumber}>{currentPage}</span>
            {hasMore && (
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                className={styles.paginationButton}
              >
                Вперёд
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
