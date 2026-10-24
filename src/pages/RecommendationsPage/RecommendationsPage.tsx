import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { addToCollection, getUserCollection } from "../../services/collection/collectionService";
import { collectionKeys, invalidateUserLibrary } from "../../services/collection/queryKeys";
import {
  RECOMMENDATION_STALE_TIME,
  fetchScoredRecommendations,
} from "../../services/recommendations/scoring";
import { getAllSwipes, recordSwipe, type SwipeRecord } from "../../services/match/swipeStore";
import { useMyDevices } from "../../hooks/useMyDevices";
import DevicePicker from "../../components/DevicePicker/DevicePicker";
import GameCard from "../../components/GameCard/GameCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from "./RecommendationsPage.module.scss";
import { gamePath } from "../../seo/canonicalUrl";
import type { Game } from "../../types/game";
import { toast } from "react-hot-toast";

const RecommendationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { devices, deviceIds, save, confirmed } = useMyDevices();
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [swipes, setSwipes] = useState<SwipeRecord[]>(() => getAllSwipes());

  const collectionQuery = useQuery({
    queryKey: collectionKeys.user(user?.uid ?? "guest"),
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  const collection = collectionQuery.data ?? [];
  const collectionFingerprint = collection
    .map((game) => `${game.id}:${game.status}:${game.rating ?? 0}`)
    .join("|");
  const swipeFingerprint = swipes.map((swipe) => `${swipe.gameId}:${swipe.action}`).join("|");

  const {
    data: recommendations = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: [
      ...collectionKeys.recommendationsV2,
      user?.uid ?? "guest",
      deviceIds.join(","),
      collectionFingerprint,
      swipeFingerprint,
      manualRefreshKey > 0 ? "refresh" : "default",
      manualRefreshKey,
    ],
    queryFn: () =>
      fetchScoredRecommendations({
        collection,
        swipes,
        platformIds: deviceIds,
        refreshOrdering: manualRefreshKey > 0,
        limit: 18,
      }),
    enabled: !authLoading && (!user || collectionQuery.isFetched),
    staleTime: RECOMMENDATION_STALE_TIME,
  });

  const handleRefresh = () => {
    setManualRefreshKey((prev) => prev + 1);
    toast.promise(refetch(), {
      loading: t("recommendations.refreshing"),
      success: t("common.update_success"),
      error: t("common.update_error"),
    });
  };

  const handleNotInterested = async (event: React.MouseEvent, game: Game) => {
    event.preventDefault();
    event.stopPropagation();

    recordSwipe({
      gameId: game.id,
      gameName: game.name,
      action: "dislike",
      genres: game.genres || [],
      tags: [],
      background_image: game.background_image,
    });
    setSwipes(getAllSwipes());

    if (!user) return;

    try {
      await addToCollection({
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        genres: game.genres,
        status: "Not Interested",
      });
      await invalidateUserLibrary(queryClient, user.uid);
      toast.success(t("common.update_success"));
    } catch {
      toast.error(t("common.update_error"));
    }
  };

  return (
    <div className={styles.container}>
      <PageMeta title={t("recommendations.title")} description={t("recommendations.description")} />
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>
            {!authLoading && (user || swipes.length > 0)
              ? t("recommendations.picked_for_you")
              : t("recommendations.recommended_games")}
          </h1>
          <p className={styles.subtitle}>{t("recommendations.ranking_note")}</p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={isRefetching || isLoading}
          aria-label={t("recommendations.refresh_recommendations")}
        >
          {isRefetching ? t("recommendations.refreshing") : t("recommendations.refresh_action")}
        </button>
      </header>

      <section className={styles.devices}>
        <h2>{t("match.devices_title")}</h2>
        <DevicePicker selected={devices} onChange={(next) => void save(next)} />
        {!confirmed && <p className={styles.subtitle}>{t("match.devices_hint")}</p>}
      </section>

      <LoadingErrorMessage
        loading={isLoading || authLoading}
        error={isError ? (error as Error).message : null}
        noResults={!isLoading && !authLoading && recommendations.length === 0}
        message={t("recommendations.add_more_hint")}
      />

      {!isLoading && !authLoading && recommendations.length > 0 && (
        <div className={styles.grid}>
          {recommendations.slice(0, swipes.some((swipe) => swipe.action === "like") ? recommendations.length : 6).map((game) => (
            <div key={game.id} className={styles.cardWrapper}>
              <Link to={gamePath(game.id)} className={styles.link}>
                <div className={styles.cardContainer}>
                  <GameCard game={game} />
                </div>
                {t(`recommendations.reason.${game.reasonKey}`, game.reasonParams) ? (
                <div className={styles.reasonBadge}>
                  {t(`recommendations.reason.${game.reasonKey}`, game.reasonParams)}
                </div>
                ) : null}
              </Link>
              <button
                className={styles.notInterestedButton}
                onClick={(event) => handleNotInterested(event, game)}
                aria-label={`${t("match.dislike")} ${game.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
