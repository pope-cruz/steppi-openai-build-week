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
import { DEMO_RESEARCH_NODES, DEMO_RESEARCH_QUESTION } from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

describe("initial path map markup", () => {
  it("renders one student node, three native branch controls, and no initial detail", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup.match(/data-path-node="student"/g)).toHaveLength(1);
    expect(markup.match(/data-path-node="branch"/g)).toHaveLength(3);
    expect(markup.match(/data-path-edge=/g)).toHaveLength(3);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(3);
    expect(markup.match(/<button[^>]*type="button"/g)).toHaveLength(3);
    expect(markup).not.toContain("data-path-detail=");
  });

  it("preserves every required branch role and the mobile relationship fallback", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup).toContain('data-path-role="strongest-fit"');
    expect(markup).toContain('data-path-role="adjacent"');
    expect(markup).toContain('data-path-role="underexplored"');
    expect(markup).toContain('data-mobile-fallback="hierarchical"');
    expect(markup).toContain('data-relationship-count="3"');
    expect(markup).toContain("press Enter or Space");
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
    expect(markup).toContain("Why it matters to you");
    expect(markup).toContain("Caveat");
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[1].id);
    expect(markup).not.toContain(DEMO_PATH_BRANCHES[2].id);
  });
});
