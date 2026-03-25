import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getParentPlatforms } from "../../services/platforms/getPlatformsList";
import PlatformCard from "../../components/PlatformCard/PlatformCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./PlatformsPage.module.css";
import type { Platform } from "../../types/game";

interface ParentPlatform {
  id: number;
  name: string;
  slug: string;
  platforms: Platform[];
}

function PlatformsPage() {
  const [parentPlatforms, setParentPlatforms] = useState<ParentPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getParentPlatforms();
        setParentPlatforms(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch platforms");
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  return (
    <div className={styles.platformsPage}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Gaming Platforms</h1>

        <LoadingErrorMessage
          loading={loading}
          error={error}
          noResults={parentPlatforms.length === 0}
        />

        {!loading && !error && parentPlatforms.map((group) => (
          <div key={group.id} className={styles.platformGroup}>
            <h2 className={styles.groupTitle}>{group.name}</h2>
            <div className={styles.platformList}>
              {group.platforms.map((platform) => (
                <Link key={platform.id} to={`/platform/${platform.id}`}>
                  <PlatformCard platform={platform} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlatformsPage;
