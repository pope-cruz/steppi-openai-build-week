import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { PathApiErrorCode } from "@/lib/path-api";
import { PathValidationError, validatePathGeneration } from "@/lib/path-validation";
import {
  ConfirmedSummarySchema,
  PathGenerationSchema,
  type PathBranch,
  type StudentProfile,
} from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 45_000;

export const PATH_INSTRUCTIONS = `You are Steppi, an educational exploration assistant for high-school students.
Generate one complete unranked set of career-role possibilities from the confirmed student profile. Target seven roles and return no fewer than six and no more than eight.

Rules:
- Return all roles together in one response. Never rank, score, tier, order, or label any role as the best fit.
- The input contains the complete structured profile followed by the student's approved summary. Treat that approved summary as the student's latest clarification.
- If the approved summary conflicts with an older inference or profile detail, follow the approved summary. If it adds information, incorporate it.
- Do not treat a stylistic omission from the short approved summary as a rejection of every omitted profile detail. Use the complete profile for breadth and the approved summary to resolve contradictions and priorities.
- Target seven roles. Six or eight are allowed only when that produces a more honest, varied set.
- Make the roles meaningfully different across occupation families, work rhythms, environments, and ways of using the student's interests. Do not return minor title variants from one occupation family.
- Give every role a unique stable id and a distinct career title.
- Reference only IDs that exist in the supplied profile in supportingProfileIds.
- Use supporting profile facts as student-provided evidence and profile inferences only as tentative model evidence.
- Use summary for one plain-language sentence explaining what the role or direction is.
- Use whyItAppeared for one or two concise, student-facing sentences explaining why the role may fit. Ground each sentence in specific supplied profile facts, experiences, preferences, strengths, or clearly tentative inferences.
- Use drawbacks for one or two concise sentences explaining why the role may not fit. Acknowledge uncertainty and describe something the student could notice or explore; never present a mismatch as a verdict.
- Use dayToDay for two or three concrete sentences that help the student imagine common tasks, collaboration, work environment, and rhythm without turning the response into a career encyclopedia.
- Use lowRiskExploration for one specific, low-cost, low-commitment activity the student can try without enrolling in a program or making a career decision.
- Include at least one unresolved question per branch.
- Related options may name general careers or majors, but do not recommend specific colleges or programs.
- Do not assert current salaries, employment demand, admissions rates, rankings, tuition, program availability, costs, or other time-sensitive facts.
- Do not diagnose aptitude or personality, predict outcomes, or shame the student's constraints.
- Use conversational, plain, age-appropriate language and speak directly to the student where natural.
- Keep every explanation concise enough to scan in under one minute.`;

type PathRequest = (input: {
  profile: StudentProfile;
  confirmedSummary: string;
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
  confirmedSummary,
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
    input: JSON.stringify(pathGenerationContext(profile, confirmedSummary)),
    max_output_tokens: 9_000,
    text: {
      format: zodTextFormat(PathGenerationSchema, "path_generation"),
    },
  });

  return response.output_parsed;
}

export function pathGenerationContext(
  profile: StudentProfile,
  confirmedSummary: string,
) {
  return {
    confirmedProfile: profile,
    studentApprovedSummary: ConfirmedSummarySchema.parse(confirmedSummary),
  };
}

export async function generatePathBranches(
  profile: StudentProfile,
  confirmedSummary: string,
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

  const parsedSummary = ConfirmedSummarySchema.safeParse(confirmedSummary);
  if (!parsedSummary.success) {
    throw new PathGenerationError("malformed_model_output");
  }

  let output: unknown;

  try {
    output = await (options.requestPaths ?? requestPathsFromOpenAI)({
      profile,
      confirmedSummary: parsedSummary.data,
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
