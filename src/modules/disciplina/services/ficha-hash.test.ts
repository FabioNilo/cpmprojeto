import { describe, expect, it } from "vitest";

import { canonicalJson } from "./ficha-hash";

describe("ficha-hash canonicalJson", () => {
  it("ordena as chaves de forma estavel", () => {
    const a = canonicalJson({ b: 1, a: { d: 4, c: 3 } });
    const b = canonicalJson({ a: { c: 3, d: 4 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":4},"b":1}');
  });

  it("ignora undefined e preserva arrays", () => {
    expect(canonicalJson({ x: undefined, y: [3, 1, 2] })).toBe('{"y":[3,1,2]}');
  });
});
