import { describe, expect, it } from "vitest";
import { cleanParams } from "./params";

describe("cleanParams", () => {
  it("drops undefined, null and empty strings", () => {
    expect(cleanParams({ a: 1, b: undefined, c: null, d: "", e: "x" })).toEqual({ a: 1, e: "x" });
  });
  it("keeps falsy-but-meaningful values (0, false)", () => {
    expect(cleanParams({ page: 0, active: false })).toEqual({ page: 0, active: false });
  });
  it("returns an empty object when nothing is set", () => {
    expect(cleanParams({ a: undefined })).toEqual({});
  });
});
