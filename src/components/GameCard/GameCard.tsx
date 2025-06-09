import type { Game } from "../../types/game";
import styles from "./GameCard.module.css";

interface GameCardProps {
  game: Game;
}

const GameCard = ({ game }: GameCardProps) => {
  return (
    <div className={styles.gameCard}>
      <img
        src={game.background_image}
        alt={game.name}
        className={styles.gameCardImg}
      />
      <div className={styles.description}>
      <h3 className={styles.heading}>{game.name}</h3>
      <p className={styles.gameCardRating}>Оценка: {game.rating}</p>
      </div>
    </div>
  );
};

export default GameCard;
