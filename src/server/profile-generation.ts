import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { ProfileApiErrorCode } from "@/lib/profile-api";
import {
  ProfileGenerationSchema,
  type IntakeAnswer,
  type ProfileGeneration,
} from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 45_000;

export const PROFILE_INSTRUCTIONS = `You are Steppi, an educational exploration assistant for high-school students.
Convert the supplied intake answers into a cautious student-profile hypothesis and a warm confirmation summary.

Rules:
- Preserve the student's meaning and distinguish their facts from your inferences.
- Every fact must cite one or more supplied questionId values in sourceAnswerIds.
- Keep inferences tentative, editable, and supported by a short rationale.
- Record financial, geographic, academic, family, accessibility, and preference constraints explicitly.
- Use uncertainties for useful open questions and tensions only for genuine conflicts in the supplied answers.
- Do not diagnose aptitude or personality, predict a correct future, guarantee outcomes, or shame constraints.
- Do not add current factual claims about careers, colleges, programs, admissions, or costs.
- Keep the profile concise and useful for later student correction.
- Write confirmationSummary as exactly two concise sentences that speak directly to the student using "you".
- In the first sentence, naturally reflect the interests, experiences, or activities that seem to draw the student in.
- In the second sentence, naturally reflect what they want from a possible future, including only the most relevant preferences, dislikes, priorities, uncertainty, or practical constraints.
- Do not mechanically list fields, expose schema language, overstate aptitude or certainty, or try to mention every captured detail.`;

type ProfileRequest = (input: {
  answers: IntakeAnswer[];
  apiKey: string;
  model: string;
}) => Promise<unknown>;

type GenerateStudentProfileOptions = {
  apiKey?: string;
  model?: string;
  requestProfile?: ProfileRequest;
};

export type ProfileGenerationDiagnostic = {
  stage: "configuration" | "provider_request" | "provider_response" | "structured_validation";
  reason:
    | "missing_api_key"
    | "invalid_model"
    | "request_timeout"
    | "upstream_api_failure"
    | "incomplete_max_output_tokens"
    | "incomplete_content_filter"
    | "parsed_output_missing"
    | "schema_validation_failed";
  issuePaths?: string[];
};

class ProfileProviderOutputError extends Error {
  readonly reason: ProfileGenerationDiagnostic["reason"];

  constructor(reason: ProfileGenerationDiagnostic["reason"]) {
    super(reason);
    this.name = "ProfileProviderOutputError";
    this.reason = reason;
  }
}

export function requireParsedProfileOutput({
  incompleteReason,
  output,
}: {
  incompleteReason?: "max_output_tokens" | "content_filter" | null;
  output: unknown;
}) {
  if (output !== null) {
    return output;
  }

  if (incompleteReason === "max_output_tokens") {
    throw new ProfileProviderOutputError("incomplete_max_output_tokens");
  }
  if (incompleteReason === "content_filter") {
    throw new ProfileProviderOutputError("incomplete_content_filter");
  }
  throw new ProfileProviderOutputError("parsed_output_missing");
}

export class ProfileGenerationError extends Error {
  readonly code: Exclude<ProfileApiErrorCode, "invalid_input">;
  readonly diagnostic: ProfileGenerationDiagnostic;

  constructor(
    code: Exclude<ProfileApiErrorCode, "invalid_input">,
    diagnostic: ProfileGenerationDiagnostic = {
      stage: "provider_request",
      reason: "upstream_api_failure",
    },
  ) {
    super(code);
    this.name = "ProfileGenerationError";
    this.code = code;
    this.diagnostic = diagnostic;
  }
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";

  return (
    error.name === "APIConnectionTimeoutError" ||
    error.name === "AbortError" ||
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED"
  );
}

async function requestProfileFromOpenAI({
  answers,
  apiKey,
  model,
}: Parameters<ProfileRequest>[0]) {
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const response = await client.responses.parse({
    model,
    instructions: PROFILE_INSTRUCTIONS,
    input: JSON.stringify({ answers }),
    max_output_tokens: 3_000,
    text: {
      format: zodTextFormat(ProfileGenerationSchema, "student_profile"),
    },
  });

  return requireParsedProfileOutput({
    output: response.output_parsed,
    incompleteReason: response.incomplete_details?.reason,
  });
}

export async function generateStudentProfile(
  answers: IntakeAnswer[],
  options: GenerateStudentProfileOptions = {},
): Promise<ProfileGeneration> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey.trim()) {
    throw new ProfileGenerationError("configuration_missing", {
      stage: "configuration",
      reason: "missing_api_key",
    });
  }

  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new ProfileGenerationError("invalid_model_configuration", {
      stage: "configuration",
      reason: "invalid_model",
    });
  }

  let output: unknown;

  try {
    output = await (options.requestProfile ?? requestProfileFromOpenAI)({
      answers,
      apiKey,
      model,
    });
  } catch (error) {
    if (error instanceof ProfileProviderOutputError) {
      throw new ProfileGenerationError("malformed_model_output", {
        stage: "provider_response",
        reason: error.reason,
      });
    }

    if (error instanceof z.ZodError) {
      throw new ProfileGenerationError("malformed_model_output", {
        stage: "structured_validation",
        reason: "schema_validation_failed",
        issuePaths: error.issues.map((issue) => issue.path.join(".")).filter(Boolean),
      });
    }

    if (isTimeoutError(error)) {
      throw new ProfileGenerationError("timeout", {
        stage: "provider_request",
        reason: "request_timeout",
      });
    }

    throw new ProfileGenerationError("api_failure", {
      stage: "provider_request",
      reason: "upstream_api_failure",
    });
  }

  const parsed = ProfileGenerationSchema.safeParse(output);

  if (!parsed.success) {
    throw new ProfileGenerationError("malformed_model_output", {
      stage: "structured_validation",
      reason: "schema_validation_failed",
      issuePaths: parsed.error.issues
        .map((issue) => issue.path.join("."))
        .filter(Boolean),
    });
  }

  return parsed.data;
}
