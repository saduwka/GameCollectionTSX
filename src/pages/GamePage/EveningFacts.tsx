import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collectionsByGameId } from "../../data/collections";
import { collectionPath } from "../../seo/canonicalUrl";
import { eveningMoods, type Mood } from "../../services/recommendations/tonightScore";
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
  const platforms = (game.parentPlatforms?.length ? game.parentPlatforms : game.platforms.map((item) => item.platform.name)).filter(
    (name, index, all) => name && all.indexOf(name) === index,
  );
  const genres = game.genres.slice(0, 3);
  const tags = (game.tags ?? [])
    .filter((tag) => !tag.language || tag.language === "rus" || tag.language === "eng")
    .slice(0, 4);
  const moods = eveningMoods((game.tags ?? []).map((tag) => tag.slug).filter((slug): slug is string => Boolean(slug)));
  const listed = collectionsByGameId(game.id);
  const genreLine = [...genres, ...tags.map((tag) => tag.name)].join(", ");

  return (
    <section className={styles.evening} aria-label={t("game_page.details.evening_title")}>
      <h2>{t("game_page.details.evening_title")}</h2>
      <dl>
        <div>
          <dt>{t("game_page.details.evening_time")}</dt>
          <dd>
            {game.playtime && game.playtime > 0
              ? t("game_page.details.evening_hours", { count: game.playtime })
              : t("game_page.details.evening_unknown")}
          </dd>
        </div>
        {platforms.length > 0 && (
          <div>
            <dt>{t("game_page.details.evening_where")}</dt>
            <dd>{platforms.join(", ")}</dd>
          </div>
        )}
        {genreLine && (
          <div>
            <dt>{t("game_page.details.evening_genre")}</dt>
            <dd>{genreLine}</dd>
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
    </section>
  );
};

export default EveningFacts;
