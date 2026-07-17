import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  AUDIT_AFFORDABILITY_QUESTION,
  AUDIT_CIIT_AFFORDABILITY_NODE,
  AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
  AUDIT_UP_VISUAL_COMMUNICATION_NODE,
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
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ).nodes,
    ).toHaveLength(3);
  });

  it("rejects a source that was not retrieved", () => {
    try {
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS.slice(1),
        "2026-07-16",
      );
      throw new Error("Expected source validation to fail.");
    } catch (error) {
      expect(error).toMatchObject({
        category: "source_processing",
        reason: "citation_not_retrieved",
      });
    }
  });

  it("classifies invalid retrieved URLs as source processing failures", () => {
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        ["not a url"],
        "2026-07-16",
      ),
    ).toThrow("invalid URL");

    try {
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        ["not a url"],
        "2026-07-16",
      );
    } catch (error) {
      expect(error).toMatchObject({
        category: "source_processing",
        reason: "retrieved_url_invalid",
      });
    }
  });

  it("rejects the wrong branch, stale check date, and duplicate node IDs", () => {
    const wrongBranch = structuredClone(DEMO_RESEARCH_NODES);
    wrongBranch[0].parentBranchId = DEMO_PATH_BRANCHES[1].id;
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: wrongBranch },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("wrong branch");

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
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
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: duplicate },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("unique IDs");
  });

  it("requires every title and factual claim to resolve to provider-backed node evidence", () => {
    const unattached = structuredClone(DEMO_RESEARCH_NODES);
    unattached[0].claims[0].sourceUrls = [unattached[1].sources[0].url];

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: unattached },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("schema");

    const unclaimedSource = structuredClone(DEMO_RESEARCH_NODES);
    unclaimedSource[0].sources.push({
      ...unclaimedSource[1].sources[0],
      dateChecked: "2026-07-16",
    });
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: unclaimedSource },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("not attached to a visible claim");
  });

  it("rejects incomplete affordability evidence and accepts the audited CIIT caveats", () => {
    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("cost, eligibility, and conditional-aid");

    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { status: "success", nodes: [AUDIT_CIIT_AFFORDABILITY_NODE] },
        AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
        "2026-07-17",
      ).nodes[0].claims.map((claim) => claim.kind),
    ).toEqual(["cost", "eligibility", "conditional-aid", "limitation"]);
  });

  it("keeps the audited UP fixture within the cited program-page claims", () => {
    const renderedFacts = [
      AUDIT_UP_VISUAL_COMMUNICATION_NODE.title,
      ...AUDIT_UP_VISUAL_COMMUNICATION_NODE.claims.map((claim) => claim.statement),
    ].join(" ");

    expect(renderedFacts).not.toMatch(/interface design|prototyp|portfolio preparation/i);
  });
});
