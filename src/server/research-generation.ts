import OpenAI from "openai";
import {
  ContentFilterFinishReasonError,
  LengthFinishReasonError,
} from "openai/error";
import { zodTextFormat } from "openai/helpers/zod";
import { parseResponse } from "openai/lib/ResponsesParser";
import type {
  Response as OpenAIResponse,
  ResponseCreateParamsNonStreaming,
  ResponseFunctionWebSearch,
  ResponseOutputMessage,
  ResponseRetrieveParamsNonStreaming,
  ResponseStatus,
} from "openai/resources/responses/responses";
import { z } from "zod";

import type { ResearchApiErrorCode } from "@/lib/research-api";
import {
  safeDiagnosticToken,
  type ResearchDiagnostic,
} from "@/lib/research-diagnostics";
import {
  ResearchValidationError,
  validateResearchContext,
  validateResearchGeneration,
} from "@/lib/research-validation";
import {
  ResearchGenerationCandidateSchema,
  type PathBranch,
  type ResearchGeneration,
  type StudentProfile,
} from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 45_000;
const BACKGROUND_RETRIEVE_PARAMS: ResponseRetrieveParamsNonStreaming = {
  include: ["web_search_call.action.sources"],
};

const RESEARCH_INSTRUCTIONS = `You are Steppi, an educational exploration assistant for high-school students.
Answer one focused question about one selected path using current web sources and the confirmed student profile.

Rules:
- Use the web search tool before answering. Prefer official institutions, government or education agencies, primary program pages, and reputable first-party resources.
- Return no more than five concise research nodes and prefer two to four useful nodes over a broad report.
- Attach every node to the supplied selectedBranch.id.
- Put every current factual clause in a short claims item. Atomic means one independently verifiable assertion per claim, even when several assertions could fit in one grammatical sentence. Do not place current facts in relevanceToStudent.
- Give every title and every claim one or more source URLs copied exactly from that node's sources. Never use an unattached or model-invented URL.
- Use fact, cost, eligibility, conditional-aid, and limitation claim kinds precisely. Every node requires a source-addressable limitation claim.
- Do not treat a source URL as blanket support for a node. Before writing a claim, verify that its linked source directly supports every verb, object, qualifier, condition, and statement of scope in that claim.
- Never add a plausible qualifier from general knowledge. If a source supports only part of a proposed claim, keep each supported assertion as its own claim and omit every unsupported clause; do not preserve unsupported wording by lowering confidence.
- Exact grounding example: if a Figma source supports creating interface mockups and interactive prototypes, return those as separate claims. Do not add “without writing code” unless a linked source directly supports that additional assertion.
- When the question concerns affordability, each returned option must include directly sourced cost, eligibility, residency or location-based eligibility, and conditional-aid claims or caveats. State the scope of the cost evidence and include mandatory fees or other material costs when the sources expose them. Do not call an option affordable, low-cost, or budget-friendly because tuition appears low or aid exists. If cost scope, eligibility, residency conditions, or aid conditions are not sufficiently supported, return no_useful_sources instead.
- Use the supplied dateChecked exactly for every source.
- Explain why each finding is relevant to this student and include a concrete caveat or limitation.
- Treat student facts and constraints as context, not as claims proven by the sources.
- Do not invent program availability, admissions requirements, tuition, costs, rankings, salaries, or career demand.
- If retrieved evidence is insufficient, return status no_useful_sources with an empty nodes array.
- Base qualitative confidence only on the directness, authority, specificity, and freshness of the linked source support for the rendered title and claims, never on general plausibility or model knowledge. Set node confidence no higher than the weakest-supported title or claim. If any wording lacks direct support, omit it rather than lowering confidence. Never predict outcomes, diagnose aptitude, or claim one path is correct.
- Keep the response scannable and suitable for connected graph nodes, not a full report.`;

type ResearchProviderResult = {
  output: unknown;
  retrievedSourceUrls: string[];
  retrievalStatus: "completed" | "failed" | "missing";
};

type ResearchProviderResponse = {
  output: OpenAIResponse["output"];
  output_parsed: unknown;
};

function isResearchWebSearchCall(
  item: OpenAIResponse["output"][number],
): item is ResponseFunctionWebSearch {
  return item.type === "web_search_call";
}

function isResearchOutputMessage(
  item: OpenAIResponse["output"][number],
): item is ResponseOutputMessage {
  return item.type === "message";
}

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

export type ResearchBackgroundProvider = {
  create: (params: ResponseCreateParamsNonStreaming) => Promise<OpenAIResponse>;
  retrieve: (
    responseId: string,
    params: ResponseRetrieveParamsNonStreaming,
  ) => Promise<OpenAIResponse>;
  cancel: (responseId: string) => Promise<OpenAIResponse>;
};

