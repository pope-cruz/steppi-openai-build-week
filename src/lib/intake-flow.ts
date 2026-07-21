import {
  MAX_CONVERSATION_TURNS,
  firstConversationQuestion as firstControllerQuestion,
  isFinalDeclineAnswer,
  type ConversationQuestion,
  type ConversationState,
  type ConversationTurn,
  type IntakeControllerStage,
} from "@/lib/intake-conversation";
import { IntakeRequestSchema, type IntakeAnswer } from "@/lib/schemas";

export type {
  ConversationQuestion,
  ConversationState,
  ConversationTurn,
} from "@/lib/intake-conversation";

export function firstConversationQuestion() {
  return firstControllerQuestion();
}

export function conversationOrientation({
  stage,
  isInterpreting,
  turnCount,
}: {
  stage: IntakeControllerStage;
  isInterpreting: boolean;
  turnCount: number;
}) {
  if (isInterpreting) {
    return "Taking in what you shared";
  }

  if (stage === "profile") {
    return "Enough context to reflect back what you shared";
  }

  if (turnCount === 0) {
    return "A short conversation—usually a few minutes";
  }

  return "Following what matters in your answers";
}

export function validateConversationAnswer(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Write a short answer before sending.";
  }

  if (trimmed.length < 2) {
    return "Add a little more detail so Steppi can use this answer.";
  }

  if (trimmed.length > 800) {
    return "Keep this answer under 800 characters.";
  }

  return null;
}

export function appendConversationTurn(
  turns: ConversationTurn[],
  question: ConversationQuestion,
  answer: string,
  answeredAt: string,
) {
  if (
    turns.length >= MAX_CONVERSATION_TURNS ||
    turns.some((turn) => turn.id === question.id)
  ) {
    return turns;
  }

  const error = validateConversationAnswer(answer);
  if (error) {
    throw new Error(error);
  }

  return [
    ...turns,
    {
      id: question.id,
      stage: question.stage,
      purpose: question.purpose,
      acknowledgement: question.acknowledgement,
      question: question.prompt,
      answer: answer.trim(),
      answeredAt,
    },
  ];
}

export function reviseConversationTurn(
  turns: ConversationTurn[],
  index: number,
  answer: string,
  answeredAt: string,
) {
  const error = validateConversationAnswer(answer);
  if (error) {
    throw new Error(error);
  }

  const existing = turns[index];
  if (!existing) {
    throw new Error("The answer to revise was not found.");
  }

  return [
    ...turns.slice(0, index),
    { ...existing, answer: answer.trim(), answeredAt },
  ];
}

export function buildConversationIntakeAnswers(
  turns: ConversationTurn[],
): IntakeAnswer[] {
  const answers = turns.map((turn) => ({
    questionId: turn.id,
    question: turn.question,
    answer: turn.answer,
    answeredAt: turn.answeredAt,
  }));

  return IntakeRequestSchema.parse({ answers }).answers;
}

export function shouldSubmitConversationKey({
  key,
  shiftKey,
  isComposing,
  value,
}: {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  value: string;
}) {
  return (
    key === "Enter" &&
    !shiftKey &&
    !isComposing &&
    validateConversationAnswer(value) === null
  );
}

export function canStartRequest(status: "idle" | "loading" | "error") {
  return status !== "loading";
}

export function shouldInterpretConversationTurn(turn: ConversationTurn) {
  return !(turn.stage === "final" && isFinalDeclineAnswer(turn.answer));
}

export function interpretationScopeKey(
  revision: number,
  sourceTurnId: string,
) {
  return `${revision}:${sourceTurnId}`;
}

export function stateBeforeRevision(
  checkpoints: ConversationState[],
  index: number,
  emptyState: ConversationState,
) {
  return index > 0 ? checkpoints[index - 1] ?? emptyState : emptyState;
}
