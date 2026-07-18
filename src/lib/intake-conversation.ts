import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(80);
const contextTextSchema = z.string().trim().min(1).max(400);

export const MAX_CONVERSATION_TURNS = 6;

export const IntakeControllerStageSchema = z.enum([
  "anchor-existing",
  "anchor-school",
  "anchor-outside",
  "follow-up-1",
  "follow-up-2",
  "final",
  "profile",
]);

const QuestionStageSchema = IntakeControllerStageSchema.exclude(["profile"]);

export const FollowUpPurposeSchema = z.enum([
  "resolve-contradiction",
  "distinguish-directions",
  "clarify-practical-constraint",
  "material-evidence-gap",
]);

export const FOLLOW_UP_PRIORITY = [
  "resolve-contradiction",
  "distinguish-directions",
  "clarify-practical-constraint",
  "material-evidence-gap",
] as const satisfies ReadonlyArray<FollowUpPurpose>;

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

export const FollowUpCandidateSchema = z
  .object({
    purpose: FollowUpPurposeSchema,
    rationale: z.string().trim().min(1).max(300),
    targetItemIds: z.array(identifierSchema).max(8),
    targetDimensions: z.array(IntakeDimensionSchema).max(3),
    sourceTurnIds: z.array(identifierSchema).max(8),
    question: z.string().trim().min(1).max(240),
  })
  .strict();

export const ConversationTurnPatchSchema = z
  .object({
    updates: ConversationUpdatesSchema,
    supersedeItemIds: z.array(identifierSchema).max(20),
    unresolvedDimensions: z.array(IntakeDimensionSchema).max(9),
    acknowledgement: z.string().trim().min(1).max(180).nullable(),
    followUpCandidates: z.array(FollowUpCandidateSchema).max(4),
  })
  .strict();

