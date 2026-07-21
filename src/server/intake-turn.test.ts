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
  id: "anchor-existing",
  stage: "anchor-existing",
  purpose: null,
  acknowledgement: null,
  question: "Which directions have you considered?",
  answer: "I have considered design and computing.",
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
    consideredPaths: [
      {
        id: "path-design",
        text: "The student has considered design.",
        basis: "explicit",
        sourceTurnIds: [turn.id],
      },
    ],
    uncertainty: [],
  },
  supersedeItemIds: [],
  unresolvedDimensions: ["subjects-and-activities", "experiences"],
  acknowledgement: "You are weighing design alongside computing.",
  followUpCandidates: [],
};

describe("server-side intake turn interpreter", () => {
  it("limits GPT-5.6 to structured interpretation and allowed candidates", () => {
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/high-school and college students/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/do not ask whether they are in high school or college/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/deterministic application code owns/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/resolve-contradiction/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/multiple independent questions/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/information already supplied/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/What are your strengths/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/exact household income/i);
    expect(INTAKE_TURN_INSTRUCTIONS).toMatch(/zero|return null/i);
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

  it("rejects malformed output and invalid update source references", async () => {
    await expect(
      interpretIntakeTurn(EMPTY_CONVERSATION_STATE, [turn], {
        apiKey: "test-only",
        requestTurn: async () => ({ followUpCandidates: 42 }),
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
              {
                id: "invalid-source",
                text: "An invalid item.",
                basis: "explicit",
                sourceTurnIds: ["unknown"],
              },
            ],
          },
        }),
      }),
    ).rejects.toMatchObject({ code: "malformed_model_output" });
  });

  it("drops an invalid candidate without discarding valid state updates", async () => {
    const result = await interpretIntakeTurn(
      EMPTY_CONVERSATION_STATE,
      [turn],
      {
        apiKey: "test-only",
        requestTurn: async () => ({
          ...patch,
          followUpCandidates: [
            {
              purpose: "material-evidence-gap",
              rationale: "A gap remains.",
              targetItemIds: [],
              targetDimensions: ["experiences"],
              sourceTurnIds: [turn.id],
              question: "What are your strengths?",
            },
          ],
        }),
      },
    );
    expect(result.updates.consideredPaths).toHaveLength(1);
    expect(result.followUpCandidates).toEqual([]);
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
