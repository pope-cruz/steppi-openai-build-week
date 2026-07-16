import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_RESEARCH_NODES, DEMO_RESEARCH_QUESTION } from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import { createResearchFlowState, researchFlowReducer } from "./research-flow";

describe("research flow state", () => {
  it("preserves the profile and original branches through success", () => {
    const profileSnapshot = structuredClone(VALID_PROFILE_FIXTURE);
    const branchSnapshot = structuredClone(DEMO_PATH_BRANCHES);
    const initial = createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);
    const loading = researchFlowReducer(initial, {
      type: "start",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });
    const success = researchFlowReducer(loading, {
      type: "succeed",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      nodes: DEMO_RESEARCH_NODES,
    });

    expect(success.request).toMatchObject({ status: "success", nodes: DEMO_RESEARCH_NODES });
    expect(success.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(success.branches).toBe(DEMO_PATH_BRANCHES);
    expect(VALID_PROFILE_FIXTURE).toEqual(profileSnapshot);
    expect(DEMO_PATH_BRANCHES).toEqual(branchSnapshot);
  });

  it("preserves the selected branch and question through failure and retry", () => {
    const initial = createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);
    const failed = researchFlowReducer(initial, {
      type: "fail",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      code: "retrieval_failure",
      message: "Could not retrieve sources.",
      retryable: true,
    });
    const retry = researchFlowReducer(failed, {
      type: "start",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });

    expect(failed.request).toMatchObject({
      status: "error",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });
    expect(retry.request).toEqual({
      status: "loading",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });
    expect(retry.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(retry.branches).toBe(DEMO_PATH_BRANCHES);
  });

  it("records insufficient evidence without adding nodes", () => {
    const initial = createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);
    const state = researchFlowReducer(initial, {
      type: "no_useful_sources",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });

    expect(state.request).toEqual({
      status: "no_useful_sources",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });
  });
});
