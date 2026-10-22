// FILE: src/components/PageMeta/PageMeta.tsx
import { useLayoutEffect } from "react";
import { canonicalUrl } from "../../seo/canonicalUrl";
import { SITE_ORIGIN } from "../../site";
import { syncDocumentMeta } from "./syncDocumentMeta";

interface PageMetaProps {
  /** Уникальная часть title. Будет автоматически дополнена " — PlayHub". */
  title: string;
  /** Meta description (для поиска и OG). */
  description?: string;
  /** OG image URL (картинка для соцсетей). */
  image?: string;
  /** Канонический URL страницы. По умолчанию origin + pathname, без query и hash. */
  url?: string;
  /** Не дописывать « — PlayHub», если title уже полный. */
  exactTitle?: boolean;
  /** OG type — обычно "website", для страниц игр можно "article". */
  type?: "website" | "article";
  /** Закрыть страницу от индексации. Для пререндеренных публичных страниц не ставить. */
  noindex?: boolean;
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
  exactTitle = false,
  noindex = false,
}: PageMetaProps) => {
  const fullTitle = exactTitle || title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
  const pageUrl =
    url ||
    (typeof window !== "undefined" ? canonicalUrl(SITE_ORIGIN, window.location.pathname) : SITE_ORIGIN);

  useLayoutEffect(() => {
    syncDocumentMeta({
      title: fullTitle,
      description,
      url: pageUrl,
      type,
      image,
      noindex,
    });
  }, [description, fullTitle, image, noindex, pageUrl, type]);

  return null;
};

export default PageMeta;
