import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import styles from "./HomePage.module.css";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getPopularGames } from "../../services/games/getPopularGames";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: games = [], isLoading: loading } = useQuery({
    queryKey: ["popularGames"],
    queryFn: async () => {
      const result = await getPopularGames();
      return result.slice(0, 5);
    },
  });

  return (
    <div className={styles.homePage}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Game Collection</h1>
        <p className={styles.description}>
          Store and manage your video game collection. Supports search, filters,
          and favorites.
        </p>
        <div className={styles.buttons}>
          <button
            className={styles.btn}
            onClick={() => navigate("/collection")}
          >
            🔍 Go to Collection
          </button>
        </div>
      </div>

      <div className={styles.trending}>
        <h1>Trending Games</h1>
        <div className={styles.gameCards}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))
          ) : (
            games.map((game) => (
              <div key={game.id} className={styles.gameCardContainer}>
                <Link to={`/game/${game.id}`}>
                  <GameCard game={game} />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
