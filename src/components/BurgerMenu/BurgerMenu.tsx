import React from "react";
import styles from "./BurgerMenu.module.css";

interface BurgerMenuProps {
  onClick: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      className={styles.burgerButton}
      onClick={onClick}
      aria-label="Открыть меню"
      aria-haspopup="dialog"
    >
      <span className={styles.bar} aria-hidden="true"></span>
      <span className={styles.bar} aria-hidden="true"></span>
      <span className={styles.bar} aria-hidden="true"></span>
    </button>
  );
};

export default BurgerMenu;
