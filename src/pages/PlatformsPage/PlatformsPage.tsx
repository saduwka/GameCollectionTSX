import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPlatformDetails } from "../../services/platforms/getPlatformsList";
import { platforms as listedPlatforms } from "../../../scripts/publicLinks.mjs";
import PlatformCard from "../../components/PlatformCard/PlatformCard";
import PlatformCardSkeleton from "../../components/Skeleton/PlatformCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import PageMeta from "../../components/PageMeta/PageMeta";
import RawgCredit from "../../components/RawgCredit/RawgCredit";
import { RAWG_DETAIL_STALE_TIME } from "../../services/rawgCache";
import styles from "./PlatformsPage.module.scss";
import { platformPath } from "../../seo/canonicalUrl";
import type { Platform } from "../../types/game";

const listedIds = listedPlatforms.map((platform) => platform.id);

function PlatformsPage() {
  const { t } = useTranslation();

  const { data: shown = [], isLoading, error, isError } = useQuery<Platform[]>({
    queryKey: ["listed-platforms", listedIds],
    queryFn: () => Promise.all(listedIds.map((id) => getPlatformDetails(String(id)))),
    staleTime: RAWG_DETAIL_STALE_TIME,
  });

  const ready = !isLoading && !isError && shown.length === listedIds.length;

  return (
    <div className={styles.platformsPage} data-seo-ready={ready ? "true" : "false"}>
      <PageMeta title={t("platforms_page.title")} description={t("platforms_page.description")} />
      <div className={styles.content}>
        <h1 className={styles.heading}>{t("platforms_page.title")}</h1>

        <LoadingErrorMessage
          loading={false}
          error={isError ? (error as Error).message : null}
          noResults={!isLoading && !isError && shown.length === 0}
        />

        {isLoading && (
          <div className={styles.platformList}>
            {listedIds.map((id) => (
              <PlatformCardSkeleton key={id} />
            ))}
          </div>
        )}

        {ready && (
          <div className={styles.platformList}>
            {shown.map((platform) => (
              <Link key={platform.id} to={platformPath(platform.id)}>
                <PlatformCard platform={platform} />
              </Link>
            ))}
          </div>
        )}
        <RawgCredit />
      </div>
    </div>
  );
}

export default PlatformsPage;
