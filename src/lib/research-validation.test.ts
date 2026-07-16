import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
  DEMO_RETRIEVED_SOURCE_URLS,
} from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  validateResearchContext,
  validateResearchGeneration,
} from "./research-validation";

describe("research validation", () => {
  it("accepts sourced nodes attached to the selected branch", () => {
    expect(
      validateResearchContext(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
      ).question,
    ).toBe(DEMO_RESEARCH_QUESTION);
    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ).nodes,
    ).toHaveLength(3);
  });

  it("rejects a source that was not retrieved", () => {
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS.slice(1),
        "2026-07-16",
      ),
    ).toThrow("not retrieved");
  });

  it("rejects the wrong branch, stale check date, and duplicate node IDs", () => {
    const wrongBranch = structuredClone(DEMO_RESEARCH_NODES);
    wrongBranch[0].parentBranchId = DEMO_PATH_BRANCHES[1].id;
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        { status: "success", nodes: wrongBranch },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("wrong branch");

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-17",
      ),
    ).toThrow("freshness");

    const duplicate = structuredClone(DEMO_RESEARCH_NODES);
    duplicate[1].id = duplicate[0].id;
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        { status: "success", nodes: duplicate },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("unique IDs");
  });
});
