import React, { useContext } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import styles from "./Header.module.css";
import searchIcon from "../../assets/icons/search.png";
import favoritesIcon from "../../assets/icons/favorites.svg";
import logoutIcon from "../../assets/icons/logout.svg";
import logo from "../../assets/logo/logo.svg";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useContext(SearchContext)!;

  const isAuthenticated = Boolean(localStorage.getItem("token"));

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearchSubmit = (): void => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  return (
    <header className={styles.header}>
      <div>
        <Link to="/" className={styles.logoWrapper}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <h1 className={styles.heading}>PlayHub</h1>
        </Link>
      </div>
      <div className={styles.searchForm}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search games..."
          className={styles.searchInput}
        />
        <img
          src={searchIcon}
          alt="Search"
          onClick={handleSearchSubmit}
          className={styles.searchIcon}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleSearchSubmit();
            }
          }}
        />
      </div>
      {isAuthenticated && (
        <div className={styles.userCard}>
          <Link to="/favorites" className={styles.favLink}>
            <img
              src={favoritesIcon}
              alt="Favorites"
              className={styles.favIcon}
            />
            <span className={styles.favHeading}>Favorites</span>
          </Link>

          <span
            onClick={handleLogout}
            className={styles.logoutButton}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleLogout();
              }
            }}
          >
            <img src={logoutIcon} alt="logout" className={styles.logoutIcon} />
            Logout
          </span>
        </div>
      )}
    </header>
  );
};

export default Header;
