import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";
import GameCard from "../../components/GameCard/GameCard";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getPopularGames } from "../../services/games/getPopularGames";
import type { Game } from "../../types/game";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const loadGames = async () => {
      const games = await getPopularGames();
      setGames(games.slice(0, 5));
    };
    loadGames();
  }, []);

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
          {games.map((game) => (
            <div key={game.id} className={styles.gameCardContainer}>
              <Link to={`/game/${game.id}`}>
                <GameCard game={game} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
