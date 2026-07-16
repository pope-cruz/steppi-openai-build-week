import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(80);
const statementSchema = z.string().trim().min(1).max(600);

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
    kind: z.enum(["strongest-fit", "adjacent", "underexplored"]),
    title: z.string().trim().min(1).max(120),
    summary: z.string().trim().min(1).max(500),
    whyItAppeared: z.array(statementSchema).min(1).max(5),
    supportingProfileIds: z.array(identifierSchema).min(1).max(10),
    drawbacks: z.array(statementSchema).min(1).max(4),
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
    confidence: z.enum(["low", "medium", "high"]),
  })
  .strict();

export const PathGenerationSchema = z
  .object({
    branches: z.array(PathBranchSchema).length(3),
  })
  .strict()
  .superRefine(({ branches }, context) => {
    const requiredKinds = [
      "strongest-fit",
      "adjacent",
      "underexplored",
    ] as const;

    for (const kind of requiredKinds) {
      if (branches.filter((branch) => branch.kind === kind).length !== 1) {
        context.addIssue({
          code: "custom",
          message: `Exactly one ${kind} branch is required.`,
          path: ["branches"],
        });
      }
    }
  });

export type IntakeAnswer = z.infer<typeof IntakeAnswerSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
export type PathBranch = z.infer<typeof PathBranchSchema>;
export type PathGeneration = z.infer<typeof PathGenerationSchema>;
