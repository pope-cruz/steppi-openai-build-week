import { describe, expect, it } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "./demo-intake";
import { IntakeRequestSchema, StudentProfileSchema } from "./schemas";
import { VALID_PROFILE_FIXTURE } from "../test/profile-fixture";

describe("Steppi schemas", () => {
  it("accepts the representative intake fixture", () => {
    expect(IntakeRequestSchema.safeParse({ answers: DEMO_INTAKE_ANSWERS }).success).toBe(true);
  });

  it("rejects empty intake answers", () => {
    expect(IntakeRequestSchema.safeParse({ answers: [] }).success).toBe(false);
  });

  it("accepts a complete student profile", () => {
    expect(StudentProfileSchema.safeParse(VALID_PROFILE_FIXTURE).success).toBe(true);
  });

  it("rejects a profile that blurs facts and inferences by omitting fact sources", () => {
    const invalidProfile = structuredClone(VALID_PROFILE_FIXTURE);
    invalidProfile.facts[0].sourceAnswerIds = [];

    expect(StudentProfileSchema.safeParse(invalidProfile).success).toBe(false);
  });
});
