import React, { useContext, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchContext } from "../../context/SearchContext";
import { fetchGames as searchGames } from "../../services/search/searchServices";
import styles from "./Header.module.css";
import logo from "../../assets/logo/logo.svg";

const RECENT_KEY = "playhub_recent_searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 250;

const loadRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
};

const saveRecent = (query: string): void => {
  if (!query.trim()) return;
  const current = loadRecent();
  const filtered = current.filter((q) => q.toLowerCase() !== query.toLowerCase());
  const next = [query, ...filtered].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useContext(SearchContext)!;
  const [debounced, setDebounced] = useState<string>(searchQuery);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Debounce input → debounced query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["search-suggest", debounced],
    queryFn: () => searchGames(debounced),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const topSuggestions = suggestions.slice(0, 6);
  const showRecent = isOpen && searchQuery.trim().length < 2 && recent.length > 0;
  const showSuggestions = isOpen && debounced.length >= 2;

  const handleSearchSubmit = (queryOverride?: string): void => {
    const q = (queryOverride ?? searchQuery).trim();
    if (!q) return;
    saveRecent(q);
    setRecent(loadRecent());
    setIsOpen(false);
    setHighlight(-1);
    if (queryOverride !== undefined) setSearchQuery(queryOverride);
    navigate(`/search?query=${encodeURIComponent(q)}`);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
    setHighlight(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    const items: { type: "suggest" | "recent"; value: string; id?: number }[] = [];
    if (showSuggestions) {
      topSuggestions.forEach((g) => items.push({ type: "suggest", value: g.name, id: g.id }));
    } else if (showRecent) {
      recent.forEach((r) => items.push({ type: "recent", value: r }));
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h + 1) % items.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h - 1 + items.length) % items.length : -1));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && items[highlight]) {
        const sel = items[highlight];
        if (sel.type === "suggest" && sel.id) {
          saveRecent(sel.value);
          setRecent(loadRecent());
          setIsOpen(false);
          setSearchQuery(sel.value);
          navigate(`/game/${sel.id}`);
          return;
        }
        handleSearchSubmit(sel.value);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlight(-1);
    }
  };

  const handleRemoveRecent = (e: React.MouseEvent, value: string): void => {
    e.stopPropagation();
    const next = recent.filter((r) => r !== value);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleClearRecent = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logoWrapper}>
            <img src={logo} alt="PlayHub logo" className={styles.logo} />
            <h1 className={styles.heading}>PlayHub</h1>
          </Link>
        </div>

        <div className={styles.rightSection}>
          <nav className={styles.navLinks}>
            <Link to="/platforms" className={styles.navLink}>Платформы</Link>
            <Link to="/games" className={styles.navLink}>Игры</Link>
          </nav>
          <div className={styles.searchForm} ref={wrapperRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder="Поиск игр..."
              className={styles.searchInput}
              aria-label="Поиск игр"
              aria-autocomplete="list"
              aria-expanded={isOpen && (showSuggestions || showRecent)}
              aria-controls="search-suggest-list"
            />
            {(showSuggestions || showRecent) && (
              <ul
                id="search-suggest-list"
                role="listbox"
                className={styles.suggestList}
              >
                {showRecent && (
                  <>
                    <li className={styles.suggestHeader}>
                      <span>Недавние</span>
                      <button
                        type="button"
                        className={styles.clearRecentBtn}
                        onClick={handleClearRecent}
                      >
                        Очистить
                      </button>
                    </li>
                    {recent.map((r, i) => (
                      <li
                        key={`recent-${r}`}
                        role="option"
                        aria-selected={highlight === i}
                        className={`${styles.suggestItem} ${highlight === i ? styles.suggestItemActive : ""}`}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseDown={(e) => { e.preventDefault(); handleSearchSubmit(r); }}
                      >
                        <span className={styles.suggestIcon}>🕘</span>
                        <span className={styles.suggestText}>{r}</span>
                        <button
                          type="button"
                          className={styles.removeRecentBtn}
                          aria-label={`Удалить ${r} из недавних`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => handleRemoveRecent(e, r)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </>
                )}

                {showSuggestions && (
                  <>
                    <li className={styles.suggestHeader}>
                      <span>{isFetching ? "Ищем..." : `Результаты (${topSuggestions.length})`}</span>
                    </li>
                    {topSuggestions.length === 0 && !isFetching && (
                      <li className={styles.suggestEmpty}>Ничего не найдено</li>
                    )}
                    {topSuggestions.map((g, i) => (
                      <li
                        key={`suggest-${g.id}`}
                        role="option"
                        aria-selected={highlight === i}
                        className={`${styles.suggestItem} ${highlight === i ? styles.suggestItemActive : ""}`}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          saveRecent(g.name);
                          setRecent(loadRecent());
                          setIsOpen(false);
                          setSearchQuery(g.name);
                          navigate(`/game/${g.id}`);
                        }}
                      >
                        {g.background_image ? (
                          <img
                            src={g.background_image}
                            alt=""
                            className={styles.suggestThumb}
                            loading="lazy"
                          />
                        ) : (
                          <span className={styles.suggestIcon}>🎮</span>
                        )}
                        <span className={styles.suggestText}>{g.name}</span>
                        {g.released && (
                          <span className={styles.suggestMeta}>
                            {g.released.split("-")[0]}
                          </span>
                        )}
                      </li>
                    ))}
                    {topSuggestions.length > 0 && (
                      <li
                        className={`${styles.suggestItem} ${styles.suggestSeeAll}`}
                        onMouseDown={(e) => { e.preventDefault(); handleSearchSubmit(); }}
                      >
                        Показать все результаты для "{searchQuery}"
                      </li>
                    )}
                  </>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
