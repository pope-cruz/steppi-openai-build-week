import { describe, expect, it, vi } from "vitest";

import { handleIntakeTurnRequest } from "@/app/api/intake/turn/route";
import {
  EMPTY_CONVERSATION_STATE,
  type ConversationTurn,
  type ConversationTurnPatch,
} from "@/lib/intake-conversation";
import { IntakeTurnGenerationError } from "@/server/intake-turn";

const turn: ConversationTurn = {
  id: "starting-point",
  acknowledgement: null,
  question: "What are you trying to figure out?",
  answer: "I enjoy digital art and coordinated a group project.",
  answeredAt: "2026-07-17T02:00:00.000Z",
};

const patch: ConversationTurnPatch = {
  updates: {
    suppliedFacts: [],
    interpretedInterests: [],
    experiences: [],
    preferences: [],
    dislikes: [],
    constraints: [],
    consideredPaths: [],
    uncertainty: [],
  },
  supersedeItemIds: [],
  unresolvedDimensions: ["constraints"],
  enoughContext: false,
  acknowledgement: "You mentioned a group project.",
  nextQuestion: "What part of that project held your attention most?",
};

function request(body: unknown) {
  return new Request("http://localhost/api/intake/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/intake/turn", () => {
  it("validates input before invoking the interpreter", async () => {
    const interpret = vi.fn();
    const response = await handleIntakeTurnRequest(request({ turns: [] }), interpret);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(interpret).not.toHaveBeenCalled();
  });

  it("returns only the validated conversational patch", async () => {
    const interpret = vi.fn().mockResolvedValue(patch);
    const response = await handleIntakeTurnRequest(
      request({ state: EMPTY_CONVERSATION_STATE, turns: [turn] }),
      interpret,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, patch });
    expect(interpret).toHaveBeenCalledOnce();
  });

  it.each([
    ["configuration_missing", 503, false],
    ["invalid_model_configuration", 503, false],
    ["timeout", 504, true],
    ["api_failure", 502, true],
    ["malformed_model_output", 502, true],
  ] as const)("maps %s to a safe public error", async (code, status, retryable) => {
    const interpret = vi
      .fn()
      .mockRejectedValue(new IntakeTurnGenerationError(code));
    const response = await handleIntakeTurnRequest(
      request({ state: EMPTY_CONVERSATION_STATE, turns: [turn] }),
      interpret,
    );
    const text = await response.text();
    expect(response.status).toBe(status);
    expect(JSON.parse(text)).toMatchObject({
      ok: false,
      error: { code, retryable },
    });
    expect(text).not.toContain(turn.answer);
    expect(text).not.toContain("OPENAI_API_KEY");
  });
});
