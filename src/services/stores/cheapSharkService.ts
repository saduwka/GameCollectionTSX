import axios from "axios";

const CHEAPSHARK_API_URL = "https://www.cheapshark.com/api/1.0";

export interface Deal {
  storeID: string;
  dealID: string;
  price: string;
  retailPrice: string;
  savings: string;
}

export interface CheapSharkGame {
  gameID: string;
  external: string;
  cheapest: string;
  cheapestDealID: string;
  thumb: string;
}

export const searchGameDeals = async (title: string): Promise<Deal[]> => {
  try {
    // 1. Search for the game ID by title
    const searchResponse = await axios.get(`${CHEAPSHARK_API_URL}/games?title=${encodeURIComponent(title)}&limit=1`);
    const games: CheapSharkGame[] = searchResponse.data;

    if (games.length === 0) return [];

    const gameID = games[0].gameID;

    // 2. Get specific deals for this game ID
    const dealsResponse = await axios.get(`${CHEAPSHARK_API_URL}/games?id=${gameID}`);
    return dealsResponse.data.deals || [];
  } catch (error) {
    console.error("Error fetching CheapShark deals:", error);
    return [];
  }
};

export const getStoreName = (storeID: string): string => {
  const stores: Record<string, string> = {
    "1": "Steam",
    "2": "GamersGate",
    "3": "GreenManGaming",
    "7": "GOG",
    "11": "Humble Store",
    "13": "Epic Games Store",
    "15": "Fanatical",
    "25": "Epic Games Store",
    "31": "Blizzard Shop",
  };
  return stores[storeID] || `Store ${storeID}`;
};
