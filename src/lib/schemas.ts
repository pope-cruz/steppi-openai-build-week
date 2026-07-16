import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(80);
const statementSchema = z.string().trim().min(1).max(600);

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
      .array(
        z
          .object({
            id: identifierSchema,
            statement: statementSchema,
            sourceAnswerIds: z.array(identifierSchema).min(1).max(12),
          })
          .strict(),
      )
      .max(12),
    inferences: z
      .array(
        z
          .object({
            id: identifierSchema,
            statement: statementSchema,
            rationale: statementSchema,
            confidence: z.enum(["low", "medium", "high"]),
            editable: z.literal(true),
          })
          .strict(),
      )
      .max(8),
    constraints: z
      .array(
        z
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
          .strict(),
      )
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

export type IntakeAnswer = z.infer<typeof IntakeAnswerSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
