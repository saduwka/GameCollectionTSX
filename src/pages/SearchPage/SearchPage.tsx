// FILE: src/pages/SearchPage/SearchPage.tsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import { fetchGames } from "../../services/search/searchServices";
import type { Game, RawGame } from "../../types/game";
import styles from "./SearchPage.module.css";

type SortOption = "relevance" | "name" | "rating";

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const searchContext = useContext(SearchContext);
  const setSearchQuery = searchContext?.setSearchQuery;
  
  const urlQuery = params.get("query") || "";

  const [inputValue, setInputValue] = useState(urlQuery);
  const [games, setGames] = useState<RawGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with URL query on mount and when it changes
  useEffect(() => {
    setInputValue(urlQuery);
    if (urlQuery) {
      loadGames(urlQuery);
    } else {
      setGames([]);
    }
  }, [urlQuery]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadGames = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchGames(query);
      setGames(results);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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

  const sortGames = (gamesList: RawGame[]): RawGame[] => {
    const list = [...gamesList];
    if (sortOption === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortOption === "rating") {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list; // relevance is default order from service (which keeps API order)
  };

  const sortedGames = sortGames(games);

  return (
    <div className={styles.searchPage}>
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

      {error && <LoadingErrorMessage loading={false} error={error} noResults={false} />}

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
                    <span>Searching for <span className={styles.queryText}>"{urlQuery}"</span>...</span>
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
