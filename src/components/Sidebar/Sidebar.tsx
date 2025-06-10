import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  onClose?: () => void;
  style?: React.CSSProperties;
};

const Sidebar: React.FC<SidebarProps> = ({ onClose, style }) => {
  const location = useLocation();

  const routes = [
    { path: "/platforms", label: "Platform" },
    { path: "/games", label: "Games" },
    { path: "/developers", label: "Developers" },
    { path: "/genres", label: "Genres" }
  ];

  return (
    <div className={styles.sidebar} style={style}>
      {onClose && (
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      )}
      <ul className={styles.navList}>
        {routes.map(({ path, label }) => (
          <li key={path}>
            <Link
              to={path}
              className={`${styles.link} ${
                location.pathname === path ? styles.activeLink : ""
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
