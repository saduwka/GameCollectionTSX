import { useContext, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Library, Sun } from "lucide-react";
import { SearchContext } from "../../context/SearchContext";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../LoginButton/LoginButton";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { gamesPath } from "../../seo/canonicalUrl";
import logo from "../../assets/logo/logo.svg";
import styles from "./AppHeader.module.scss";

const links = [
  { to: "/", key: "common.today", tabKey: "common.today", icon: Sun, end: true },
  { to: gamesPath(), key: "common.catalog", tabKey: "common.catalog", icon: LayoutGrid, end: false },
  { to: "/collection", key: "common.my_collection", tabKey: "common.collection_short", icon: Library, end: false },
] as const;

const AppHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useContext(SearchContext)!;
  const { user } = useAuth();

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand} end>
          <img src={logo} alt="" className={styles.logo} />
          PlayHub
        </NavLink>
        <nav className={styles.nav} aria-label={t("common.main_menu")}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              rel={link.to === "/collection" ? "nofollow" : undefined}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
        <form className={styles.search} onSubmit={submitSearch} role="search">
          <input
            className={styles.searchInput}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("common.search_placeholder")}
            aria-label={t("common.search_placeholder")}
          />
        </form>
        <div className={styles.account}>
          <LanguageSwitcher />
          {user ? (
            <NavLink to="/profile" aria-label={t("common.profile")}>
              <img src={user.photoURL || ""} alt="" className={styles.avatar} />
            </NavLink>
          ) : (
            <LoginButton compact />
          )}
        </div>
      </header>
      <nav className={styles.tabs} aria-label={t("common.main_menu")}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              rel={link.to === "/collection" ? "nofollow" : undefined}
              className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ""}`}
            >
              <Icon size={18} aria-hidden="true" />
              {t(link.tabKey)}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default AppHeader;
