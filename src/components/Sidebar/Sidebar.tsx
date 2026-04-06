// FILE: src/components/Sidebar/Sidebar.tsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../LoginButton/LoginButton";
import LogoutButton from "../LogoutButton/LogoutButton";
import styles from "./Sidebar.module.css";
import logo from "../../assets/logo/logo.svg";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useContext(SearchContext)!;
  const { user } = useAuth();

  const handleSearchSubmit = (e?: React.FormEvent): void => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} 
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logoWrapper} onClick={onClose}>
            <img src={logo} alt="Logo" className={styles.logo} />
            <span className={styles.brandName}>PlayHub</span>
          </Link>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.userSection}>
            {user ? (
              <div className={styles.userInfo}>
                <Link to="/profile" className={styles.profileLink} onClick={onClose}>
                  <img src={user.photoURL || ""} alt={user.displayName || ""} className={styles.userAvatar} />
                  <span className={styles.userName}>{user.displayName}</span>
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <LoginButton />
            )}
          </div>

          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search games..."
              className={styles.searchInput}
            />
          </form>

          <nav className={styles.navLinks}>
            <Link to="/" className={styles.navLink} onClick={onClose}>Recommendations</Link>
            {user && (
              <>
                <Link to="/collection" className={styles.navLink} onClick={onClose}>My Collection</Link>
              </>
            )}
            <Link to="/platforms" className={styles.navLink} onClick={onClose}>Platforms</Link>
            <Link to="/games" className={styles.navLink} onClick={onClose}>Games</Link>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
