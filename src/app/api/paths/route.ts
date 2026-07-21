import { NextResponse } from "next/server";
import { z } from "zod";

import type { PathApiFailure, PathApiResponse } from "@/lib/path-api";
import { ConfirmedSummarySchema, StudentProfileSchema } from "@/lib/schemas";
import {
  generatePathBranches,
  PathGenerationError,
} from "@/server/path-generation";

export const runtime = "nodejs";
export const maxDuration = 150;

const PathRequestSchema = z
  .object({
    profile: StudentProfileSchema,
    confirmedSummary: ConfirmedSummarySchema,
  })
  .strict();
type GeneratePaths = typeof generatePathBranches;

const ERROR_DETAILS: Record<
  PathGenerationError["code"],
  { message: string; retryable: boolean; status: number }
> = {
  configuration_missing: {
    message: "Steppi cannot open career roles yet. What you shared is still available.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message: "Steppi cannot open career roles yet. What you shared is still available.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message: "Steppi took too long to open these roles. What you shared is still here; please try again.",
    retryable: true,
    status: 504,
  },
  api_failure: {
    message: "Steppi could not open these roles right now. What you shared is still here; please try again.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message: "Steppi received a role set it could not safely show. Nothing incomplete was shown; please try again.",
    retryable: true,
    status: 502,
  },
};

function failureResponse(body: PathApiFailure, status: number) {
  return NextResponse.json<PathApiResponse>(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handlePathRequest(
  request: Request,
  generatePaths: GeneratePaths = generatePathBranches,
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
          message: "What you confirmed could not be read. Please return to your reflection and try again.",
          retryable: false,
        },
      },
      400,
    );
  }

  const parsedInput = PathRequestSchema.safeParse(input);

  if (!parsedInput.success) {
    return failureResponse(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: "What you confirmed is incomplete or invalid. Please review your reflection before exploring roles.",
          retryable: false,
        },
      },
      400,
    );
  }

  try {
    const branches = await generatePaths(
      parsedInput.data.profile,
      parsedInput.data.confirmedSummary,
    );

    return NextResponse.json<PathApiResponse>(
      { ok: true, branches },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const generationError =
      error instanceof PathGenerationError
        ? error
        : new PathGenerationError("api_failure");
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
  return handlePathRequest(request);
}