type BackgroundResearchOptions = {
  apiKey?: string;
  model?: string;
  dateChecked?: string;
  provider?: ResearchBackgroundProvider;
};

export type BackgroundResearchState =
  | { status: "queued" | "in_progress" }
  | { status: "completed"; result: ResearchGeneration }
  | {
      status: "failed" | "cancelled" | "incomplete";
      diagnostic: ResearchDiagnostic;
    };

function defaultDiagnostic(
  code: Exclude<ResearchApiErrorCode, "invalid_input">,
): ResearchDiagnostic {
  if (code === "configuration_missing" || code === "invalid_model_configuration") {
    return { category: "configuration", stage: "configuration", reason: code };
  }
  if (code === "timeout") {
    return { category: "timeout", stage: "openai_request", reason: "request_timeout" };
  }
  if (code === "retrieval_failure") {
    return {
      category: "source_processing",
      stage: "retrieval_status",
      reason: "retrieval_incomplete",
    };
  }
  if (code === "malformed_model_output") {
    return {
      category: "schema_validation",
      stage: "model_output_validation",
      reason: "output_invalid",
    };
  }
  return { category: "upstream_api", stage: "openai_request", reason: "request_failed" };
}

export class ResearchGenerationError extends Error {
  readonly code: Exclude<ResearchApiErrorCode, "invalid_input">;
  readonly diagnostic: ResearchDiagnostic;

  constructor(
    code: Exclude<ResearchApiErrorCode, "invalid_input">,
    diagnostic: ResearchDiagnostic = defaultDiagnostic(code),
  ) {
    super(code);
    this.name = "ResearchGenerationError";
    this.code = code;
    this.diagnostic = diagnostic;
  }
}

const TIMEOUT_ERROR_NAMES = new Set([
  "APIConnectionTimeoutError",
  "AbortError",
  "ConnectTimeoutError",
]);
const TIMEOUT_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "ECONNABORTED",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function isTimeoutError(error: unknown, inspectCause = true): boolean {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return true;
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const name = "name" in error ? safeDiagnosticToken(error.name) : undefined;
  const code = "code" in error ? safeDiagnosticToken(error.code) : undefined;

  if (
    (name && TIMEOUT_ERROR_NAMES.has(name)) ||
    (code && TIMEOUT_ERROR_CODES.has(code))
  ) {
    return true;
  }

  return inspectCause && "cause" in error
    ? isTimeoutError(error.cause, false)
    : false;
}

function upstreamReason(status: number | undefined) {
  if (status === 400 || status === 422) return "request_rejected";
  if (status === 401) return "authentication_rejected";
  if (status === 403) return "permission_rejected";
  if (status === 404) return "model_or_endpoint_not_found";
  if (status === 429) return "rate_limited";
  if (status && status >= 500) return "upstream_server_error";
  return "connection_failed";
}

export function classifyResearchProviderError(error: unknown): ResearchDiagnostic {
  if (isTimeoutError(error)) {
    return { category: "timeout", stage: "openai_request", reason: "request_timeout" };
  }

  if (error instanceof z.ZodError) {
    return {
      category: "parsing",
      stage: "structured_output_parse",
      reason: "zod_parse_failed",
    };
  }

  if (error instanceof LengthFinishReasonError) {
    return {
      category: "parsing",
      stage: "structured_output_parse",
      reason: "output_length_exceeded",
    };
  }

  if (error instanceof ContentFilterFinishReasonError) {
    return {
      category: "parsing",
      stage: "structured_output_parse",
      reason: "content_filter_rejected",
    };
  }

  if (error instanceof OpenAI.APIConnectionError) {
    return {
      category: "upstream_api",
      stage: "openai_request",
      reason: "connection_failed",
    };
  }

  if (error instanceof OpenAI.APIError) {
    return {
      category: "upstream_api",
      stage: "openai_request",
      reason: upstreamReason(error.status),
      ...(typeof error.status === "number" ? { upstreamStatus: error.status } : {}),
      ...(safeDiagnosticToken(error.code)
        ? { upstreamCode: safeDiagnosticToken(error.code) }
        : {}),
      ...(safeDiagnosticToken(error.requestID)
        ? { requestId: safeDiagnosticToken(error.requestID) }
        : {}),
    };
  }

  return {
    category: "upstream_api",
    stage: "openai_request",
    reason: "unexpected_provider_error",
  };
}

export function buildResearchResponseParams({
  profile,
  branch,
  question,
  dateChecked,
  model,
}: Omit<Parameters<ResearchProviderRequest>[0], "apiKey">) {
  return {
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
        type: "web_search" as const,
        search_context_size: "medium" as const,
        user_location: {
          type: "approximate" as const,
          city: "Manila",
          country: "PH",
          timezone: "Asia/Manila",
        },
      },
    ],
    tool_choice: "required" as const,
    include: ["web_search_call.action.sources" as const],
    text: {
      format: zodTextFormat(
        ResearchGenerationCandidateSchema,
        "research_generation",
      ),
    },
  };
}

