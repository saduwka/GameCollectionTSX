import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import GamePage from "./pages/GamePage/GamePage";
import GamesPage from "./pages/GamesPage/GamesPage";
import PlatformsPage from "./pages/PlatformsPage/PlatformsPage";
import PlatformDetails from "./pages/PlatformDetails/PlatformDetails";
import SearchPage from "./pages/SearchPage/SearchPage";
import CollectionPage from "./pages/CollectionPage/CollectionPage";
import RecommendationsPage from "./pages/RecommendationsPage/RecommendationsPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import PublicCollectionPage from "./pages/PublicCollectionPage/PublicCollectionPage";
import BurgerMenu from "./components/BurgerMenu/BurgerMenu";
import Sidebar from "./components/Sidebar/Sidebar";
import ComparisonBar from "./components/ComparisonBar/ComparisonBar";

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
          <Routes>
            <Route path="/" element={<RecommendationsPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/game/:id" element={<GamePage />} />
            <Route path="/game/:id/:platformId" element={<GamePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/platform/:id" element={<PlatformDetails />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/collection/:uid" element={<PublicCollectionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default PageRoutes;
