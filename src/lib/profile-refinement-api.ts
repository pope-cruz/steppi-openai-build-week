import { z } from "zod";

import { StudentProfileSchema, type StudentProfile } from "@/lib/schemas";

export type ProfileRefinementApiErrorCode =
  | "invalid_input"
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "api_failure"
  | "malformed_model_output";

export type ProfileRefinementApiSuccess = {
  ok: true;
  profile: StudentProfile;
  acknowledgement: string;
  decision: "complete" | "follow_up" | "offer_choice";
  nextQuestion: string | null;
};

export type ProfileRefinementApiFailure = {
  ok: false;
  error: {
    code: ProfileRefinementApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type ProfileRefinementApiResponse =
  | ProfileRefinementApiSuccess
  | ProfileRefinementApiFailure;

export const ProfileRefinementApiResponseSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      profile: StudentProfileSchema,
      acknowledgement: z.string().trim().min(1).max(180),
      decision: z.enum(["complete", "follow_up", "offer_choice"]),
      nextQuestion: z.string().trim().min(1).max(240).nullable(),
    })
    .strict()
    .superRefine(({ decision, nextQuestion }, context) => {
      if (decision === "follow_up" && nextQuestion === null) {
        context.addIssue({
          code: "custom",
          message: "A follow-up response requires one question.",
          path: ["nextQuestion"],
        });
      }
      if (decision !== "follow_up" && nextQuestion !== null) {
        context.addIssue({
          code: "custom",
          message: "A terminal refinement response cannot include a question.",
          path: ["nextQuestion"],
        });
      }
    }),
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
