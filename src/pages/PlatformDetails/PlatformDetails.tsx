import type { FC } from "react";
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import GameCard from "../../components/GameCard/GameCard";
import {
  getPlatformDetails,
  getGamesForPlatform
} from "../../services/platforms/getPlatformDetails";
import styles from "./PlatformDetails.module.css";

const PlatformPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [platformDetails, setPlatformDetails] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isFetching = useRef(false);

  useEffect(() => {
    const fetchPlatformDetails = async () => {
      setLoading(true);
      try {
        const platformData = await getPlatformDetails(id!);
        setPlatformDetails(platformData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlatformDetails();
  }, [id]);

  useEffect(() => {
    const fetchGames = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoadingMore(true);
      try {
        console.log("Fetching games for page:", page);
        const gamesData = await getGamesForPlatform(id!, page);
        console.log(
          "Games received:",
          gamesData.results.map((g: any) => g.id)
        );
        if (gamesData.results.length === 0) {
          setHasMore(false);
        } else {
          setGames((prevGames) => [...prevGames, ...gamesData.results]);
          if (gamesData.results.length < 10) {
            setHasMore(false);
          }
        }
      } catch (err: any) {
        setError(err.message);
        setHasMore(false);
      } finally {
        setLoadingMore(false);
        isFetching.current = false;
      }
    };
    fetchGames();
  }, [id, page]);

  if (loading) {
    return (
      <LoadingErrorMessage
        loading={true}
        error={null}
        noResults={false}
        message="Loading platform details..."
      />
    );
  }

  if (error) {
    return (
      <LoadingErrorMessage
        loading={false}
        error={error}
        noResults={false}
        message="An error occurred while loading platform details."
      />
    );
  }

  return (
    <div className={styles.platformPage}>
      <button
        className={styles.backButton}
        onClick={() => window.history.back()}
      >
        Go Back
      </button>
      <h1 className={styles.heading}>{platformDetails.name}</h1>
      <p className={styles.platformDescription}>
        {platformDetails.description}
      </p>
      <h2 className={styles.heading}>Games</h2>
      <div className={styles.gameList}>
        {games.map((game) => (
          <Link to={`/game/${game.id}`} key={game.id}>
            <GameCard game={game} />
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className={styles.loadMoreButton}>
          <button
            onClick={() => setPage((prevPage) => prevPage + 1)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlatformPage;
