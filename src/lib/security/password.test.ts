import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password security", () => {
  it("hashes and verifies a valid password", async () => {
    const hash = await hashPassword("Admin@12345");

    await expect(verifyPassword("Admin@12345", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
