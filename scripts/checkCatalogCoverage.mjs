import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { gameIdsInHtml, gameIdsInSitemap, sameGameIds } from "./catalogCoverage.mjs";

const dist = path.resolve("dist");

const readCatalogHtml = async () => {
  const pages = [path.join(dist, "games/index.html")];
  const pageDir = path.join(dist, "games/page");
  const entries = await readdir(pageDir);
  for (const entry of entries) pages.push(path.join(pageDir, entry, "index.html"));
  return (await Promise.all(pages.map((file) => readFile(file, "utf8")))).join("\n");
};

const listed = gameIdsInSitemap(await readFile(path.join(dist, "sitemap-games.xml"), "utf8"));
const linked = gameIdsInHtml(await readCatalogHtml());
if (!sameGameIds(listed, linked)) {
  const missing = [...listed].filter((id) => !linked.has(id));
  const extra = [...linked].filter((id) => !listed.has(id));
  throw new Error(`catalog pages do not match sitemap-games.xml missing=${missing.join(",")} extra=${extra.join(",")}`);
}
console.log(`catalog pages cover ${listed.size} sitemap games`);
