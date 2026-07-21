import { z } from "zod";

import {
  ConfirmedSummarySchema,
  PathBranchSchema,
  StudentProfileSchema,
} from "@/lib/schemas";

const identifierSchema = z.string().trim().min(1).max(100);
export const ROLE_QUESTION_MAX_LENGTH = 300;
export const MAX_ROLE_CONVERSATION_MESSAGES = 24;

export const RoleConversationQuestionSchema = z
  .string()
  .trim()
  .min(2)
  .max(ROLE_QUESTION_MAX_LENGTH);

export const RoleConversationSourceSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    publisher: z.string().trim().min(1).max(120).nullable(),
    url: z.string().trim().max(2_048).refine((value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }, "Conversation sources must use HTTPS."),
    dateChecked: z.string().date(),
  })
  .strict();

export const RoleConversationAnswerBlockSchema = z
  .object({
    id: identifierSchema,
    text: z.string().trim().min(1).max(500),
    sourceUrls: z.array(RoleConversationSourceSchema.shape.url).max(4),
  })
  .strict();

export const RoleConversationGenerationSchema = z
  .object({
    mode: z.enum(["interpretive", "researched", "unavailable"]),
    answerBlocks: z.array(RoleConversationAnswerBlockSchema).min(1).max(5),
    relevanceToStudent: z.string().trim().min(1).max(400),
    caveat: z.string().trim().min(1).max(350).nullable(),
    nextStep: z.string().trim().min(1).max(350).nullable(),
    sources: z.array(RoleConversationSourceSchema).max(6),
  })
  .strict();

export const RoleConversationAssistantMessageSchema = z
  .object({
    id: identifierSchema,
    role: z.literal("assistant"),
    branchId: identifierSchema,
    createdAt: z.string().datetime({ offset: true }),
    ...RoleConversationGenerationSchema.shape,
  })
  .strict();

export const RoleConversationUserMessageSchema = z
  .object({
    id: identifierSchema,
    role: z.literal("user"),
    branchId: identifierSchema,
    content: RoleConversationQuestionSchema,
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const RoleConversationMessageSchema = z.discriminatedUnion("role", [
  RoleConversationUserMessageSchema,
  RoleConversationAssistantMessageSchema,
]);

export const RoleConversationRequestSchema = z
  .object({
    profile: StudentProfileSchema,
    confirmedSummary: ConfirmedSummarySchema,
    branch: PathBranchSchema,
    history: z
      .array(RoleConversationMessageSchema)
      .max(MAX_ROLE_CONVERSATION_MESSAGES),
    question: RoleConversationQuestionSchema,
    requestId: identifierSchema,
    safetyIdentifier: z.string().trim().min(8).max(100),
  })
  .strict()
  .superRefine(({ branch, history }, context) => {
    const mismatchedIndex = history.findIndex(
      (message) => message.branchId !== branch.id,
    );
    if (mismatchedIndex !== -1) {
      context.addIssue({
        code: "custom",
        message: "Conversation history must belong to the selected role.",
        path: ["history", mismatchedIndex, "branchId"],
      });
    }
  });

export type RoleConversationSource = z.infer<
  typeof RoleConversationSourceSchema
>;
export type RoleConversationAnswerBlock = z.infer<
  typeof RoleConversationAnswerBlockSchema
>;
export type RoleConversationGeneration = z.infer<
  typeof RoleConversationGenerationSchema
>;
export type RoleConversationAssistantMessage = z.infer<
  typeof RoleConversationAssistantMessageSchema
>;
export type RoleConversationUserMessage = z.infer<
  typeof RoleConversationUserMessageSchema
>;
export type RoleConversationMessage = z.infer<
  typeof RoleConversationMessageSchema
>;
export type RoleConversationRequest = z.infer<
  typeof RoleConversationRequestSchema
>;

export type RoleConversationErrorCode =
  | "invalid_input"
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "retrieval_failure"
  | "api_failure"
  | "malformed_model_output";

export type RoleConversationApiResponse =
  | {
      ok: true;
      branchId: string;
      requestId: string;
      message: RoleConversationAssistantMessage;
    }
  | {
      ok: false;
      error: {
        code: RoleConversationErrorCode;
        message: string;
        retryable: boolean;
      };
    };

export const RoleConversationApiResponseSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      branchId: identifierSchema,
      requestId: identifierSchema,
      message: RoleConversationAssistantMessageSchema,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      error: z
        .object({
          code: z.enum([
            "invalid_input",
            "configuration_missing",
            "invalid_model_configuration",
            "timeout",
            "retrieval_failure",
            "api_failure",
            "malformed_model_output",
          ]),
          message: z.string().trim().min(1).max(300),
          retryable: z.boolean(),
        })
        .strict(),
    })
    .strict(),
]);

export function validateRoleConversationQuestion(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Ask a short question first.";
  if (trimmed.length < 2) return "Add a little more detail to your question.";
  if (trimmed.length > ROLE_QUESTION_MAX_LENGTH) {
    return `Keep your question under ${ROLE_QUESTION_MAX_LENGTH} characters.`;
  }
  return null;
}

