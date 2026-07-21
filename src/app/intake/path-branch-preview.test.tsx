import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import {
  DESKTOP_ROLE_SLOTS,
  InitialPathMap,
  desktopRoleSlot,
  rolePillWidthClass,
} from "@/app/intake/path-branch-preview";
import { RoleConversationPanel } from "@/app/intake/role-conversation";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import { developmentRoleConversationMessage } from "@/lib/demo-role-conversation";
import { emptyRoleConversationThread } from "@/lib/role-conversation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

describe("initial path map markup", () => {
  it("renders every role as one desktop and one mobile title-only pill", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        confirmedSummary={DEMO_CONFIRMATION_SUMMARY}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(markup.match(/data-role-surface="desktop"/g)).toHaveLength(7);
    expect(markup.match(/data-role-surface="mobile"/g)).toHaveLength(7);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(14);
    for (const branch of DEMO_PATH_BRANCHES) {
      expect(markup.match(new RegExp(branch.title, "g"))).toHaveLength(4);
      expect(markup).not.toContain(branch.summary);
    }
    expect(markup).not.toContain("data-path-detail=");
  });

  it("uses a deterministic floating desktop composition and complete mobile list", () => {
    const markup = renderToStaticMarkup(
      <InitialPathMap
        branches={DEMO_PATH_BRANCHES}
        confirmedSummary={DEMO_CONFIRMATION_SUMMARY}
        profile={VALID_PROFILE_FIXTURE}
      />,
    );

    expect(DESKTOP_ROLE_SLOTS).toHaveLength(8);
    DEMO_PATH_BRANCHES.forEach((branch, index) => {
      expect(markup).toContain(`data-role-pill="${branch.id}"`);
      expect(markup).toContain(desktopRoleSlot(index));
    });
    expect(markup).toContain('data-mobile-fallback="role-list"');
    expect(markup).toContain('data-role-overview="desktop"');
    expect(markup).toContain('data-role-overview="mobile"');
    expect(markup).not.toContain("data-path-graph=");
  });

  it("varies pill width by title length", () => {
    expect(rolePillWidthClass("Archivist")).toBe("w-[12rem]");
    expect(rolePillWidthClass("Science communication producer")).toBe(
      "w-[15.5rem]",
    );
    expect(
      rolePillWidthClass(
        "Human-centered artificial intelligence product and experience designer",
      ),
    ).toBe("w-[19rem]");
  });

  it("keeps the complete role brief intact", () => {
    const selected = DEMO_PATH_BRANCHES[0];
    const markup = renderToStaticMarkup(
      <PathDetailPanel
        branch={selected}
        evidence={profileEvidence(VALID_PROFILE_FIXTURE)}
        onClear={() => undefined}
      />,
    );

    expect(markup).toContain("What this role is");
    expect(markup).toContain(selected.summary);
    expect(markup).toContain("Why it may fit you");
    expect(markup).toContain("Why it may not fit you");
    expect(markup).toContain("What the day-to-day can feel like");
    expect(markup).toContain("Try it before committing");
    expect(markup).toContain("See what Steppi connected from your profile");
  });

  it("renders a compact onboarding-style follow-up", () => {
    const markup = renderToStaticMarkup(
      <RoleConversationPanel
        branch={DEMO_PATH_BRANCHES[0]}
        fieldError={null}
        onDraftChange={() => undefined}
        onReset={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        thread={emptyRoleConversationThread()}
      />,
    );

    expect(markup).toContain(`data-role-conversation="${DEMO_PATH_BRANCHES[0].id}"`);
    expect(markup).toContain(`Ask one thing about ${DEMO_PATH_BRANCHES[0].title}`);
    expect(markup).toContain("A short follow-up is enough");
    expect(markup).toContain("Ask a short follow-up");
    expect(markup.match(/rounded-full/g)).toHaveLength(3);
    expect(markup).not.toContain("What should Steppi research next?");
  });

  it("keeps a sourced answer concise and its source directory collapsed", () => {
    const branch = DEMO_PATH_BRANCHES[0];
    const assistant = developmentRoleConversationMessage({
      branchId: branch.id,
      requestId: "request-1",
      researched: true,
    });
    const markup = renderToStaticMarkup(
      <RoleConversationPanel
        branch={branch}
        fieldError={null}
        onDraftChange={() => undefined}
        onReset={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        thread={{
          draft: "",
          messages: [
            {
              id: "user-1",
              role: "user",
              branchId: branch.id,
              content: "What could I study for this?",
              createdAt: "2026-07-20T11:59:00.000+08:00",
            },
            assistant,
          ],
          request: { status: "idle" },
        }}
      />,
    );

    expect(markup).toContain('data-role-conversation-answer="researched"');
    expect(markup).toContain("current sources checked");
    expect(markup).toContain("1 current source");
    expect(markup).toContain("<details");
    expect(markup).not.toContain("<details open");
    expect(markup).toContain("Try this next");
  });

  it("preserves one submitted question and offers retry after failure", () => {
    const branch = DEMO_PATH_BRANCHES[0];
    const question = "What might surprise me about this work?";
    const markup = renderToStaticMarkup(
      <RoleConversationPanel
        branch={branch}
        fieldError={null}
        onDraftChange={() => undefined}
        onReset={() => undefined}
        onRetry={() => undefined}
        onSubmit={() => undefined}
        thread={{
          draft: "",
          messages: [
            {
              id: "user-1",
              role: "user",
              branchId: branch.id,
              content: question,
              createdAt: "2026-07-20T11:59:00.000+08:00",
            },
          ],
          request: {
            status: "error",
            requestId: "request-1",
            question,
            userMessageId: "user-1",
            message: "Steppi could not answer right now. Your question is still here.",
            retryable: true,
          },
        }}
      />,
    );

    expect(markup).toContain("That answer did not come through");
    expect(markup).toContain("Retry this question");
    expect(markup.match(/What might surprise me about this work\?/g)).toHaveLength(1);
  });
});
