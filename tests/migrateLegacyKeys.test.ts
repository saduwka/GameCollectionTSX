import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEGACY_KEY_MAP, migrateLegacyKeys } from "../src/services/storage/migrateLegacyKeys";

class MemoryStorage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }

  clear() {
    this.data.clear();
  }
}

describe("legacy storage keys", () => {
  it("copies old values, keeps a newer key, and deletes the old ones", () => {
    const storage = new MemoryStorage();
    storage.setItem("playhub:swipes:v1", "old-swipes");
    storage.setItem("playhub:devices:v1", "old-devices");
    storage.setItem("gamevening:devices:v1", "new-devices");

    migrateLegacyKeys(storage as Storage);

    assert.equal(storage.getItem("gamevening:swipes:v1"), "old-swipes");
    assert.equal(storage.getItem("gamevening:devices:v1"), "new-devices");
    assert.equal(storage.getItem("playhub:swipes:v1"), null);
    assert.equal(storage.getItem("playhub:devices:v1"), null);

    const snapshot = Object.fromEntries(Object.values(LEGACY_KEY_MAP).map((key) => [key, storage.getItem(key)]));
    migrateLegacyKeys(storage as Storage);
    assert.deepEqual(
      Object.fromEntries(Object.values(LEGACY_KEY_MAP).map((key) => [key, storage.getItem(key)])),
      snapshot,
    );
  });
});
