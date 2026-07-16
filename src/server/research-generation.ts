import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { ResearchApiErrorCode } from "@/lib/research-api";
import {
  ResearchValidationError,
  validateResearchContext,
  validateResearchGeneration,
} from "@/lib/research-validation";
import {
  ResearchGenerationSchema,
  type PathBranch,
  type ResearchGeneration,
  type StudentProfile,
} from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 45_000;

const RESEARCH_INSTRUCTIONS = `You are Steppi, an educational exploration assistant for high-school students.
Answer one focused question about one selected path using current web sources and the confirmed student profile.

Rules:
- Use the web search tool before answering. Prefer official institutions, government or education agencies, primary program pages, and reputable first-party resources.
- Return no more than five concise research nodes and prefer two to four useful nodes over a broad report.
- Attach every node to the supplied selectedBranch.id.
- Every node must cite at least one URL actually found in this request's web search.
- Use the supplied dateChecked exactly for every source.
- Explain why each finding is relevant to this student and include a concrete caveat or limitation.
- Treat student facts and constraints as context, not as claims proven by the sources.
- Do not invent program availability, admissions requirements, tuition, costs, rankings, salaries, or career demand.
- If retrieved evidence is insufficient, return status no_useful_sources with an empty nodes array.
- Use qualitative confidence only. Never predict outcomes, diagnose aptitude, or claim one path is correct.
- Keep the response scannable and suitable for connected graph nodes, not a full report.`;

type ResearchProviderResult = {
  output: unknown;
  retrievedSourceUrls: string[];
  retrievalStatus: "completed" | "failed" | "missing";
};

type ResearchProviderRequest = (input: {
  profile: StudentProfile;
  branch: PathBranch;
  question: string;
  dateChecked: string;
  apiKey: string;
  model: string;
}) => Promise<ResearchProviderResult>;

type GenerateResearchOptions = {
  apiKey?: string;
  model?: string;
  dateChecked?: string;
  requestResearch?: ResearchProviderRequest;
};

export class ResearchGenerationError extends Error {
  readonly code: Exclude<ResearchApiErrorCode, "invalid_input">;

  constructor(code: Exclude<ResearchApiErrorCode, "invalid_input">) {
    super(code);
    this.name = "ResearchGenerationError";
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

async function requestResearchFromOpenAI({
  profile,
  branch,
  question,
  dateChecked,
  apiKey,
  model,
}: Parameters<ResearchProviderRequest>[0]): Promise<ResearchProviderResult> {
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const response = await client.responses.parse({
    model,
    instructions: RESEARCH_INSTRUCTIONS,
    input: JSON.stringify({
      confirmedProfile: profile,
      selectedBranch: branch,
      focusedQuestion: question,
      dateChecked,
    }),
    max_output_tokens: 5_500,
    store: false,
    tools: [
      {
        type: "web_search",
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          city: "Manila",
          country: "PH",
          timezone: "Asia/Manila",
        },
      },
    ],
    tool_choice: "required",
    include: ["web_search_call.action.sources"],
    text: {
      format: zodTextFormat(ResearchGenerationSchema, "research_generation"),
    },
  });

  const searchCalls = response.output.filter(
    (item) => item.type === "web_search_call",
  );
  const retrievedSourceUrls = searchCalls.flatMap((call) =>
    call.action.type === "search"
      ? (call.action.sources ?? []).map((source) => source.url)
      : [],
  );
  const retrievalStatus = searchCalls.some((call) => call.status === "completed")
    ? "completed"
    : searchCalls.some((call) => call.status === "failed")
      ? "failed"
      : "missing";

  return {
    output: response.output_parsed,
    retrievedSourceUrls,
    retrievalStatus,
  };
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function generateResearchExpansion(
  profile: StudentProfile,
  branch: PathBranch,
  question: string,
  options: GenerateResearchOptions = {},
): Promise<ResearchGeneration> {
  try {
    validateResearchContext(profile, branch, question);
  } catch {
    throw new ResearchGenerationError("malformed_model_output");
  }

  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const dateChecked = options.dateChecked ?? currentDate();

  if (!apiKey.trim()) {
    throw new ResearchGenerationError("configuration_missing");
  }
  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new ResearchGenerationError("invalid_model_configuration");
  }

  let result: ResearchProviderResult;
  try {
    result = await (options.requestResearch ?? requestResearchFromOpenAI)({
      profile,
      branch,
      question: question.trim(),
      dateChecked,
      apiKey,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof ResearchValidationError) {
      throw new ResearchGenerationError("malformed_model_output");
    }
    if (isTimeoutError(error)) {
      throw new ResearchGenerationError("timeout");
    }
    throw new ResearchGenerationError("api_failure");
  }

  if (result.retrievalStatus !== "completed") {
    throw new ResearchGenerationError("retrieval_failure");
  }

  try {
    return validateResearchGeneration(
      branch,
      result.output,
      result.retrievedSourceUrls,
      dateChecked,
    );
  } catch {
    throw new ResearchGenerationError("malformed_model_output");
  }
}
