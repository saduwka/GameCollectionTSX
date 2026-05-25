import { useQuery } from "@tanstack/react-query";
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
  const { data: parentPlatforms = [], isLoading, error, isError } = useQuery<ParentPlatform[]>({
    queryKey: ["parentPlatforms"],
    queryFn: getParentPlatforms,
  });

  return (
    <div className={styles.platformsPage}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Gaming Platforms</h1>

        <LoadingErrorMessage
          loading={isLoading}
          error={isError ? (error as Error).message : null}
          noResults={!isLoading && !isError && parentPlatforms.length === 0}
        />

        {!isLoading && !isError && parentPlatforms.map((group) => (
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
