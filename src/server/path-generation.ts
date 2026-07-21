import OpenAI from "openai";
import {
  APIError,
  ContentFilterFinishReasonError,
  LengthFinishReasonError,
} from "openai/error";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { PathApiErrorCode } from "@/lib/path-api";
import {
  PathValidationError,
  type PathValidationFailureReason,
  validatePathGeneration,
} from "@/lib/path-validation";
import {
  ConfirmedSummarySchema,
  PathGenerationSchema,
  type PathBranch,
  type StudentProfile,
} from "@/lib/schemas";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 45_000;
const RETRY_BACKOFF_MS = [250, 750] as const;

export const MAX_PATH_ATTEMPTS = 3;
export const PATH_MAX_OUTPUT_TOKENS = 15_000;
export const PATH_REASONING_EFFORT = "low";
export const PATH_TEXT_VERBOSITY = "low";

export const PATH_INSTRUCTIONS = `You are Steppi, a career-exploration tool for high-school and college students.
Generate one complete unranked set of career-role possibilities from the confirmed student profile. Target thirteen roles and return no fewer than twelve and no more than fifteen.

Rules:
- Return all roles together in one response. Never rank, score, tier, order, or label any role as the best fit.
- The input contains the complete structured profile followed by the student's approved summary. Treat that approved summary as the student's latest clarification.
- The input also contains allowedSupportingProfileIds. Copy supportingProfileIds exactly from that allow-list; never invent, alter, or repeat an ID within one role.
- If retryCorrection is present, correct that application-identified problem while regenerating the complete role set.
- If the approved summary conflicts with an older inference or profile detail, follow the approved summary. If it adds information, incorporate it.
- Do not treat a stylistic omission from the short approved summary as a rejection of every omitted profile detail. Use the complete profile for breadth and the approved summary to resolve contradictions and priorities.
- Target thirteen roles. Twelve, fourteen, or fifteen are allowed only when that produces a more honest, varied set.
- Make the roles meaningfully different across occupation families, work rhythms, environments, and ways of using the student's interests. Do not return minor title variants from one occupation family.
- Give every role a unique stable id and a distinct career title.
- Reference only IDs that exist in the supplied profile in supportingProfileIds.
- Use supporting profile facts as student-provided evidence and profile inferences only as tentative model evidence.
- Use summary for one plain-language sentence explaining what the role or direction is.
- Use whyItAppeared for one or two concise, student-facing sentences explaining why the role may fit. Ground each sentence in specific supplied profile facts, experiences, preferences, strengths, or clearly tentative inferences.
- Use drawbacks for one or two concise sentences explaining why the role may not fit. Acknowledge uncertainty and describe something the student could notice or explore; never present a mismatch as a verdict.
- Use dayToDay as an array of two or three items that help the student imagine common tasks, collaboration, work environment, and rhythm without turning the response into a career encyclopedia. Put exactly one sentence in each array item; never combine multiple sentences in one item.
- Use lowRiskExploration for one specific, low-cost, low-commitment activity the student can try without enrolling in a program or making a career decision.
- Include at least one unresolved question per branch.
- Related options may name general careers or majors, but do not recommend specific colleges or programs.
- Do not assert current salaries, employment demand, admissions rates, rankings, tuition, program availability, costs, or other time-sensitive facts.
- Do not diagnose aptitude or personality, predict outcomes, or shame the student's constraints.
- Use conversational, plain, student-facing language. Keep it stage-neutral unless the student has explicitly disclosed their education stage, and speak directly to the student where natural.
- Keep every explanation concise enough to scan in under one minute.`;

type PathProviderResult = {
  output: unknown;
  incompleteReason?: "max_output_tokens" | "content_filter" | null;
  requestId?: string | null;
};

type PathRequest = (input: {
  profile: StudentProfile;
  confirmedSummary: string;
  apiKey: string;
  model: string;
  attempt: number;
  retryCorrection?: string;
}) => Promise<PathProviderResult>;

type DiagnosticPublicCode = Exclude<PathApiErrorCode, "invalid_input">;

export type PathGenerationDiagnostic = {
  attempt: number;
  stage:
    | "configuration"
    | "input_validation"
    | "provider_request"
    | "provider_response"
    | "structured_validation"
    | "role_validation"
    | "complete";
  reason:
    | "missing_api_key"
    | "invalid_model"
    | "invalid_confirmed_summary"
    | "request_timeout"
    | "request_aborted"
    | "connection_failed"
    | "retryable_upstream_status"
    | "authentication_failed"
    | "permission_denied"
    | "request_rejected"
    | "upstream_api_failure"
    | "incomplete_max_output_tokens"
    | "incomplete_content_filter"
    | "parsed_output_missing"
    | "provider_parse_failed"
    | "schema_validation_failed"
    | PathValidationFailureReason
    | "validated_output";
  retryable: boolean;
  publicCode?: DiagnosticPublicCode;
  elapsedMs?: number;
  upstreamStatus?: number;
  upstreamCode?: string;
  requestId?: string;
  issuePaths?: string[];
};

