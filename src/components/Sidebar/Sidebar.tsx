// FILE: src/components/Sidebar/Sidebar.tsx
import React, { useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SearchContext } from "../../context/SearchContext";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../LoginButton/LoginButton";
import LogoutButton from "../LogoutButton/LogoutButton";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import styles from "./Sidebar.module.scss";
import logo from "../../assets/logo/logo.svg";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useContext(SearchContext)!;
  const { user } = useAuth();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Закрытие по Esc + перевод фокуса на close-button при открытии
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);

    // Блокируем скролл body, пока сайдбар открыт
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Фокус на кнопку «закрыть» — точка входа клавиатурной навигации
    closeBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

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
      <button
        type="button"
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-label={t('common.close_menu')}
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
      />
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.main_menu')}
        aria-hidden={!isOpen}
      >
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logoWrapper} onClick={onClose}>
            <img src={logo} alt="" className={styles.logo} />
            <span className={styles.brandName}>PlayHub</span>
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('common.close_menu')}
          >
            &times;
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.userSection}>
            {user ? (
              <div className={styles.userInfo}>
                <Link to="/profile" className={styles.profileLink} onClick={onClose}>
                  <img
                    src={user.photoURL || ""}
                    alt=""
                    className={styles.userAvatar}
                  />
                  <span className={styles.userName}>{user.displayName}</span>
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <LoginButton />
            )}
          </div>

          <form
            className={styles.searchForm}
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <label htmlFor="sidebar-search" className={styles.srOnly}>
              {t('common.search_placeholder')}
            </label>
            <input
              id="sidebar-search"
              type="search"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('common.search_placeholder')}
              className={styles.searchInput}
              aria-label={t('common.search_placeholder')}
            />
          </form>

          <nav className={styles.navLinks} aria-label="Основная навигация">
            <Link to="/" className={styles.navLink} onClick={onClose}>
              {t('common.home')}
            </Link>
            <Link to="/games" className={styles.navLink} onClick={onClose}>
              {t('common.games')}
            </Link>
            <Link to="/platforms" className={styles.navLink} onClick={onClose}>
              {t('common.platforms')}
            </Link>
            <Link to="/match" className={styles.navLink} onClick={onClose}>
              {t('common.game_match')}
            </Link>
            <Link to="/me" className={styles.navLink} onClick={onClose}>
              {t('common.recommendations')}
            </Link>
            {user && (
              <Link to="/collection" className={styles.navLink} onClick={onClose}>
                {t('common.my_collection')}
              </Link>
            )}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <LanguageSwitcher />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
