import React from "react";
import styles from "./BurgerMenu.module.scss";

interface BurgerMenuProps {
  onClick: () => void;
  isOpen?: boolean;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ onClick, isOpen = false }) => {
  return (
    <button
      type="button"
      className={`${styles.burgerButton} ${isOpen ? styles.open : ""}`}
      onClick={onClick}
      aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <div className={styles.barContainer}>
        <span className={styles.bar} aria-hidden="true"></span>
        <span className={styles.bar} aria-hidden="true"></span>
        <span className={styles.bar} aria-hidden="true"></span>
      </div>
    </button>
  );
};

export default BurgerMenu;
