import { describe, expect, it } from "vitest";

import { BRANCH_REFINEMENT_CONSTRAINT } from "@/lib/branch-refinement";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  AUDIT_CIIT_AFFORDABILITY_NODE,
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
} from "@/lib/demo-research";
import { createPathMapState, pathMapReducer } from "@/lib/path-map-state";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  createResearchFlowState,
  isAnyResearchRequestActive,
  isResearchRequestActive,
  researchFlowReducer,
  visibleResearchForBranch,
} from "./research-flow";

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

  it("preserves the selected graph, relationships, and question for partial success", () => {
    const selectedMap = pathMapReducer(
      createPathMapState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES),
      { type: "select", branchId: DEMO_PATH_BRANCHES[0].id },
    );
    const initialResearch = createResearchFlowState(
      VALID_PROFILE_FIXTURE,
      DEMO_PATH_BRANCHES,
    );
    const partialNodes = [DEMO_RESEARCH_NODES[0], DEMO_RESEARCH_NODES[2]];
    const partial = researchFlowReducer(initialResearch, {
      type: "succeed",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      nodes: partialNodes,
    });

    expect(selectedMap.selectedBranchId).toBe(DEMO_PATH_BRANCHES[0].id);
    expect(selectedMap.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(selectedMap.branches).toBe(DEMO_PATH_BRANCHES);
    expect(selectedMap.branches).toHaveLength(3);
    expect(partial.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(partial.branches).toBe(DEMO_PATH_BRANCHES);
    expect(partial.request).toEqual({
      status: "success",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      nodes: partialNodes,
    });
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
      status: "starting",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });
    expect(retry.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(retry.branches).toBe(DEMO_PATH_BRANCHES);
  });

  it("tracks queued, in-progress, and cancelled work without changing graph data", () => {
    const initial = createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);
    const started = researchFlowReducer(initial, {
      type: "start",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });
    const queued = researchFlowReducer(started, {
      type: "pending",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      status: "queued",
    });
    const inProgress = researchFlowReducer(queued, {
      type: "pending",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      status: "in_progress",
    });
    const cancelled = researchFlowReducer(inProgress, {
      type: "cancelled",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
    });

    expect(isResearchRequestActive(started.request)).toBe(true);
    expect(isResearchRequestActive(queued.request)).toBe(true);
    expect(isResearchRequestActive(inProgress.request)).toBe(true);
    expect(isResearchRequestActive(cancelled.request)).toBe(false);
    expect(cancelled.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(cancelled.branches).toBe(DEMO_PATH_BRANCHES);
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

  it("replaces only the visible selected-branch neighborhood after refinement", () => {
    const initial = createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES);
    const baseline = researchFlowReducer(initial, {
      type: "succeed",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: DEMO_RESEARCH_QUESTION,
      nodes: DEMO_RESEARCH_NODES,
    });
    const pending = researchFlowReducer(baseline, {
      type: "refinement_pending",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: BRANCH_REFINEMENT_CONSTRAINT,
      status: "in_progress",
    });
    const refined = researchFlowReducer(pending, {
      type: "refinement_succeed",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: BRANCH_REFINEMENT_CONSTRAINT,
      nodes: [AUDIT_CIIT_AFFORDABILITY_NODE],
    });

    expect(pending.request).toBe(baseline.request);
    expect(visibleResearchForBranch(pending, DEMO_PATH_BRANCHES[0].id)?.nodes)
      .toBe(DEMO_RESEARCH_NODES);
    expect(refined.request).toBe(baseline.request);
    expect(refined.profile).toBe(VALID_PROFILE_FIXTURE);
    expect(refined.branches).toBe(DEMO_PATH_BRANCHES);
    expect(visibleResearchForBranch(refined, DEMO_PATH_BRANCHES[0].id)).toMatchObject({
      refined: true,
      nodes: [AUDIT_CIIT_AFFORDABILITY_NODE],
    });
    expect(visibleResearchForBranch(refined, DEMO_PATH_BRANCHES[1].id)).toBeNull();
  });

  it.each(["no_useful_sources", "fail"] as const)(
    "keeps the last valid result visible after refinement %s",
    (terminalState) => {
      const baseline = researchFlowReducer(
        createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES),
        {
          type: "succeed",
          branchId: DEMO_PATH_BRANCHES[0].id,
          question: DEMO_RESEARCH_QUESTION,
          nodes: DEMO_RESEARCH_NODES,
        },
      );
      const terminal = researchFlowReducer(
        baseline,
        terminalState === "fail"
          ? {
              type: "refinement_fail",
              branchId: DEMO_PATH_BRANCHES[0].id,
              question: BRANCH_REFINEMENT_CONSTRAINT,
              code: "api_failure",
              message: "The refinement could not be completed.",
              retryable: true,
            }
          : {
              type: "refinement_no_useful_sources",
              branchId: DEMO_PATH_BRANCHES[0].id,
              question: BRANCH_REFINEMENT_CONSTRAINT,
            },
      );

      expect(terminal.request).toBe(baseline.request);
      expect(visibleResearchForBranch(terminal, DEMO_PATH_BRANCHES[0].id)?.nodes)
        .toBe(DEMO_RESEARCH_NODES);
    },
  );

  it("blocks a second active request and ignores refinement for the wrong branch", () => {
    const baseline = researchFlowReducer(
      createResearchFlowState(VALID_PROFILE_FIXTURE, DEMO_PATH_BRANCHES),
      {
        type: "succeed",
        branchId: DEMO_PATH_BRANCHES[0].id,
        question: DEMO_RESEARCH_QUESTION,
        nodes: DEMO_RESEARCH_NODES,
      },
    );
    const active = researchFlowReducer(baseline, {
      type: "refinement_start",
      branchId: DEMO_PATH_BRANCHES[0].id,
      question: BRANCH_REFINEMENT_CONSTRAINT,
    });
    const wrongBranch = researchFlowReducer(active, {
      type: "refinement_succeed",
      branchId: DEMO_PATH_BRANCHES[1].id,
      question: BRANCH_REFINEMENT_CONSTRAINT,
      nodes: [AUDIT_CIIT_AFFORDABILITY_NODE],
    });

    expect(isAnyResearchRequestActive(active)).toBe(true);
    expect(wrongBranch).toBe(active);
  });
});
