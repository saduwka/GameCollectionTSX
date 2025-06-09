import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface Game {
  name: string;
  [key: string]: any;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredGames: Game[];
  loading: boolean;
  error: string | null;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(searchQuery);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ...rest of the provider logic

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        filteredGames: games,
        loading,
        error,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
