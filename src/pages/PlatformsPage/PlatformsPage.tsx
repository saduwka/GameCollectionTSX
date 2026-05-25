import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getParentPlatforms } from "../../services/platforms/getPlatformsList";
import PlatformCard from "../../components/PlatformCard/PlatformCard";
import PlatformCardSkeleton from "../../components/Skeleton/PlatformCardSkeleton";
import Skeleton from "../../components/Skeleton/Skeleton";
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
        <h1 className={styles.heading}>Игровые платформы</h1>

        <LoadingErrorMessage
          loading={false}
          error={isError ? (error as Error).message : null}
          noResults={!isLoading && !isError && parentPlatforms.length === 0}
        />

        {isLoading && (
          <>
            {Array.from({ length: 3 }).map((_, gi) => (
              <div key={gi} className={styles.platformGroup}>
                <Skeleton width="180px" height="1.6rem" />
                <div className={styles.platformList}>
                  {Array.from({ length: 4 }).map((__, pi) => (
                    <PlatformCardSkeleton key={pi} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

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
