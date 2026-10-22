import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { faqPageJsonLd } from "../../components/JsonLd/JsonLd";
import { aboutPath } from "../../seo/canonicalUrl";
import styles from "../AboutPage/InfoPage.module.scss";

const FaqPage = () => {
  const { t } = useTranslation();

  return (
    <article className={styles.page} data-seo-ready="true">
      <PageMeta title={t("info.faq_title")} description={t("info.faq_description")} />
      <JsonLd
        data={faqPageJsonLd([
          { question: t("info.faq_q1"), answer: t("info.faq_a1") },
          { question: t("info.faq_q2"), answer: t("info.faq_a2") },
          { question: t("info.faq_q3"), answer: t("info.faq_a3") },
        ])}
      />
      <h1>{t("info.faq_title")}</h1>
      <h2>{t("info.faq_q1")}</h2>
      <p>{t("info.faq_a1")}</p>
      <h2>{t("info.faq_q2")}</h2>
      <p>{t("info.faq_a2")}</p>
      <h2>{t("info.faq_q3")}</h2>
      <p>{t("info.faq_a3")}</p>
      <p>
        <Link to={aboutPath()}>{t("common.about")}</Link>
      </p>
    </article>
  );
};

export default FaqPage;
