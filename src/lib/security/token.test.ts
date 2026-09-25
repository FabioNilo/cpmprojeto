import { describe, expect, it } from "vitest";

import { createSessionToken, hashToken } from "./token";

describe("session tokens", () => {
  it("creates non-repeating opaque tokens and stable hashes", () => {
    const first = createSessionToken();
    const second = createSessionToken();

    expect(first).not.toBe(second);
    expect(hashToken(first)).toBe(hashToken(first));
    expect(hashToken(first)).not.toBe(hashToken(second));
  });
});
