import { describe, expect, it } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import {
  DEMO_INTERPRETIVE_ROLE_RESPONSE,
  DEMO_RESEARCHED_ROLE_RESPONSE,
  developmentRoleConversationMessage,
} from "@/lib/demo-role-conversation";
import {
  RoleConversationRequestSchema,
  conversationHistoryForRequest,
  emptyRoleConversationThread,
  questionRequiresCurrentSources,
  roleConversationThreadsReducer,
  roleConversationWordCount,
  validateRoleConversationQuestion,
} from "@/lib/role-conversation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

describe("role conversation contracts", () => {
  it("validates natural questions and detects unstable current-fact topics", () => {
    expect(validateRoleConversationQuestion("How creative is this work?")).toBeNull();
    expect(validateRoleConversationQuestion(" ")).toBe("Ask a short question first.");
    expect(questionRequiresCurrentSources("How creative is the work?")).toBe(false);
    expect(questionRequiresCurrentSources("Are there affordable programs near Manila?")).toBe(true);
    expect(questionRequiresCurrentSources("What is the current salary?")).toBe(true);
  });

  it("rejects history attached to a different role", () => {
    const result = RoleConversationRequestSchema.safeParse({
      profile: VALID_PROFILE_FIXTURE,
      confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
      branch: DEMO_PATH_BRANCHES[0],
      history: [
        {
          id: "user-1",
          role: "user",
          branchId: DEMO_PATH_BRANCHES[1].id,
          content: "What is surprising about this role?",
          createdAt: "2026-07-20T12:00:00.000+08:00",
        },
      ],
      question: "What would I do each day?",
      requestId: "request-1",
      safetyIdentifier: "safe-session-1",
    });

    expect(result.success).toBe(false);
  });

  it("keeps role histories independent and ignores stale answers", () => {
    const branchId = DEMO_PATH_BRANCHES[0].id;
    const otherBranchId = DEMO_PATH_BRANCHES[1].id;
    const userMessage = {
      id: "user-1",
      role: "user" as const,
      branchId,
      content: "What might surprise me about this work?",
      createdAt: "2026-07-20T12:00:00.000+08:00",
    };
    const started = roleConversationThreadsReducer({}, {
      type: "start",
      branchId,
      requestId: "request-1",
      userMessage,
    });
    const withOtherDraft = roleConversationThreadsReducer(started, {
      type: "draft",
      branchId: otherBranchId,
      value: "How collaborative is it?",
    });
    const stale = roleConversationThreadsReducer(withOtherDraft, {
      type: "succeed",
      branchId,
      requestId: "stale-request",
      message: developmentRoleConversationMessage({
        branchId,
        requestId: "stale-request",
      }),
    });

    expect(stale).toBe(withOtherDraft);
    expect(stale[branchId].messages).toEqual([userMessage]);
    expect(stale[otherBranchId].draft).toBe("How collaborative is it?");
  });

  it("retries without duplicating the submitted user message", () => {
    const branchId = DEMO_PATH_BRANCHES[0].id;
    const userMessage = {
      id: "user-1",
      role: "user" as const,
      branchId,
      content: "What might surprise me about this work?",
      createdAt: "2026-07-20T12:00:00.000+08:00",
    };
    const started = roleConversationThreadsReducer({}, {
      type: "start",
      branchId,
      requestId: "request-1",
      userMessage,
    });
    const failed = roleConversationThreadsReducer(started, {
      type: "fail",
      branchId,
      requestId: "request-1",
      message: "Try again.",
      retryable: true,
    });
    const retried = roleConversationThreadsReducer(failed, {
      type: "retry",
      branchId,
      requestId: "request-2",
      question: userMessage.content,
      userMessageId: userMessage.id,
    });

    expect(retried[branchId].messages).toHaveLength(1);
    expect(conversationHistoryForRequest(retried[branchId], userMessage.id)).toEqual([]);
  });

  it("keeps deterministic fixtures within the intended concise targets", () => {
    expect(roleConversationWordCount(DEMO_INTERPRETIVE_ROLE_RESPONSE)).toBeGreaterThanOrEqual(50);
    expect(roleConversationWordCount(DEMO_INTERPRETIVE_ROLE_RESPONSE)).toBeLessThanOrEqual(90);
    expect(roleConversationWordCount(DEMO_RESEARCHED_ROLE_RESPONSE)).toBeGreaterThanOrEqual(70);
    expect(roleConversationWordCount(DEMO_RESEARCHED_ROLE_RESPONSE)).toBeLessThanOrEqual(120);
    expect(emptyRoleConversationThread()).toEqual({
      draft: "",
      messages: [],
      request: { status: "idle" },
    });
  });
});
