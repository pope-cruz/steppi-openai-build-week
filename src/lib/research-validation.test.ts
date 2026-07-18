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

  it("omits one unmatched citation while retaining multiple valid nodes", () => {
    const partiallyInvalid = structuredClone(DEMO_RESEARCH_NODES);
    partiallyInvalid[0].claims.splice(1, 0, {
      id: "invented-citation-claim",
      kind: "fact",
      statement: "This plausible statement has no retrieved support.",
      sourceUrls: ["https://invented.example/not-retrieved"],
    });

    const result = validateResearchGeneration(
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
      { status: "success", nodes: partiallyInvalid },
      DEMO_RETRIEVED_SOURCE_URLS,
      "2026-07-16",
    );

    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.flatMap((node) => node.claims.map((claim) => claim.id)))
      .not.toContain("invented-citation-claim");
    expect(result.nodes).toEqual(DEMO_RESEARCH_NODES);
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

  it("omits wrong-branch, stale, and duplicate nodes without weakening retained nodes", () => {
    const wrongBranch = structuredClone(DEMO_RESEARCH_NODES);
    wrongBranch[0].parentBranchId = DEMO_PATH_BRANCHES[1].id;
    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: wrongBranch },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ).nodes,
    ).toEqual(DEMO_RESEARCH_NODES.slice(1));

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: DEMO_RESEARCH_NODES },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-17",
      ),
    ).toThrow("no valid source-backed nodes");

    const duplicate = structuredClone(DEMO_RESEARCH_NODES);
    duplicate[1].id = duplicate[0].id;
    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: duplicate },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ).nodes.map((node) => node.id),
    ).toEqual([DEMO_RESEARCH_NODES[0].id, DEMO_RESEARCH_NODES[2].id]);
  });

  it("omits an invalid node while valid siblings render", () => {
    const invalidNode = structuredClone(DEMO_RESEARCH_NODES);
    invalidNode[0].titleSourceUrls = [];

    const result = validateResearchGeneration(
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
      { status: "success", nodes: invalidNode },
      DEMO_RETRIEVED_SOURCE_URLS,
      "2026-07-16",
    );

    expect(result.nodes).toEqual(DEMO_RESEARCH_NODES.slice(1));
  });

  it("omits a claim with a missing citation while retaining its valid node", () => {
    const missingCitation = structuredClone(DEMO_RESEARCH_NODES);
    missingCitation[0].claims[0].sourceUrls = [];

    const result = validateResearchGeneration(
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
      { status: "success", nodes: missingCitation },
      DEMO_RETRIEVED_SOURCE_URLS,
      "2026-07-16",
    );

    expect(result.nodes).toHaveLength(3);
    expect(result.nodes[0].claims).toEqual([DEMO_RESEARCH_NODES[0].claims[1]]);
  });

  it("removes unsupported claims and unused sources before strict retained-node validation", () => {
    const unattached = structuredClone(DEMO_RESEARCH_NODES);
    unattached[0].claims[0].sourceUrls = [unattached[1].sources[0].url];

    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: unattached },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ).nodes[0].claims,
    ).toEqual([DEMO_RESEARCH_NODES[0].claims[1]]);

    const unclaimedSource = structuredClone(DEMO_RESEARCH_NODES);
    unclaimedSource[0].sources.push({
      ...unclaimedSource[1].sources[0],
      dateChecked: "2026-07-16",
    });
    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: unclaimedSource },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ).nodes,
    ).toEqual(DEMO_RESEARCH_NODES);
  });

  it("fails safely when every node has an unmatched citation", () => {
    const allInvalid = structuredClone(DEMO_RESEARCH_NODES);
    for (const node of allInvalid) {
      node.titleSourceUrls = [`https://invented.example/${node.id}`];
    }

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: allInvalid },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      ),
    ).toThrow("no valid source-backed nodes");

    try {
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { status: "success", nodes: allInvalid },
        DEMO_RETRIEVED_SOURCE_URLS,
        "2026-07-16",
      );
    } catch (error) {
      expect(error).toMatchObject({
        category: "schema_validation",
        reason: "no_valid_research_nodes",
      });
    }
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
    ).toThrow("no valid source-backed nodes");

    expect(
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { status: "success", nodes: [AUDIT_CIIT_AFFORDABILITY_NODE] },
        AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
        "2026-07-17",
      ).nodes[0].claims.map((claim) => claim.kind),
    ).toEqual([
      "cost",
      "eligibility",
      "fact",
      "conditional-aid",
      "limitation",
      "limitation",
    ]);
  });

  it("rejects an unsupported positive affordability conclusion despite complete claim kinds", () => {
    const unsupportedConclusion = structuredClone(AUDIT_CIIT_AFFORDABILITY_NODE);
    unsupportedConclusion.title = "Affordable CIIT degree option";

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { status: "success", nodes: [unsupportedConclusion] },
        AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
        "2026-07-17",
      ),
    ).toThrow("no valid source-backed nodes");
  });

  it("rejects affordability output without a sourced residency caveat", () => {
    const missingResidency = structuredClone(AUDIT_CIIT_AFFORDABILITY_NODE);
    missingResidency.claims = missingResidency.claims.filter(
      (claim) => claim.id !== "ciit-residency-limitation",
    );

    expect(() =>
      validateResearchGeneration(
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { status: "success", nodes: [missingResidency] },
        AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
        "2026-07-17",
      ),
    ).toThrow("no valid source-backed nodes");
  });

  it("keeps the audited UP fixture within the cited program-page claims", () => {
    const renderedFacts = [
      AUDIT_UP_VISUAL_COMMUNICATION_NODE.title,
      ...AUDIT_UP_VISUAL_COMMUNICATION_NODE.claims.map((claim) => claim.statement),
    ].join(" ");

    expect(renderedFacts).not.toMatch(/interface design|prototyp|portfolio preparation/i);
  });
});
