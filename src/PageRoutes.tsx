// FILE: src/PageRoutes.tsx
import { lazy, Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HomePage from "./pages/HomePage/HomePage";
import BurgerMenu from "./components/BurgerMenu/BurgerMenu";
import Sidebar from "./components/Sidebar/Sidebar";
import ComparisonBar from "./components/ComparisonBar/ComparisonBar";

// Route-level code splitting: каждая страница грузится отдельным чанком.
// HomePage оставлен eager (лендинг, нужен сразу), NotFoundPage тоже мелкий и грузим лениво.
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
import LoadingErrorMessage from "./components/LoadingErrorMessage/LoadingErrorMessage";
const RouteFallback = () => {
  return (
    <LoadingErrorMessage loading={true} error={null} noResults={false} variant="inline" />
  );
};

const PageRoutes = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
return (
  <div className="app-container">
    <a href="#main-content" className="skip-link">
      {t('common.main_menu')}
    </a>
    <BurgerMenu onClick={toggleSidebar} isOpen={isSidebarOpen} />
    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
    <ComparisonBar />

    <div className="content-wrapper">
        <main
          id="main-content"
          tabIndex={-1}
          className="main-content"
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/me" element={<RecommendationsPage />} />
              <Route path="/game/:id" element={<GamePage />} />
              <Route path="/game/:id/:platformId" element={<GamePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/platform/:id" element={<PlatformDetails />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/collection/:uid" element={<PublicCollectionPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/match" element={<MatchPage />} />
              {/* path="*" must be the LAST route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default PageRoutes;
