import React from "react";
import { useNavigate } from "react-router-dom";
import { useComparison } from "../../context/ComparisonContext";
import styles from "./ComparisonBar.module.css";

const ComparisonBar: React.FC = () => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  if (comparisonList.length === 0) return null;

  return (
    <div className={styles.comparisonBar}>
      <div className={styles.container}>
        <div className={styles.gameList}>
          {comparisonList.map((game) => (
            <div key={game.id} className={styles.gameThumb}>
              <img src={game.background_image} alt={game.name} />
              <button
                className={styles.removeBtn}
                onClick={() => removeFromComparison(game.id)}
              >
                &times;
              </button>
            </div>
          ))}
          {Array.from({ length: 4 - comparisonList.length }).map((_, i) => (
            <div key={i} className={styles.emptySlot}>
              +
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <span className={styles.count}>{comparisonList.length} / 4 games</span>
          <button className={styles.clearBtn} onClick={clearComparison}>
            Clear
          </button>
          <button
            className={styles.compareBtn}
            onClick={() => navigate("/compare")}
            disabled={comparisonList.length < 2}
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
