import { describe, expect, it } from "vitest";

import { developmentIntakeTurnPayload } from "@/lib/demo-intake-conversation";
import {
  EMPTY_CONVERSATION_STATE,
  IntakeTurnApiResponseSchema,
  applyConversationPatch,
  firstConversationQuestion,
  nextControllerQuestion,
  prepareConversationPatchForController,
  type ConversationQuestion,
  type ConversationState,
  type ConversationTurn,
} from "@/lib/intake-conversation";

const answeredAt = "2026-07-17T02:00:00.000Z";

function answer(
  question: ConversationQuestion,
  text = "A detailed fixture answer.",
): ConversationTurn {
  return {
    id: question.id,
    stage: question.stage,
    purpose: question.purpose,
    acknowledgement: question.acknowledgement,
    question: question.prompt,
    answer: text,
    answeredAt,
  };
}

function fixtureResult({
  attempt,
  fixture,
  state,
  turns,
}: {
  attempt: number;
  fixture: "intake-success" | "intake-alternate" | "intake-uncertain";
  state: ConversationState;
  turns: ConversationTurn[];
}) {
  const payload = IntakeTurnApiResponseSchema.parse(
    developmentIntakeTurnPayload({ fixture, state, turns, attempt }),
  );
  if (!payload.ok) throw new Error("expected fixture success");
  const patch = prepareConversationPatchForController(
    state,
    payload.patch,
    turns,
  );
  return {
    patch,
    state: applyConversationPatch(state, patch, turns),
  };
}

function runAnchors(
  fixture: "intake-success" | "intake-alternate" | "intake-uncertain",
) {
  let state = EMPTY_CONVERSATION_STATE;
  const turns: ConversationTurn[] = [];
  let question: ConversationQuestion = firstConversationQuestion();
  let lastPatch = null;

  for (let index = 0; index < 3; index += 1) {
    turns.push(answer(question));
    const result = fixtureResult({
      fixture,
      state,
      turns: [...turns],
      attempt: index + 1,
    });
    state = result.state;
    lastPatch = result.patch;
    question = nextControllerQuestion({
      completedTurn: turns.at(-1)!,
      patch: result.patch,
      turns,
    })!;
  }

  return { lastPatch: lastPatch!, question, state, turns };
}

describe("deterministic intake fixtures", () => {
  it("always reaches a first follow-up after the three anchors", () => {
    const result = runAnchors("intake-success");
    expect(result.turns.map((turn) => turn.stage)).toEqual([
      "anchor-existing",
      "anchor-school",
      "anchor-outside",
    ]);
    expect(result.question).toMatchObject({
      stage: "follow-up-1",
      purpose: "distinguish-directions",
    });
  });

  it("uses a second follow-up only when a distinct need remains", () => {
    const result = runAnchors("intake-alternate");
    const followUpTurn = answer(result.question);
    const turns = [...result.turns, followUpTurn];
    const interpreted = fixtureResult({
      fixture: "intake-alternate",
      state: result.state,
      turns,
      attempt: 4,
    });
    expect(
      nextControllerQuestion({
        completedTurn: followUpTurn,
        patch: interpreted.patch,
        turns,
      }),
    ).toMatchObject({
      stage: "follow-up-2",
      purpose: "clarify-practical-constraint",
    });
  });

  it("preserves uncertainty while still progressing", () => {
    const result = runAnchors("intake-uncertain");
    expect(result.state.uncertainty).toHaveLength(3);
    expect(result.question.stage).toBe("follow-up-1");
    expect(result.question.purpose).toBe("material-evidence-gap");
  });

  it("exposes a failed first attempt for user-initiated retry", () => {
    const firstTurn = answer(firstConversationQuestion());
    const first = IntakeTurnApiResponseSchema.parse(
      developmentIntakeTurnPayload({
        fixture: "intake-retry",
        state: EMPTY_CONVERSATION_STATE,
        turns: [firstTurn],
        attempt: 1,
      }),
    );
    const retry = IntakeTurnApiResponseSchema.parse(
      developmentIntakeTurnPayload({
        fixture: "intake-retry",
        state: EMPTY_CONVERSATION_STATE,
        turns: [firstTurn],
        attempt: 2,
      }),
    );
    expect(first).toMatchObject({ ok: false, error: { retryable: true } });
    expect(retry.ok).toBe(true);
  });

  it("keeps malformed fixture output outside the validated boundary", () => {
    const firstTurn = answer(firstConversationQuestion());
    expect(
      IntakeTurnApiResponseSchema.safeParse(
        developmentIntakeTurnPayload({
          fixture: "intake-malformed",
          state: EMPTY_CONVERSATION_STATE,
          turns: [firstTurn],
          attempt: 1,
        }),
      ).success,
    ).toBe(false);
  });
});
