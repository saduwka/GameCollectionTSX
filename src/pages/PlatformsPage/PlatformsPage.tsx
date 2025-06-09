import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlatforms } from "../../services/platforms/getPlatformsList";
import PlatformCard from "../../components/PlatformCard/PlatformCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./PlatformsPage.module.css";
import classNames from "classnames";
import type { Platform } from "../../types/game";

function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [sortType, setSortType] = useState<"alphabet" | "popularity">("alphabet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlatforms();
        setPlatforms(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch platforms");
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  const handleSort = (type: "alphabet" | "popularity") => {
    setSortType(type);
  };

  const sortedPlatforms = [...platforms].sort((a, b) => {
    if (sortType === "alphabet") {
      return a.name.localeCompare(b.name);
    } else if (sortType === "popularity") {
      return (b.games_count || 0) - (a.games_count || 0);
    }
    return 0;
  });

  return (
    <div className={styles.platformsPage}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Gaming Platforms</h1>

        {!loading && (
          <div className={styles.sortButtons}>
            <button
              onClick={() => handleSort("alphabet")}
              className={classNames(styles.sortButton, {
                [styles.active]: sortType === "alphabet",
              })}
            >
              A–Z
            </button>
            <button
              onClick={() => handleSort("popularity")}
              className={classNames(styles.sortButton, {
                [styles.active]: sortType === "popularity",
              })}
            >
              Popular
            </button>
          </div>
        )}

        <LoadingErrorMessage
          loading={loading}
          error={error}
          noResults={platforms.length === 0}
        />

        {(!loading && !error && platforms.length > 0) && (
          <div className={styles.platformList}>
            {sortedPlatforms.map((platform) => (
              <Link key={platform.id} to={`/platform/${platform.id}`}>
                <PlatformCard platform={platform} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlatformsPage;
