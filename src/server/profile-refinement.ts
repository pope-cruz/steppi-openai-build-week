import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { ProfileRefinementApiErrorCode } from "@/lib/profile-refinement-api";
import {
  ProfileRefinementModelOutputSchema,
  applyProfileRefinementPatch,
  type ProfileRefinementModelOutput,
  type ProfileRefinementRequest,
} from "@/lib/profile-refinement";
import type { StudentProfile } from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6-luna";
const REQUEST_TIMEOUT_MS = 25_000;

export const PROFILE_REFINEMENT_INSTRUCTIONS = `You are Steppi's profile-refinement interpreter for a high-school or college student.
Use the current structured profile and the refinement transcript. Interpret only the latest student answer and return one small patch to the current profile.

Rules:
- Preserve every valid profile item that the latest answer does not correct, clarify, supersede, or resolve.
- Use remove, replace, and add operations only when the student's words justify them. Return empty arrays for every unused operation.
- A replaced or added fact must cite the relevant refinement turn ID in sourceAnswerIds. Preserve still-valid prior source IDs when useful.
- Direct corrections should usually be applied immediately with decision complete and no follow-up.
- Ask one follow-up only when its answer would materially change the role possibility set. Make it concise, contextual, and connected to the latest answer.
- Do not repeat information already present, declined, corrected, or recorded as uncertain.
- Uncertainty is valid context. Do not force a definite preference or prolong refinement merely to fill profile fields.
- Use offer_choice when the current patch is useful but the student may reasonably choose between another clarification and opening the role space.
- Refinement usually needs zero to three follow-up questions, but there is no required count.
- Never recommend careers, majors, colleges, programs, or paths during profile refinement.
- Do not expose schema names, IDs, confidence fields, source references, internal reasoning, or category labels in acknowledgement or nextQuestion.
- Keep acknowledgement and nextQuestion plain, warm, restrained, student-facing, and stage-neutral unless the student has explicitly disclosed their education stage.
- When a constraint becomes more or less important, replace that constraint rather than adding a duplicate.
- When a fact is corrected, replace or remove the old fact so contradictory versions do not coexist.
- When an uncertainty or tension is resolved, remove or replace it rather than leaving stale context.`;

type RefinementRequest = (input: {
  request: ProfileRefinementRequest;
  apiKey: string;
  model: string;
}) => Promise<unknown>;

type RefineStudentProfileOptions = {
  apiKey?: string;
  model?: string;
  requestRefinement?: RefinementRequest;
};

export type ProfileRefinementResult = {
  profile: StudentProfile;
  acknowledgement: string;
  decision: ProfileRefinementModelOutput["decision"];
  nextQuestion: string | null;
};

export class ProfileRefinementError extends Error {
  readonly code: Exclude<ProfileRefinementApiErrorCode, "invalid_input">;

  constructor(code: Exclude<ProfileRefinementApiErrorCode, "invalid_input">) {
    super(code);
    this.name = "ProfileRefinementError";
    this.code = code;
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

async function requestRefinementFromOpenAI({
  request,
  apiKey,
  model,
}: Parameters<RefinementRequest>[0]) {
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });
  const response = await client.responses.parse({
    model,
    instructions: PROFILE_REFINEMENT_INSTRUCTIONS,
    input: JSON.stringify(request),
    max_output_tokens: 3_000,
    reasoning: { effort: "none" },
    text: {
      format: zodTextFormat(
        ProfileRefinementModelOutputSchema,
        "profile_refinement_turn",
      ),
      verbosity: "low",
    },
  });

  return response.output_parsed;
}

export async function refineStudentProfile(
  request: ProfileRefinementRequest,
  options: RefineStudentProfileOptions = {},
): Promise<ProfileRefinementResult> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey.trim()) {
    throw new ProfileRefinementError("configuration_missing");
  }
  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new ProfileRefinementError("invalid_model_configuration");
  }

  let output: unknown;
  try {
    output = await (options.requestRefinement ?? requestRefinementFromOpenAI)({
      request,
      apiKey,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ProfileRefinementError("malformed_model_output");
    }
    if (isTimeoutError(error)) {
      throw new ProfileRefinementError("timeout");
    }
    throw new ProfileRefinementError("api_failure");
  }

  const parsed = ProfileRefinementModelOutputSchema.safeParse(output);
  if (!parsed.success) {
    throw new ProfileRefinementError("malformed_model_output");
  }

  let profile: StudentProfile;
  try {
    profile = applyProfileRefinementPatch(
      request.profile,
      parsed.data.patch,
      request.turns,
    );
  } catch {
    throw new ProfileRefinementError("malformed_model_output");
  }

  return {
    profile,
    acknowledgement: parsed.data.acknowledgement,
    decision: parsed.data.decision,
    nextQuestion: parsed.data.nextQuestion,
  };
}
