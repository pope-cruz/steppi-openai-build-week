import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { PathApiErrorCode } from "@/lib/path-api";
import { PathValidationError, validatePathGeneration } from "@/lib/path-validation";
import {
  PathGenerationSchema,
  type PathBranch,
  type StudentProfile,
} from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 45_000;

const PATH_INSTRUCTIONS = `You are Steppi, an educational exploration assistant for high-school students.
Generate one complete set of exactly three cautious path hypotheses from the confirmed student profile.

Rules:
- Return exactly one strongest-fit, one adjacent, and one underexplored branch in a single response.
- Make the three directions meaningfully different, not renamed versions of one career.
- Reference only IDs that exist in the supplied profile in supportingProfileIds.
- Use supporting profile facts as student-provided evidence and profile inferences only as tentative model evidence.
- Explain why each path appeared without framing any path as objectively correct or guaranteed.
- Include at least one real drawback or tension and at least one unresolved question per branch.
- Keep confidence qualitative and cautious.
- Related options may name general careers or majors, but do not recommend specific colleges or programs.
- Do not assert current salaries, employment demand, admissions rates, rankings, tuition, program availability, costs, or other time-sensitive facts.
- Do not diagnose aptitude or personality, predict outcomes, or shame the student's constraints.
- Keep every field concise enough to compare on one screen.`;

type PathRequest = (input: {
  profile: StudentProfile;
  apiKey: string;
  model: string;
}) => Promise<unknown>;

type GeneratePathsOptions = {
  apiKey?: string;
  model?: string;
  requestPaths?: PathRequest;
};

export class PathGenerationError extends Error {
  readonly code: Exclude<PathApiErrorCode, "invalid_input">;

  constructor(code: Exclude<PathApiErrorCode, "invalid_input">) {
    super(code);
    this.name = "PathGenerationError";
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

async function requestPathsFromOpenAI({
  profile,
  apiKey,
  model,
}: Parameters<PathRequest>[0]) {
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const response = await client.responses.parse({
    model,
    instructions: PATH_INSTRUCTIONS,
    input: JSON.stringify({ confirmedProfile: profile }),
    max_output_tokens: 4_500,
    text: {
      format: zodTextFormat(PathGenerationSchema, "path_generation"),
    },
  });

  return response.output_parsed;
}

export async function generatePathBranches(
  profile: StudentProfile,
  options: GeneratePathsOptions = {},
): Promise<PathBranch[]> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey.trim()) {
    throw new PathGenerationError("configuration_missing");
  }

  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new PathGenerationError("invalid_model_configuration");
  }

  let output: unknown;

  try {
    output = await (options.requestPaths ?? requestPathsFromOpenAI)({
      profile,
      apiKey,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof PathValidationError) {
      throw new PathGenerationError("malformed_model_output");
    }

    if (isTimeoutError(error)) {
      throw new PathGenerationError("timeout");
    }

    throw new PathGenerationError("api_failure");
  }

  try {
    return validatePathGeneration(profile, output);
  } catch {
    throw new PathGenerationError("malformed_model_output");
  }
}
