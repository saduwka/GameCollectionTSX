import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/data/collections.ts", import.meta.url), "utf8");

export const collectionSlugs = [...source.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((match) => match[1]);

export const pinnedGameIds = [
  ...new Set([...source.matchAll(/game\(\s*(\d+)\s*,/g)].map((match) => Number(match[1]))),
];
