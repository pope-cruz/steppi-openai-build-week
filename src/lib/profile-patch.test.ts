import { describe, expect, it } from "vitest";

import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  applyProfilePatch,
  ProfilePatchApplicationError,
  profilePatchHasChanges,
} from "./profile-patch";

describe("profile patch application", () => {
  it("removes one inference and preserves every unrelated profile field", () => {
    const original = structuredClone(VALID_PROFILE_FIXTURE);
    const snapshot = structuredClone(original);
    const result = applyProfilePatch(original, {
      removeInferenceIds: ["inference-collaboration"],
    });

    expect(result.inferences.map((item) => item.id)).toEqual([
      "inference-visual-thinking",
    ]);
    expect(result.inferences[0]).toEqual(snapshot.inferences[1]);
    expect(result.facts).toEqual(snapshot.facts);
    expect(result.constraints).toEqual(snapshot.constraints);
    expect(result.uncertainties).toEqual(snapshot.uncertainties);
    expect(result.tensions).toEqual(snapshot.tensions);
    expect(original).toEqual(snapshot);
    expect(result).not.toBe(original);
  });

  it("replaces only the targeted inference statement", () => {
    const result = applyProfilePatch(VALID_PROFILE_FIXTURE, {
      replaceStatements: [
        {
          targetId: "inference-collaboration",
          newStatement: "Creative team projects may be worth exploring.",
        },
      ],
    });

    expect(result.inferences[0]).toEqual({
      ...VALID_PROFILE_FIXTURE.inferences[0],
      statement: "Creative team projects may be worth exploring.",
    });
    expect(result.inferences[1]).toEqual(VALID_PROFILE_FIXTURE.inferences[1]);
  });

  it("adds one validated constraint without changing existing constraints", () => {
    const result = applyProfilePatch(VALID_PROFILE_FIXTURE, {
      addConstraints: [
        {
          id: "constraint-family-schedule",
          type: "family",
          statement: "Needs time each week for family responsibilities.",
          priority: "high",
        },
      ],
    });

    expect(result.constraints).toHaveLength(2);
    expect(result.constraints[0]).toEqual(VALID_PROFILE_FIXTURE.constraints[0]);
    expect(result.constraints[1].statement).toContain("family responsibilities");
  });

  it("rejects empty replacements, empty constraints, and invalid targets", () => {
    expect(() =>
      applyProfilePatch(VALID_PROFILE_FIXTURE, {
        replaceStatements: [
          { targetId: "inference-collaboration", newStatement: " " },
        ],
      }),
    ).toThrow();
    expect(() =>
      applyProfilePatch(VALID_PROFILE_FIXTURE, {
        addConstraints: [
          {
            id: "constraint-empty",
            type: "other",
            statement: " ",
            priority: "medium",
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      applyProfilePatch(VALID_PROFILE_FIXTURE, {
        removeInferenceIds: ["inference-missing"],
      }),
    ).toThrow(ProfilePatchApplicationError);
  });

  it("rejects conflicting operations and duplicate added IDs", () => {
    expect(() =>
      applyProfilePatch(VALID_PROFILE_FIXTURE, {
        removeInferenceIds: ["inference-collaboration"],
        replaceStatements: [
          {
            targetId: "inference-collaboration",
            newStatement: "A conflicting replacement.",
          },
        ],
      }),
    ).toThrow(ProfilePatchApplicationError);
    expect(() =>
      applyProfilePatch(VALID_PROFILE_FIXTURE, {
        addConstraints: [
          {
            id: "constraint-location",
            type: "geographic",
            statement: "An existing ID must not be reused.",
            priority: "medium",
          },
        ],
      }),
    ).toThrow(ProfilePatchApplicationError);
  });

  it("supports exact cancel, undo, and reset by retaining the original source", () => {
    const original = VALID_PROFILE_FIXTURE;
    const pending = applyProfilePatch(original, {
      removeInferenceIds: ["inference-collaboration"],
    });
    const cancelled = original;
    const reset = original;

    expect(pending).not.toEqual(original);
    expect(cancelled).toBe(original);
    expect(reset).toBe(original);
    expect(profilePatchHasChanges(null)).toBe(false);
    expect(
      profilePatchHasChanges({
        removeInferenceIds: ["inference-collaboration"],
      }),
    ).toBe(true);
  });
});
