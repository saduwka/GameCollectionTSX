import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { track } from "../src/services/analytics/track";

describe("track", () => {
  afterEach(() => {
    delete (globalThis as { gtag?: unknown }).gtag;
  });

  it("stays silent when gtag is missing", () => {
    assert.doesNotThrow(() => track("ticket_copy", { game_id: 1 }));
  });

  it("sends an event name and params", () => {
    const calls: unknown[][] = [];
    (globalThis as { gtag?: (...args: unknown[]) => void }).gtag = (...args) => {
      calls.push(args);
    };
    track("ticket_copy", { game_id: 1, unused: undefined });
    assert.deepEqual(calls, [["event", "ticket_copy", { game_id: 1 }]]);
  });
});
