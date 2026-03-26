import React, { useContext } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import styles from "./Header.module.css";
import logo from "../../assets/logo/logo.svg";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useContext(SearchContext)!;

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
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logoWrapper}>
            <img src={logo} alt="Logo" className={styles.logo} />
            <h1 className={styles.heading}>PlayHub</h1>
          </Link>
        </div>

        <div className={styles.rightSection}>
          <nav className={styles.navLinks}>
            <Link to="/platforms" className={styles.navLink}>Platforms</Link>
            <Link to="/games" className={styles.navLink}>Games</Link>
          </nav>
          <div className={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search games..."
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
