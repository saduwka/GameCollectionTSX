import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage/HomePage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import GamePage from "./pages/GamePage/GamePage";
import GamesPage from "./pages/GamesPage/GamesPage";
import Sidebar from "./components/Sidebar/Sidebar";
import PlatformsPage from "./pages/PlatformsPage/PlatformsPage";
import PlatformDetails from "./pages/PlatformDetails/PlatformDetails";
import Header from "./components/Header/Header";
import SearchPage from "./pages/SearchPage/SearchPage";

const PageRoutes = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden"
      }}
    >
      <Header onBurgerClick={toggleSidebar} />
      <div style={{ display: "flex", position: "relative" }}>
        {(isSidebarOpen || !isMobile) && (
          <div
            style={{
              position: isMobile ? "absolute" : "relative",
              zIndex: 100,
              width: 220,
              height: "100%",
              left: 0,
              top: 0
            }}
          >
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        )}
        <div
          style={{
            marginLeft: !isMobile ? "0" : "0",
            flex: 1,
            height: "100%",
            width: "100%"
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/game/:id" element={<GamePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/platform/:id" element={<PlatformDetails />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default PageRoutes;
