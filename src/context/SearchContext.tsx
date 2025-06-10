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
  const [error, setError] = useState<string | null>(null);

  // Дебаунс для searchQuery
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Фейковая логика загрузки и фильтрации игр
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        // Загружаем игры (замени на реальный API)
        const fetchedGames: Game[] = [
          { name: "Halo" },
          { name: "God of War" },
          { name: "Elden Ring" }
        ];

        // Фильтрация по debouncedSearchQuery
        const filtered = fetchedGames.filter((game) =>
          game.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );

        setFilteredGames(filtered);
        setError(null);
      } catch {
        setError("Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    if (debouncedSearchQuery.trim()) {
      fetchGames();
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
        loading,
        error
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
