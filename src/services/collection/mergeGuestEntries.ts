import type { GameStatus } from "./collectionService";

export interface GuestSwipeInput {
  gameId: number;
  gameName: string;
  action: "like" | "dislike";
  genres?: string[];
  background_image?: string;
  timestamp?: number;
}

export interface GuestPickInput {
  id: number;
  name: string;
  background_image: string;
  genres: string[];
  status: "Wishlist" | "Backlog";
}

export interface MergedGuestGame {
  id: number;
  name: string;
  background_image: string;
  genres: string[];
  status: GameStatus;
}

export const mergeGuestEntries = (
  swipes: GuestSwipeInput[],
  picks: GuestPickInput[]
): MergedGuestGame[] => {
  const byId = new Map<number, MergedGuestGame>();
  const orderedSwipes = [...swipes].sort(
    (left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0)
  );

  for (const swipe of orderedSwipes) {
    byId.set(swipe.gameId, {
      id: swipe.gameId,
      name: swipe.gameName,
      background_image: swipe.background_image || "",
      genres: swipe.genres || [],
      status: swipe.action === "like" ? "Liked" : "Not Interested",
    });
  }

  for (const pick of picks) {
    byId.set(pick.id, {
      id: pick.id,
      name: pick.name,
      background_image: pick.background_image,
      genres: pick.genres,
      status: pick.status,
    });
  }

  return [...byId.values()];
};
