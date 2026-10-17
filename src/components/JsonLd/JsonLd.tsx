import { Helmet } from "react-helmet-async";
import { SITE_ORIGIN } from "../../site";
import type { Game } from "../../types/game";

interface JsonLdProps {
  data: Record<string, unknown>;
}

const JsonLd = ({ data }: JsonLdProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);

export const itemListJsonLd = (games: { id: number; name: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: games.slice(0, 20).map((game, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: game.name,
    url: `${SITE_ORIGIN}/game/${game.id}`,
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
