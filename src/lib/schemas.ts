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
      .array(pathSentenceSchema)
      .min(2)
      .max(3)
      .describe(
        "Two or three concrete sentences describing common work, collaboration, environment, and rhythm.",
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
    branches: z.array(PathBranchSchema).min(6).max(8),
  })
  .strict();

export const ResearchQuestionSchema = z.string().trim().min(6).max(300);

const researchClaimStatementSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .describe(
    "One concise, independently verifiable factual clause. Every word and qualifier must be directly supported by the linked source URLs; omit unsupported wording.",
  );

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
  })
  .strict();

export const ResearchClaimSchema = z
  .object({
    id: identifierSchema,
    kind: z.enum([
      "fact",
      "cost",
      "eligibility",
      "conditional-aid",
      "limitation",
    ]),
    statement: researchClaimStatementSchema,
    sourceUrls: z
      .array(SourceEvidenceSchema.shape.url)
      .min(1)
      .max(4)
      .describe(
        "Only source URLs that directly support the complete factual clause, including every qualifier and condition.",
      ),
  })
  .strict();

export const ResearchNodeSchema = z
  .object({
    id: identifierSchema,
    parentBranchId: identifierSchema,
    type: z.enum(["career", "major", "college", "program", "resource", "cost"]),
    title: z
      .string()
      .trim()
      .min(1)
      .max(140)
      .describe("A concise title directly supported by titleSourceUrls."),
    titleSourceUrls: z.array(SourceEvidenceSchema.shape.url).min(1).max(4),
    claims: z.array(ResearchClaimSchema).min(1).max(6),
    relevanceToStudent: z.string().trim().min(1).max(400),
    confidence: z
      .enum(["low", "medium", "high"])
      .describe(
        "Strength of direct source support for this node's title and claims, no higher than the weakest supported item and never based on general plausibility.",
      ),
    sources: z.array(SourceEvidenceSchema).min(1).max(4),
  })
  .strict()
  .superRefine(({ claims, sources, titleSourceUrls }, context) => {
    const sourceUrls = new Set(sources.map((source) => source.url));
    const claimIds = claims.map((claim) => claim.id);

    if (new Set(claimIds).size !== claimIds.length) {
      context.addIssue({
        code: "custom",
        message: "Research claims must have unique IDs within a node.",
        path: ["claims"],
      });
    }
    if (new Set(sources.map((source) => source.url)).size !== sources.length) {
      context.addIssue({
        code: "custom",
        message: "Research sources must have unique URLs within a node.",
        path: ["sources"],
      });
    }
    if (titleSourceUrls.some((url) => !sourceUrls.has(url))) {
      context.addIssue({
        code: "custom",
        message: "A research title may reference only sources attached to its node.",
        path: ["titleSourceUrls"],
      });
    }
    for (const [claimIndex, claim] of claims.entries()) {
      if (new Set(claim.sourceUrls).size !== claim.sourceUrls.length) {
        context.addIssue({
          code: "custom",
          message: "A research claim may reference each source only once.",
          path: ["claims", claimIndex, "sourceUrls"],
        });
      }
      if (claim.sourceUrls.some((url) => !sourceUrls.has(url))) {
        context.addIssue({
          code: "custom",
          message: "A research claim may reference only sources attached to its node.",
          path: ["claims", claimIndex, "sourceUrls"],
        });
      }
    }
    if (!claims.some((claim) => claim.kind === "limitation")) {
      context.addIssue({
        code: "custom",
        message: "Every research node requires a source-addressable limitation.",
        path: ["claims"],
      });
    }
  });

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

// Provider parsing keeps field-level structure strict while deferring citation
// relationships to the item-scoped validator. Retained nodes are parsed again
// with ResearchNodeSchema before they can reach the client.
const ResearchClaimCandidateSchema = z
  .object({
    ...ResearchClaimSchema.shape,
    sourceUrls: z.array(SourceEvidenceSchema.shape.url).max(4),
  })
  .strict();

export const ResearchNodeCandidateSchema = z
  .object({
    ...ResearchNodeSchema.shape,
    titleSourceUrls: z.array(SourceEvidenceSchema.shape.url).max(4),
    claims: z.array(ResearchClaimCandidateSchema).max(6),
    sources: z.array(SourceEvidenceSchema).max(4),
  })
  .strict();

export const ResearchGenerationCandidateSchema = z
  .object({
    status: z.enum(["success", "no_useful_sources"]),
    nodes: z.array(ResearchNodeCandidateSchema).max(5),
  })
  .strict()
  .superRefine(({ nodes, status }, context) => {
    if (status === "success" && nodes.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Successful research requires at least one candidate node.",
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
export type ResearchClaim = z.infer<typeof ResearchClaimSchema>;
export type ResearchNode = z.infer<typeof ResearchNodeSchema>;
export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;
export type ResearchGeneration = z.infer<typeof ResearchGenerationSchema>;
