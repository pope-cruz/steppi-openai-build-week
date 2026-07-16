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

export const ResearchQuestionSchema = z.string().trim().min(6).max(300);

export const SourceEvidenceSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    // Structured Outputs requires every field to be present. Use null when the
    // retrieved source does not expose a reliable publisher name.
    publisher: z.string().trim().min(1).max(120).nullable(),
    url: z
      .string()
      .trim()
      .min(1)
      .max(2_048)
      // `format: uri` is outside OpenAI Structured Outputs' supported string
      // formats. Keep the model schema a bounded string and enforce URL safety
      // again in runtime validation after parsing.
      .refine((value) => {
        try {
          return new URL(value).protocol === "https:";
        } catch {
          return false;
        }
      }, {
        message: "Research sources must use HTTPS.",
      }),
    dateChecked: z.string().date(),
    supports: z.string().trim().min(1).max(400),
  })
  .strict();

export const ResearchNodeSchema = z
  .object({
    id: identifierSchema,
    parentBranchId: identifierSchema,
    type: z.enum(["career", "major", "college", "program", "resource", "cost"]),
    title: z.string().trim().min(1).max(140),
    summary: z.string().trim().min(1).max(500),
    relevanceToStudent: z.string().trim().min(1).max(400),
    caveats: z.array(statementSchema).min(1).max(3),
    confidence: z.enum(["low", "medium", "high"]),
    sources: z.array(SourceEvidenceSchema).min(1).max(4),
  })
  .strict();

export const ResearchRequestSchema = z
  .object({
    profile: StudentProfileSchema,
    branch: PathBranchSchema,
    question: ResearchQuestionSchema,
  })
  .strict();

export const ResearchGenerationSchema = z
  .object({
    status: z.enum(["success", "no_useful_sources"]),
    nodes: z.array(ResearchNodeSchema).max(5),
  })
  .strict()
  .superRefine(({ nodes, status }, context) => {
    if (status === "success" && nodes.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Successful research requires at least one node.",
        path: ["nodes"],
      });
    }
    if (status === "no_useful_sources" && nodes.length !== 0) {
      context.addIssue({
        code: "custom",
        message: "No-useful-source results cannot contain research nodes.",
        path: ["nodes"],
      });
    }
  });

export type IntakeAnswer = z.infer<typeof IntakeAnswerSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
export type PathBranch = z.infer<typeof PathBranchSchema>;
export type PathGeneration = z.infer<typeof PathGenerationSchema>;
export type ResearchQuestion = z.infer<typeof ResearchQuestionSchema>;
export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;
export type ResearchNode = z.infer<typeof ResearchNodeSchema>;
export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;
export type ResearchGeneration = z.infer<typeof ResearchGenerationSchema>;
