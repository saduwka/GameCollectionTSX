import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const profile = (isPublic: boolean) => ({
  displayName: "Ada",
  photoURL: "",
  isPublic,
});

describe("firestore rules", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "gamecollection-ff71a",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("hides settings and closed collections from guests", async () => {
    await testEnv.clearFirestore();
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(setDoc(doc(alice.firestore(), "user_settings", "alice"), { my_devices: [4] }));
    await assertSucceeds(setDoc(doc(alice.firestore(), "public_profiles", "alice"), profile(false)));
    await assertSucceeds(setDoc(doc(alice.firestore(), "user_collections", "alice", "games", "1"), {
      name: "Private game",
      note: "secret",
      addedAt: 1,
    }));
    await assertSucceeds(setDoc(doc(alice.firestore(), "user_collections", "alice", "private", "1"), {
      note: "secret",
    }));

    const guest = testEnv.unauthenticatedContext();
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(guest.firestore(), "user_settings", "alice")));
    await assertFails(getDoc(doc(bob.firestore(), "user_settings", "alice")));
    await assertFails(getDoc(doc(guest.firestore(), "public_profiles", "alice")));
    await assertFails(getDoc(doc(guest.firestore(), "user_collections", "alice", "games", "1")));
    await assertFails(getDoc(doc(guest.firestore(), "user_collections", "alice", "private", "1")));
    await assertSucceeds(getDoc(doc(alice.firestore(), "user_collections", "alice", "games", "1")));
    await assertFails(setDoc(doc(bob.firestore(), "user_settings", "alice"), { my_devices: [1] }));
  });

  it("opens a public profile and its games, and rejects extra profile fields", async () => {
    await testEnv.clearFirestore();
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(setDoc(doc(alice.firestore(), "public_profiles", "alice"), {
      ...profile(true),
      steamId: "123",
    }));
    await assertSucceeds(setDoc(doc(alice.firestore(), "public_profiles", "alice"), profile(true)));
    await assertSucceeds(setDoc(doc(alice.firestore(), "user_collections", "alice", "games", "1"), {
      name: "Public game",
      addedAt: 1,
    }));

    const guest = testEnv.unauthenticatedContext();
    const bob = testEnv.authenticatedContext("bob");
    await assertSucceeds(getDoc(doc(guest.firestore(), "public_profiles", "alice")));
    await assertSucceeds(getDoc(doc(guest.firestore(), "user_collections", "alice", "games", "1")));
    await assertFails(getDocs(collection(guest.firestore(), "public_profiles")));
    await assertFails(updateDoc(doc(bob.firestore(), "public_profiles", "alice"), { isPublic: false }));
    await assertFails(updateDoc(doc(bob.firestore(), "user_collections", "alice", "games", "1"), { name: "Hijack" }));
  });

  it("treats a missing profile and a missing isPublic flag as private", async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "user_collections", "old", "games", "1"), {
        name: "Legacy",
        addedAt: 1,
      });
      await setDoc(doc(context.firestore(), "public_profiles", "flagless"), {
        displayName: "Old",
        photoURL: "",
      });
      await setDoc(doc(context.firestore(), "user_collections", "flagless", "games", "1"), {
        name: "Legacy",
        addedAt: 1,
      });
    });

    const guest = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(guest.firestore(), "public_profiles", "old")));
    await assertFails(getDoc(doc(guest.firestore(), "user_collections", "old", "games", "1")));
    await assertFails(getDoc(doc(guest.firestore(), "user_collections", "flagless", "games", "1")));
    assert.equal(true, true);
  });
});
