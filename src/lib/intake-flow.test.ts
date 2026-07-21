import { describe, expect, it } from "vitest";

import {
  EMPTY_CONVERSATION_STATE,
  FINAL_CONSIDERATION_QUESTION,
  MAX_CONVERSATION_TURNS,
  type ConversationQuestion,
  type ConversationTurn,
} from "@/lib/intake-conversation";
import {
  appendConversationTurn,
  buildConversationIntakeAnswers,
  canStartRequest,
  conversationOrientation,
  firstConversationQuestion,
  interpretationScopeKey,
  reviseConversationTurn,
  shouldSubmitConversationKey,
  shouldInterpretConversationTurn,
  stateBeforeRevision,
  validateConversationAnswer,
} from "@/lib/intake-flow";
import { IntakeRequestSchema } from "@/lib/schemas";

const answeredAt = "2026-07-17T02:00:00.000Z";

function question(index: number): ConversationQuestion {
  if (index === 0) return firstConversationQuestion();
  if (index === 5) return FINAL_CONSIDERATION_QUESTION;
  const stage = [
    "anchor-school",
    "anchor-outside",
    "follow-up-1",
    "follow-up-2",
  ][index - 1] as ConversationQuestion["stage"];
  return {
    id: stage,
    stage,
    purpose:
      stage === "follow-up-1"
        ? "distinguish-directions"
        : stage === "follow-up-2"
          ? "clarify-practical-constraint"
          : null,
    acknowledgement: index === 0 ? null : "A useful connection.",
    prompt: `Question ${index + 1}?`,
    helper: "",
    placeholder: "",
  };
}

function addTurn(
  turns: ConversationTurn[],
  nextQuestion: ConversationQuestion,
  answer: string,
) {
  return appendConversationTurn(turns, nextQuestion, answer, answeredAt);
}

describe("deterministic conversational intake shell", () => {
  it("opens with the existing-possibilities anchor", () => {
    const opening = firstConversationQuestion();
    expect(opening).toMatchObject({
      id: "anchor-existing",
      stage: "anchor-existing",
      purpose: null,
    });
    expect(opening.prompt).toMatch(/programs, majors, careers, or fields/i);
  });

  it("rejects empty input and preserves multiline input", () => {
    expect(validateConversationAnswer(" \n ")).toContain("before sending");
    const turns = addTurn(
      [],
      firstConversationQuestion(),
      "I enjoy visual projects.\nI am unsure about coding.",
    );
    expect(turns[0].answer).toContain("\n");
    expect(turns[0]).toMatchObject({
      stage: "anchor-existing",
      purpose: null,
    });
  });

  it("uses Enter to send but leaves Shift+Enter for a newline", () => {
    expect(
      shouldSubmitConversationKey({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        value: "A useful answer",
      }),
    ).toBe(true);
    expect(
      shouldSubmitConversationKey({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
        value: "Line one\nLine two",
      }),
    ).toBe(false);
  });

  it("prevents duplicate messages and concurrent request starts", () => {
    const opening = firstConversationQuestion();
    const turns = addTurn([], opening, "I have a few ideas to compare.");
    expect(
      appendConversationTurn(turns, opening, "Duplicate", answeredAt),
    ).toBe(turns);
    expect(canStartRequest("loading")).toBe(false);
    expect(canStartRequest("idle")).toBe(true);
    expect(canStartRequest("error")).toBe(true);
  });

  it("never appends more than the six supported genuine answers", () => {
    let turns: ConversationTurn[] = [];
    for (let index = 0; index < MAX_CONVERSATION_TURNS; index += 1) {
      turns = addTurn(turns, question(index), `Answer ${index + 1}`);
    }
    const unsupported: ConversationQuestion = {
      ...FINAL_CONSIDERATION_QUESTION,
      id: "unsupported-seventh",
    };
    expect(
      appendConversationTurn(turns, unsupported, "Another answer", answeredAt),
    ).toBe(turns);
  });

  it("revision replaces the answer and invalidates later turns", () => {
    const first = addTurn(
      [],
      firstConversationQuestion(),
      "I am considering computing.",
    );
    const second = addTurn(first, question(1), "I enjoy digital art.");
    const revised = reviseConversationTurn(
      second,
      0,
      "Correction: I am considering design.",
      answeredAt,
    );
    expect(revised).toHaveLength(1);
    expect(revised[0].answer).toContain("design");
  });

  it("restores the checkpoint before a revised turn", () => {
    const afterFirst = { ...EMPTY_CONVERSATION_STATE };
    expect(stateBeforeRevision([afterFirst], 0, EMPTY_CONVERSATION_STATE)).toBe(
      EMPTY_CONVERSATION_STATE,
    );
    expect(stateBeforeRevision([afterFirst], 1, EMPTY_CONVERSATION_STATE)).toBe(
      afterFirst,
    );
  });

  it("sends only genuine answers and preserves the final decline unchanged", () => {
    let turns: ConversationTurn[] = [];
    for (let index = 0; index < 4; index += 1) {
      turns = addTurn(turns, question(index), `Answer ${index + 1}`);
    }
    turns = addTurn(turns, FINAL_CONSIDERATION_QUESTION, "I don’t know");

    const answers = buildConversationIntakeAnswers(turns);
    expect(answers).toHaveLength(5);
    expect(answers.at(-1)).toMatchObject({
      questionId: "final-consideration",
      answer: "I don’t know",
    });
    expect(answers.some((answer) => answer.questionId.includes("context-copy"))).toBe(
      false,
    );
    expect(IntakeRequestSchema.safeParse({ answers }).success).toBe(true);
    expect(shouldInterpretConversationTurn(turns.at(-1)!)).toBe(false);
  });

  it("sends every final answer directly to profile generation", () => {
    const turn = addTurn(
      [],
      FINAL_CONSIDERATION_QUESTION,
      "I want work where I can make useful things with other people.",
    ).at(-1)!;

    expect(shouldInterpretConversationTurn(turn)).toBe(false);
  });

  it("scopes interpretation work to both revision and source-turn ID", () => {
    expect(interpretationScopeKey(3, "anchor-school")).toBe(
      "3:anchor-school",
    );
    expect(interpretationScopeKey(4, "anchor-school")).not.toBe(
      interpretationScopeKey(3, "anchor-school"),
    );
    expect(interpretationScopeKey(3, "anchor-outside")).not.toBe(
      interpretationScopeKey(3, "anchor-school"),
    );
  });

  it("reports semantic progress without a step count", () => {
    expect(
      conversationOrientation({
        stage: "anchor-existing",
        isInterpreting: false,
        turnCount: 0,
      }),
    ).toContain("conversation");
    expect(
      conversationOrientation({
        stage: "anchor-outside",
        isInterpreting: true,
        turnCount: 3,
      }),
    ).toContain("Taking in");
    expect(
      conversationOrientation({
        stage: "profile",
        isInterpreting: false,
        turnCount: 5,
      }),
    ).toContain("Enough context");
  });
});
