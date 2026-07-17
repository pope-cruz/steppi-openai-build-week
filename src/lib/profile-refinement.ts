import { z } from "zod";

import {
  StudentConstraintSchema,
  StudentFactSchema,
  StudentInferenceSchema,
  StudentProfileSchema,
  type StudentProfile,
} from "@/lib/schemas";

const identifierSchema = z.string().trim().min(1).max(80);
const statementSchema = z.string().trim().min(1).max(600);

const StudentUncertaintySchema = StudentProfileSchema.shape.uncertainties.element;
const StudentTensionSchema = StudentProfileSchema.shape.tensions.element;

const FactReplacementSchema = z
  .object({
    targetId: identifierSchema,
    statement: statementSchema,
    sourceAnswerIds: z.array(identifierSchema).min(1).max(12),
  })
  .strict();

const InferenceReplacementSchema = z
  .object({
    targetId: identifierSchema,
    statement: statementSchema,
    rationale: statementSchema,
    confidence: StudentInferenceSchema.shape.confidence,
  })
  .strict();

const ConstraintReplacementSchema = z
  .object({
    targetId: identifierSchema,
    type: StudentConstraintSchema.shape.type,
    statement: statementSchema,
    priority: StudentConstraintSchema.shape.priority,
  })
  .strict();

const UncertaintyReplacementSchema = z
  .object({
    targetId: identifierSchema,
    question: StudentUncertaintySchema.shape.question,
    whyItMatters: StudentUncertaintySchema.shape.whyItMatters,
  })
  .strict();

const TensionReplacementSchema = z
  .object({
    targetId: identifierSchema,
    description: StudentTensionSchema.shape.description,
    relatedFactIds: StudentTensionSchema.shape.relatedFactIds,
  })
  .strict();

export const ProfileRefinementPatchSchema = z
  .object({
    removeFactIds: z.array(identifierSchema).max(12),
    replaceFacts: z.array(FactReplacementSchema).max(12),
    addFacts: z.array(StudentFactSchema).max(12),
    removeInferenceIds: z.array(identifierSchema).max(8),
    replaceInferences: z.array(InferenceReplacementSchema).max(8),
    addInferences: z.array(StudentInferenceSchema).max(8),
    removeConstraintIds: z.array(identifierSchema).max(8),
    replaceConstraints: z.array(ConstraintReplacementSchema).max(8),
    addConstraints: z.array(StudentConstraintSchema).max(8),
    removeUncertaintyIds: z.array(identifierSchema).max(6),
    replaceUncertainties: z.array(UncertaintyReplacementSchema).max(6),
    addUncertainties: z.array(StudentUncertaintySchema).max(6),
    removeTensionIds: z.array(identifierSchema).max(4),
    replaceTensions: z.array(TensionReplacementSchema).max(4),
    addTensions: z.array(StudentTensionSchema).max(4),
  })
  .strict();

export const EMPTY_PROFILE_REFINEMENT_PATCH: ProfileRefinementPatch = {
  removeFactIds: [],
  replaceFacts: [],
  addFacts: [],
  removeInferenceIds: [],
  replaceInferences: [],
  addInferences: [],
  removeConstraintIds: [],
  replaceConstraints: [],
  addConstraints: [],
  removeUncertaintyIds: [],
  replaceUncertainties: [],
  addUncertainties: [],
  removeTensionIds: [],
  replaceTensions: [],
  addTensions: [],
};

