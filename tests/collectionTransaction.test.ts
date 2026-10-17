import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

process.env.VITE_FIREBASE_API_KEY ||= "demo-key";
process.env.VITE_FIREBASE_AUTH_DOMAIN ||= "demo.firebaseapp.com";
process.env.VITE_FIREBASE_PROJECT_ID ||= "gamecollection-ff71a";
process.env.VITE_FIREBASE_STORAGE_BUCKET ||= "demo.appspot.com";
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||= "0";
process.env.VITE_FIREBASE_APP_ID ||= "demo";

describe("addToCollectionIfMissing", () => {
  it("creates one document when two calls race and leaves it unchanged later", async () => {
    const { auth, db } = await import("../src/firebase.ts");
    const { connectAuthEmulator, signInAnonymously } = await import("firebase/auth");
    const { connectFirestoreEmulator, doc, getDoc } = await import("firebase/firestore");
    const { addToCollectionIfMissing } = await import("../src/services/collection/collectionService.ts");

    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);

    const credential = await signInAnonymously(auth);
    const uid = credential.user.uid;
    const game = {
      id: 9001,
      name: "Original",
      background_image: "",
      genres: ["Action"],
      status: "Liked" as const,
    };

    const results = await Promise.all([
      addToCollectionIfMissing(game),
      addToCollectionIfMissing({ ...game, name: "Other", status: "Wishlist" }),
    ]);
    assert.deepEqual(results.sort(), [false, true]);

    const ref = doc(db, "user_collections", uid, "games", "9001");
    const created = await getDoc(ref);
    const createdData = created.data();
    assert.ok(createdData);
    assert.equal(typeof createdData.addedAt, "number");
    assert.equal(createdData.note, undefined);

    const again = await addToCollectionIfMissing({ ...game, name: "Changed", status: "Backlog" });
    const after = (await getDoc(ref)).data();
    assert.equal(again, false);
    assert.equal(after?.name, createdData.name);
    assert.equal(after?.status, createdData.status);
    assert.equal(after?.addedAt, createdData.addedAt);
  });
});

after(async () => {
  const { app, auth, db } = await import("../src/firebase.ts");
  const { signOut } = await import("firebase/auth");
  const { terminate } = await import("firebase/firestore");
  const { deleteApp } = await import("firebase/app");
  await signOut(auth);
  await terminate(db);
  await deleteApp(app);
});
