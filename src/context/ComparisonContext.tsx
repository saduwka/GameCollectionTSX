import React, { createContext, useState, useContext, type ReactNode } from "react";
import type { Game } from "../types/game";

interface ComparisonContextType {
  comparisonList: Game[];
  addToComparison: (game: Game) => void;
  removeFromComparison: (gameId: number) => void;
  clearComparison: () => void;
  isInComparison: (gameId: number) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<Game[]>([]);

  const addToComparison = (game: Game) => {
    if (comparisonList.length >= 4) {
      alert("You can compare up to 4 games at a time.");
      return;
    }
    if (!comparisonList.some((g) => g.id === game.id)) {
      setComparisonList([...comparisonList, game]);
    }
  };

  const removeFromComparison = (gameId: number) => {
    setComparisonList(comparisonList.filter((g) => g.id !== gameId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const isInComparison = (gameId: number) => {
    return comparisonList.some((g) => g.id === gameId);
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};
