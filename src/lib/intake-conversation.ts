import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(80);
const contextTextSchema = z.string().trim().min(1).max(400);

export const IntakeDimensionSchema = z.enum([
  "grade",
  "interests",
  "subjects-and-activities",
  "experiences",
  "considered-paths",
  "strengths-and-preferences",
  "dislikes",
  "constraints",
  "certainty-and-help-goal",
]);

export const ConversationContextItemSchema = z
  .object({
    id: identifierSchema,
    text: contextTextSchema,
    basis: z.enum(["explicit", "tentative-interpretation"]),
    sourceTurnIds: z.array(identifierSchema).min(1).max(8),
  })
  .strict();

const contextItemArraySchema = z.array(ConversationContextItemSchema).max(20);

export const SupersededConversationItemSchema = z
  .object({
    itemId: identifierSchema,
    text: contextTextSchema,
    supersededByTurnId: identifierSchema,
  })
  .strict();

export const ConversationStateSchema = z
  .object({
    suppliedFacts: contextItemArraySchema,
    interpretedInterests: contextItemArraySchema,
    experiences: contextItemArraySchema,
    preferences: contextItemArraySchema,
    dislikes: contextItemArraySchema,
    constraints: contextItemArraySchema,
    consideredPaths: contextItemArraySchema,
    uncertainty: contextItemArraySchema,
    correctedOrSupersededInformation: z
      .array(SupersededConversationItemSchema)
      .max(20),
    unresolvedDimensions: z.array(IntakeDimensionSchema).max(9),
    enoughContext: z.boolean(),
  })
  .strict();

const ConversationUpdatesSchema = z
  .object({
    suppliedFacts: contextItemArraySchema,
    interpretedInterests: contextItemArraySchema,
    experiences: contextItemArraySchema,
    preferences: contextItemArraySchema,
    dislikes: contextItemArraySchema,
    constraints: contextItemArraySchema,
    consideredPaths: contextItemArraySchema,
    uncertainty: contextItemArraySchema,
  })
  .strict();

export const ConversationTurnPatchSchema = z
  .object({
    updates: ConversationUpdatesSchema,
    supersedeItemIds: z.array(identifierSchema).max(20),
    unresolvedDimensions: z.array(IntakeDimensionSchema).max(9),
    enoughContext: z.boolean(),
    acknowledgement: z.string().trim().min(1).max(180),
    nextQuestion: z.string().trim().min(1).max(240).nullable(),
  })
  .strict()
  .superRefine(({ enoughContext, nextQuestion }, context) => {
    if (enoughContext && nextQuestion !== null) {
      context.addIssue({
        code: "custom",
        message: "A completed intake cannot include another question.",
        path: ["nextQuestion"],
      });
    }

    if (!enoughContext && nextQuestion === null) {
      context.addIssue({
        code: "custom",
        message: "An incomplete intake requires one next question.",
        path: ["nextQuestion"],
      });
    }
  });

