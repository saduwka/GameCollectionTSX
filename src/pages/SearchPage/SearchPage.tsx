import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import GameCard from "../../components/GameCard/GameCard";
import styles from "./SearchPage.module.css";
import { useNavigate } from "react-router-dom";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import type { Game } from "../../types/game";
import { fetchGames } from "../../services/search/seatchServices";

const SearchPage: React.FC = () => {
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("name");

  const [params] = useSearchParams();
  const searchQuery = params.get("query") || "";

  const sortGames = (games: Game[], option: string): Game[] => {
    switch (option) {
      case "name":
        return [...games].sort((a, b) => a.name.localeCompare(b.name));
      case "rating":
        return [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return games;
    }
  };

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchGames(searchQuery);
        const sortedResults = sortGames(results, sortOption);
        setFilteredGames(sortedResults);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (searchQuery) {
      loadGames();
    }
  }, [searchQuery, sortOption]);

  const navigate = useNavigate();

  const handleGameClick = (gameId: string | number) => {
    navigate(`/game/${gameId}`);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  return (
    <div className={styles.searchPage}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Results</h1>

        <LoadingErrorMessage
          loading={loading}
          error={error}
          noResults={filteredGames.length === 0 && !loading}
        />

        {!loading && !error && filteredGames.length > 0 && (
          <>
            <div className={styles.sortContainer}>
              <label htmlFor="sort">Sort by: </label>
              <select id="sort" value={sortOption} onChange={handleSortChange}>
                <option value="name">Name (A-Z)</option>
                <option value="rating">Rating (Highest)</option>
              </select>
            </div>
            <div className={styles.gameList}>
              {filteredGames.map((game: Game) => (
                <div key={game.id} onClick={() => handleGameClick(game.id)}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
