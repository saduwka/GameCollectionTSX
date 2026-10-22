import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collections } from "../../data/collections";
import { collectionSlugs, genres } from "../../../scripts/publicLinks.mjs";
import {
  aboutPath,
  collectionPath,
  faqPath,
  gamesPath,
  genrePath,
  platformsPath,
} from "../../seo/canonicalUrl";
import styles from "./SiteFooter.module.scss";

const bySlug = new Map(collections.map((collection) => [collection.slug, collection]));

const SiteFooter = () => {
  const { t, i18n } = useTranslation();
  const english = i18n.language.startsWith("en");

  return (
    <footer className={styles.footer}>
      <nav aria-label={t("common.catalog")}>
        <h2>{t("common.catalog")}</h2>
        <Link to={gamesPath()}>{t("common.games")}</Link>
        <Link to={platformsPath()}>{t("common.platforms")}</Link>
        <Link to="/match">{t("common.game_match")}</Link>
        <Link to="/search">{t("common.find_game")}</Link>
      </nav>
      <nav aria-label={t("common.genres")}>
        <h2>{t("common.genres")}</h2>
        {genres.map((genre) => (
          <Link key={genre.slug} to={genrePath(genre.slug)}>
            {english ? genre.en : genre.ru}
          </Link>
        ))}
      </nav>
      <nav aria-label={t("landing.picks")}>
        <h2>{t("landing.picks")}</h2>
        {collectionSlugs.map((slug) => {
          const collection = bySlug.get(slug);
          if (!collection) return null;
          return (
            <Link key={slug} to={collectionPath(slug)}>
              {english ? collection.title.en : collection.title.ru}
            </Link>
          );
        })}
        <Link to={aboutPath()}>{t("common.about")}</Link>
        <Link to={faqPath()}>{t("common.faq")}</Link>
      </nav>
    </footer>
  );
};

export default SiteFooter;
