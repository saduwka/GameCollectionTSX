import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { organizationJsonLd, websiteJsonLd } from "../../components/JsonLd/JsonLd";
import { faqPath } from "../../seo/canonicalUrl";
import styles from "./InfoPage.module.scss";

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <article className={styles.page} data-seo-ready="true">
      <PageMeta title={t("info.about_title")} description={t("info.about_description")} />
      <JsonLd data={websiteJsonLd(t("info.about_description"))} />
      <JsonLd data={organizationJsonLd(t("info.about_description"))} />
      <h1>{t("info.about_title")}</h1>
      <p>{t("info.about_p1")}</p>
      <p>{t("info.about_p2")}</p>
      <p>{t("info.about_p3")}</p>
      <p>{t("info.about_renamed")}</p>
      <p>
        <Link to={faqPath()}>{t("common.faq")}</Link>
      </p>
    </article>
  );
};

export default AboutPage;
