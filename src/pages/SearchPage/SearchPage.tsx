// FILE: src/pages/SearchPage/SearchPage.tsx
import React, { useState, useRef, useContext, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { SearchContext } from "../../context/SearchContext";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import { fetchGames } from "../../services/search/searchServices";
import { RAWG_LIST_STALE_TIME } from "../../services/rawgCache";
import PageMeta from "../../components/PageMeta/PageMeta";
import EmptyState from "../../components/ui/EmptyState";
import { collectionPath, gamePath } from "../../seo/canonicalUrl";
import { collections } from "../../data/collections";
import type { Game } from "../../types/game";
import styles from "./SearchPage.module.scss";

type SortOption = "relevance" | "name" | "rating";

const SearchPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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
    staleTime: RAWG_LIST_STALE_TIME,
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
    return list.sort((a, b) => {
      const thinA = (a.ratings_count ?? 0) < 5 ? 1 : 0;
      const thinB = (b.ratings_count ?? 0) < 5 ? 1 : 0;
      if (thinA !== thinB) return thinA - thinB;
      return (b.ratings_count ?? 0) - (a.ratings_count ?? 0);
    });
  }, [games, sortOption]);

  return (
    <div className={styles.searchPage}>
      <PageMeta
        title={urlQuery ? t('search.title_with_query', { query: urlQuery }) : t('search.title_default')}
        description={
          urlQuery
            ? t('search.description_with_query', { query: urlQuery })
            : t('search.description_default')
        }
        noindex
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
            placeholder={t('common.search_placeholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {inputValue && (
            <button type="button" className={styles.clearButton} onClick={clearSearch} aria-label={t('search.clear_search')}>
              ✕
            </button>
          )}
        </div>
        <button type="submit" className={styles.submitButton}>{t('search.submit_button')}</button>
      </form>

      {isError && <LoadingErrorMessage loading={false} error={(error as Error).message} noResults={false} />}

      {!urlQuery ? (
        <div className={styles.gameGrid}>
          <EmptyState title={t("search.empty_state_hint")} text={t("landing.empty_title")} />
          {["zelda", "hades", "stardew", "portal", "celeste"].map((query) => (
            <button key={query} type="button" className={styles.sortBtn} onClick={() => setParams({ query })}>
              {query}
            </button>
          ))}
          {collections.map((collection) => (
            <Link key={collection.slug} to={collectionPath(collection.slug)}>
              {i18n.language.startsWith("en") ? collection.title.en : collection.title.ru}
            </Link>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.headerRow}>
            <div className={styles.resultsCount}>
              {loading ? (
                <LoadingErrorMessage loading={true} error={null} noResults={false} variant="inline" />
              ) : (
                <span>
                  {games.length > 0 ? (
                    <>
                      <span className={styles.queryText}>"{urlQuery}"</span> — {t('search.results_count', { count: games.length })}
                    </>
                  ) : (
                    <span>{t('search.no_results', { query: urlQuery })}</span>
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
                  aria-pressed={sortOption === option}
                  onClick={() => setSortOption(option)}
                >
                  {option === "relevance" && t('search.sort_relevance')}
                  {option === "rating" && t('search.sort_rating')}
                  {option === "name" && t('search.sort_name')}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.gameGrid}>
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <GameCardSkeleton key={i} />)
            ) : games.length > 0 ? (
              sortedGames.map((game) => (
                <Link key={game.id} to={gamePath(game.id)} className={styles.gameLink}>
                  <GameCard game={game as unknown as Game} />
                </Link>
              ))
            ) : (
              <EmptyState title={t("landing.empty_title")} text={t("search.not_found_hint")} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
