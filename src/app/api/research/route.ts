import { NextResponse } from "next/server";

import type {
  ResearchApiFailure,
  ResearchApiResponse,
} from "@/lib/research-api";
import {
  recordResearchDiagnostic,
  type ResearchDiagnostic,
  type ResearchDiagnosticRecorder,
} from "@/lib/research-diagnostics";
import { ResearchRequestSchema, type ResearchRequest } from "@/lib/schemas";
import {
  cancelBackgroundResearch,
  retrieveBackgroundResearch,
  ResearchGenerationError,
  startBackgroundResearch,
} from "@/server/research-generation";
import {
  openResearchJobToken,
  researchContextDigest,
  researchContextMatches,
  sealResearchJobToken,
  type ResearchJobToken,
} from "@/server/research-job-token";

export const runtime = "nodejs";
export const maxDuration = 60;

export const RESEARCH_JOB_COOKIE = "steppi_research_job";
const RESEARCH_JOB_MAX_AGE_SECONDS = 180;
const RESEARCH_JOB_ACTIVE_BUDGET_MS = 120_000;

type RouteDependencies = {
  startResearch: typeof startBackgroundResearch;
  retrieveResearch: typeof retrieveBackgroundResearch;
  cancelResearch: typeof cancelBackgroundResearch;
  recordDiagnostic: ResearchDiagnosticRecorder;
  jobSecret: () => string;
  now: () => number;
};

const defaultDependencies: RouteDependencies = {
  startResearch: startBackgroundResearch,
  retrieveResearch: retrieveBackgroundResearch,
  cancelResearch: cancelBackgroundResearch,
  recordDiagnostic: recordResearchDiagnostic,
  jobSecret: () => process.env.OPENAI_API_KEY ?? "",
  now: Date.now,
};

const ERROR_DETAILS: Record<
  ResearchGenerationError["code"],
  { message: string; retryable: boolean; status: number }
> = {
  configuration_missing: {
    message: "Research is not configured yet. Your selected path and question are still here.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message: "Research is not configured for GPT-5.6 yet. Your selected path and question are still here.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message: "Steppi took too long to contact the research service. Your map and question are safe; please try again.",
    retryable: true,
    status: 504,
  },
  retrieval_failure: {
    message: "Steppi could not reach useful sources right now. Your map and question are safe; please try again.",
    retryable: true,
    status: 502,
  },
  api_failure: {
    message: "Steppi could not finish this research right now. Your map and question are safe; please try again.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message: "Steppi received research it could not safely verify. Nothing new was added; please try again.",
    retryable: true,
    status: 502,
  },
};

function dependencies(overrides: Partial<RouteDependencies>) {
  return { ...defaultDependencies, ...overrides };
}

function failureResponse(
  body: ResearchApiFailure,
  status: number,
  clearCookie = false,
) {
  const response = NextResponse.json<ResearchApiResponse>(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
  if (clearCookie) clearResearchJobCookie(response);
  return response;
}

function safeFailure(
  error: unknown,
  recordDiagnostic: ResearchDiagnosticRecorder,
  publicStatus: "failed" | "cancelled" | "incomplete" = "failed",
  clearCookie = false,
) {
  const generationError =
    error instanceof ResearchGenerationError
      ? error
      : new ResearchGenerationError("api_failure", {
          category: "upstream_api",
          stage: "research_route",
          reason: "unexpected_exception",
        });
  recordDiagnostic(generationError.diagnostic);
  const details = ERROR_DETAILS[generationError.code];
  return failureResponse(
    {
      ok: false,
      status: publicStatus,
      error: {
        code: generationError.code,
        message: details.message,
        retryable: details.retryable,
      },
    },
    details.status,
    clearCookie,
  );
}

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function setResearchJobCookie(response: NextResponse, token: string) {
  response.cookies.set(RESEARCH_JOB_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/research",
    maxAge: RESEARCH_JOB_MAX_AGE_SECONDS,
  });
}

function clearResearchJobCookie(response: NextResponse) {
  response.cookies.set(RESEARCH_JOB_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/research",
    maxAge: 0,
  });
}

async function validatedInput(
  request: Request,
  recordDiagnostic: ResearchDiagnosticRecorder,
) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    recordDiagnostic({
      category: "schema_validation",
      stage: "route_input",
      reason: "invalid_json",
    });
    return null;
  }

  const parsed = ResearchRequestSchema.safeParse(input);
  if (!parsed.success) {
    recordDiagnostic({
      category: "schema_validation",
      stage: "route_input",
      reason: "request_schema",
    });
    return null;
  }
  return parsed.data;
}

function invalidInputResponse() {
  return failureResponse(
    {
      ok: false,
      status: "failed",
      error: {
        code: "invalid_input",
        message: "The selected path or question is incomplete. Please review it before researching.",
        retryable: false,
      },
    },
    400,
  );
}

function readJob(
  request: Request,
  input: ResearchRequest,
  deps: RouteDependencies,
) {
  const token = cookieValue(request, RESEARCH_JOB_COOKIE);
  const job = token ? openResearchJobToken(token, deps.jobSecret()) : null;
  if (!job) return null;
  return researchContextMatches(job.contextDigest, researchContextDigest(input))
    ? job
    : null;
}

function missingJobResponse(recordDiagnostic: ResearchDiagnosticRecorder) {
  recordDiagnostic({
    category: "configuration",
    stage: "background_job_handle",
    reason: "job_handle_missing_or_invalid",
  });
  return failureResponse(
    {
      ok: false,
      status: "failed",
      error: {
        code: "api_failure",
        message: "This research job is no longer available. Your map and question are safe; please try again.",
        retryable: true,
      },
    },
    409,
    true,
  );
}

