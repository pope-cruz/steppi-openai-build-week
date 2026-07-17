import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import { InitialPathMap } from "@/app/intake/path-branch-preview";
import { ResearchComposer } from "@/app/intake/path-research";
import { ResearchExpansion } from "@/app/intake/research-expansion";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  AUDIT_AFFORDABILITY_QUESTION,
  AUDIT_CIIT_AFFORDABILITY_NODE,
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
} from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

describe("initial path map markup", () => {
  it("renders one student node, three graph controls, three browse controls, and no initial detail", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup.match(/data-path-node="student"/g)).toHaveLength(1);
    expect(markup.match(/data-path-node="branch"/g)).toHaveLength(3);
    expect(markup.match(/data-path-edge=/g)).toHaveLength(3);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(6);
    expect(markup.match(/<button[^>]*type="button"/g)).toHaveLength(6);
    expect(markup).not.toContain("data-path-detail=");
  });

  it("preserves every required branch role and adds the mobile path-list fallback", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup).toContain('data-path-role="strongest-fit"');
    expect(markup).toContain('data-path-role="adjacent"');
    expect(markup).toContain('data-path-role="underexplored"');
    expect(markup.match(/data-path-browser-item=/g)).toHaveLength(3);
    expect(markup).toContain('data-mobile-fallback="path-list"');
    expect(markup).toContain('data-path-graph="primary"');
    expect(markup).toContain("Browse your directions");
    expect(markup).toContain('data-relationship-count="3"');
    expect(markup).toContain("press Enter or Space");
  });

  it("uses existing concise path data in the browseable index", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    for (const branch of DEMO_PATH_BRANCHES) {
      expect(markup).toContain(`data-path-browser-item="${branch.kind}"`);
      expect(markup).toContain(branch.title);
      expect(markup).toContain(branch.summary);
    }
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(6);
    expect(markup).not.toContain("data-path-detail=");
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
    expect(markup).toContain(selected.whyItAppeared[0]);
    expect(markup).toContain(selected.drawbacks[0]);
    expect(markup).toContain(selected.unresolvedQuestions[0]);
    expect(markup).toContain("Student fact");
    expect(markup).toContain("Steppi inference");
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[1].title);
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[2].title);
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

  it("renders audited affordability facts beside their exact source references", () => {
    const markup = renderToStaticMarkup(
      <ResearchExpansion
        branch={DEMO_PATH_BRANCHES[0]}
        nodes={[AUDIT_CIIT_AFFORDABILITY_NODE]}
        question={AUDIT_AFFORDABILITY_QUESTION}
      />,
    );

    expect(markup).toContain("PHP 135,000–165,000");
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
});