type GeneratePathsOptions = {
  apiKey?: string;
  model?: string;
  requestPaths?: PathRequest;
  sleep?: (milliseconds: number) => Promise<void>;
  diagnosticSink?: (diagnostic: PathGenerationDiagnostic) => void;
  now?: () => number;
};

class PathProviderOutputError extends Error {
  readonly reason:
    | "incomplete_max_output_tokens"
    | "incomplete_content_filter"
    | "parsed_output_missing";
  readonly retryable: boolean;

  constructor(
    reason: PathProviderOutputError["reason"],
    retryable: boolean,
  ) {
    super(reason);
    this.name = "PathProviderOutputError";
    this.reason = reason;
    this.retryable = retryable;
  }
}

export class PathGenerationError extends Error {
  readonly code: DiagnosticPublicCode;
  readonly diagnostics: PathGenerationDiagnostic[];

  constructor(
    code: DiagnosticPublicCode,
    diagnostics: PathGenerationDiagnostic[] = [],
  ) {
    super(code);
    this.name = "PathGenerationError";
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function defaultDiagnosticSink(diagnostic: PathGenerationDiagnostic) {
  const method = diagnostic.reason === "validated_output" ? console.info : console.warn;
  method(`[path-generation] ${JSON.stringify(diagnostic)}`);
}

function emitDiagnostic(
  sink: (diagnostic: PathGenerationDiagnostic) => void,
  diagnostic: PathGenerationDiagnostic,
) {
  try {
    sink(diagnostic);
  } catch {
    // Diagnostics must never change the user-visible generation result.
  }
}

function safeToken(value: unknown, maximumLength = 128) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^[a-z0-9._-]+$/i.test(trimmed) && trimmed.length <= maximumLength
    ? trimmed
    : undefined;
}

function isTimeoutError(error: unknown) {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return true;
  }
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

function profileItemIds(profile: StudentProfile) {
  return [
    ...profile.facts.map((item) => item.id),
    ...profile.inferences.map((item) => item.id),
    ...profile.constraints.map((item) => item.id),
    ...profile.uncertainties.map((item) => item.id),
    ...profile.tensions.map((item) => item.id),
  ];
}

async function requestPathsFromOpenAI({
  profile,
  confirmedSummary,
  apiKey,
  model,
  retryCorrection,
}: Parameters<PathRequest>[0]): Promise<PathProviderResult> {
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const response = await client.responses.parse({
    model,
    instructions: PATH_INSTRUCTIONS,
    input: JSON.stringify(
      pathGenerationContext(profile, confirmedSummary, retryCorrection),
    ),
    max_output_tokens: PATH_MAX_OUTPUT_TOKENS,
    reasoning: { effort: PATH_REASONING_EFFORT },
    text: {
      format: zodTextFormat(PathGenerationSchema, "path_generation"),
      verbosity: PATH_TEXT_VERBOSITY,
    },
  });

  return {
    output: response.output_parsed,
    incompleteReason: response.incomplete_details?.reason,
    requestId: response._request_id,
  };
}

export function pathGenerationContext(
  profile: StudentProfile,
  confirmedSummary: string,
  retryCorrection?: string,
) {
  return {
    confirmedProfile: profile,
    studentApprovedSummary: ConfirmedSummarySchema.parse(confirmedSummary),
    allowedSupportingProfileIds: profileItemIds(profile),
    ...(retryCorrection ? { retryCorrection } : {}),
  };
}

export function requireParsedPathOutput({
  incompleteReason,
  output,
}: Pick<PathProviderResult, "incompleteReason" | "output">) {
  if (output !== null && output !== undefined) {
    return output;
  }

  if (incompleteReason === "max_output_tokens") {
    throw new PathProviderOutputError("incomplete_max_output_tokens", true);
  }
  if (incompleteReason === "content_filter") {
    throw new PathProviderOutputError("incomplete_content_filter", false);
  }
  throw new PathProviderOutputError("parsed_output_missing", true);
}

function publicCodeForDiagnostics(diagnostics: PathGenerationDiagnostic[]) {
  const priority: Record<DiagnosticPublicCode, number> = {
    configuration_missing: 0,
    invalid_model_configuration: 0,
    api_failure: 1,
    timeout: 2,
    malformed_model_output: 3,
  };

  return diagnostics.reduce<DiagnosticPublicCode>(
    (selected, diagnostic) =>
      diagnostic.publicCode && priority[diagnostic.publicCode] > priority[selected]
        ? diagnostic.publicCode
        : selected,
    "api_failure",
  );
}

function apiFailureDiagnostic(
  error: APIError,
  attempt: number,
): PathGenerationDiagnostic {
  const upstreamStatus = error.status;
  const upstreamCode = safeToken(error.code, 80);
  const requestId = safeToken(error.requestID);
  const base = {
    attempt,
    stage: "provider_request" as const,
    publicCode: "api_failure" as const,
    ...(typeof upstreamStatus === "number" ? { upstreamStatus } : {}),
    ...(upstreamCode ? { upstreamCode } : {}),
    ...(requestId ? { requestId } : {}),
  };

  if (error instanceof OpenAI.APIUserAbortError) {
    return { ...base, reason: "request_aborted", retryable: false };
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return { ...base, reason: "connection_failed", retryable: true };
  }
  if (error instanceof OpenAI.AuthenticationError) {
    return { ...base, reason: "authentication_failed", retryable: false };
  }
  if (error instanceof OpenAI.PermissionDeniedError) {
    return { ...base, reason: "permission_denied", retryable: false };
  }
  if (
    upstreamStatus === 408 ||
    upstreamStatus === 409 ||
    upstreamStatus === 429 ||
    (typeof upstreamStatus === "number" && upstreamStatus >= 500)
  ) {
    return { ...base, reason: "retryable_upstream_status", retryable: true };
  }
  return { ...base, reason: "request_rejected", retryable: false };
}

function diagnosticForAttemptError({
  attempt,
  error,
  requestId,
}: {
  attempt: number;
  error: unknown;
  requestId?: string;
}): PathGenerationDiagnostic {
  const requestMetadata = requestId ? { requestId } : {};

  if (error instanceof PathProviderOutputError) {
    return {
      attempt,
      stage: "provider_response",
      reason: error.reason,
      retryable: error.retryable,
      publicCode: "malformed_model_output",
      ...requestMetadata,
    };
  }
  if (error instanceof LengthFinishReasonError) {
    return {
      attempt,
      stage: "provider_response",
      reason: "incomplete_max_output_tokens",
      retryable: true,
      publicCode: "malformed_model_output",
      ...requestMetadata,
    };
  }
  if (error instanceof ContentFilterFinishReasonError) {
    return {
      attempt,
      stage: "provider_response",
      reason: "incomplete_content_filter",
      retryable: false,
      publicCode: "malformed_model_output",
      ...requestMetadata,
    };
  }
  if (error instanceof SyntaxError) {
    return {
      attempt,
      stage: "provider_response",
      reason: "provider_parse_failed",
      retryable: true,
      publicCode: "malformed_model_output",
      ...requestMetadata,
    };
  }
  if (error instanceof z.ZodError) {
    return {
      attempt,
      stage: "structured_validation",
      reason: "schema_validation_failed",
      retryable: true,
      publicCode: "malformed_model_output",
      issuePaths: error.issues
        .map((issue) => issue.path.join("."))
        .filter(Boolean),
      ...requestMetadata,
    };
  }
  if (error instanceof PathValidationError) {
    return {
      attempt,
      stage: "role_validation",
      reason: error.reason,
      retryable: true,
      publicCode: "malformed_model_output",
      ...requestMetadata,
    };
  }
  if (isTimeoutError(error)) {
    return {
      attempt,
      stage: "provider_request",
      reason: "request_timeout",
      retryable: true,
      publicCode: "timeout",
      ...requestMetadata,
    };
  }
  if (error instanceof APIError) {
    return apiFailureDiagnostic(error, attempt);
  }
  return {
    attempt,
    stage: "provider_request",
    reason: "upstream_api_failure",
    retryable: false,
    publicCode: "api_failure",
    ...requestMetadata,
  };
}

function retryCorrectionFor(diagnostic: PathGenerationDiagnostic) {
  const { reason } = diagnostic;

  if (
    reason === "schema_validation_failed" &&
    diagnostic.issuePaths?.some((path) => path.includes(".dayToDay."))
  ) {
    return "Regenerate the complete role set with dayToDay as an array of two or three items for every role. Put exactly one sentence in each dayToDay item; never combine multiple sentences in one item.";
  }
  if (
    reason === "invalid_evidence_reference" ||
    reason === "duplicate_evidence_ids"
  ) {
    return "Regenerate the complete role set and copy every supportingProfileIds value exactly from allowedSupportingProfileIds, without repeats.";
  }
  if (
    reason === "duplicate_role_ids" ||
    reason === "duplicate_role_titles" ||
    reason === "roles_too_similar" ||
    reason === "roles_collapsed"
  ) {
    return "Regenerate the complete role set with unique IDs, distinct titles, and meaningfully different occupation families, work rhythms, and environments.";
  }
  if (reason === "unsupported_current_claim") {
    return "Regenerate the complete role set without salaries, rankings, demand, admissions, costs, availability, or other current claims.";
  }
  if (
    reason === "schema_validation_failed" ||
    reason === "provider_parse_failed" ||
    reason === "incomplete_max_output_tokens" ||
    reason === "parsed_output_missing"
  ) {
    return "Regenerate one complete schema-valid object containing twelve to fifteen fully populated roles; do not omit, rename, or add fields.";
  }
  return undefined;
}

export async function generatePathBranches(
  profile: StudentProfile,
  confirmedSummary: string,
  options: GeneratePathsOptions = {},
): Promise<PathBranch[]> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const requestPaths = options.requestPaths ?? requestPathsFromOpenAI;
  const sleep = options.sleep ?? defaultSleep;
  const diagnosticSink = options.diagnosticSink ?? defaultDiagnosticSink;
  const now = options.now ?? Date.now;

