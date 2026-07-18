import { describe, expect, it } from "vitest";

import {
  BRANCH_REFINEMENT_CONSTRAINT,
  BranchRefinementRequestSchema,
  buildBranchRefinementResearchRequest,
  validateBranchRefinementResult,
} from "@/lib/branch-refinement";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  AUDIT_CIIT_AFFORDABILITY_NODE,
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
} from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

const selectedBranch = DEMO_PATH_BRANCHES[0];

function refinementRequest() {
  return {
    profile: VALID_PROFILE_FIXTURE,
    branch: selectedBranch,
    constraint: BRANCH_REFINEMENT_CONSTRAINT,
    originalResearch: {
      branchId: selectedBranch.id,
      question: DEMO_RESEARCH_QUESTION,
      nodes: DEMO_RESEARCH_NODES,
    },
  } as const;
}

describe("fixed branch refinement boundary", () => {
  it("maps the validated fixed action onto the unchanged research request", () => {
    const input = refinementRequest();
    const profileSnapshot = structuredClone(input.profile);
    const branchSnapshot = structuredClone(input.branch);
    const originalSnapshot = structuredClone(input.originalResearch);

    expect(BranchRefinementRequestSchema.parse(input)).toBeDefined();
    expect(buildBranchRefinementResearchRequest(input)).toEqual({
      profile: input.profile,
      branch: input.branch,
      question: BRANCH_REFINEMENT_CONSTRAINT,
    });
    expect(input.profile).toEqual(profileSnapshot);
    expect(input.branch).toEqual(branchSnapshot);
    expect(input.originalResearch).toEqual(originalSnapshot);
  });

  it("rejects a snapshot or result attached to another branch", () => {
    const input = refinementRequest();

    expect(() =>
      BranchRefinementRequestSchema.parse({
        ...input,
        originalResearch: {
          ...input.originalResearch,
          branchId: DEMO_PATH_BRANCHES[1].id,
        },
      }),
    ).toThrow("selected branch");

    expect(() =>
      validateBranchRefinementResult({
        branchId: selectedBranch.id,
        constraint: BRANCH_REFINEMENT_CONSTRAINT,
        nodes: [
          {
            ...AUDIT_CIIT_AFFORDABILITY_NODE,
            parentBranchId: DEMO_PATH_BRANCHES[1].id,
          },
        ],
      }),
    ).toThrow("selected branch");
  });

  it("accepts no other constraint and no result larger than five nodes", () => {
    const input = refinementRequest();

    expect(() =>
      BranchRefinementRequestSchema.parse({
        ...input,
        constraint: "Show more local options",
      }),
    ).toThrow();

    expect(() =>
      validateBranchRefinementResult({
        branchId: selectedBranch.id,
        constraint: BRANCH_REFINEMENT_CONSTRAINT,
        nodes: Array.from({ length: 6 }, (_, index) => ({
          ...AUDIT_CIIT_AFFORDABILITY_NODE,
          id: `refined-${index}`,
        })),
      }),
    ).toThrow();
  });
});
