import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  return (
    <div>
      <div className={styles.sidebar}>
        <ul>
          <li>
            <Link
              to="/platforms"
              className={`${styles.link} ${location.pathname === "/platforms" ? styles.activeLink : ""}`}
            >
              Platform
            </Link>
          </li>
          <li>
            <Link
              to="/games"
              className={`${styles.link} ${location.pathname === "/games" ? styles.activeLink : ""}`}
            >
              Games
            </Link>
          </li>
          <li>
            <Link
              to="/developers"
              className={`${styles.link} ${location.pathname === "/developers" ? styles.activeLink : ""}`}
            >
              Developers
            </Link>
          </li>
          <li>
            <Link
              to="/genres"
              className={`${styles.link} ${location.pathname === "/genres" ? styles.activeLink : ""}`}
            >
              Genres
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
