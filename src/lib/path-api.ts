import { z } from "zod";

import { PathGenerationSchema, type PathBranch } from "@/lib/schemas";

export type PathApiErrorCode =
  | "invalid_input"
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "api_failure"
  | "malformed_model_output";

export type PathApiSuccess = {
  ok: true;
  branches: PathBranch[];
};

export type PathApiFailure = {
  ok: false;
  error: {
    code: PathApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type PathApiResponse = PathApiSuccess | PathApiFailure;

export const PathApiResponseSchema = z.discriminatedUnion("ok", [
  PathGenerationSchema.extend({ ok: z.literal(true) }).strict(),
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
