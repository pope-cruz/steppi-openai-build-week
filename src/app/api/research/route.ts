import { NextResponse } from "next/server";

import type {
  ResearchApiFailure,
  ResearchApiResponse,
} from "@/lib/research-api";
import { ResearchRequestSchema } from "@/lib/schemas";
import {
  generateResearchExpansion,
  ResearchGenerationError,
} from "@/server/research-generation";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateResearch = typeof generateResearchExpansion;

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
    message: "Steppi took too long to research this path. Your map and question are safe; please try again.",
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

function failureResponse(body: ResearchApiFailure, status: number) {
  return NextResponse.json<ResearchApiResponse>(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleResearchRequest(
  request: Request,
  generateResearch: GenerateResearch = generateResearchExpansion,
) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return failureResponse(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: "The research question could not be read. Please review it and try again.",
          retryable: false,
        },
      },
      400,
    );
  }

  const parsedInput = ResearchRequestSchema.safeParse(input);
  if (!parsedInput.success) {
    return failureResponse(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: "The selected path or question is incomplete. Please review it before researching.",
          retryable: false,
        },
      },
      400,
    );
  }

  const { profile, branch, question } = parsedInput.data;
  try {
    const result = await generateResearch(profile, branch, question);
    if (result.status === "no_useful_sources") {
      return NextResponse.json<ResearchApiResponse>(
        { ok: true, status: "no_useful_sources", question, nodes: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json<ResearchApiResponse>(
      { ok: true, status: "success", question, nodes: result.nodes },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const generationError =
      error instanceof ResearchGenerationError
        ? error
        : new ResearchGenerationError("api_failure");
    const details = ERROR_DETAILS[generationError.code];
    return failureResponse(
      {
        ok: false,
        error: {
          code: generationError.code,
          message: details.message,
          retryable: details.retryable,
        },
      },
      details.status,
    );
  }
}

export async function POST(request: Request) {
  return handleResearchRequest(request);
}