const CURRENT_FACT_QUESTION_PATTERNS = [
  /\b(?:college|university|school|program|degree|major|course)s?\b/i,
  /\b(?:tuition|cost|fee|afford|scholarship|financial aid)\b/i,
  /\b(?:admission|requirement|application|deadline|eligib)\w*\b/i,
  /\b(?:license|licensing|certification|professional requirement)s?\b/i,
  /\b(?:salary|pay|job market|demand|outlook|openings)\b/i,
  /\b(?:near me|nearby|in manila|philippines|local opportunit)\w*\b/i,
  /\b(?:current|currently|latest|today|this year|available now)\b/i,
];

export function questionRequiresCurrentSources(question: string) {
  return CURRENT_FACT_QUESTION_PATTERNS.some((pattern) =>
    pattern.test(question),
  );
}

const UNSUPPORTED_CURRENT_CLAIM_PATTERNS = [
  /(?:₱|\$|php\s|usd\s)\s*\d/i,
  /\b(?:average|median|starting)\s+salary\b/i,
  /\b(?:acceptance|admission)\s+rate\b/i,
  /\b(?:employment|job)\s+(?:growth|demand|outlook)\b/i,
  /\b\d+(?:\.\d+)?%\s+(?:acceptance|admission|employment|growth|demand)\b/i,
];

export function containsUnsupportedCurrentClaim(value: string) {
  return UNSUPPORTED_CURRENT_CLAIM_PATTERNS.some((pattern) =>
    pattern.test(value),
  );
}

export type RoleConversationRequestState =
  | { status: "idle" }
  | {
      status: "loading";
      requestId: string;
      question: string;
      userMessageId: string;
    }
  | {
      status: "error";
      requestId: string;
      question: string;
      userMessageId: string;
      message: string;
      retryable: boolean;
    };

export type RoleConversationThread = {
  draft: string;
  messages: RoleConversationMessage[];
  request: RoleConversationRequestState;
};

export type RoleConversationThreads = Record<string, RoleConversationThread>;

export type RoleConversationThreadsAction =
  | { type: "draft"; branchId: string; value: string }
  | {
      type: "start";
      branchId: string;
      requestId: string;
      userMessage: RoleConversationUserMessage;
    }
  | {
      type: "retry";
      branchId: string;
      requestId: string;
      question: string;
      userMessageId: string;
    }
  | {
      type: "succeed";
      branchId: string;
      requestId: string;
      message: RoleConversationAssistantMessage;
    }
  | {
      type: "fail";
      branchId: string;
      requestId: string;
      message: string;
      retryable: boolean;
    }
  | { type: "reset"; branchId: string };

export function emptyRoleConversationThread(): RoleConversationThread {
  return { draft: "", messages: [], request: { status: "idle" } };
}

export function roleConversationThreadsReducer(
  state: RoleConversationThreads,
  action: RoleConversationThreadsAction,
): RoleConversationThreads {
  const current = state[action.branchId] ?? emptyRoleConversationThread();

  if (action.type === "draft") {
    return {
      ...state,
      [action.branchId]: { ...current, draft: action.value },
    };
  }
  if (action.type === "reset") {
    return { ...state, [action.branchId]: emptyRoleConversationThread() };
  }
  if (action.type === "start") {
    return {
      ...state,
      [action.branchId]: {
        draft: "",
        messages: [...current.messages, action.userMessage],
        request: {
          status: "loading",
          requestId: action.requestId,
          question: action.userMessage.content,
          userMessageId: action.userMessage.id,
        },
      },
    };
  }
  if (action.type === "retry") {
    return {
      ...state,
      [action.branchId]: {
        ...current,
        request: {
          status: "loading",
          requestId: action.requestId,
          question: action.question,
          userMessageId: action.userMessageId,
        },
      },
    };
  }
  if (action.type === "succeed") {
    if (
      current.request.status !== "loading" ||
      current.request.requestId !== action.requestId ||
      action.message.branchId !== action.branchId
    ) {
      return state;
    }
    return {
      ...state,
      [action.branchId]: {
        ...current,
        messages: [...current.messages, action.message],
        request: { status: "idle" },
      },
    };
  }
  if (
    current.request.status !== "loading" ||
    current.request.requestId !== action.requestId
  ) {
    return state;
  }
  return {
    ...state,
    [action.branchId]: {
      ...current,
      request: {
        status: "error",
        requestId: current.request.requestId,
        question: current.request.question,
        userMessageId: current.request.userMessageId,
        message: action.message,
        retryable: action.retryable,
      },
    },
  };
}

export function conversationHistoryForRequest(
  thread: RoleConversationThread,
  userMessageId: string,
) {
  return thread.messages.filter((message) => message.id !== userMessageId);
}

export function roleConversationWordCount(generation: RoleConversationGeneration) {
  return generation.answerBlocks
    .map((block) => block.text)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
