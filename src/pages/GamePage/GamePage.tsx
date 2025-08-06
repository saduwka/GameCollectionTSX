import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGameDetails } from "../../services/games/getGameDetails";
import {
  addGameToCollection,
  removeGameFromCollection
} from "../../services/collection/collectionService";
import {
  addReview,
  getReviews,
  updateReview,
  deleteReview
} from "../../services/reviews/reviewsService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import ReviewsList from "../../components/ReviewsList/ReviewsList";
import ImageModal from "../../components/ImageModal/ImageModal";
import LoginButton from "../../components/LoginButton/LoginButton";

import type { Game } from "../../types/game";
import type { Review } from "../../types/review";

import styles from "./GamePage.module.css";

const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [status, setStatus] = useState<string>("");
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [imageAnimationKey, setImageAnimationKey] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  // Получаем данные игры и отзывы
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("No game ID provided");
          setLoading(false);
          return;
        }

        const game = await getGameDetails(id);
        const fetchedReviews = await getReviews(game.id.toString());

        setGameDetails(game);
        setReviews(fetchedReviews);

        // Пользовательский отзыв
        if (user) {
          const ownReview =
            fetchedReviews.find((r) => r.userId === user.uid) || null;
          setUserReview(ownReview);
        }

        // Средняя оценка
        if (fetchedReviews.length > 0) {
          const sum = fetchedReviews.reduce((acc, r) => acc + r.rating, 0);
          setAverageRating(sum / fetchedReviews.length);
        } else {
          setAverageRating(null);
        }

        // Статус коллекции
        const saved = localStorage.getItem("favorites");
        const parsed = saved ? JSON.parse(saved) : {};
        if (parsed[id]) {
          setStatus(parsed[id].status);
        }

        setLoading(false);
      } catch {
        setError("Failed to fetch game details");
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // Обновление статуса игры
  const handleStatusClick = async (clickedStatus: string) => {
    if (!gameDetails || !user) return;
    setSaving(true);

    try {
      if (status === clickedStatus) {
        await removeGameFromCollection(gameDetails.id, user.uid);
        setStatus("");
        toast.success("Game removed from collection");
      } else {
        await addGameToCollection(
          { ...gameDetails, status: clickedStatus },
          user.uid
        );
        setStatus(clickedStatus);
        toast.success("Game status updated");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Сохранить отзыв
  const handleReviewSubmit = async (comment: string, rating: number) => {
    if (!gameDetails || !user) return;

    const newReview: Review = {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      comment,
      rating
    };

    if (userReview) {
      // Обновить
      await updateReview(gameDetails.id.toString(), userReview.id!, newReview);
      const updated = reviews.map((r) =>
        r.id === userReview.id ? { ...newReview, id: r.id } : r
      );
      setReviews(updated);
      setUserReview({ ...newReview, id: userReview.id });
      toast.success("Review updated");
      const sum = updated.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(sum / updated.length);
    } else {
      // Добавить новый
      const id = await addReview(gameDetails.id.toString(), newReview);
      const updated = [...reviews, { ...newReview, id }];
      setReviews(updated);
      setUserReview({ ...newReview, id });
      toast.success("Review added");
      const sum = updated.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(sum / updated.length);
    }
  };

  // Удалить отзыв
  const handleReviewDelete = async () => {
    if (!gameDetails || !userReview) return;

    await deleteReview(gameDetails.id.toString(), userReview.id!);
    const updated = reviews.filter((r) => r.id !== userReview.id);
    setReviews(updated);
    setUserReview(null);
    toast.success("Review deleted");

    if (updated.length > 0) {
      const sum = updated.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(sum / updated.length);
    } else {
      setAverageRating(null);
    }
  };

  // Модальное окно
  const images = [
    gameDetails?.background_image,
    gameDetails?.background_image_additional
  ].filter(Boolean) as string[];

  return (
    <>
      <LoadingErrorMessage
        loading={loading}
        error={error}
        noResults={!loading && !error && !gameDetails}
        message="No game found"
      />

      {!loading && !error && gameDetails && (
        <div className={styles.gamePageContainer}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Back
          </button>

          <h1 className={styles.gamePageHeader}>{gameDetails.name}</h1>

          <div className={styles.gameWrapper}>
            <div className={styles.gameImgWrapper}>
              <div className={styles.gamePageImageContainer}>
                {images.map((src, index) => (
                  <img
                    key={index}
                    className={styles.gamePageImage}
                    src={src}
                    alt={gameDetails.name}
                    onClick={() => setModalIndex(index)}
                  />
                ))}
              </div>

              <div className={styles.statusButtons}>
                {["played", "playing", "wishlist"].map((s) => (
                  <button
                    key={s}
                    disabled={saving}
                    className={status === s ? styles.active : ""}
                    onClick={() => handleStatusClick(s)}
                  >
                    {s === "played" && "✅ "}
                    {s === "playing" && "🕹️ "}
                    {s === "wishlist" && "📌 "}
                    {saving && status === s
                      ? "Saving…"
                      : s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.gamePageDetails}>
              <p>
                <strong>Release Date:</strong> {gameDetails.released}
              </p>
              <p>
                <strong>RAWG Rating:</strong> {gameDetails.rating}
              </p>
              <p>
                <strong>User Rating:</strong>{" "}
                {averageRating
                  ? averageRating.toFixed(1)
                  : "No user rating yet"}
              </p>
              <p>
                <strong>Metacritic:</strong> {gameDetails.metacritic || "N/A"}
              </p>

              <div>
                <strong>Description:</strong>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: gameDetails.description }}
                />
              </div>

              <p>
                <strong>Platforms:</strong>{" "}
                {gameDetails.platforms?.length
                  ? gameDetails.platforms.map((p, i, arr) => (
                      <span key={p.platform.id}>
                        <a
                          href={`/platform/${p.platform.id}`}
                          className={styles.platformLink}
                        >
                          {p.platform.name}
                        </a>
                        {i < arr.length - 1 && ", "}
                      </span>
                    ))
                  : "N/A"}
              </p>

              {gameDetails.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={gameDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          </div>
          <div className={styles.reviewsSection}>
            {user ? (
              <ReviewForm
                userReview={userReview}
                onSubmit={handleReviewSubmit}
                onDelete={handleReviewDelete}
              />
            ) : (
              <>
                <p>Please log in to leave a review.</p>
                <LoginButton />
              </>
            )}

            <ReviewsList reviews={reviews} />
          </div>

          {modalIndex !== null && (
            <ImageModal
              images={images}
              currentIndex={modalIndex}
              onClose={() => setModalIndex(null)}
              onPrev={() => {
                setModalIndex((prev) =>
                  prev !== null ? (prev - 1 + images.length) % images.length : 0
                );
                setImageAnimationKey((prev) => prev + 1);
              }}
              onNext={() => {
                setModalIndex((prev) =>
                  prev !== null ? (prev + 1) % images.length : 0
                );
                setImageAnimationKey((prev) => prev + 1);
              }}
              animationKey={imageAnimationKey}
            />
          )}
        </div>
      )}
    </>
  );
};

export default GamePage;
