import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Game } from "../types/game";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredGames: Game[];
  loading: boolean;
}

export const SearchContext = createContext<SearchContextType | undefined>(
  undefined
);

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState<string>(searchQuery);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Дебаунс для searchQuery
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // The actual search logic is handled on the SearchPage.
  // This context is primarily for sharing the search query string.
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      setLoading(true);
      // In a real app, you would fetch here.
      // For now, we clear games as the SearchPage will handle the display.
      setFilteredGames([]);
      setLoading(false);
    } else {
      setFilteredGames([]);
    }
  }, [debouncedSearchQuery]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        filteredGames,
        loading
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
