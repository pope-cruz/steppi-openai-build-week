import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(80);
const statementSchema = z.string().trim().min(1).max(600);
const pathSentenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(280)
  .refine(
    (value) => (value.match(/[.!?](?=\s|$)/g) ?? []).length <= 1,
    "Path explanation items must contain no more than one sentence.",
  );

export const StudentFactSchema = z
  .object({
    id: identifierSchema,
    statement: statementSchema,
    sourceAnswerIds: z.array(identifierSchema).min(1).max(12),
  })
  .strict();

export const StudentInferenceSchema = z
  .object({
    id: identifierSchema,
    statement: statementSchema,
    rationale: statementSchema,
    confidence: z.enum(["low", "medium", "high"]),
    editable: z.literal(true),
  })
  .strict();

export const StudentConstraintSchema = z
  .object({
    id: identifierSchema,
    type: z.enum([
      "financial",
      "geographic",
      "academic",
      "family",
      "accessibility",
      "preference",
      "other",
    ]),
    statement: statementSchema,
    priority: z.enum(["low", "medium", "high"]),
  })
  .strict();

export const IntakeAnswerSchema = z
  .object({
    questionId: identifierSchema,
    question: z.string().trim().min(1).max(240),
    answer: z.union([
      z.string().trim().min(1).max(800),
      z.array(z.string().trim().min(1).max(160)).min(1).max(12),
    ]),
    answeredAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const IntakeRequestSchema = z
  .object({
    answers: z.array(IntakeAnswerSchema).min(4).max(20),
  })
  .strict();

export const StudentProfileSchema = z
  .object({
    facts: z
      .array(StudentFactSchema)
      .max(12),
    inferences: z
      .array(StudentInferenceSchema)
      .max(8),
    constraints: z
      .array(StudentConstraintSchema)
      .max(8),
    uncertainties: z
      .array(
        z
          .object({
            id: identifierSchema,
            question: z.string().trim().min(1).max(300),
            whyItMatters: statementSchema,
          })
          .strict(),
      )
      .max(6),
    tensions: z
      .array(
        z
          .object({
            id: identifierSchema,
            description: statementSchema,
            relatedFactIds: z.array(identifierSchema).min(1).max(12),
          })
          .strict(),
      )
      .max(4),
  })
  .strict();

function hasExactlyTwoSentences(value: string) {
  return (
    (value.match(/[.!?]+(?=\s|$)/g) ?? []).length === 2 &&
    /[.!?]$/.test(value)
  );
}

export const ConfirmationSummarySchema = z
  .string()
  .trim()
  .min(1)
  .max(700)
  .refine(
    hasExactlyTwoSentences,
    "The generated confirmation summary must contain exactly two sentences.",
  )
  .refine(
    (value) => /\byou\b/i.test(value),
    'The generated confirmation summary must address the student using "you".',
  );

export const ConfirmedSummarySchema = z.string().trim().min(1).max(1_200);

export const ProfileGenerationSchema = z
  .object({
    profile: StudentProfileSchema,
    confirmationSummary: ConfirmationSummarySchema,
  })
  .strict();

export const ProfilePatchSchema = z
  .object({
    removeInferenceIds: z.array(identifierSchema).max(8).optional(),
    replaceStatements: z
      .array(
        z
          .object({
            targetId: identifierSchema,
            newStatement: statementSchema,
          })
          .strict(),
      )
      .max(8)
      .optional(),
    addConstraints: z.array(StudentConstraintSchema).max(8).optional(),
    addFacts: z.array(StudentFactSchema).max(12).optional(),
  })
  .strict();

export const PathBranchSchema = z
  .object({
    id: identifierSchema,
    title: z.string().trim().min(1).max(120),
    summary: pathSentenceSchema.describe(
      "One plain-language sentence explaining what this role or direction is.",
    ),
    whyItAppeared: z
      .array(pathSentenceSchema)
      .min(1)
      .max(2)
      .describe(
        "One or two concise sentences explaining why this may fit the student, grounded in the supplied profile evidence.",
      ),
    supportingProfileIds: z.array(identifierSchema).min(1).max(10),
    drawbacks: z
      .array(pathSentenceSchema)
      .min(1)
      .max(2)
      .describe(
        "One or two concise sentences explaining why this may not fit, framed as uncertainty to explore rather than a verdict.",
      ),
    dayToDay: z
      .array(
        pathSentenceSchema.describe(
          "Exactly one concrete day-to-day sentence. Do not combine multiple sentences in one array item.",
        ),
      )
      .min(2)
      .max(3)
      .describe(
        "An array of two or three items describing common work, collaboration, environment, and rhythm. Each item must contain exactly one sentence.",
      ),
    lowRiskExploration: pathSentenceSchema.describe(
      "One concrete, low-risk way the student can explore this role before committing.",
    ),
    unresolvedQuestions: z
      .array(z.string().trim().min(1).max(300))
      .min(1)
      .max(4),
    relatedOptions: z
      .array(
        z
          .object({
            id: identifierSchema,
            label: z.string().trim().min(1).max(120),
            type: z.enum(["career", "major", "resource", "question"]),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

export const PathGenerationSchema = z
  .object({
    branches: z.array(PathBranchSchema).min(12).max(15),
  })
  .strict();

export type IntakeAnswer = z.infer<typeof IntakeAnswerSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
export type ProfileGeneration = z.infer<typeof ProfileGenerationSchema>;
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
export type PathBranch = z.infer<typeof PathBranchSchema>;
export type PathGeneration = z.infer<typeof PathGenerationSchema>;
