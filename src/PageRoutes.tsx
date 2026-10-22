import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MotionConfig } from "framer-motion";
import HomePage from "./pages/HomePage/HomePage";
import AppHeader from "./components/AppHeader/AppHeader";
import ComparisonBar from "./components/ComparisonBar/ComparisonBar";
import SiteFooter from "./components/SiteFooter/SiteFooter";
import LoadingErrorMessage from "./components/LoadingErrorMessage/LoadingErrorMessage";

const GamePage = lazy(() => import("./pages/GamePage/GamePage"));
const GamesPage = lazy(() => import("./pages/GamesPage/GamesPage"));
const PlatformsPage = lazy(() => import("./pages/PlatformsPage/PlatformsPage"));
const PlatformDetails = lazy(() => import("./pages/PlatformDetails/PlatformDetails"));
const SearchPage = lazy(() => import("./pages/SearchPage/SearchPage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage/CollectionPage"));
const ComparePage = lazy(() => import("./pages/ComparePage/ComparePage"));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage/RecommendationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage/ProfilePage"));
const PublicCollectionPage = lazy(() => import("./pages/PublicCollectionPage/PublicCollectionPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));
const MatchPage = lazy(() => import("./pages/MatchPage/MatchPage"));
const AboutPage = lazy(() => import("./pages/AboutPage/AboutPage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage/CollectionsPage"));
const FaqPage = lazy(() => import("./pages/FaqPage/FaqPage"));

const RouteFallback = () => (
  <LoadingErrorMessage loading={true} error={null} noResults={false} variant="inline" />
);

const PageRoutes = () => {
  const { t } = useTranslation();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-container">
        <a href="#main-content" className="skip-link">
          {t("common.main_menu")}
        </a>
        <div className="content-wrapper">
          <AppHeader />
          <ComparisonBar />
          <main id="main-content" tabIndex={-1} className="main-content">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/me" element={<RecommendationsPage />} />
                <Route path="/game/:id" element={<GamePage />} />
                <Route path="/game/:id/:platformId" element={<GamePage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/games/page/:page" element={<GamesPage />} />
                <Route path="/genre/:slug" element={<GamesPage />} />
                <Route path="/genre/:slug/page/:page" element={<GamesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/platforms" element={<PlatformsPage />} />
                <Route path="/platform/:id" element={<PlatformDetails />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/collections/:slug" element={<CollectionsPage />} />
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="/collection/:uid" element={<PublicCollectionPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/match" element={<MatchPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <SiteFooter />
        </div>
      </div>
    </MotionConfig>
  );
};

export default PageRoutes;
