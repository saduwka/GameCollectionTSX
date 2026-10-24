import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { disambiguateDescriptions, gameMetaDescription } from "../src/seo/gameMetaDescription";

describe("game meta description", () => {
  it("describes GTA V in Russian without the RAWG paragraph", () => {
    const text = gameMetaDescription(
      {
        id: 3498,
        name: "Grand Theft Auto V",
        released: "2013-09-17",
        genres: ["Action", "Adventure"],
        platforms: ["PC", "PlayStation", "Xbox"],
        metacritic: 92,
        playtime: 32,
        collectionTitle: "На один вечер",
      },
      false,
    );
    assert.match(text, /Платформы:/);
    assert.match(text, /^Grand Theft Auto V \(2013\)/);
    assert.equal(text.includes("Grand Theft Auto V is"), false);
    assert.match(text, /В подборке «На один вечер»/);
  });

  it("appends the id only when two games share a sentence", () => {
    const rows = [
      { id: 1, description: "Same." },
      { id: 2, description: "Same." },
      { id: 3, description: "Unique." },
    ];
    assert.deepEqual(disambiguateDescriptions(rows), ["Same. #1", "Same. #2", "Unique."]);
  });
});
