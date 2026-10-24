import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { breadcrumbJsonLd, itemListJsonLd } from "../../components/JsonLd/JsonLd";
import { collectionBySlug, collections, type EditorialCollection } from "../../data/collections";
import { collectionPath, gamePath } from "../../seo/canonicalUrl";
import { track } from "../../services/analytics/track";
import { SITE_ORIGIN } from "../../site";
import styles from "./CollectionsPage.module.scss";

const pick = (value: { ru: string; en: string }, language: string) =>
  language.startsWith("en") ? value.en : value.ru;

const factLabels = (language: string) =>
  language.startsWith("en")
    ? {
        fit: "Who it suits",
        session: "Time for a session",
        evening: "Can you finish it in an evening",
        platforms: "Platforms",
        why: "Why it is here",
        notFor: "Who should skip it",
      }
    : {
        fit: "Кому подойдёт",
        session: "Сколько времени нужно на сессию",
        evening: "Можно ли пройти за вечер",
        platforms: "Платформы",
        why: "Почему включили",
        notFor: "Кому не подойдёт",
      };

const CollectionArticle = ({ collection, language }: { collection: EditorialCollection; language: string }) => {
  const title = pick(collection.title, language);
  const description = pick(collection.description, language);
  const index = collections.findIndex((item) => item.slug === collection.slug);
  const neighbors = [1, 2, 3].map((step) => collections[(index + step) % collections.length]);
  const labels = factLabels(language);
  const facts = ["fit", "session", "evening", "platforms", "why", "notFor"] as const;
  const crumbs = [
    { name: language.startsWith("en") ? "Home" : "Главная", url: `${SITE_ORIGIN}/` },
    { name: language.startsWith("en") ? "Collections" : "Подборки", url: `${SITE_ORIGIN}/` },
    { name: title, url: `${SITE_ORIGIN}${collectionPath(collection.slug)}` },
  ];

  return (
    <article className={styles.page} data-seo-ready="true">
      <PageMeta title={title} description={description} />
      <JsonLd data={itemListJsonLd(collection.games)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <nav className={styles.crumbs} aria-label="breadcrumb">
        <Link to="/">{crumbs[0].name}</Link>
        <span aria-hidden="true">/</span>
        <span>{crumbs[1].name}</span>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>
      <h1>{title}</h1>
      <p className={styles.intro}>{pick(collection.intro, language)}</p>
      <p className={styles.source}>
        {pick(collection.source, language)} {pick(collection.checked, language)}
      </p>
      {collection.games.map((game) => (
        <section key={game.id} className={styles.game}>
          <h2>
            <Link
              to={gamePath(game.id)}
              onClick={() => track("game_open", { game_id: game.id, from: `collection:${collection.slug}` })}
            >
              {game.name}
            </Link>
          </h2>
          <dl className={styles.facts}>
            {facts.map((key) => (
              <div key={key}>
                <dt>{labels[key]}</dt>
                <dd>{pick(game[key], language)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <nav className={styles.links} aria-label={language.startsWith("en") ? "Other collections" : "Другие подборки"}>
        <Link to="/">{language.startsWith("en") ? "Tonight" : "Сегодня"}</Link>
        {neighbors.map((item) => (
          <Link
            key={item.slug}
            to={collectionPath(item.slug)}
            onClick={() => track("collection_open", { slug: item.slug, from: "other" })}
          >
            {pick(item.title, language)}
          </Link>
        ))}
      </nav>
    </article>
  );
};

const CollectionsPage = () => {
  const { slug = "" } = useParams();
  const { i18n } = useTranslation();
  const collection = collectionBySlug(slug);

  if (!collection) {
    return (
      <article className={styles.page} data-seo-ready="false">
        <PageMeta title="Подборка" description="Такой подборки нет." noindex />
        <h1>Такой подборки нет</h1>
        <p>
          <Link to="/">На главную</Link>
        </p>
      </article>
    );
  }

  return <CollectionArticle collection={collection} language={i18n.language} />;
};

export default CollectionsPage;
