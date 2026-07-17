import { describe, expect, it } from "vitest";

import {
  EMPTY_CONVERSATION_STATE,
  MAX_CONVERSATION_TURNS,
} from "@/lib/intake-conversation";
import {
  appendConversationTurn,
  buildConversationIntakeAnswers,
  canStartRequest,
  conversationOrientation,
  firstConversationQuestion,
  reviseConversationTurn,
  shouldSubmitConversationKey,
  stateBeforeRevision,
  validateConversationAnswer,
  type ConversationQuestion,
  type ConversationTurn,
} from "@/lib/intake-flow";
import { IntakeRequestSchema } from "@/lib/schemas";

const answeredAt = "2026-07-17T02:00:00.000Z";

function addTurn(
  turns: ConversationTurn[],
  question: ConversationQuestion,
  answer: string,
) {
  return appendConversationTurn(turns, question, answer, answeredAt);
}

describe("hybrid conversational intake shell", () => {
  it("opens broadly without exposing a category", () => {
    const opening = firstConversationQuestion();
    expect(opening.prompt).toBe(
      "What are you trying to figure out about college or work right now?",
    );
    expect(opening.prompt).not.toMatch(/category|dimension|assessment/i);
  });

  it("rejects empty input and preserves multiline input", () => {
    expect(validateConversationAnswer(" \n ")).toContain("before sending");
    const turn = addTurn(
      [],
      firstConversationQuestion(),
      "I enjoy visual projects.\nI am unsure about coding.",
    );
    expect(turn[0].answer).toContain("\n");
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

  it("prevents duplicate messages and model starts while loading", () => {
    const opening = firstConversationQuestion();
    const turns = addTurn([], opening, "I have a few ideas to compare.");
    expect(
      appendConversationTurn(turns, opening, "Duplicate", answeredAt),
    ).toBe(turns);
    expect(canStartRequest("loading")).toBe(false);
    expect(canStartRequest("idle")).toBe(true);
    expect(canStartRequest("error")).toBe(true);
  });

  it("never appends an unsupported thirteenth answer", () => {
    const turns = Array.from({ length: MAX_CONVERSATION_TURNS }, (_, index) => ({
      id: `turn-${index + 1}`,
      acknowledgement: index === 0 ? null : "Thanks for explaining.",
      question: `Question ${index + 1}?`,
      answer: "I am still figuring that out.",
      answeredAt,
    }));
    const unsupportedQuestion: ConversationQuestion = {
      id: "follow-up-13",
      acknowledgement: "Thanks for explaining.",
      prompt: "One more question?",
      helper: "",
      placeholder: "",
    };

    expect(
      appendConversationTurn(
        turns,
        unsupportedQuestion,
        "Another answer",
        answeredAt,
      ),
    ).toBe(turns);
  });

  it("revision replaces the answer and invalidates later turns", () => {
    const first = addTurn([], firstConversationQuestion(), "I am in Grade 11.");
    const followUp: ConversationQuestion = {
      id: "follow-up-2",
      acknowledgement: "You mentioned Grade 11.",
      prompt: "What has held your attention lately?",
      helper: "",
      placeholder: "",
    };
    const turns = addTurn(first, followUp, "Digital art projects.");
    const revised = reviseConversationTurn(
      turns,
      0,
      "Correction: I am in Grade 12.",
      answeredAt,
    );
    expect(revised).toHaveLength(1);
    expect(revised[0].answer).toContain("Grade 12");
  });

  it("restores the checkpoint before a revised turn", () => {
    const afterFirst = { ...EMPTY_CONVERSATION_STATE, enoughContext: false };
    expect(stateBeforeRevision([afterFirst], 0, EMPTY_CONVERSATION_STATE)).toBe(
      EMPTY_CONVERSATION_STATE,
    );
    expect(stateBeforeRevision([afterFirst], 1, EMPTY_CONVERSATION_STATE)).toBe(
      afterFirst,
    );
  });

  it("preserves the existing validated IntakeAnswer payload after early completion", () => {
    const turns = addTurn(
      [],
      firstConversationQuestion(),
      "I am in Grade 11, enjoy digital art, coordinated a school project, dislike programming-heavy work, and need affordable options near Manila.",
    );
    const answers = buildConversationIntakeAnswers(turns);

    expect(answers).toHaveLength(4);
    expect(answers[0].questionId).toBe(turns[0].id);
    expect(answers.slice(1).every((answer) => answer.questionId.includes("context-copy"))).toBe(
      true,
    );
    expect(new Set(answers.map((answer) => answer.answer))).toEqual(
      new Set([turns[0].answer]),
    );
    expect(IntakeRequestSchema.safeParse({ answers }).success).toBe(true);
  });

  it("reports semantic progress without a step count", () => {
    expect(
      conversationOrientation({
        enoughContext: false,
        isInterpreting: false,
        turnCount: 0,
      }),
    ).toContain("conversation");
    expect(
      conversationOrientation({
        enoughContext: false,
        isInterpreting: true,
        turnCount: 4,
      }),
    ).toContain("Taking in");
    expect(
      conversationOrientation({
        enoughContext: true,
        isInterpreting: false,
        turnCount: 2,
      }),
    ).toContain("Enough context");
  });
});
