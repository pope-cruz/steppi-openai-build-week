import { describe, expect, it } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "./demo-intake";
import {
  ConfirmationSummarySchema,
  ConfirmedSummarySchema,
  IntakeRequestSchema,
  PathGenerationSchema,
  ProfilePatchSchema,
  StudentProfileSchema,
} from "./schemas";
import { DEMO_CONFIRMATION_SUMMARY } from "./demo-profile";
import { VALID_PROFILE_FIXTURE } from "../test/profile-fixture";
import { VALID_PROFILE_PATCH_FIXTURE } from "../test/profile-patch-fixture";
import { DEMO_PATH_BRANCHES, DEMO_PATH_BRANCHES_MAX } from "./demo-paths";

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

  it("accepts only an initial two-sentence summary that addresses the student", () => {
    expect(ConfirmationSummarySchema.safeParse(DEMO_CONFIRMATION_SUMMARY).success).toBe(
      true,
    );
    expect(
      ConfirmationSummarySchema.safeParse("You enjoy visual work.").success,
    ).toBe(false);
    expect(
      ConfirmationSummarySchema.safeParse(
        "The student enjoys visual work. Creative collaboration matters.",
      ).success,
    ).toBe(false);
    expect(
      ConfirmationSummarySchema.safeParse(
        "You enjoy visual work. You want creative collaboration. You prefer Manila.",
      ).success,
    ).toBe(false);
  });

  it("lets a student-approved refinement override the two-sentence format", () => {
    expect(
      ConfirmedSummarySchema.safeParse(
        "Actually, I am open to programming now. Please also consider community work. Affordability matters most.",
      ).success,
    ).toBe(true);
    expect(ConfirmedSummarySchema.safeParse("   ").success).toBe(false);
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

  it("accepts twelve, thirteen, and fifteen complete unranked roles", () => {
    expect(
      PathGenerationSchema.safeParse({ branches: DEMO_PATH_BRANCHES.slice(0, 12) })
        .success,
    ).toBe(true);
    expect(
      PathGenerationSchema.safeParse({ branches: DEMO_PATH_BRANCHES }).success,
    ).toBe(true);
    expect(
      PathGenerationSchema.safeParse({
        branches: DEMO_PATH_BRANCHES_MAX,
      }).success,
    ).toBe(true);
  });

  it("rejects fewer than twelve, more than fifteen, and ranked-like role fields", () => {
    const sixteenthRole = {
      ...structuredClone(DEMO_PATH_BRANCHES[0]),
      id: "role-public-information-designer",
      title: "Public information designer",
    };
    const legacyRankedRole = {
      ...structuredClone(DEMO_PATH_BRANCHES[0]),
      kind: "strongest-fit",
      confidence: "high",
    };

    expect(
      PathGenerationSchema.safeParse({ branches: DEMO_PATH_BRANCHES.slice(0, 11) })
        .success,
    ).toBe(false);
    expect(
      PathGenerationSchema.safeParse({
        branches: [...DEMO_PATH_BRANCHES_MAX, sixteenthRole],
      }).success,
    ).toBe(false);
    expect(
      PathGenerationSchema.safeParse({
        branches: [legacyRankedRole, ...DEMO_PATH_BRANCHES.slice(1)],
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

  it("enforces the concise selected-role explanation contract", () => {
    const tooManyFitSentences = structuredClone(DEMO_PATH_BRANCHES);
    tooManyFitSentences[0].whyItAppeared = [
      "The student enjoys visual problem-solving.",
      "They are curious about digital products.",
      "They also enjoy presenting ideas.",
    ];
    const tooLittleDayToDay = structuredClone(DEMO_PATH_BRANCHES);
    tooLittleDayToDay[0].dayToDay = ["A designer sketches possible screens."];
    const multiSentenceSummary = structuredClone(DEMO_PATH_BRANCHES);
    multiSentenceSummary[0].summary =
      "Designers shape digital experiences. They work with product teams.";
    const missingExploration = structuredClone(DEMO_PATH_BRANCHES);
    for (const branch of missingExploration) {
      Reflect.deleteProperty(branch, "lowRiskExploration");
    }

    expect(
      PathGenerationSchema.safeParse({ branches: tooManyFitSentences }).success,
    ).toBe(false);
    expect(
      PathGenerationSchema.safeParse({ branches: tooLittleDayToDay }).success,
    ).toBe(false);
    expect(
      PathGenerationSchema.safeParse({ branches: multiSentenceSummary }).success,
    ).toBe(false);
    expect(
      PathGenerationSchema.safeParse({ branches: missingExploration }).success,
    ).toBe(false);
  });

});
