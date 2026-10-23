import { Helmet } from "react-helmet-async";
import { canonicalUrl } from "../../seo/canonicalUrl";
import { SITE_NAME, SITE_ORIGIN } from "../../site";
import type { Game } from "../../types/game";

interface JsonLdProps {
  data: Record<string, unknown>;
}

const JsonLd = ({ data }: JsonLdProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);

const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const ORG_ID = `${SITE_ORIGIN}/#org`;

export const websiteJsonLd = (description?: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  inLanguage: "ru",
  publisher: { "@id": ORG_ID },
  ...(description ? { description } : {}),
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_ORIGIN}/search?query={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const organizationJsonLd = (description: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/logo-512.png`,
  sameAs: ["https://t.me/saduwkaa", "https://github.com/saduwka/GameCollectionTSX"],
  description,
});

export const faqPageJsonLd = (items: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

export const breadcrumbJsonLd = (items: { name: string; url?: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    ...(item.url ? { item: item.url } : {}),
  })),
});

export const itemListJsonLd = (games: { id: number; name: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: games.slice(0, 20).map((game, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: game.name,
    url: canonicalUrl(SITE_ORIGIN, `/game/${game.id}`),
  })),
});

export const videoGameJsonLd = (game: Game): Record<string, unknown> => {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    image: game.background_image || undefined,
    genre: game.genres,
    gamePlatform: game.platforms.map((item) => item.platform.name),
  };

  if (game.released && game.released !== "Unknown") {
    data.datePublished = game.released;
  }

  if (game.rating > 0 && (game.ratings_count ?? 0) > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: game.rating,
      bestRating: 5,
      ratingCount: game.ratings_count,
    };
  }

  return data;
};

export default JsonLd;
