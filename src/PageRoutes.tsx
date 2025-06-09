import { Routes, Route } from "react-router-dom";
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
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden"
      }}
    >
      <Header />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div
          style={{
            display: "flex",
            marginLeft: "220px",
            flex: 1,
            height: "100%"
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
