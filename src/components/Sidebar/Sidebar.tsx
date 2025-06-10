import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar: React.FC = () => {
  const location = useLocation();

  const routes = [
    { path: "/platforms", label: "Platform" },
    { path: "/games", label: "Games" },
    { path: "/developers", label: "Developers" },
    { path: "/genres", label: "Genres" }
  ];

  return (
    <div className={styles.sidebar}>
      <ul>
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