export function buildBackgroundResearchResponseParams(
  input: Parameters<typeof buildResearchResponseParams>[0],
): ResponseCreateParamsNonStreaming {
  return {
    ...buildResearchResponseParams(input),
    background: true,
  };
}

export function extractResearchProviderResult(
  response: ResearchProviderResponse,
): ResearchProviderResult {
  const searchCalls = response.output.filter(isResearchWebSearchCall);
  const retrievedSourceUrls = searchCalls.flatMap((call) =>
    call.action.type === "search"
      ? (call.action.sources ?? []).map((source) => source.url)
      : [],
  );
  const citedSourceUrls = response.output
    .filter(isResearchOutputMessage)
    .flatMap((message) => message.content)
    .flatMap((content) =>
      content.type === "output_text"
        ? content.annotations
            .filter((annotation) => annotation.type === "url_citation")
            .map((annotation) => annotation.url)
        : [],
    );
  const retrievalStatus = searchCalls.some((call) => call.status === "completed")
    ? "completed"
    : searchCalls.some((call) => call.status === "failed")
      ? "failed"
      : "missing";

  return {
    output: response.output_parsed,
    retrievedSourceUrls: [...new Set([...retrievedSourceUrls, ...citedSourceUrls])],
    retrievalStatus,
  };
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

  const response = await client.responses.parse(
    buildResearchResponseParams({ profile, branch, question, dateChecked, model }),
  );

  return extractResearchProviderResult(response);
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function researchConfiguration(options: BackgroundResearchOptions) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey.trim()) {
    throw new ResearchGenerationError("configuration_missing", {
      category: "configuration",
      stage: "configuration",
      reason: "api_key_missing",
    });
  }
  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new ResearchGenerationError("invalid_model_configuration", {
      category: "configuration",
      stage: "configuration",
      reason: "model_not_gpt_5_6",
    });
  }

  return { apiKey, model };
}

function backgroundProvider(
  apiKey: string,
  provider?: ResearchBackgroundProvider,
): ResearchBackgroundProvider {
  if (provider) {
    return provider;
  }

  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });
  return {
    create: (params) => client.responses.create(params),
    retrieve: (responseId, params) => client.responses.retrieve(responseId, params),
    cancel: (responseId) => client.responses.cancel(responseId),
  };
}

function providerDiagnosticAtStage(error: unknown, stage: string) {
  return { ...classifyResearchProviderError(error), stage };
}

function providerTerminalDiagnostic(
  status: "failed" | "cancelled" | "incomplete",
  response: OpenAIResponse,
): ResearchDiagnostic {
  const upstreamCode = safeDiagnosticToken(response.error?.code);
  return {
    category: status === "incomplete" ? "parsing" : "upstream_api",
    stage: "provider_terminal_state",
    reason: `response_${status}`,
    ...(upstreamCode ? { upstreamCode } : {}),
  };
}

function normalizeProviderStatus(status: ResponseStatus | undefined) {
  return status === "queued" ? "queued" : "in_progress";
}

export async function startBackgroundResearch(
  profile: StudentProfile,
  branch: PathBranch,
  question: string,
  options: BackgroundResearchOptions = {},
) {
  let context: ReturnType<typeof validateResearchContext>;
  try {
    context = validateResearchContext(profile, branch, question);
  } catch (error) {
    const validationError = error as ResearchValidationError;
    throw new ResearchGenerationError("malformed_model_output", {
      category: validationError.category ?? "schema_validation",
      stage: "research_context",
      reason: validationError.reason ?? "request_context_invalid",
    });
  }

  const { apiKey, model } = researchConfiguration(options);
  const dateChecked = options.dateChecked ?? currentDate();
  let response: OpenAIResponse;
  try {
    response = await backgroundProvider(apiKey, options.provider).create(
      buildBackgroundResearchResponseParams({
        profile: context.profile,
        branch: context.branch,
        question: context.question,
        dateChecked,
        model,
      }),
    );
  } catch (error) {
    const diagnostic = providerDiagnosticAtStage(error, "background_response_create");
    throw new ResearchGenerationError(
      diagnostic.category === "timeout" ? "timeout" : "api_failure",
      diagnostic,
    );
  }

  return {
    responseId: response.id,
    dateChecked,
    status: normalizeProviderStatus(response.status),
  } as const;
}

