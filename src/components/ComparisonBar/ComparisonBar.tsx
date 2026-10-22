import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useComparison } from "../../context/ComparisonContext";
import styles from "./ComparisonBar.module.scss";

const ComparisonBar: React.FC = () => {
  const { t } = useTranslation();
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  if (comparisonList.length < 2) return null;

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
          <span className={styles.count}>{t("compare.count", { count: comparisonList.length })}</span>
          <button className={styles.clearBtn} onClick={clearComparison}>
            {t("common.clear")}
          </button>
          <button
            className={styles.compareBtn}
            onClick={() => navigate("/compare")}
          >
            {t("compare.title")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
