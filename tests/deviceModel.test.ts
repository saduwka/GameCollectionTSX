import assert from "node:assert/strict";
import test from "node:test";
import { gamesOnPlatform } from "../src/services/platforms/deviceModel.ts";

test("PS4 pool keeps only games that include platform 18", () => {
  const games = [
    { id: 1, platforms: [18, 1] },
    { id: 2, platforms: [4] },
    { id: 3, platforms: [] },
  ];
  assert.deepEqual(
    gamesOnPlatform(games, 18).map((game) => game.id),
    [1],
  );
});
