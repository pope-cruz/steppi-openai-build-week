import { describe, expect, it } from "vitest";

import { developmentIntakeTurnPayload } from "@/lib/demo-intake-conversation";
import {
  EMPTY_CONVERSATION_STATE,
  IntakeTurnApiResponseSchema,
  MAX_CONVERSATION_TURNS,
  applyConversationPatch,
  prepareConversationPatchForPacing,
  type ConversationTurn,
} from "@/lib/intake-conversation";

const turn: ConversationTurn = {
  id: "starting-point",
  acknowledgement: null,
  question: "What are you trying to figure out about college or work right now?",
  answer:
    "I am in Grade 11, liked designing our publication, and need affordable options near Manila with a manageable commute. My family hopes I choose something stable.",
  answeredAt: "2026-07-17T02:00:00.000Z",
};

function fixturePatch(fixture: "intake-success" | "intake-practical") {
  const payload = IntakeTurnApiResponseSchema.parse(
    developmentIntakeTurnPayload({
      fixture,
      state: EMPTY_CONVERSATION_STATE,
      turns: [turn],
      attempt: 1,
    }),
  );
  if (!payload.ok) throw new Error("expected fixture success");
  return payload.patch;
}

describe("deterministic intake pacing fixtures", () => {
  it("can complete after one detailed answer spanning several dimensions", () => {
    const patch = fixturePatch("intake-success");
    const state = applyConversationPatch(EMPTY_CONVERSATION_STATE, patch, [turn]);

    expect(patch.enoughContext).toBe(true);
    expect(patch.nextQuestion).toBeNull();
    expect(state.suppliedFacts).toHaveLength(1);
    expect(state.interpretedInterests).toHaveLength(1);
    expect(state.experiences).toHaveLength(1);
    expect(state.preferences).toHaveLength(1);
    expect(state.dislikes).toHaveLength(1);
    expect(state.constraints).toHaveLength(1);
    expect(state.consideredPaths).toHaveLength(1);
    expect(state.uncertainty).toHaveLength(1);
  });

  it("keeps affordability, Manila, transport, and family influence explicit without asking for them again", () => {
    const patch = fixturePatch("intake-practical");
    const state = applyConversationPatch(EMPTY_CONVERSATION_STATE, patch, [turn]);
    const constraintText = state.constraints.map((item) => item.text).join(" ");

    expect(constraintText).toMatch(/costs manageable/i);
    expect(constraintText).toMatch(/Manila/i);
    expect(constraintText).toMatch(/family/i);
    expect(constraintText).toMatch(/commute/i);
    expect(patch.nextQuestion).toMatch(/publication/i);
    expect(patch.nextQuestion).not.toMatch(/income|afford|Manila|commute/i);
  });

  it("exposes a failed first attempt for user-initiated retry without an automatic second request", () => {
    const first = IntakeTurnApiResponseSchema.parse(
      developmentIntakeTurnPayload({
        fixture: "intake-retry",
        state: EMPTY_CONVERSATION_STATE,
        turns: [turn],
        attempt: 1,
      }),
    );
    const retry = IntakeTurnApiResponseSchema.parse(
      developmentIntakeTurnPayload({
        fixture: "intake-retry",
        state: EMPTY_CONVERSATION_STATE,
        turns: [turn],
        attempt: 2,
      }),
    );

    expect(first).toMatchObject({ ok: false, error: { retryable: true } });
    expect(retry.ok).toBe(true);
  });

  it("keeps malformed fixture output outside the validated state boundary", () => {
    expect(
      IntakeTurnApiResponseSchema.safeParse(
        developmentIntakeTurnPayload({
          fixture: "intake-malformed",
          state: EMPTY_CONVERSATION_STATE,
          turns: [turn],
          attempt: 1,
        }),
      ).success,
    ).toBe(false);
  });

  it("turns repeated uncertainty into completion at the final supported answer", () => {
    const turns = Array.from({ length: MAX_CONVERSATION_TURNS }, (_, index) => ({
      ...turn,
      id: `turn-${index + 1}`,
      question: `Question ${index + 1}?`,
      answer: "I still do not know; I have not had much exposure.",
    }));
    const payload = IntakeTurnApiResponseSchema.parse(
      developmentIntakeTurnPayload({
        fixture: "intake-max-turns",
        state: EMPTY_CONVERSATION_STATE,
        turns,
        attempt: MAX_CONVERSATION_TURNS,
      }),
    );
    if (!payload.ok) throw new Error("expected fixture success");

    const paced = prepareConversationPatchForPacing(payload.patch, turns);
    expect(paced.enoughContext).toBe(true);
    expect(paced.nextQuestion).toBeNull();
  });
});
