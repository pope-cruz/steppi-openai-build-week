import { describe, expect, it } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "./demo-intake";
import {
  IntakeRequestSchema,
  PathGenerationSchema,
  ProfilePatchSchema,
  StudentProfileSchema,
} from "./schemas";
import { VALID_PROFILE_FIXTURE } from "../test/profile-fixture";
import { VALID_PROFILE_PATCH_FIXTURE } from "../test/profile-patch-fixture";
import { DEMO_PATH_BRANCHES } from "./demo-paths";

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

  it("accepts every supported ProfilePatch operation", () => {
    expect(ProfilePatchSchema.safeParse(VALID_PROFILE_PATCH_FIXTURE).success).toBe(
      true,
    );
  });

  it("rejects malformed and unsupported ProfilePatch operations", () => {
    expect(
      ProfilePatchSchema.safeParse({
        replaceStatements: [
          { targetId: "inference-collaboration", newStatement: "   " },
        ],
      }).success,
    ).toBe(false);
    expect(
      ProfilePatchSchema.safeParse({
        removeFactIds: ["fact-interests"],
      }).success,
    ).toBe(false);
  });

  it("accepts exactly one path branch for each required role", () => {
    expect(
      PathGenerationSchema.safeParse({ branches: DEMO_PATH_BRANCHES }).success,
    ).toBe(true);
  });

  it("rejects missing, duplicate, and extra path roles", () => {
    const duplicateRole = structuredClone(DEMO_PATH_BRANCHES);
    duplicateRole[2].kind = "adjacent";

    expect(
      PathGenerationSchema.safeParse({ branches: DEMO_PATH_BRANCHES.slice(0, 2) })
        .success,
    ).toBe(false);
    expect(PathGenerationSchema.safeParse({ branches: duplicateRole }).success).toBe(
      false,
    );
    expect(
      PathGenerationSchema.safeParse({
        branches: [...DEMO_PATH_BRANCHES, DEMO_PATH_BRANCHES[0]],
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed path branch", () => {
    const malformed = structuredClone(DEMO_PATH_BRANCHES);
    malformed[0].drawbacks = [];

    expect(PathGenerationSchema.safeParse({ branches: malformed }).success).toBe(
      false,
    );
  });
});
