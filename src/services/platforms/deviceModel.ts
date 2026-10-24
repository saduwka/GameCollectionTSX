export interface DeviceModel {
  id: number;
  key: string;
}

export const FAMILY_MODELS: Record<string, DeviceModel[]> = {
  ps: [
    { id: 187, key: "ps5" },
    { id: 18, key: "ps4" },
  ],
  xbox: [
    { id: 186, key: "series" },
    { id: 1, key: "one" },
  ],
  switch: [{ id: 7, key: "switch" }],
};

export const gamesOnPlatform = <T extends { platforms?: number[] }>(games: T[], platformId: number) =>
  games.filter((game) => (game.platforms ?? []).includes(platformId));