  if (!apiKey.trim()) {
    const diagnostic: PathGenerationDiagnostic = {
      attempt: 0,
      stage: "configuration",
      reason: "missing_api_key",
      retryable: false,
      publicCode: "configuration_missing",
    };
    emitDiagnostic(diagnosticSink, diagnostic);
    throw new PathGenerationError("configuration_missing", [diagnostic]);
  }

  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    const diagnostic: PathGenerationDiagnostic = {
      attempt: 0,
      stage: "configuration",
      reason: "invalid_model",
      retryable: false,
      publicCode: "invalid_model_configuration",
    };
    emitDiagnostic(diagnosticSink, diagnostic);
    throw new PathGenerationError("invalid_model_configuration", [diagnostic]);
  }

  const parsedSummary = ConfirmedSummarySchema.safeParse(confirmedSummary);
  if (!parsedSummary.success) {
    const diagnostic: PathGenerationDiagnostic = {
      attempt: 0,
      stage: "input_validation",
      reason: "invalid_confirmed_summary",
      retryable: false,
      publicCode: "malformed_model_output",
      issuePaths: parsedSummary.error.issues
        .map((issue) => issue.path.join("."))
        .filter(Boolean),
    };
    emitDiagnostic(diagnosticSink, diagnostic);
    throw new PathGenerationError("malformed_model_output", [diagnostic]);
  }

  const diagnostics: PathGenerationDiagnostic[] = [];
  let retryCorrection: string | undefined;

  for (let attempt = 1; attempt <= MAX_PATH_ATTEMPTS; attempt += 1) {
    const attemptStartedAt = now();
    let requestId: string | undefined;

    try {
      const providerResult = await requestPaths({
        profile,
        confirmedSummary: parsedSummary.data,
        apiKey,
        model,
        attempt,
        ...(retryCorrection ? { retryCorrection } : {}),
      });
      requestId = safeToken(providerResult.requestId);
      const output = requireParsedPathOutput(providerResult);
      const branches = validatePathGeneration(profile, output);
      emitDiagnostic(diagnosticSink, {
        attempt,
        stage: "complete",
        reason: "validated_output",
        retryable: false,
        elapsedMs: Math.max(0, Math.round(now() - attemptStartedAt)),
        ...(requestId ? { requestId } : {}),
      });
      return branches;
    } catch (error) {
      const diagnostic = diagnosticForAttemptError({
        attempt,
        error,
        requestId,
      });
      diagnostic.elapsedMs = Math.max(
        0,
        Math.round(now() - attemptStartedAt),
      );
      diagnostics.push(diagnostic);
      emitDiagnostic(diagnosticSink, diagnostic);

      if (!diagnostic.retryable) {
        throw new PathGenerationError(
          diagnostic.publicCode ?? "api_failure",
          diagnostics,
        );
      }
      if (attempt === MAX_PATH_ATTEMPTS) {
        throw new PathGenerationError(
          publicCodeForDiagnostics(diagnostics),
          diagnostics,
        );
      }

      retryCorrection = retryCorrectionFor(diagnostic);
      await sleep(RETRY_BACKOFF_MS[attempt - 1]);
    }
  }

  throw new PathGenerationError(
    publicCodeForDiagnostics(diagnostics),
    diagnostics,
  );
}
