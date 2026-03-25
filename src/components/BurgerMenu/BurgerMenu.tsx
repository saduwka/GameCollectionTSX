import React from "react";
import styles from "./BurgerMenu.module.css";

interface BurgerMenuProps {
  onClick: () => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ onClick }) => {
  return (
    <button className={styles.burgerButton} onClick={onClick} aria-label="Open menu">
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </button>
  );
};

export default BurgerMenu;
