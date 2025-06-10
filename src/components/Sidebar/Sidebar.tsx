import React, { useEffect, useRef } from "react";
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

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className={styles.sidebar} style={style} ref={sidebarRef}>
      <ul className={styles.navList}>
        {routes.map(({ path, label }) => (
          <li key={path}>
            <Link
              to={path}
              className={`${styles.link} ${
                location.pathname === path ? styles.activeLink : ""
              }`}
              onClick={onClose}
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