export const ConversationTurnSchema = z
  .object({
    id: identifierSchema,
    acknowledgement: z.string().trim().min(1).max(180).nullable(),
    question: z.string().trim().min(1).max(240),
    answer: z.string().trim().min(1).max(800),
    answeredAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const IntakeTurnRequestSchema = z
  .object({
    state: ConversationStateSchema,
    turns: z.array(ConversationTurnSchema).min(1).max(12),
  })
  .strict();

export const IntakeTurnApiResponseSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      patch: ConversationTurnPatchSchema,
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

export type IntakeDimension = z.infer<typeof IntakeDimensionSchema>;
export type ConversationContextItem = z.infer<
  typeof ConversationContextItemSchema
>;
export type ConversationState = z.infer<typeof ConversationStateSchema>;
export type ConversationTurnPatch = z.infer<
  typeof ConversationTurnPatchSchema
>;
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
export type IntakeTurnApiResponse = z.infer<
  typeof IntakeTurnApiResponseSchema
>;

export const EMPTY_CONVERSATION_STATE: ConversationState = {
  suppliedFacts: [],
  interpretedInterests: [],
  experiences: [],
  preferences: [],
  dislikes: [],
  constraints: [],
  consideredPaths: [],
  uncertainty: [],
  correctedOrSupersededInformation: [],
  unresolvedDimensions: [...IntakeDimensionSchema.options],
  enoughContext: false,
};

const ACTIVE_STATE_KEYS = [
  "suppliedFacts",
  "interpretedInterests",
  "experiences",
  "preferences",
  "dislikes",
  "constraints",
  "consideredPaths",
  "uncertainty",
] as const satisfies ReadonlyArray<keyof ConversationState>;

export class ConversationPatchError extends Error {
  constructor() {
    super("invalid_conversation_patch");
    this.name = "ConversationPatchError";
  }
}

export function applyConversationPatch(
  currentState: ConversationState,
  patchInput: ConversationTurnPatch,
  turns: ConversationTurn[],
) {
  const stateResult = ConversationStateSchema.safeParse(currentState);
  const patchResult = ConversationTurnPatchSchema.safeParse(patchInput);
  const turnsResult = z.array(ConversationTurnSchema).min(1).max(12).safeParse(turns);

  if (!stateResult.success || !patchResult.success || !turnsResult.success) {
    throw new ConversationPatchError();
  }

  const state = stateResult.data;
  const patch = patchResult.data;
  const validTurnIds = new Set(turnsResult.data.map((turn) => turn.id));
  const activeItems = ACTIVE_STATE_KEYS.flatMap((key) => state[key]);
  const activeById = new Map(activeItems.map((item) => [item.id, item]));
  const supersedeIds = new Set(patch.supersedeItemIds);
  const addedItems = ACTIVE_STATE_KEYS.flatMap((key) => patch.updates[key]);
  const addedIds = new Set<string>();

  if (
    activeById.size !== activeItems.length ||
    supersedeIds.size !== patch.supersedeItemIds.length ||
    new Set(patch.unresolvedDimensions).size !== patch.unresolvedDimensions.length
  ) {
    throw new ConversationPatchError();
  }

  for (const id of supersedeIds) {
    if (!activeById.has(id)) {
      throw new ConversationPatchError();
    }
  }

  for (const item of addedItems) {
    if (
      addedIds.has(item.id) ||
      (activeById.has(item.id) && !supersedeIds.has(item.id)) ||
      item.sourceTurnIds.some((turnId) => !validTurnIds.has(turnId))
    ) {
      throw new ConversationPatchError();
    }
    addedIds.add(item.id);
  }

  const latestTurnId = turnsResult.data.at(-1)!.id;
  const newlySuperseded = patch.supersedeItemIds.map((itemId) => ({
    itemId,
    text: activeById.get(itemId)!.text,
    supersededByTurnId: latestTurnId,
  }));

  const nextState: ConversationState = {
    suppliedFacts: [
      ...state.suppliedFacts.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.suppliedFacts,
    ],
    interpretedInterests: [
      ...state.interpretedInterests.filter(
        (item) => !supersedeIds.has(item.id),
      ),
      ...patch.updates.interpretedInterests,
    ],
    experiences: [
      ...state.experiences.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.experiences,
    ],
    preferences: [
      ...state.preferences.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.preferences,
    ],
    dislikes: [
      ...state.dislikes.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.dislikes,
    ],
    constraints: [
      ...state.constraints.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.constraints,
    ],
    consideredPaths: [
      ...state.consideredPaths.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.consideredPaths,
    ],
    uncertainty: [
      ...state.uncertainty.filter((item) => !supersedeIds.has(item.id)),
      ...patch.updates.uncertainty,
    ],
    correctedOrSupersededInformation: [
      ...state.correctedOrSupersededInformation,
      ...newlySuperseded,
    ],
    unresolvedDimensions: patch.unresolvedDimensions,
    enoughContext: patch.enoughContext,
  };

  const parsedNextState = ConversationStateSchema.safeParse(nextState);
  if (!parsedNextState.success) {
    throw new ConversationPatchError();
  }

  return parsedNextState.data;
}

export type ConversationQuestion = {
  id: string;
  acknowledgement: string | null;
  prompt: string;
  helper: string;
  placeholder: string;
  quickResponses?: string[];
};

export const STARTING_CONVERSATION_QUESTION: ConversationQuestion = {
  id: "starting-point",
  acknowledgement: null,
  prompt: "What are you trying to figure out about college or work right now?",
  helper:
    "Start wherever makes sense. You can mention ideas you have, things you enjoy, or what feels unclear.",
  placeholder: "I’m trying to figure out…",
  quickResponses: ["I have a few ideas", "I’m starting from scratch"],
};

export function questionFromPatch(
  patch: ConversationTurnPatch,
  turnCount: number,
): ConversationQuestion | null {
  if (patch.enoughContext || patch.nextQuestion === null) {
    return null;
  }

  return {
    id: `follow-up-${turnCount + 1}`,
    acknowledgement: patch.acknowledgement,
    prompt: patch.nextQuestion,
    helper: "Answer in your own words. “I’m not sure” is always okay.",
    placeholder: "What comes to mind is…",
  };
}

export function fallbackConversationQuestion(
  turnCount: number,
): ConversationQuestion {
  return {
    id: `fallback-${turnCount + 1}`,
    acknowledgement:
      "I couldn’t safely interpret that answer, but your words are still here.",
    prompt:
      "What feels most important for Steppi to understand from what you just shared?",
    helper:
      "Your previous answer is still here. Add whatever would make it easier to understand.",
    placeholder: "The part I most want to make clear is…",
  };
}