export const ConversationTurnSchema = z
  .object({
    id: identifierSchema,
    stage: QuestionStageSchema,
    purpose: FollowUpPurposeSchema.nullable(),
    acknowledgement: z.string().trim().min(1).max(180).nullable(),
    question: z.string().trim().min(1).max(240),
    answer: z.string().trim().min(1).max(800),
    answeredAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine(({ purpose, stage }, context) => {
    const isFollowUp = stage === "follow-up-1" || stage === "follow-up-2";
    if (isFollowUp !== (purpose !== null)) {
      context.addIssue({
        code: "custom",
        message: "Only follow-up turns may declare a follow-up purpose.",
        path: ["purpose"],
      });
    }
  });

export const IntakeTurnRequestSchema = z
  .object({
    state: ConversationStateSchema,
    turns: z.array(ConversationTurnSchema).min(1).max(MAX_CONVERSATION_TURNS),
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

export type IntakeControllerStage = z.infer<
  typeof IntakeControllerStageSchema
>;
export type FollowUpPurpose = z.infer<typeof FollowUpPurposeSchema>;
export type IntakeDimension = z.infer<typeof IntakeDimensionSchema>;
export type ConversationContextItem = z.infer<
  typeof ConversationContextItemSchema
>;
export type ConversationState = z.infer<typeof ConversationStateSchema>;
export type FollowUpCandidate = z.infer<typeof FollowUpCandidateSchema>;
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

const DIRECTIONAL_STATE_KEYS = [
  "interpretedInterests",
  "preferences",
  "consideredPaths",
] as const satisfies ReadonlyArray<keyof ConversationState>;

const DIRECTIONAL_DIMENSIONS = new Set<IntakeDimension>([
  "interests",
  "considered-paths",
  "strengths-and-preferences",
  "certainty-and-help-goal",
]);

const GENERIC_ACKNOWLEDGEMENTS = new Set([
  "thanks",
  "thank you",
  "thanks for sharing",
  "thank you for sharing",
  "that makes sense",
  "got it",
  "great answer",
  "interesting",
]);

const ALLOWED_CONTRASTS = [
  /enjoy\b.*\bavoid/,
  /avoid\b.*\benjoy/,
  /include\b.*\bexclude/,
  /exclude\b.*\binclude/,
  /want more\b.*\bwant less/,
  /want less\b.*\bwant more/,
  /attract\w*\b.*\bhesitat/,
  /hesitat\w*\b.*\battract/,
  /like\b.*\bdislike/,
  /dislike\b.*\blike/,
  /repeat\b.*\bavoid/,
  /avoid\b.*\brepeat/,
];

export class ConversationPatchError extends Error {
  constructor() {
    super("invalid_conversation_patch");
    this.name = "ConversationPatchError";
  }
}

export function normalizedConversationText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isFinalDeclineAnswer(answer: string) {
  return new Set(["no", "nothing", "nothing else", "i dont know"]).has(
    normalizedConversationText(answer),
  );
}

export function isProhibitedGenericQuestion(question: string) {
  const normalized = normalizedConversationText(question);
  return [
    /^(?:(?:can you )?(?:tell me|share|describe) )?(?:(?:what|which) (?:are )?)?your (?:main |biggest |top )?strengths(?: are)?$/,
    /^(?:(?:can you )?(?:tell me|share|describe) )?(?:(?:what|which) (?:are )?)?your (?:main |biggest |top )?weaknesses(?: are)?$/,
    /^(?:can you (?:tell me|share)|tell me|describe)?\s*what kind of person (?:are you|you are)$/,
    /^(?:do|would) you prefer (?:to )?work(?:ing)? alone or with others$/,
    /^where do you see yourself in (?:five|5) years(?: time)?$/,
  ].some((pattern) => pattern.test(normalized));
}

export function hasMultipleIndependentQuestions(question: string) {
  if ((question.match(/\?/g) ?? []).length > 1 || /\n\s*[-*\d]/.test(question)) {
    return true;
  }

  const normalized = normalizedConversationText(question);
  if (ALLOWED_CONTRASTS.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  return /\b(?:and|also|plus)\s+(?:what|where|when|why|how|which|do|are|would|have|can)\b/.test(
    normalized,
  );
}

function sanitizeAcknowledgement(acknowledgement: string | null) {
  if (
    acknowledgement === null ||
    GENERIC_ACKNOWLEDGEMENTS.has(normalizedConversationText(acknowledgement))
  ) {
    return null;
  }
  return acknowledgement;
}

function parsedInputs(
  currentState: ConversationState,
  patchInput: ConversationTurnPatch,
  turns: ConversationTurn[],
) {
  const stateResult = ConversationStateSchema.safeParse(currentState);
  const patchResult = ConversationTurnPatchSchema.safeParse(patchInput);
  const turnsResult = z
    .array(ConversationTurnSchema)
    .min(1)
    .max(MAX_CONVERSATION_TURNS)
    .safeParse(turns);

  if (!stateResult.success || !patchResult.success || !turnsResult.success) {
    throw new ConversationPatchError();
  }

  return {
    state: stateResult.data,
    patch: patchResult.data,
    turns: turnsResult.data,
  };
}

function applyValidatedUpdates(
  state: ConversationState,
  patch: ConversationTurnPatch,
  turns: ConversationTurn[],
) {
  const validTurnIds = new Set(turns.map((turn) => turn.id));
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

  const latestTurnId = turns.at(-1)!.id;
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
  };

  const parsedNextState = ConversationStateSchema.safeParse(nextState);
  if (!parsedNextState.success) {
    throw new ConversationPatchError();
  }
  return parsedNextState.data;
}

function candidateIsEligible({
  candidate,
  nextState,
  patch,
  priorState,
  turns,
}: {
  candidate: FollowUpCandidate;
  nextState: ConversationState;
  patch: ConversationTurnPatch;
  priorState: ConversationState;
  turns: ConversationTurn[];
}) {
  const validTurnIds = new Set(turns.map((turn) => turn.id));
  const priorItems = ACTIVE_STATE_KEYS.flatMap((key) => priorState[key]);
  const nextItems = ACTIVE_STATE_KEYS.flatMap((key) => nextState[key]);
  const validItemIds = new Set([...priorItems, ...nextItems].map((item) => item.id));
  const unresolved = new Set(patch.unresolvedDimensions);
  const askedQuestions = new Set(
    turns.map((turn) => normalizedConversationText(turn.question)),
  );

  if (
    candidate.sourceTurnIds.some((id) => !validTurnIds.has(id)) ||
    candidate.targetItemIds.some((id) => !validItemIds.has(id)) ||
    new Set(candidate.targetItemIds).size !== candidate.targetItemIds.length ||
    new Set(candidate.targetDimensions).size !==
      candidate.targetDimensions.length ||
    isProhibitedGenericQuestion(candidate.question) ||
    hasMultipleIndependentQuestions(candidate.question) ||
    askedQuestions.has(normalizedConversationText(candidate.question))
  ) {
    return false;
  }

  if (candidate.purpose === "resolve-contradiction") {
    return (
      patch.supersedeItemIds.length > 0 || candidate.targetItemIds.length >= 2
    );
  }

  if (candidate.purpose === "distinguish-directions") {
    const directionalIds = new Set(
      DIRECTIONAL_STATE_KEYS.flatMap((key) => nextState[key]).map(
        (item) => item.id,
      ),
    );
    return (
      [...unresolved].some((dimension) =>
        DIRECTIONAL_DIMENSIONS.has(dimension),
      ) &&
      candidate.targetItemIds.filter((id) => directionalIds.has(id)).length >= 2
    );
  }

  if (candidate.purpose === "clarify-practical-constraint") {
    const constraintIds = new Set(nextState.constraints.map((item) => item.id));
    return (
      unresolved.has("constraints") &&
      (candidate.targetDimensions.includes("constraints") ||
        candidate.targetItemIds.some((id) => constraintIds.has(id)))
    );
  }

  return (
    candidate.targetDimensions.length > 0 &&
    candidate.targetDimensions.every((dimension) => unresolved.has(dimension))
  );
}

export function prepareConversationPatchForController(
  currentState: ConversationState,
  patchInput: ConversationTurnPatch,
  turns: ConversationTurn[],
): ConversationTurnPatch {
  const { state, patch, turns: parsedTurns } = parsedInputs(
    currentState,
    patchInput,
    turns,
  );
  const nextState = applyValidatedUpdates(state, patch, parsedTurns);
  const seenPurposes = new Set<FollowUpPurpose>();
  const followUpCandidates = patch.followUpCandidates.filter((candidate) => {
    if (
      seenPurposes.has(candidate.purpose) ||
      !candidateIsEligible({
        candidate,
        nextState,
        patch,
        priorState: state,
        turns: parsedTurns,
      })
    ) {
      return false;
    }
    seenPurposes.add(candidate.purpose);
    return true;
  });

  return ConversationTurnPatchSchema.parse({
    ...patch,
    acknowledgement: sanitizeAcknowledgement(patch.acknowledgement),
    followUpCandidates,
  });
}

export function applyConversationPatch(
  currentState: ConversationState,
  patchInput: ConversationTurnPatch,
  turns: ConversationTurn[],
) {
  const prepared = prepareConversationPatchForController(
    currentState,
    patchInput,
    turns,
  );
  return applyValidatedUpdates(
    ConversationStateSchema.parse(currentState),
    prepared,
    z.array(ConversationTurnSchema).parse(turns),
  );
}

export type ConversationQuestion = {
  id: string;
  stage: Exclude<IntakeControllerStage, "profile">;
  purpose: FollowUpPurpose | null;
  acknowledgement: string | null;
  prompt: string;
  helper: string;
  placeholder: string;
  quickResponses?: string[];
};

const ANCHOR_EXISTING_QUESTION: ConversationQuestion = {
  id: "anchor-existing",
  stage: "anchor-existing",
  purpose: null,
  acknowledgement: null,
  prompt:
    "Which college programs, majors, careers, or fields have you already considered, and what attracts you or makes you hesitate about them?",
  helper: "It is okay if you have several ideas or none that feel settled.",
  placeholder: "I have considered…",
};

const ANCHOR_SCHOOL_QUESTION: ConversationQuestion = {
  id: "anchor-school",
  stage: "anchor-school",
  purpose: null,
  acknowledgement: null,
  prompt:
    "Looking at your classes, projects, and school activities, which concrete kinds of work—such as researching, solving, writing, explaining, presenting, designing, building, organizing, or helping—do you enjoy or dislike?",
  helper: "Specific moments are useful, even if your reaction was mixed.",
  placeholder: "At school, I tend to enjoy…",
};

const ANCHOR_OUTSIDE_QUESTION: ConversationQuestion = {
  id: "anchor-outside",
  stage: "anchor-outside",
  purpose: null,
  acknowledgement: null,
  prompt:
    "Outside school—in clubs, hobbies, games, work, family responsibilities, communities, volunteering, or personal projects—which experiences have mattered to you, and which parts do you enjoy or avoid?",
  helper: "Small, informal, and family experiences count too.",
  placeholder: "Outside school, I have…",
};

export const FINAL_CONSIDERATION_QUESTION: ConversationQuestion = {
  id: "final-consideration",
  stage: "final",
  purpose: null,
  acknowledgement: null,
  prompt: "Before I put this together, is there anything else Steppi should consider?",
  helper: "“No,” “nothing,” and “I don’t know” are completely okay.",
  placeholder: "One more thing—or nothing—is…",
  quickResponses: ["Nothing", "I don’t know"],
};

const FALLBACK_FOLLOW_UP_PROMPT =
  "Of the experiences you mentioned, which part would you most want a future path to include, and which part would you most want it to avoid?";

export function firstConversationQuestion() {
  return ANCHOR_EXISTING_QUESTION;
}

function questionWithAcknowledgement(
  question: ConversationQuestion,
  acknowledgement: string | null,
) {
  return { ...question, acknowledgement };
}

function selectedCandidate(
  patch: ConversationTurnPatch,
  turns: ConversationTurn[],
) {
  const purposesAlreadyAsked = new Set(
    turns.flatMap((turn) => (turn.purpose ? [turn.purpose] : [])),
  );
  return FOLLOW_UP_PRIORITY.map((purpose) =>
    patch.followUpCandidates.find(
      (candidate) =>
        candidate.purpose === purpose && !purposesAlreadyAsked.has(purpose),
    ),
  ).find((candidate) => candidate !== undefined);
}

function followUpQuestion(
  stage: "follow-up-1" | "follow-up-2",
  patch: ConversationTurnPatch | null,
  turns: ConversationTurn[],
): ConversationQuestion {
  const candidate = patch ? selectedCandidate(patch, turns) : undefined;
  return {
    id: stage,
    stage,
    purpose: candidate?.purpose ?? "distinguish-directions",
    acknowledgement: patch?.acknowledgement ?? null,
    prompt: candidate?.question ?? FALLBACK_FOLLOW_UP_PROMPT,
    helper: "Answer in your own words. “I’m not sure” is always okay.",
    placeholder: "What comes to mind is…",
  };
}

export function nextControllerQuestion({
  completedTurn,
  patch,
  turns,
}: {
  completedTurn: ConversationTurn;
  patch: ConversationTurnPatch;
  turns: ConversationTurn[];
}): ConversationQuestion | null {
  if (completedTurn.stage === "anchor-existing") {
    return questionWithAcknowledgement(
      ANCHOR_SCHOOL_QUESTION,
      patch.acknowledgement,
    );
  }
  if (completedTurn.stage === "anchor-school") {
    return questionWithAcknowledgement(
      ANCHOR_OUTSIDE_QUESTION,
      patch.acknowledgement,
    );
  }
  if (completedTurn.stage === "anchor-outside") {
    return followUpQuestion("follow-up-1", patch, turns);
  }
  if (completedTurn.stage === "follow-up-1") {
    if (selectedCandidate(patch, turns)) {
      return followUpQuestion("follow-up-2", patch, turns);
    }
    return questionWithAcknowledgement(
      FINAL_CONSIDERATION_QUESTION,
      patch.acknowledgement,
    );
  }
  if (completedTurn.stage === "follow-up-2") {
    return questionWithAcknowledgement(
      FINAL_CONSIDERATION_QUESTION,
      patch.acknowledgement,
    );
  }
  return null;
}

export function questionAfterInterpretationFailure(
  completedTurn: ConversationTurn,
): ConversationQuestion | null {
  if (completedTurn.stage === "anchor-existing") {
    return ANCHOR_SCHOOL_QUESTION;
  }
  if (completedTurn.stage === "anchor-school") {
    return ANCHOR_OUTSIDE_QUESTION;
  }
  if (completedTurn.stage === "anchor-outside") {
    return followUpQuestion("follow-up-1", null, [completedTurn]);
  }
  if (
    completedTurn.stage === "follow-up-1" ||
    completedTurn.stage === "follow-up-2"
  ) {
    return FINAL_CONSIDERATION_QUESTION;
  }
  return null;
}