export async function retrieveBackgroundResearch(
  responseId: string,
  profile: StudentProfile,
  branch: PathBranch,
  question: string,
  dateChecked: string,
  options: BackgroundResearchOptions = {},
): Promise<BackgroundResearchState> {
  const context = validateResearchContext(profile, branch, question);
  const { apiKey, model } = researchConfiguration(options);
  let response: OpenAIResponse;

  try {
    response = await backgroundProvider(apiKey, options.provider).retrieve(
      responseId,
      BACKGROUND_RETRIEVE_PARAMS,
    );
  } catch (error) {
    const diagnostic = providerDiagnosticAtStage(error, "background_response_retrieve");
    throw new ResearchGenerationError(
      diagnostic.category === "timeout" ? "timeout" : "api_failure",
      diagnostic,
    );
  }

  const responseStatus = response.status;
  if (responseStatus === "queued" || responseStatus === "in_progress") {
    return { status: responseStatus };
  }
  if (responseStatus === "failed" || responseStatus === "cancelled" || responseStatus === "incomplete") {
    return {
      status: responseStatus,
      diagnostic: providerTerminalDiagnostic(responseStatus, response),
    };
  }
  if (responseStatus !== "completed") {
    return {
      status: "failed",
      diagnostic: {
        category: "upstream_api",
        stage: "provider_terminal_state",
        reason: "response_status_missing",
      },
    };
  }

  let result: ResearchProviderResult;
  try {
    const parsed = parseResponse(
      response,
      buildResearchResponseParams({
        profile: context.profile,
        branch: context.branch,
        question: context.question,
        dateChecked,
        model,
      }),
    );
    result = extractResearchProviderResult(parsed);
  } catch (error) {
    throw new ResearchGenerationError("malformed_model_output", {
      ...providerDiagnosticAtStage(error, "structured_output_parse"),
      category: "parsing",
    });
  }

  if (result.retrievalStatus !== "completed") {
    throw new ResearchGenerationError("retrieval_failure", {
      category: "source_processing",
      stage: "retrieval_status",
      reason:
        result.retrievalStatus === "failed"
          ? "retrieval_failed"
          : "retrieval_missing",
    });
  }

  try {
    return {
      status: "completed",
      result: validateResearchGeneration(
        context.branch,
        context.question,
        result.output,
        result.retrievedSourceUrls,
        dateChecked,
      ),
    };
  } catch (error) {
    const validationError = error as ResearchValidationError;
    throw new ResearchGenerationError("malformed_model_output", {
      category: validationError.category ?? "schema_validation",
      stage: "model_output_validation",
      reason: validationError.reason ?? "output_invalid",
    });
  }
}

export async function cancelBackgroundResearch(
  responseId: string,
  options: BackgroundResearchOptions = {},
) {
  const { apiKey } = researchConfiguration(options);
  try {
    await backgroundProvider(apiKey, options.provider).cancel(responseId);
  } catch (error) {
    const diagnostic = providerDiagnosticAtStage(error, "background_response_cancel");
    throw new ResearchGenerationError(
      diagnostic.category === "timeout" ? "timeout" : "api_failure",
      diagnostic,
    );
  }
  return { status: "cancelled" as const };
}

export async function generateResearchExpansion(
  profile: StudentProfile,
  branch: PathBranch,
  question: string,
  options: GenerateResearchOptions = {},
): Promise<ResearchGeneration> {
  try {
    validateResearchContext(profile, branch, question);
  } catch (error) {
    const validationError = error as ResearchValidationError;
    throw new ResearchGenerationError("malformed_model_output", {
      category: validationError.category ?? "schema_validation",
      stage: "research_context",
      reason: validationError.reason ?? "request_context_invalid",
    });
  }

  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const dateChecked = options.dateChecked ?? currentDate();

  if (!apiKey.trim()) {
    throw new ResearchGenerationError("configuration_missing", {
      category: "configuration",
      stage: "configuration",
      reason: "api_key_missing",
    });
  }
  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new ResearchGenerationError("invalid_model_configuration", {
      category: "configuration",
      stage: "configuration",
      reason: "model_not_gpt_5_6",
    });
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
    const diagnostic = classifyResearchProviderError(error);
    throw new ResearchGenerationError(
      diagnostic.category === "timeout"
        ? "timeout"
        : diagnostic.category === "parsing"
          ? "malformed_model_output"
          : "api_failure",
      diagnostic,
    );
  }

  if (result.retrievalStatus !== "completed") {
    throw new ResearchGenerationError("retrieval_failure", {
      category: "source_processing",
      stage: "retrieval_status",
      reason:
        result.retrievalStatus === "failed"
          ? "retrieval_failed"
          : "retrieval_missing",
    });
  }

  try {
    return validateResearchGeneration(
      branch,
      question,
      result.output,
      result.retrievedSourceUrls,
      dateChecked,
    );
  } catch (error) {
    const validationError = error as ResearchValidationError;
    throw new ResearchGenerationError("malformed_model_output", {
      category: validationError.category ?? "schema_validation",
      stage: "model_output_validation",
      reason: validationError.reason ?? "output_invalid",
    });
  }
}
