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

export const fetchCheapSharkStores = async () => {
  const { data } = await axios.get<{ storeID: string; storeName: string; isActive: number }[]>(`${CHEAPSHARK_API_URL}/stores`);
  return data.filter((store) => store.isActive === 1);
};

export const getStoreName = (storeID: string, stores?: { storeID: string; storeName: string }[]): string => {
  const live = stores?.find((store) => store.storeID === storeID)?.storeName;
  if (live) return live;
  const known: Record<string, string> = {
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
  return known[storeID] || "";
};
