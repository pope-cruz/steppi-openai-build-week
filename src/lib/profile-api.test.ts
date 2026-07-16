import { describe, expect, it } from "vitest";

import { ProfileApiResponseSchema } from "@/lib/profile-api";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

describe("ProfileApiResponseSchema", () => {
  it("accepts a validated profile response", () => {
    expect(
      ProfileApiResponseSchema.safeParse({
        ok: true,
        profile: VALID_PROFILE_FIXTURE,
      }).success,
    ).toBe(true);
  });

  it("rejects a malformed profile before client rendering", () => {
    expect(
      ProfileApiResponseSchema.safeParse({
        ok: true,
        profile: { facts: [] },
      }).success,
    ).toBe(false);
  });

  it("accepts only the documented public error shape", () => {
    expect(
      ProfileApiResponseSchema.safeParse({
        ok: false,
        error: {
          code: "timeout",
          message: "Steppi took too long. Please try again.",
          retryable: true,
        },
      }).success,
    ).toBe(true);
    expect(
      ProfileApiResponseSchema.safeParse({
        ok: false,
        error: {
          code: "private_upstream_error",
          message: "raw error",
          retryable: true,
        },
      }).success,
    ).toBe(false);
  });
});
