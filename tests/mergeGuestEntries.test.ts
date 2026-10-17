import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeGuestEntries } from "../src/services/collection/mergeGuestEntries.ts";

const pick = (id: number, status: "Wishlist" | "Backlog", name = "Game") => ({
  id,
  name,
  background_image: "",
  genres: ["Action"],
  status,
});

describe("mergeGuestEntries", () => {
  it("lets an explicit wishlist override a like", () => {
    const [game] = mergeGuestEntries(
      [{ gameId: 1, gameName: "Game", action: "like", timestamp: 1 }],
      [pick(1, "Wishlist")]
    );
    assert.equal(game.status, "Wishlist");
  });

  it("lets a backlog override a dislike", () => {
    const [game] = mergeGuestEntries(
      [{ gameId: 2, gameName: "Game", action: "dislike", timestamp: 1 }],
      [pick(2, "Backlog")]
    );
    assert.equal(game.status, "Backlog");
  });

  it("keeps a swipe when there is no pick", () => {
    const games = mergeGuestEntries(
      [
        { gameId: 3, gameName: "Liked", action: "like", timestamp: 1 },
        { gameId: 4, gameName: "Skipped", action: "dislike", timestamp: 2 },
      ],
      []
    );
    assert.deepEqual(
      games.map((game) => game.status),
      ["Liked", "Not Interested"]
    );
  });

  it("keeps the later swipe and the later pick", () => {
    const [game] = mergeGuestEntries(
      [
        { gameId: 5, gameName: "Old", action: "dislike", timestamp: 1 },
        { gameId: 5, gameName: "New", action: "like", timestamp: 2 },
      ],
      [pick(5, "Wishlist", "Old pick"), pick(5, "Backlog", "New pick")]
    );
    assert.equal(game.status, "Backlog");
    assert.equal(game.name, "New pick");
  });
});
