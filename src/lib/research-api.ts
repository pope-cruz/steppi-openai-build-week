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

export type ResearchApiSuccess =
  | {
      ok: true;
      status: "success";
      question: string;
      nodes: ResearchNode[];
    }
  | {
      ok: true;
      status: "no_useful_sources";
      question: string;
      nodes: [];
    };

export type ResearchApiFailure = {
  ok: false;
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
    status: z.literal("success"),
    question: ResearchQuestionSchema,
    nodes: z.array(ResearchNodeSchema).min(1).max(5),
  })
  .strict();

const ResearchNoSourcesResponseSchema = z
  .object({
    ok: z.literal(true),
    status: z.literal("no_useful_sources"),
    question: ResearchQuestionSchema,
    nodes: z.tuple([]),
  })
  .strict();

export const ResearchApiResponseSchema = z.union([
  ResearchSuccessResponseSchema,
  ResearchNoSourcesResponseSchema,
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
