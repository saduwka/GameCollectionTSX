import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGames } from "../../services/games/fetchGames";
import { getGenres } from "../../services/games/getGenres";
import { getPlatforms } from "../../services/platforms/getPlatformsList";
import GameCard from "../../components/GameCard/GameCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./GamesPage.module.css";
import type { Game, RawGame } from "../../types/game";

// Функция преобразования RawGame в Game
const mapRawGameToGame = (raw: RawGame): Game => {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description_raw,
    background_image: raw.background_image,
    background_image_additional: undefined,
    coverUrl: raw.background_image, // можно заменить, если у вас есть отдельное поле с обложкой
    rating: raw.rating,
    platforms: raw.platforms.map((p) => ({
      platform: {
        id: p.platform.id,
        name: p.platform.name,
        slug: "" // Если slug отсутствует, оставляем пустую строку
      },
      released_at: undefined,
      requirements: undefined
    })),
    released: raw.released,
    genres: raw.genres.map((g) => g.name),
    metacritic: raw.metacritic ?? null,
    website: null,
    added: raw.added
  };
};

const GamesPage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filter, setFilter] = useState<"random" | "popular" | "rating">(
    "random"
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedGenreId, setSelectedGenreId] = useState<string>("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [platforms, setPlatforms] = useState<{ id: string; name: string }[]>([]);

  const shuffleArray = (array: Game[]): Game[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresList = await getGenres();
        setGenres(genresList);
      } catch (error) {
        console.error("Failed to load genres", error);
      }
    };
    fetchGenres();

    const fetchPlatforms = async () => {
      try {
        const platformsList = await getPlatforms();
        const sortedPlatforms = platformsList.sort((a, b) => a.name.localeCompare(b.name));
        setPlatforms(sortedPlatforms);
      } catch (error) {
        console.error("Failed to load platforms", error);
      }
    };
    fetchPlatforms();
  }, []);

  useEffect(() => {
    const getGames = async () => {
      setLoading(true);
      setError(null);
      try {
        let ordering = "";
        if (filter === "popular") {
          ordering = "-added";
        } else if (filter === "rating") {
          ordering = "-rating";
        } else {
          ordering = ""; // No specific ordering for random; fetch without ordering then shuffle
        }

        const gamesData = await fetchGames(
          currentPage,
          ordering,
          selectedYear,
          selectedGenreId,
          selectedPlatformId
        );

        // Преобразуем RawGame[] в Game[]
        let sortedGames: Game[] = gamesData.games.map(mapRawGameToGame);

        if (filter === "random") {
          sortedGames = shuffleArray(sortedGames);
        }

        setGames(sortedGames);
        setHasMore(gamesData.nextPageUrl !== null);
      } catch (err) {
        setError("Failed to fetch games");
      } finally {
        setLoading(false);
      }
    };

    getGames();
  }, [filter, currentPage, selectedYear, selectedGenreId, selectedPlatformId]);

  return (
    <div className={styles.gamesPage}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Games List</h1>
        {!loading && (
          <div className={styles.filters}>
            <button
              className={filter === "random" ? styles.activeButton : ""}
              onClick={() => setFilter("random")}
            >
              Random
            </button>
            <button
              className={filter === "popular" ? styles.activeButton : ""}
              onClick={() => setFilter("popular")}
            >
              Popular
            </button>
            <button
              className={filter === "rating" ? styles.activeButton : ""}
              onClick={() => setFilter("rating")}
            >
              Rating
            </button>

            <select
              className={styles.selectFilter}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">All Years</option>
              {Array.from(
                { length: new Date().getFullYear() - 1979 },
                (_, i) => 1980 + i
              )
                .reverse()
                .map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
            </select>

            <select
              className={styles.selectFilter}
              value={selectedGenreId}
              onChange={(e) => setSelectedGenreId(e.target.value)}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select
              className={styles.selectFilter}
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
            >
              <option value="">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <LoadingErrorMessage
          loading={loading}
          error={error}
          noResults={!loading && !error && games.length === 0}
        />
        {!loading && !error && games.length > 0 && (
          <div className={styles.gamesList}>
            {games.map((game) => (
              <div key={game.id} className={styles.gameCardContainer}>
                <Link to={`/game/${game.id}`}>
                  <GameCard game={game} />
                </Link>
              </div>
            ))}
          </div>
        )}
        {!loading && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className={styles.pageNumber}>{currentPage}</span>
            {hasMore && (
              <button onClick={() => setCurrentPage((prev) => prev + 1)}>
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