export const ProfileRefinementTurnSchema = z
  .object({
    id: identifierSchema,
    question: z.string().trim().min(1).max(240),
    answer: z.string().trim().min(2).max(800),
    answeredAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const ProfileRefinementRequestSchema = z
  .object({
    profile: StudentProfileSchema,
    turns: z.array(ProfileRefinementTurnSchema).min(1).max(12),
  })
  .strict();

export const ProfileRefinementModelOutputSchema = z
  .object({
    patch: ProfileRefinementPatchSchema,
    acknowledgement: z.string().trim().min(1).max(180),
    decision: z.enum(["complete", "follow_up", "offer_choice"]),
    nextQuestion: z.string().trim().min(1).max(240).nullable(),
  })
  .strict()
  .superRefine(({ decision, nextQuestion }, context) => {
    if (decision === "follow_up" && nextQuestion === null) {
      context.addIssue({
        code: "custom",
        message: "A follow-up decision requires one next question.",
        path: ["nextQuestion"],
      });
    }
    if (decision !== "follow_up" && nextQuestion !== null) {
      context.addIssue({
        code: "custom",
        message: "Completion and choice decisions cannot include another question.",
        path: ["nextQuestion"],
      });
    }
  });

export const PROFILE_REFINEMENT_OPENING_QUESTION =
  "What would you like Steppi to understand differently before building your map?";

export type ProfileRefinementPatch = z.infer<
  typeof ProfileRefinementPatchSchema
>;
export type ProfileRefinementTurn = z.infer<typeof ProfileRefinementTurnSchema>;
export type ProfileRefinementRequest = z.infer<
  typeof ProfileRefinementRequestSchema
>;
export type ProfileRefinementModelOutput = z.infer<
  typeof ProfileRefinementModelOutputSchema
>;

export type ProfileSummary = {
  decision: string;
  signals: string[];
  practicalContext: string[];
  openQuestions: string[];
};

export class ProfileRefinementApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileRefinementApplicationError";
  }
}

function studentFacingStatement(statement: string) {
  const replacements: Array<[RegExp, string]> = [
    [/^The student is\b/i, "You are"],
    [/^The student has\b/i, "You have"],
    [/^The student does\b/i, "You do"],
    [/^The student enjoys\b/i, "You enjoy"],
    [/^The student dislikes\b/i, "You dislike"],
    [/^The student prefers\b/i, "You prefer"],
    [/^The student needs\b/i, "You need"],
    [/^The student wants\b/i, "You want"],
  ];
  let result = statement;

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }

  result = result.replace(/\bthe student's\b/gi, "your");
  if (/^You\b/.test(result)) {
    result = result
      .replace(/\bdislikes\b/g, "dislike")
      .replace(/\benjoys\b/g, "enjoy")
      .replace(/\bprefers\b/g, "prefer")
      .replace(/\bneeds\b/g, "need")
      .replace(/\bwants\b/g, "want");
  }

  return result;
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new ProfileRefinementApplicationError(`${label} contains duplicate IDs.`);
  }
}

function applyCollectionPatch<
  Item extends { id: string },
  Replacement extends { targetId: string },
>({
  additions,
  current,
  label,
  removals,
  replacements,
  replace,
}: {
  additions: Item[];
  current: Item[];
  label: string;
  removals: string[];
  replacements: Replacement[];
  replace: (item: Item, replacement: Replacement) => Item;
}) {
  const currentIds = new Set(current.map((item) => item.id));
  const replacementIds = replacements.map((item) => item.targetId);
  const additionIds = additions.map((item) => item.id);

  assertUnique(removals, `${label} removals`);
  assertUnique(replacementIds, `${label} replacements`);
  assertUnique(additionIds, `${label} additions`);

  for (const targetId of [...removals, ...replacementIds]) {
    if (!currentIds.has(targetId)) {
      throw new ProfileRefinementApplicationError(
        `${label} target "${targetId}" does not exist.`,
      );
    }
  }

  const removalSet = new Set(removals);
  if (replacementIds.some((id) => removalSet.has(id))) {
    throw new ProfileRefinementApplicationError(
      `${label} cannot remove and replace the same item.`,
    );
  }
  if (additionIds.some((id) => currentIds.has(id))) {
    throw new ProfileRefinementApplicationError(
      `${label} additions cannot reuse an existing ID.`,
    );
  }

  const replacementMap = new Map(
    replacements.map((replacement) => [replacement.targetId, replacement]),
  );

  return [
    ...current
      .filter((item) => !removalSet.has(item.id))
      .map((item) => {
        const replacement = replacementMap.get(item.id);
        return replacement ? replace(item, replacement) : structuredClone(item);
      }),
    ...additions.map((item) => structuredClone(item)),
  ];
}

