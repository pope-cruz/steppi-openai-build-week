import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import { developmentRoleConversationMessage } from "@/lib/demo-role-conversation";
import { handleRoleConversationRequest } from "@/app/api/role-conversation/route";
import { RoleConversationGenerationError } from "@/server/role-conversation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

function body() {
  return {
    profile: VALID_PROFILE_FIXTURE,
    confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
    branch: DEMO_PATH_BRANCHES[0],
    history: [],
    question: "What might surprise me about this work?",
    requestId: "request-1",
    safetyIdentifier: "safe-session-1",
  };
}

function request(input: unknown) {
  return new Request("http://localhost/api/role-conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

describe("POST /api/role-conversation", () => {
  it("returns a validated role-bound assistant message", async () => {
    const generateMessage = vi.fn().mockResolvedValue(
      developmentRoleConversationMessage({
        branchId: DEMO_PATH_BRANCHES[0].id,
        requestId: "request-1",
      }),
    );
    const response = await handleRoleConversationRequest(request(body()), {
      generateMessage,
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.branchId).toBe(DEMO_PATH_BRANCHES[0].id);
    expect(payload.requestId).toBe("request-1");
    expect(generateMessage).toHaveBeenCalledOnce();
  });

  it("rejects invalid input before generation", async () => {
    const generateMessage = vi.fn();
    const response = await handleRoleConversationRequest(
      request({ ...body(), question: "" }),
      { generateMessage },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: {
        code: "invalid_input",
        message: "That role question is incomplete. Please review it and try again.",
        retryable: false,
      },
    });
    expect(generateMessage).not.toHaveBeenCalled();
  });

  it.each([
    ["timeout", 504, true],
    ["retrieval_failure", 502, true],
    ["malformed_model_output", 502, true],
    ["configuration_missing", 503, false],
  ] as const)("maps %s without exposing provider details", async (code, status, retryable) => {
    const response = await handleRoleConversationRequest(request(body()), {
      generateMessage: vi
        .fn()
        .mockRejectedValue(new RoleConversationGenerationError(code)),
    });
    const payload = await response.json();

    expect(response.status).toBe(status);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe(code);
    expect(payload.error.retryable).toBe(retryable);
    expect(JSON.stringify(payload)).not.toContain("test-key");
  });
});