export async function handleResearchStart(
  request: Request,
  overrides: Partial<RouteDependencies> = {},
) {
  const deps = dependencies(overrides);
  const input = await validatedInput(request, deps.recordDiagnostic);
  if (!input) return invalidInputResponse();

  const existingToken = cookieValue(request, RESEARCH_JOB_COOKIE);
  const existingJob = existingToken
    ? openResearchJobToken(existingToken, deps.jobSecret())
    : null;
  if (
    existingJob &&
    !existingJob.cancelRequested &&
    deps.now() - existingJob.createdAt < RESEARCH_JOB_ACTIVE_BUDGET_MS
  ) {
    return failureResponse(
      {
        ok: false,
        status: "failed",
        error: {
          code: "api_failure",
          message: "Research is already active for this map. Wait for it to finish or cancel it first.",
          retryable: false,
        },
      },
      409,
    );
  }

  try {
    const started = await deps.startResearch(input.profile, input.branch, input.question);
    const job: ResearchJobToken = {
      responseId: started.responseId,
      contextDigest: researchContextDigest(input),
      dateChecked: started.dateChecked,
      createdAt: deps.now(),
      cancelRequested: false,
    };
    const response = NextResponse.json<ResearchApiResponse>(
      { ok: true, status: started.status },
      { headers: { "Cache-Control": "no-store" } },
    );
    setResearchJobCookie(response, sealResearchJobToken(job, deps.jobSecret()));
    return response;
  } catch (error) {
    return safeFailure(error, deps.recordDiagnostic);
  }
}

export async function handleResearchStatus(
  request: Request,
  overrides: Partial<RouteDependencies> = {},
) {
  const deps = dependencies(overrides);
  const input = await validatedInput(request, deps.recordDiagnostic);
  if (!input) return invalidInputResponse();
  const job = readJob(request, input, deps);
  if (!job) return missingJobResponse(deps.recordDiagnostic);
  if (job.cancelRequested) {
    return NextResponse.json<ResearchApiResponse>(
      { ok: true, status: "cancelled" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const state = await deps.retrieveResearch(
      job.responseId,
      input.profile,
      input.branch,
      input.question,
      job.dateChecked,
    );
    if (state.status === "queued" || state.status === "in_progress") {
      return NextResponse.json<ResearchApiResponse>(
        { ok: true, status: state.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (state.status === "completed") {
      const response = NextResponse.json<ResearchApiResponse>(
        state.result.status === "success"
          ? {
              ok: true,
              status: "completed",
              outcome: "success",
              question: input.question,
              nodes: state.result.nodes,
            }
          : {
              ok: true,
              status: "completed",
              outcome: "no_useful_sources",
              question: input.question,
              nodes: [],
            },
        { headers: { "Cache-Control": "no-store" } },
      );
      clearResearchJobCookie(response);
      return response;
    }

    if (!("diagnostic" in state)) {
      return safeFailure(
        new ResearchGenerationError("api_failure", {
          category: "upstream_api",
          stage: "background_response_retrieve",
          reason: "unexpected_pending_state",
        }),
        deps.recordDiagnostic,
        "failed",
        true,
      );
    }
    deps.recordDiagnostic(state.diagnostic);
    const code = state.status === "incomplete" ? "malformed_model_output" : "api_failure";
    const details = ERROR_DETAILS[code];
    return failureResponse(
      {
        ok: false,
        status: state.status,
        error: { code, message: details.message, retryable: true },
      },
      details.status,
      true,
    );
  } catch (error) {
    return safeFailure(error, deps.recordDiagnostic, "failed", true);
  }
}

function cancelReasonDiagnostic(reason: unknown): ResearchDiagnostic | null {
  return reason === "timeout"
    ? {
        category: "timeout",
        stage: "client_polling",
        reason: "polling_budget_exceeded",
      }
    : null;
}

export async function handleResearchCancel(
  request: Request,
  overrides: Partial<RouteDependencies> = {},
) {
  const deps = dependencies(overrides);
  let reason: unknown;
  try {
    const input = (await request.json()) as { reason?: unknown };
    reason = input.reason;
  } catch {
    reason = "user";
  }
  const timeoutDiagnostic = cancelReasonDiagnostic(reason);
  if (timeoutDiagnostic) deps.recordDiagnostic(timeoutDiagnostic);

  const token = cookieValue(request, RESEARCH_JOB_COOKIE);
  const job = token ? openResearchJobToken(token, deps.jobSecret()) : null;
  if (!job || job.cancelRequested) {
    return NextResponse.json<ResearchApiResponse>(
      { ok: true, status: "cancelled" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const cancelledJob = { ...job, cancelRequested: true };
  try {
    await deps.cancelResearch(job.responseId);
    const response = NextResponse.json<ResearchApiResponse>(
      { ok: true, status: "cancelled" },
      { headers: { "Cache-Control": "no-store" } },
    );
    setResearchJobCookie(
      response,
      sealResearchJobToken(cancelledJob, deps.jobSecret()),
    );
    return response;
  } catch (error) {
    const response = safeFailure(error, deps.recordDiagnostic, "cancelled");
    setResearchJobCookie(
      response,
      sealResearchJobToken(cancelledJob, deps.jobSecret()),
    );
    return response;
  }
}

export async function POST(request: Request) {
  return handleResearchStart(request);
}

export async function PUT(request: Request) {
  return handleResearchStatus(request);
}

export async function DELETE(request: Request) {
  return handleResearchCancel(request);
}
