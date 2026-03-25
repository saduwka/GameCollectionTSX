import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import GamePage from "./pages/GamePage/GamePage";
import GamesPage from "./pages/GamesPage/GamesPage";
import PlatformsPage from "./pages/PlatformsPage/PlatformsPage";
import PlatformDetails from "./pages/PlatformDetails/PlatformDetails";
import SearchPage from "./pages/SearchPage/SearchPage";
import BurgerMenu from "./components/BurgerMenu/BurgerMenu";
import Sidebar from "./components/Sidebar/Sidebar";

const PageRoutes = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-container">
      <BurgerMenu onClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <div className="content-wrapper" style={{ display: "flex", minHeight: "100vh" }}>
        <main className="main-content" style={{ flex: 1, width: "100%", paddingTop: "0" }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/game/:id" element={<GamePage />} />
            <Route path="/game/:id/:platformId" element={<GamePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/platform/:id" element={<PlatformDetails />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default PageRoutes;
