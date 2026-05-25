// FILE: src/pages/SearchPage/SearchPage.tsx
import React, { useState, useRef, useContext, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchContext } from "../../context/SearchContext";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import { fetchGames } from "../../services/search/searchServices";
import PageMeta from "../../components/PageMeta/PageMeta";
import type { Game } from "../../types/game";
import styles from "./SearchPage.module.css";

type SortOption = "relevance" | "name" | "rating";

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const searchContext = useContext(SearchContext);
  const setSearchQuery = searchContext?.setSearchQuery;
  
  const urlQuery = params.get("query") || "";

  const [inputValue, setInputValue] = useState(urlQuery);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  const inputRef = useRef<HTMLInputElement>(null);

  const { data: games = [], isLoading: loading, error, isError } = useQuery({
    queryKey: ["search", urlQuery],
    queryFn: () => fetchGames(urlQuery),
    enabled: !!urlQuery,
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    
    // Update URL param
    setParams(trimmed ? { query: trimmed } : {});
    
    // Update Global Search Context if it exists
    if (setSearchQuery) {
      setSearchQuery(trimmed);
    }
  };

  const clearSearch = () => {
    setInputValue("");
    inputRef.current?.focus();
  };

  const sortedGames = useMemo(() => {
    const list = [...games];
    if (sortOption === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortOption === "rating") {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list; // relevance is default order
  }, [games, sortOption]);

  return (
    <div className={styles.searchPage}>
      <PageMeta
        title={urlQuery ? `Поиск: ${urlQuery}` : "Поиск игр"}
        description={
          urlQuery
            ? `Результаты поиска «${urlQuery}» по каталогу PlayHub — 500 000+ игр.`
            : "Умный поиск по каталогу PlayHub — найдите игры по названию, жанру и платформе."
        }
      />
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <div className={styles.inputWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search games..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {inputValue && (
            <button type="button" className={styles.clearButton} onClick={clearSearch} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>
        <button type="submit" className={styles.submitButton}>Search</button>
      </form>

      {isError && <LoadingErrorMessage loading={false} error={(error as Error).message} noResults={false} />}

      {!urlQuery ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>What are you looking for?</h2>
          <p className={styles.emptyHint}>Type a game title to start searching</p>
        </div>
      ) : (
        <>
          <div className={styles.headerRow}>
            <div className={styles.resultsCount}>
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>
                  {games.length > 0 ? (
                    <>
                      <span className={styles.queryText}>"{urlQuery}"</span> — {games.length} results
                    </>
                  ) : (
                    <span>No results for <span className={styles.queryText}>"{urlQuery}"</span></span>
                  )}
                </span>
              )}
            </div>

            <div className={styles.sortControls}>
              {(["relevance", "rating", "name"] as SortOption[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.sortBtn} ${sortOption === option ? styles.sortBtnActive : ""}`}
                  onClick={() => setSortOption(option)}
                >
                  {option === "relevance" && "Relevance"}
                  {option === "rating" && "Rating ↓"}
                  {option === "name" && "A–Z"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.gameGrid}>
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <GameCardSkeleton key={i} />)
            ) : games.length > 0 ? (
              sortedGames.map((game) => (
                <Link key={game.id} to={`/game/${game.id}`} className={styles.gameLink}>
                  <GameCard game={game as unknown as Game} />
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>
                <h2 className={styles.emptyTitle}>No games found for "{urlQuery}"</h2>
                <p className={styles.emptyHint}>Try a different spelling or a shorter query</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
