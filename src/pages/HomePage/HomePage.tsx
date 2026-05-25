import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import styles from "./HomePage.module.css";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import { useAuth } from "../../context/AuthContext";
import { getPopularGames } from "../../services/games/getPopularGames";
import { fetchGames } from "../../services/games/fetchGames";
import type { Game } from "../../types/game";
import PageMeta from "../../components/PageMeta/PageMeta";

interface ShelfProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaTo?: string;
  isLoading: boolean;
  items: Game[];
  renderItem: (item: Game) => React.ReactNode;
  skeletonCount?: number;
}

const Shelf: React.FC<ShelfProps> = ({
  title,
  subtitle,
  ctaLabel,
  ctaTo,
  isLoading,
  items,
  renderItem,
  skeletonCount = 5,
}) => (
  <section className={styles.shelf}>
    <header className={styles.shelfHeader}>
      <div>
        <h2 className={styles.shelfTitle}>{title}</h2>
        {subtitle && <p className={styles.shelfSubtitle}>{subtitle}</p>}
      </div>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className={styles.shelfCta}>
          {ctaLabel} →
        </Link>
      )}
    </header>
    <div className={styles.shelfGrid}>
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))
        : items.map(renderItem)}
    </div>
  </section>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["popularGames"],
    queryFn: async () => {
      const result = await getPopularGames();
      return result.slice(0, 5);
    },
  });

  const { data: topRated = [], isLoading: topRatedLoading } = useQuery({
    queryKey: ["topRatedGames"],
    queryFn: async () => {
      const data = await fetchGames(1, "-metacritic");
      return data.games.slice(0, 5);
    },
  });

  const { data: rpgPicks = [], isLoading: rpgLoading } = useQuery({
    queryKey: ["genrePicks", "role-playing-games-rpg"],
    queryFn: async () => {
      const data = await fetchGames(1, "-rating", undefined, "role-playing-games-rpg");
      return data.games.slice(0, 5);
    },
  });

  const { data: indieGems = [], isLoading: indieLoading } = useQuery({
    queryKey: ["genrePicks", "indie"],
    queryFn: async () => {
      const data = await fetchGames(1, "-rating", undefined, "indie");
      return data.games.slice(0, 5);
    },
  });

  const isAuthenticated = !authLoading && !!user;

  return (
    <div className={styles.homePage}>
      <PageMeta
        title="PlayHub"
        description="PlayHub — каталог из 500 000+ игр. Умный поиск, сравнение, личная коллекция и рекомендации, основанные на ваших интересах."
      />
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🎮 PlayHub</span>
          <h1 className={styles.heroTitle}>
            Найди свою следующую любимую игру
          </h1>
          <p className={styles.heroDescription}>
            Каталог из 500 000+ игр, умный поиск, сравнение, личная коллекция и
            рекомендации, основанные на твоих интересах.
          </p>
          <div className={styles.heroButtons}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate("/games")}
            >
              Каталог игр
            </button>
            <button
              className={styles.btnMatch}
              onClick={() => navigate("/match")}
            >
              🔥 Свайпать игры
            </button>
            {isAuthenticated ? (
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/me")}
              >
                Мои рекомендации
              </button>
            ) : (
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/platforms")}
              >
                По платформам
              </button>
            )}
          </div>
          {!isAuthenticated && !authLoading && (
            <p className={styles.heroHint}>
              Войди через Google в верхнем меню, чтобы вести коллекцию и
              получать персональные подборки.
            </p>
          )}
        </div>
      </section>

      <Shelf
        title="🔥 В тренде сейчас"
        subtitle="Игры, о которых говорят прямо сейчас"
        ctaLabel="Смотреть все"
        ctaTo="/games"
        isLoading={trendingLoading}
        items={trending}
        renderItem={(game) => (
          <Link to={`/game/${game.id}`} key={game.id} className={styles.cardLink}>
            <GameCard game={game} />
          </Link>
        )}
      />

      <Shelf
        title="⭐ Топ по Metacritic"
        subtitle="Высочайшие оценки критиков"
        isLoading={topRatedLoading}
        items={topRated}
        renderItem={(game) => (
          <Link to={`/game/${game.id}`} key={game.id} className={styles.cardLink}>
            <GameCard game={game} />
          </Link>
        )}
      />

      <Link to="/match" className={styles.matchBanner}>
        <div className={styles.matchBannerStack} aria-hidden="true">
          <span className={`${styles.matchCard} ${styles.matchCard3}`} />
          <span className={`${styles.matchCard} ${styles.matchCard2}`} />
          <span className={`${styles.matchCard} ${styles.matchCard1}`}>
            <span className={styles.matchCardEmoji}>🎮</span>
          </span>
        </div>
        <div className={styles.matchBannerContent}>
          <span className={styles.matchBannerBadge}>NEW · PlayHub Match</span>
          <h2 className={styles.matchBannerTitle}>
            Найди игры свайпами
          </h2>
          <p className={styles.matchBannerText}>
            Вправо — нравится, влево — нет. Чем больше свайпаешь, тем точнее подбор.
          </p>
        </div>
        <span className={styles.matchBannerArrow}>→</span>
      </Link>

      <Shelf
        title="🗡️ Лучшие RPG"
        subtitle="Глубокие миры и долгие истории"
        isLoading={rpgLoading}
        items={rpgPicks}
        renderItem={(game) => (
          <Link to={`/game/${game.id}`} key={game.id} className={styles.cardLink}>
            <GameCard game={game} />
          </Link>
        )}
      />

      <Shelf
        title="💎 Инди-жемчужины"
        subtitle="Маленькие студии, большие идеи"
        isLoading={indieLoading}
        items={indieGems}
        renderItem={(game) => (
          <Link to={`/game/${game.id}`} key={game.id} className={styles.cardLink}>
            <GameCard game={game} />
          </Link>
        )}
      />

      <section className={styles.featuresStrip}>
        <Link to="/games" className={styles.feature}>
          <div className={styles.featureEmoji}>🔍</div>
          <h3 className={styles.featureTitle}>Умный поиск</h3>
          <p className={styles.featureText}>
            Фильтры по жанрам, годам, платформам и времени прохождения
          </p>
        </Link>
        <Link to="/platforms" className={styles.feature}>
          <div className={styles.featureEmoji}>🎮</div>
          <h3 className={styles.featureTitle}>50+ платформ</h3>
          <p className={styles.featureText}>
            От ретро до современных — найди игры под своё железо
          </p>
        </Link>
        <Link to={isAuthenticated ? "/collection" : "/games"} className={styles.feature}>
          <div className={styles.featureEmoji}>📚</div>
          <h3 className={styles.featureTitle}>Личная коллекция</h3>
          <p className={styles.featureText}>
            Трекинг статуса, рейтинги, заметки и часы игры
          </p>
        </Link>
        <Link to="/compare" className={styles.feature}>
          <div className={styles.featureEmoji}>⚖️</div>
          <h3 className={styles.featureTitle}>Сравнение</h3>
          <p className={styles.featureText}>
            До 4 игр рядом — выбери, во что сыграть следующим
          </p>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
