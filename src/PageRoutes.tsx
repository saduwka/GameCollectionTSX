// FILE: src/PageRoutes.tsx
import { lazy, Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
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

const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#999",
      fontSize: 14,
    }}
  >
    Загрузка...
  </div>
);

const PageRoutes = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-container">
      <BurgerMenu onClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <ComparisonBar />

      <div className="content-wrapper" style={{ display: "flex", minHeight: "100vh" }}>
        <main className="main-content" style={{ flex: 1, width: "100%", paddingTop: "0" }}>
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
