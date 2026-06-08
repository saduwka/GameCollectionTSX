import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import styles from "./HomePage.module.scss";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Shelf: React.FC<ShelfProps> = ({
  title,
  subtitle,
  ctaLabel,
  ctaTo,
  isLoading,
  items,
  renderItem,
  skeletonCount = 4,
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
    <motion.div 
      className={styles.shelfGrid}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))
        : items.map(item => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderItem(item)}
            </motion.div>
          ))}
    </motion.div>
  </section>
);

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["popularGames"],
    queryFn: async () => {
      const result = await getPopularGames();
      return result.slice(0, 4);
    },
  });

  const { data: topRated = [], isLoading: topRatedLoading } = useQuery({
    queryKey: ["topRatedGames"],
    queryFn: async () => {
      const data = await fetchGames(1, "-metacritic");
      return data.games.slice(0, 4);
    },
  });

  const { data: rpgPicks = [], isLoading: rpgLoading } = useQuery({
    queryKey: ["genrePicks", "role-playing-games-rpg"],
    queryFn: async () => {
      const data = await fetchGames(1, "-rating", undefined, "role-playing-games-rpg");
      return data.games.slice(0, 4);
    },
  });

  const { data: indieGems = [], isLoading: indieLoading } = useQuery({
    queryKey: ["genrePicks", "indie"],
    queryFn: async () => {
      const data = await fetchGames(1, "-rating", undefined, "indie");
      return data.games.slice(0, 4);
    },
  });

  const isAuthenticated = !authLoading && !!user;

  return (
    <div className={styles.homePage}>
      <PageMeta
        title="PlayHub"
        description={t('home.meta_description')}
      />
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🎮 PlayHub</span>
          <h1 className={styles.heroTitle}>
            {t('home.hero_title')}
          </h1>
          <p className={styles.heroDescription}>
            {t('home.hero_description')}
          </p>
          <div className={styles.heroButtons}>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate("/games")}
            >
              {t('home.cta_catalog')}
            </button>
            <button
              className={styles.btnMatch}
              onClick={() => navigate("/match")}
            >
              {t('home.cta_match')}
            </button>
            {isAuthenticated ? (
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/me")}
              >
                {t('home.cta_recommendations')}
              </button>
            ) : (
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/platforms")}
              >
                {t('home.cta_platforms')}
              </button>
            )}
          </div>
          {!isAuthenticated && !authLoading && (
            <p className={styles.heroHint}>
              {t('home.hero_hint')}
            </p>
          )}
        </div>
      </section>

      <Shelf
        title={t('home.trending_title')}
        subtitle={t('home.trending_subtitle')}
        ctaLabel={t('home.see_all')}
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
        title={t('home.top_metacritic_title')}
        subtitle={t('home.top_metacritic_subtitle')}
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
          <span className={styles.matchBannerBadge}>{t('home.match_banner_badge')}</span>
          <h2 className={styles.matchBannerTitle}>
            {t('home.match_banner_title')}
          </h2>
          <p className={styles.matchBannerText}>
            {t('home.match_banner_text')}
          </p>
        </div>
        <span className={styles.matchBannerArrow}>→</span>
      </Link>

      <Shelf
        title={t('home.best_rpg_title')}
        subtitle={t('home.best_rpg_subtitle')}
        isLoading={rpgLoading}
        items={rpgPicks}
        renderItem={(game) => (
          <Link to={`/game/${game.id}`} key={game.id} className={styles.cardLink}>
            <GameCard game={game} />
          </Link>
        )}
      />

      <Shelf
        title={t('home.indie_gems_title')}
        subtitle={t('home.indie_gems_subtitle')}
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
          <h3 className={styles.featureTitle}>{t('home.feature_search_title')}</h3>
          <p className={styles.featureText}>
            {t('home.feature_search_text')}
          </p>
        </Link>
        <Link to="/platforms" className={styles.feature}>
          <div className={styles.featureEmoji}>🎮</div>
          <h3 className={styles.featureTitle}>{t('home.feature_platforms_title')}</h3>
          <p className={styles.featureText}>
            {t('home.feature_platforms_text')}
          </p>
        </Link>
        <Link to={isAuthenticated ? "/collection" : "/games"} className={styles.feature}>
          <div className={styles.featureEmoji}>📚</div>
          <h3 className={styles.featureTitle}>{t('home.feature_collection_title')}</h3>
          <p className={styles.featureText}>
            {t('home.feature_collection_text')}
          </p>
        </Link>
        <Link to="/compare" className={styles.feature}>
          <div className={styles.featureEmoji}>⚖️</div>
          <h3 className={styles.featureTitle}>{t('home.feature_compare_title')}</h3>
          <p className={styles.featureText}>
            {t('home.feature_compare_text')}
          </p>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
