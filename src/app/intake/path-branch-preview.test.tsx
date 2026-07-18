import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import { BranchRefinementPanel } from "@/app/intake/branch-refinement";
import {
  DESKTOP_ROLE_SLOTS,
  InitialPathMap,
  desktopRoleSlot,
  rolePillWidthClass,
} from "@/app/intake/path-branch-preview";
import { ResearchComposer } from "@/app/intake/path-research";
import { ResearchExpansion } from "@/app/intake/research-expansion";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  AUDIT_AFFORDABILITY_QUESTION,
  AUDIT_CIIT_AFFORDABILITY_NODE,
  AUDIT_FIGMA_PROTOTYPING_NODE,
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
} from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";
import { BRANCH_REFINEMENT_CONSTRAINT } from "@/lib/branch-refinement";

describe("initial path map markup", () => {
  it("renders every role as one desktop and one mobile title-only pill", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup.match(/data-role-surface="desktop"/g)).toHaveLength(7);
    expect(markup.match(/data-role-surface="mobile"/g)).toHaveLength(7);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(14);
    expect(markup.match(/<button[^>]*type="button"/g)).toHaveLength(14);
    for (const branch of DEMO_PATH_BRANCHES) {
      expect(markup.match(new RegExp(branch.title, "g"))).toHaveLength(4);
      expect(markup).not.toContain(branch.summary);
      expect(markup).not.toContain(branch.whyItAppeared[0]);
      expect(markup).not.toContain(branch.drawbacks[0]);
    }
    expect(markup).not.toContain("Strongest current fit");
    expect(markup).not.toContain("Adjacent possibility");
    expect(markup).not.toContain("Underexplored possibility");
    expect(markup).not.toContain("data-path-detail=");
  });

  it("uses a deterministic floating desktop composition and complete mobile list", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(DESKTOP_ROLE_SLOTS).toHaveLength(8);
    DEMO_PATH_BRANCHES.forEach((branch, index) => {
      expect(markup).toContain(`data-role-pill="${branch.id}"`);
      expect(markup).toContain(`data-role-slot="${index}"`);
      expect(markup).toContain(desktopRoleSlot(index));
    });
    expect(markup).toContain('data-mobile-fallback="role-list"');
    expect(markup).toContain('data-role-overview="desktop"');
    expect(markup).toContain('data-role-overview="mobile"');
    expect(markup).toContain("lg:grid");
    expect(markup).toContain("lg:hidden");
    expect(markup).toContain("press Enter or Space");
    expect(markup).not.toContain("data-path-edge=");
    expect(markup).not.toContain("data-path-graph=");
  });

  it("varies pill width by title length and wraps long titles safely", () => {
    const longTitleBranches = structuredClone(DEMO_PATH_BRANCHES);
    longTitleBranches[0].title =
      "Human-centered artificial intelligence product and experience designer";
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={longTitleBranches}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(rolePillWidthClass("Archivist")).toBe("w-[12rem]");
    expect(rolePillWidthClass("Science communication producer")).toBe(
      "w-[15.5rem]",
    );
    expect(rolePillWidthClass(longTitleBranches[0].title)).toBe("w-[19rem]");
    expect(markup).toContain(longTitleBranches[0].title);
    expect(markup).toContain("[overflow-wrap:anywhere]");
    expect(markup).toContain("max-w-full");
  });

  it("renders full details for only the selected branch", () => {
    const selected = DEMO_PATH_BRANCHES[0];
    const markup = renderToStaticMarkup(
      <PathDetailPanel
        branch={selected}
        evidence={profileEvidence(VALID_PROFILE_FIXTURE)}
        onClear={() => undefined}
      />,
    );

    expect(markup).toContain(`data-path-detail="${selected.id}"`);
    expect(markup).toContain(selected.title);
    expect(markup).toContain("What this role is");
    expect(markup).toContain(selected.summary);
    expect(markup).toContain("Why it may fit you");
    expect(markup).toContain(selected.whyItAppeared[0]);
    expect(markup).toContain("Why it may not fit you");
    expect(markup).toContain(selected.drawbacks[0]);
    expect(markup).toContain("What the day-to-day can feel like");
    expect(markup).toContain(selected.dayToDay[0]);
    expect(markup).toContain("Try it before committing");
    expect(markup).toContain(selected.lowRiskExploration);
    expect(markup).toContain(selected.unresolvedQuestions[0]);
    expect(markup).toContain("See what Steppi connected from your profile");
    expect(markup).toContain("Student fact");
    expect(markup).toContain("Steppi inference");
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[1].title);
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[2].title);
  });

  it("uses neutral selected-role framing without ranked-like metadata", () => {
    const role = DEMO_PATH_BRANCHES[2];
    const markup = renderToStaticMarkup(
      <PathDetailPanel
        branch={role}
        evidence={profileEvidence(VALID_PROFILE_FIXTURE)}
        onClear={() => undefined}
      />,
    );

    expect(markup).toContain("Career possibility");
    expect(markup).not.toContain("Strongest current fit");
    expect(markup).not.toContain("Adjacent possibility");
    expect(markup).not.toContain("Underexplored possibility");
    expect(markup.toLowerCase()).not.toContain("confidence");
  });

  it("keeps a long compound role title within the responsive header contract", () => {
    const longTitleBranch = {
      ...DEMO_PATH_BRANCHES[1],
      title: "Human-centered artificial intelligence product and experience designer",
    };
    const markup = renderToStaticMarkup(
      <PathDetailPanel
        branch={longTitleBranch}
        evidence={profileEvidence(VALID_PROFILE_FIXTURE)}
        onClear={() => undefined}
      />,
    );

    expect(markup).toContain(longTitleBranch.title);
    expect(markup).toContain("overflow-wrap:anywhere");
    expect(markup).toContain("Back to all paths");
  });

  it("offers three suggested questions and a branch-labeled free-text input", () => {
    const markup = renderToStaticMarkup(
      <ResearchComposer
        branch={DEMO_PATH_BRANCHES[0]}
        fieldError={null}
        onCancel={() => undefined}
        onQuestionChange={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        question=""
        request={{ status: "idle" }}
      />,
    );

    expect(markup.match(/type="button"/g)).toHaveLength(3);
    expect(markup).toContain(`Question about ${DEMO_PATH_BRANCHES[0].title}`);
    expect(markup).toContain("What could I study for");
    expect(markup).toContain("How much coding or technical work");
    expect(markup).toContain("How can I try this before committing");
  });

  it("renders sourced research only beneath its parent branch", () => {
    const markup = renderToStaticMarkup(
      <ResearchExpansion
        branch={DEMO_PATH_BRANCHES[0]}
        nodes={DEMO_RESEARCH_NODES}
        question={DEMO_RESEARCH_QUESTION}
      />,
    );

    expect(markup).toContain(`data-research-branch="${DEMO_PATH_BRANCHES[0].id}"`);
    expect(markup.match(/data-research-node=/g)).toHaveLength(3);
    expect(markup).toContain(DEMO_RESEARCH_NODES[0].sources[0].title);
    expect(markup).toContain(DEMO_RESEARCH_NODES[0].sources[0].url);
    expect(markup).toContain("checked 2026-07-16");
    expect(markup).toContain("Cited factual claims");
    expect(markup).toContain("Steppi connection · not a sourced fact");
    expect(markup.match(/data-research-claim=/g)).toHaveLength(6);
    expect(markup.match(/data-claim-source-url=/g)).toHaveLength(6);
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[1].id);
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[2].id);
  });

  it("renders a validated partial result without restoring an omitted node", () => {
    const partialNodes = [DEMO_RESEARCH_NODES[0], DEMO_RESEARCH_NODES[2]];
    const markup = renderToStaticMarkup(
      <ResearchExpansion
        branch={DEMO_PATH_BRANCHES[0]}
        nodes={partialNodes}
        question={DEMO_RESEARCH_QUESTION}
      />,
    );

    expect(markup.match(/data-research-node=/g)).toHaveLength(2);
    expect(markup).toContain(DEMO_RESEARCH_NODES[0].title);
    expect(markup).toContain(DEMO_RESEARCH_NODES[2].title);
    expect(markup).not.toContain(DEMO_RESEARCH_NODES[1].title);
  });

  it("renders audited affordability facts beside their exact source references", () => {
    const markup = renderToStaticMarkup(
      <ResearchExpansion
        branch={DEMO_PATH_BRANCHES[0]}
        nodes={[AUDIT_CIIT_AFFORDABILITY_NODE]}
        question={AUDIT_AFFORDABILITY_QUESTION}
      />,
    );

    expect(markup).toContain("PHP 135,000–165,000");
    expect(markup).toContain("Quezon City campus");
    expect(markup).toContain("Manila-residency discount");
    expect(markup).toContain("Scholarships");
    expect(markup).toContain("aid is not guaranteed");
    expect(markup).toContain("Cost");
    expect(markup).toContain("Eligibility");
    expect(markup).toContain("Conditional aid");
    for (const claim of AUDIT_CIIT_AFFORDABILITY_NODE.claims) {
      expect(markup).toContain(`data-research-claim="${claim.id}"`);
      for (const url of claim.sourceUrls) {
        expect(markup).toContain(`data-claim-source-url="${url}"`);
      }
    }
  });

  it("renders the audited Figma capabilities as separate sourced claims without the unsupported qualifier", () => {
    const markup = renderToStaticMarkup(
      <ResearchExpansion
        branch={DEMO_PATH_BRANCHES[0]}
        nodes={[AUDIT_FIGMA_PROTOTYPING_NODE]}
        question={DEMO_RESEARCH_QUESTION}
      />,
    );

    expect(markup).toContain("Figma supports creating interface mockups.");
    expect(markup).toContain("Figma supports creating interactive prototypes.");
    expect(markup).toContain("Medium source confidence");
    expect(markup.match(/data-research-claim=/g)).toHaveLength(3);
    expect(markup).not.toMatch(/without writing code/i);
  });

  it("states when a complete affordability answer is unavailable", () => {
    const markup = renderToStaticMarkup(
      <ResearchComposer
        branch={DEMO_PATH_BRANCHES[0]}
        fieldError={null}
        onCancel={() => undefined}
        onQuestionChange={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        question={AUDIT_AFFORDABILITY_QUESTION}
        request={{
          status: "no_useful_sources",
          branchId: DEMO_PATH_BRANCHES[0].id,
          question: AUDIT_AFFORDABILITY_QUESTION,
        }}
      />,
    );

    expect(markup).toContain("Affordability information is unavailable");
    expect(markup).toContain("cost, eligibility, and conditional-aid details");
    expect(markup).toContain("did not label an option affordable");
  });

  it("offers only the fixed refinement action after successful research", () => {
    const markup = renderToStaticMarkup(
      <BranchRefinementPanel
        branch={DEMO_PATH_BRANCHES[0]}
        onCancel={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        originalFindingCount={DEMO_RESEARCH_NODES.length}
        state={{ status: "idle" }}
      />,
    );

    expect(markup).toContain(BRANCH_REFINEMENT_CONSTRAINT);
    expect(markup).toContain("One practical refinement");
    expect(markup).toContain('data-original-research-count="3"');
    expect(markup).not.toContain("textarea");
  });

  it("explains a successful selected-branch-only refinement", () => {
    const markup = renderToStaticMarkup(
      <BranchRefinementPanel
        branch={DEMO_PATH_BRANCHES[0]}
        onCancel={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        originalFindingCount={DEMO_RESEARCH_NODES.length}
        state={{
          status: "success",
          branchId: DEMO_PATH_BRANCHES[0].id,
          question: BRANCH_REFINEMENT_CONSTRAINT,
          nodes: [AUDIT_CIIT_AFFORDABILITY_NODE],
        }}
      />,
    );

    expect(markup).toContain("What changed");
    expect(markup).toContain("Why");
    expect(markup).toContain("What stayed the same");
    expect(markup).toContain("complete starting role set");
    expect(markup).toContain("3 original findings");
  });

  it.each([
    {
      label: "no useful source",
      state: {
        status: "no_useful_sources" as const,
        branchId: DEMO_PATH_BRANCHES[0].id,
        question: BRANCH_REFINEMENT_CONSTRAINT,
      },
      copy: "Your original findings are still here",
    },
    {
      label: "provider failure",
      state: {
        status: "error" as const,
        branchId: DEMO_PATH_BRANCHES[0].id,
        question: BRANCH_REFINEMENT_CONSTRAINT,
        code: "api_failure",
        message: "Steppi could not finish this research right now.",
        retryable: true,
      },
      copy: "original source-backed findings remain visible",
    },
  ])("preserves the prior result copy after $label", ({ copy, state }) => {
    const markup = renderToStaticMarkup(
      <BranchRefinementPanel
        branch={DEMO_PATH_BRANCHES[0]}
        onCancel={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        originalFindingCount={DEMO_RESEARCH_NODES.length}
        state={state}
      />,
    );

    expect(markup).toContain(copy);
  });
});
