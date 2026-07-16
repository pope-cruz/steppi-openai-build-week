import { z } from "zod";

import {
  ResearchNodeSchema,
  ResearchQuestionSchema,
  type ResearchNode,
} from "@/lib/schemas";

export type ResearchApiErrorCode =
  | "invalid_input"
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "retrieval_failure"
  | "api_failure"
  | "malformed_model_output";

export type ResearchJobStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "incomplete";

export type ResearchApiSuccess =
  | {
      ok: true;
      status: "queued" | "in_progress";
    }
  | {
      ok: true;
      status: "completed";
      outcome: "success";
      question: string;
      nodes: ResearchNode[];
    }
  | {
      ok: true;
      status: "completed";
      outcome: "no_useful_sources";
      question: string;
      nodes: [];
    }
  | {
      ok: true;
      status: "cancelled";
    };

export type ResearchApiFailure = {
  ok: false;
  status: "failed" | "cancelled" | "incomplete";
  error: {
    code: ResearchApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type ResearchApiResponse = ResearchApiSuccess | ResearchApiFailure;

const ResearchSuccessResponseSchema = z
  .object({
    ok: z.literal(true),
    status: z.literal("completed"),
    outcome: z.literal("success"),
    question: ResearchQuestionSchema,
    nodes: z.array(ResearchNodeSchema).min(1).max(5),
  })
  .strict();

const ResearchNoSourcesResponseSchema = z
  .object({
    ok: z.literal(true),
    status: z.literal("completed"),
    outcome: z.literal("no_useful_sources"),
    question: ResearchQuestionSchema,
    nodes: z.tuple([]),
  })
  .strict();

export const ResearchApiResponseSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      status: z.enum(["queued", "in_progress"]),
    })
    .strict(),
  ResearchSuccessResponseSchema,
  ResearchNoSourcesResponseSchema,
  z.object({ ok: z.literal(true), status: z.literal("cancelled") }).strict(),
  z
    .object({
      ok: z.literal(false),
      status: z.enum(["failed", "cancelled", "incomplete"]),
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