export function applyProfileRefinementPatch(
  currentProfile: StudentProfile,
  input: unknown,
  turns: ProfileRefinementTurn[],
): StudentProfile {
  const profile = StudentProfileSchema.parse(currentProfile);
  const patch = ProfileRefinementPatchSchema.parse(input);
  const parsedTurns = z.array(ProfileRefinementTurnSchema).min(1).max(12).parse(turns);
  const validSourceIds = new Set([
    ...profile.facts.flatMap((fact) => fact.sourceAnswerIds),
    ...parsedTurns.map((turn) => turn.id),
  ]);
  const refinementTurnIds = new Set(parsedTurns.map((turn) => turn.id));

  for (const fact of [
    ...patch.replaceFacts.map((replacement) => ({
      id: replacement.targetId,
      sourceAnswerIds: replacement.sourceAnswerIds,
    })),
    ...patch.addFacts,
  ]) {
    if (fact.sourceAnswerIds.some((id) => !validSourceIds.has(id))) {
      throw new ProfileRefinementApplicationError(
        `Fact "${fact.id}" cites an unknown source answer.`,
      );
    }
    if (!fact.sourceAnswerIds.some((id) => refinementTurnIds.has(id))) {
      throw new ProfileRefinementApplicationError(
        `Fact "${fact.id}" must cite a refinement answer.`,
      );
    }
  }

  const facts = applyCollectionPatch({
    current: profile.facts,
    removals: patch.removeFactIds,
    replacements: patch.replaceFacts,
    additions: patch.addFacts,
    label: "Fact",
    replace: (item, replacement) => ({
      ...item,
      statement: replacement.statement,
      sourceAnswerIds: [...replacement.sourceAnswerIds],
    }),
  });
  const inferences = applyCollectionPatch({
    current: profile.inferences,
    removals: patch.removeInferenceIds,
    replacements: patch.replaceInferences,
    additions: patch.addInferences,
    label: "Inference",
    replace: (item, replacement) => ({
      ...item,
      statement: replacement.statement,
      rationale: replacement.rationale,
      confidence: replacement.confidence,
    }),
  });
  const constraints = applyCollectionPatch({
    current: profile.constraints,
    removals: patch.removeConstraintIds,
    replacements: patch.replaceConstraints,
    additions: patch.addConstraints,
    label: "Constraint",
    replace: (item, replacement) => ({
      ...item,
      type: replacement.type,
      statement: replacement.statement,
      priority: replacement.priority,
    }),
  });
  const uncertainties = applyCollectionPatch({
    current: profile.uncertainties,
    removals: patch.removeUncertaintyIds,
    replacements: patch.replaceUncertainties,
    additions: patch.addUncertainties,
    label: "Uncertainty",
    replace: (item, replacement) => ({
      ...item,
      question: replacement.question,
      whyItMatters: replacement.whyItMatters,
    }),
  });
  const tensions = applyCollectionPatch({
    current: profile.tensions,
    removals: patch.removeTensionIds,
    replacements: patch.replaceTensions,
    additions: patch.addTensions,
    label: "Tension",
    replace: (item, replacement) => ({
      ...item,
      description: replacement.description,
      relatedFactIds: [...replacement.relatedFactIds],
    }),
  });

  const factIds = new Set(facts.map((fact) => fact.id));
  if (
    tensions.some((tension) =>
      tension.relatedFactIds.some((factId) => !factIds.has(factId)),
    )
  ) {
    throw new ProfileRefinementApplicationError(
      "A resulting tension references a missing fact.",
    );
  }

  return StudentProfileSchema.parse({
    facts,
    inferences,
    constraints,
    uncertainties,
    tensions,
  });
}

export function buildProfileSummary(profile: StudentProfile): ProfileSummary {
  const parsed = StudentProfileSchema.parse(profile);

  return {
    decision:
      parsed.uncertainties[0]?.question ??
      "Which three college or career directions are worth exploring first?",
    signals: [
      ...parsed.facts.map((fact) => fact.statement),
      ...parsed.inferences.map((inference) => inference.statement),
    ]
      .slice(0, 5)
      .map(studentFacingStatement),
    practicalContext: parsed.constraints
      .map((constraint) => constraint.statement)
      .map(studentFacingStatement),
    openQuestions: [
      ...parsed.uncertainties.map((uncertainty) => uncertainty.question),
      ...parsed.tensions.map((tension) => tension.description),
    ]
      .slice(0, 4)
      .map(studentFacingStatement),
  };
}

export function appendProfileRefinementTurn(
  turns: ProfileRefinementTurn[],
  question: string,
  answer: string,
  answeredAt: string,
): ProfileRefinementTurn[] {
  const trimmedAnswer = answer.trim();
  const id = `profile-refinement-${turns.length + 1}`;

  if (turns.some((turn) => turn.id === id)) {
    return turns;
  }

  const nextTurn = ProfileRefinementTurnSchema.parse({
    id,
    question,
    answer: trimmedAnswer,
    answeredAt,
  });

  return [...turns, nextTurn];
}
