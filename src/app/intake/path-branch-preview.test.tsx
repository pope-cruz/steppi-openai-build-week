import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import { InitialPathMap } from "@/app/intake/path-branch-preview";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
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
});
