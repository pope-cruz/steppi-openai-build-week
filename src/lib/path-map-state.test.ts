import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import { createPathMapState, pathMapReducer } from "./path-map-state";

describe("path map selection state", () => {
  it("starts with no branch selected and preserves all required roles", () => {
    const state = createPathMapState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);

    expect(state.selectedBranchId).toBeNull();
    expect(state.branches).toHaveLength(3);
    expect(state.branches.map((branch) => branch.kind).sort()).toEqual([
      "adjacent",
      "strongest-fit",
      "underexplored",
    ]);
  });

  it("selects, switches, and clears without mutating profile or branch data", () => {
    const profileSnapshot = structuredClone(VALID_PROFILE_FIXTURE);
    const branchSnapshot = structuredClone(DEMO_PATH_BRANCHES);
    const initial = createPathMapState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);
    const first = pathMapReducer(initial, {
      type: "select",
      branchId: DEMO_PATH_BRANCHES[0].id,
    });
    const switched = pathMapReducer(first, {
      type: "select",
      branchId: DEMO_PATH_BRANCHES[2].id,
    });
    const cleared = pathMapReducer(switched, { type: "clear" });

    expect(first.selectedBranchId).toBe(DEMO_PATH_BRANCHES[0].id);
    expect(switched.selectedBranchId).toBe(DEMO_PATH_BRANCHES[2].id);
    expect(cleared.selectedBranchId).toBeNull();
    expect(first.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(switched.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(cleared.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(first.branches).toBe(DEMO_PATH_BRANCHES);
    expect(switched.branches).toBe(DEMO_PATH_BRANCHES);
    expect(cleared.branches).toBe(DEMO_PATH_BRANCHES);
    expect(VALID_PROFILE_FIXTURE).toEqual(profileSnapshot);
    expect(DEMO_PATH_BRANCHES).toEqual(branchSnapshot);
  });

  it("ignores an unknown branch id", () => {
    const initial = createPathMapState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);

    expect(
      pathMapReducer(initial, { type: "select", branchId: "missing-branch" }),
    ).toBe(initial);
  });
});
