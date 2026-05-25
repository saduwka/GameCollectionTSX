import { useCallback } from "react";
import { toast } from "react-hot-toast";
import type { Game } from "../../types/game";
import { useComparison } from "../../context/ComparisonContext";
import styles from "./GameCard.module.css";

interface GameCardProps {
  game: Game;
  /** Hide the "Add to compare" button (e.g. on the /compare page itself) */
  hideCompareButton?: boolean;
}

const GameCard = ({ game, hideCompareButton = false }: GameCardProps) => {
  const { addToComparison, removeFromComparison, isInComparison, comparisonList } = useComparison();
  const inCompare = isInComparison(game.id);

  const handleCompareClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (inCompare) {
        removeFromComparison(game.id);
        toast.success("Убрано из сравнения");
        return;
      }
      if (comparisonList.length >= 4) {
        toast.error("Можно сравнивать максимум 4 игры");
        return;
      }
      addToComparison(game);
      toast.success("Добавлено в сравнение");
    },
    [inCompare, comparisonList.length, addToComparison, removeFromComparison, game]
  );

  return (
    <div className={styles.gameCard}>
      {!hideCompareButton && (
        <button
          type="button"
          className={`${styles.compareBtn} ${inCompare ? styles.compareBtnActive : ""}`}
          onClick={handleCompareClick}
          aria-label={inCompare ? "Убрать из сравнения" : "Добавить в сравнение"}
          aria-pressed={inCompare}
          title={inCompare ? "В сравнении — нажмите, чтобы убрать" : "Добавить в сравнение"}
        >
          {inCompare ? "✓" : "⇄"}
        </button>
      )}
      <img
        src={game.background_image}
        alt={game.name}
        className={styles.gameCardImg}
      />
      <div className={styles.description}>
        <h3 className={styles.heading}>{game.name}</h3>
        {game.rating > 0 && <p className={styles.gameCardRating}>Rating: {game.rating}</p>}
      </div>
    </div>
  );
};

export default GameCard;
