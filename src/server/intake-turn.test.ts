import { describe, expect, it, vi } from "vitest";

import {
  EMPTY_CONVERSATION_STATE,
  type ConversationTurn,
  type ConversationTurnPatch,
} from "@/lib/intake-conversation";
import {
  INTAKE_TURN_INSTRUCTIONS,
  IntakeTurnGenerationError,
  interpretIntakeTurn,
} from "@/server/intake-turn";

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
    experiences: [
      {
        id: "digital-art-project",
        text: "The student coordinated a digital art project.",
        basis: "explicit",
        sourceTurnIds: [turn.id],
      },
    ],
    preferences: [],
    dislikes: [],
    constraints: [],
    consideredPaths: [],
    uncertainty: [],
  },
  supersedeItemIds: [],
  unresolvedDimensions: ["constraints"],
  enoughContext: false,
  acknowledgement: "You mentioned coordinating a digital art project.",
  nextQuestion: "What part of that project held your attention most?",
};

describe("server-side intake turn interpreter", () => {
  it("instructs GPT-5.6 to use high-information pacing and practical context", () => {
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/high-information/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(
      /affordability, location, family expectations, access.*transportation/i,
    );
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/exact household income/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/not a checklist/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/little exposure/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/three meaningfully different/i);
  });

  it("makes one injected model request and returns a validated patch", async () => {
    const requestTurn = vi.fn().mockResolvedValue(patch);
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "test-only",
        model: "gpt-5.6",
        requestTurn,
      }),
    ).resolves.toEqual(patch);
    expect(requestTurn).toHaveBeenCalledOnce();
    expect(requestTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        state: EMPTY_CONVERSATION_STATE,
        turns: [turn],
        apiKey: "test-only",
        model: "gpt-5.6",
      }),
    );
  });

  it("rejects malformed output and invalid source references", async () => {
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "test-only",
        requestTurn: async () => ({ nextQuestion: 42 }),
      }),
    ).rejects.toMatchObject({ code: "malformed_model_output" });
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "test-only",
        requestTurn: async () => ({
          ...patch,
          updates: {
            ...patch.updates,
            experiences: [
              { ...patch.updates.experiences[0], sourceTurnIds: ["unknown"] },
            ],
          },
        }),
      }),
    ).rejects.toMatchObject({ code: "malformed_model_output" });
  });

  it("normalizes an incomplete twelfth-turn result to completion after one request", async () => {
    const turns = Array.from({ length: 12 }, (_, index) => ({
      ...turn,
      id: `turn-${index + 1}`,
      question: `Question ${index + 1}?`,
    }));
    const requestTurn = vi.fn().mockResolvedValue({
      ...patch,
      updates: {
        ...patch.updates,
        experiences: [],
      },
      acknowledgement: "The student is still exploring.",
      nextQuestion: "What else would help?",
    });

    const result = await interpretIntakeTurn(EMPTY_CONVERSATION_STATE, turns, {
      apiKey: "test-only",
      requestTurn,
    });

    expect(requestTurn).toHaveBeenCalledOnce();
    expect(result.enoughContext).toBe(true);
    expect(result.nextQuestion).toBeNull();
  });

  it("does not call the model without configuration", async () => {
    const requestTurn = vi.fn();
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "",
        requestTurn,
      }),
    ).rejects.toEqual(new IntakeTurnGenerationError("configuration_missing"));
    expect(requestTurn).not.toHaveBeenCalled();
  });

  it("classifies timeouts and generic model failures safely", async () => {
    const timeout = Object.assign(new Error("do not expose"), {
      name: "APIConnectionTimeoutError",
    });
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "test-only",
        requestTurn: async () => Promise.reject(timeout),
      }),
    ).rejects.toMatchObject({ code: "timeout" });
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "test-only",
        requestTurn: async () => Promise.reject(new Error("secret detail")),
      }),
    ).rejects.toMatchObject({ code: "api_failure" });
  });
});
