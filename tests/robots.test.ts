import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const robots = readFileSync(path.join(import.meta.dirname, "../public/robots.txt"), "utf8");

const starRules = (text: string) => {
  const rules: { allow: boolean; path: string }[] = [];
  let active = false;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      active = value === "*";
      continue;
    }
    if (!active) continue;
    if (key === "allow") rules.push({ allow: true, path: value });
    if (key === "disallow") rules.push({ allow: false, path: value });
  }
  return rules;
};

const matches = (pathname: string, pattern: string) => {
  if (pattern.endsWith("$")) return pathname === pattern.slice(0, -1);
  return pathname.startsWith(pattern);
};

const isAllowed = (pathname: string) => {
  const hits = starRules(robots).filter((rule) => matches(pathname, rule.path));
  const longest = Math.max(...hits.map((rule) => rule.path.length));
  const winners = hits.filter((rule) => rule.path.length === longest);
  return winners.some((rule) => rule.allow);
};

describe("robots", () => {
  it("allows public collections and blocks only the private shelf", () => {
    assert.equal(isAllowed("/collections/short-evening"), true);
    assert.equal(isAllowed("/collections/relax/"), true);
    assert.equal(isAllowed("/collection/example"), true);
    assert.equal(isAllowed("/collection"), false);
    assert.equal(isAllowed("/match"), true);
    assert.equal(isAllowed("/search"), true);
    assert.equal(isAllowed("/profile"), false);
    assert.equal(robots.includes("Disallow: /match"), false);
    assert.equal(robots.includes("Disallow: /search"), false);
    assert.equal(robots.includes("Disallow: /collection/"), false);
  });
});
