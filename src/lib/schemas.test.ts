import { describe, expect, it } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "./demo-intake";
import {
  IntakeRequestSchema,
  PathGenerationSchema,
  ProfilePatchSchema,
  ResearchGenerationSchema,
  ResearchRequestSchema,
  StudentProfileSchema,
} from "./schemas";
import { VALID_PROFILE_FIXTURE } from "../test/profile-fixture";
import { VALID_PROFILE_PATCH_FIXTURE } from "../test/profile-patch-fixture";
import { DEMO_PATH_BRANCHES } from "./demo-paths";
import {
  AUDIT_CIIT_AFFORDABILITY_NODE,
  AUDIT_FIGMA_PROTOTYPING_NODE,
  AUDIT_UP_VISUAL_COMMUNICATION_NODE,
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
} from "./demo-research";

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

  it("accepts strict research requests and one-to-five sourced nodes", () => {
    expect(
      ResearchRequestSchema.safeParse({
        profile: VALID_PROFILE_FIXTURE,
        branch: DEMO_PATH_BRANCHES[0],
        question: DEMO_RESEARCH_QUESTION,
      }).success,
    ).toBe(true);
    expect(
      ResearchGenerationSchema.safeParse({
        status: "success",
        nodes: DEMO_RESEARCH_NODES,
      }).success,
    ).toBe(true);

    const withoutPublisher = structuredClone(DEMO_RESEARCH_NODES);
    withoutPublisher[0].sources[0].publisher = null;
    expect(
      ResearchGenerationSchema.safeParse({
        status: "success",
        nodes: withoutPublisher,
      }).success,
    ).toBe(true);
  });

  it("rejects empty success, unsupported source protocols, and excess nodes", () => {
    const insecure = structuredClone(DEMO_RESEARCH_NODES);
    insecure[0].sources[0].url = "http://example.com/source";

    expect(
      ResearchGenerationSchema.safeParse({ status: "success", nodes: [] }).success,
    ).toBe(false);
    expect(
      ResearchGenerationSchema.safeParse({ status: "success", nodes: insecure }).success,
    ).toBe(false);
    expect(
      ResearchGenerationSchema.safeParse({
        status: "success",
        nodes: Array.from({ length: 6 }, (_, index) => ({
          ...DEMO_RESEARCH_NODES[0],
          id: `research-${index}`,
        })),
      }).success,
    ).toBe(false);
  });

  it("requires explicit source relationships for titles, claims, and limitations", () => {
    const missingClaimSource = structuredClone(DEMO_RESEARCH_NODES);
    missingClaimSource[0].claims[0].sourceUrls = [];
    const detachedClaimSource = structuredClone(DEMO_RESEARCH_NODES);
    detachedClaimSource[0].claims[0].sourceUrls = [
      detachedClaimSource[1].sources[0].url,
    ];
    const missingLimitation = structuredClone(DEMO_RESEARCH_NODES);
    missingLimitation[0].claims = missingLimitation[0].claims.filter(
      (claim) => claim.kind !== "limitation",
    );

    for (const nodes of [missingClaimSource, detachedClaimSource, missingLimitation]) {
      expect(
        ResearchGenerationSchema.safeParse({ status: "success", nodes }).success,
      ).toBe(false);
    }
  });

  it("accepts the audit regression fixtures with explicit factual claims", () => {
    expect(
      ResearchGenerationSchema.safeParse({
        status: "success",
        nodes: [
          AUDIT_UP_VISUAL_COMMUNICATION_NODE,
          AUDIT_CIIT_AFFORDABILITY_NODE,
          AUDIT_FIGMA_PROTOTYPING_NODE,
        ],
      }).success,
    ).toBe(true);
    expect(
      AUDIT_CIIT_AFFORDABILITY_NODE.claims.find((claim) => claim.kind === "cost")
        ?.statement,
    ).toContain("PHP 135,000–165,000");
    expect(
      AUDIT_CIIT_AFFORDABILITY_NODE.claims.find(
        (claim) => claim.kind === "conditional-aid",
      )?.statement,
    ).toMatch(/conditional|not guaranteed/i);
    expect(
      AUDIT_FIGMA_PROTOTYPING_NODE.claims.map((claim) => claim.statement),
    ).toEqual([
      "Figma supports creating interface mockups.",
      "Figma supports creating interactive prototypes.",
      "Access to Figma's education plan depends on meeting its eligibility requirements.",
    ]);
    expect(
      AUDIT_FIGMA_PROTOTYPING_NODE.claims
        .map((claim) => claim.statement)
        .join(" "),
    ).not.toMatch(/without writing code/i);
  });

  it("accepts only an empty no-useful-source result", () => {
    expect(
      ResearchGenerationSchema.safeParse({
        status: "no_useful_sources",
        nodes: [],
      }).success,
    ).toBe(true);
    expect(
      ResearchGenerationSchema.safeParse({
        status: "no_useful_sources",
        nodes: DEMO_RESEARCH_NODES,
      }).success,
    ).toBe(false);
  });
});
