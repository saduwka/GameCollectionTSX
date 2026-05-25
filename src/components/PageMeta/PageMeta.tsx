// FILE: src/components/PageMeta/PageMeta.tsx
import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  /** Уникальная часть title. Будет автоматически дополнена " — PlayHub". */
  title: string;
  /** Meta description (для поиска и OG). */
  description?: string;
  /** OG image URL (картинка для соцсетей). */
  image?: string;
  /** Канонический URL страницы. По умолчанию текущий location.href. */
  url?: string;
  /** OG type — обычно "website", для страниц игр можно "article". */
  type?: "website" | "article";
}

const SITE_NAME = "PlayHub";
const DEFAULT_DESCRIPTION =
  "PlayHub — каталог из 500 000+ игр. Умный поиск, сравнение, личная коллекция и рекомендации, основанные на ваших интересах.";

const PageMeta = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = "website",
}: PageMetaProps) => {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} — ${SITE_NAME}`;
  const pageUrl =
    url ||
    (typeof window !== "undefined" ? window.location.href : undefined);

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      {image && <meta property="og:image" content={image} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {pageUrl && <link rel="canonical" href={pageUrl} />}
    </Helmet>
  );
};

export default PageMeta;
