import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";

import { PathApiResponseSchema } from "./path-api";

describe("PathApiResponseSchema", () => {
  it("accepts exactly three structurally valid branches", () => {
    expect(
      PathApiResponseSchema.safeParse({
        ok: true,
        branches: DEMO_PATH_BRANCHES,
      }).success,
    ).toBe(true);
  });

  it("rejects malformed successful output before client rendering", () => {
    expect(
      PathApiResponseSchema.safeParse({
        ok: true,
        branches: DEMO_PATH_BRANCHES.slice(0, 2),
      }).success,
    ).toBe(false);
  });

  it("accepts only the documented public error shape", () => {
    expect(
      PathApiResponseSchema.safeParse({
        ok: false,
        error: {
          code: "timeout",
          message: "Steppi took too long. Please try again.",
          retryable: true,
        },
      }).success,
    ).toBe(true);
    expect(
      PathApiResponseSchema.safeParse({
        ok: false,
        error: {
          code: "raw_sdk_error",
          message: "private detail",
          retryable: true,
        },
      }).success,
    ).toBe(false);
  });
});
