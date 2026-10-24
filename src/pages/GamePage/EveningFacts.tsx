import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collectionsByGameId } from "../../data/collections";
import { collectionPath } from "../../seo/canonicalUrl";
import { localizedGenre, localizedTag } from "../../seo/labels";
import { moodMatch, RECIPES, type Mood } from "../../services/recommendations/tonightScore";
import type { Game } from "../../types/game";
import styles from "./GamePage.module.scss";

const moodKey: Record<Mood, string> = {
  calm: "landing.mood_calm",
  deep: "landing.mood_deep",
  finish: "landing.mood_finish",
  coop: "landing.mood_coop",
};

const EveningFacts = ({ game }: { game: Game }) => {
  const { t, i18n } = useTranslation();
  const english = i18n.language.startsWith("en");
  const platforms = game.platforms
    .map((item) => item.platform.name)
    .filter((name, index, all) => name && all.indexOf(name) === index);
  const genres = game.genres
    .map((name) => localizedGenre(name, english))
    .filter(Boolean)
    .slice(0, 2);
  const tags = (game.tags ?? [])
    .map((tag) => localizedTag(tag.slug, tag.name, english))
    .filter(Boolean)
    .slice(0, 3);
  const slugs = (game.tags ?? []).map((tag) => tag.slug).filter((slug): slug is string => Boolean(slug));
  const moods = (Object.keys(RECIPES) as Mood[])
    .map((mood) => ({ mood, score: moodMatch({ tags: slugs }, RECIPES[mood]) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.mood);
  const listed = collectionsByGameId(game.id);
  const session =
    game.playtime && game.playtime > 0
      ? game.playtime <= 3
        ? t("game_page.details.session_short", { count: game.playtime })
        : game.playtime <= 12
          ? t("game_page.details.session_evening", { count: game.playtime })
          : t("game_page.details.session_long", { count: game.playtime })
      : t("game_page.details.evening_unknown");

  return (
    <section className={styles.evening} aria-label={t("game_page.details.evening_title")}>
      <h2>{t("game_page.details.evening_title")}</h2>
      <dl>
        <div>
          <dt>{t("game_page.details.evening_time")}</dt>
          <dd>{session}</dd>
        </div>
        {platforms.length > 0 && (
          <div>
            <dt>{t("game_page.details.evening_where")}</dt>
            <dd>{platforms.slice(0, 4).join(", ")}</dd>
          </div>
        )}
        {(genres.length > 0 || tags.length > 0) && (
          <div>
            <dt>{t("game_page.details.evening_genre")}</dt>
            <dd>{[...genres, ...tags].join(", ")}</dd>
          </div>
        )}
        {moods.length > 0 && (
          <div>
            <dt>{t("game_page.details.evening_mood")}</dt>
            <dd>{moods.map((mood) => t(moodKey[mood])).join(", ")}</dd>
          </div>
        )}
        {listed.length > 0 && (
          <div>
            <dt>{t("game_page.details.evening_collections")}</dt>
            <dd>
              {listed.map((collection) => (
                <Link key={collection.slug} to={collectionPath(collection.slug)}>
                  {english ? collection.title.en : collection.title.ru}
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>
      <a className={styles.whereLink} href="#where-to-play">
        {t("game_page.where_to_play")}
      </a>
    </section>
  );
};

export default EveningFacts;
