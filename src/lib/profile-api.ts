import { z } from "zod";

import {
  ConfirmationSummarySchema,
  StudentProfileSchema,
  type ProfileGeneration,
} from "@/lib/schemas";

export type ProfileApiErrorCode =
  | "invalid_input"
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "api_failure"
  | "malformed_model_output";

export type ProfileApiSuccess = { ok: true } & ProfileGeneration;

export type ProfileApiFailure = {
  ok: false;
  error: {
    code: ProfileApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type ProfileApiResponse = ProfileApiSuccess | ProfileApiFailure;

export const ProfileApiResponseSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      profile: StudentProfileSchema,
      confirmationSummary: ConfirmationSummarySchema,
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
