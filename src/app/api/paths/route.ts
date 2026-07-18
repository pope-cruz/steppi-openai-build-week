import { NextResponse } from "next/server";
import { z } from "zod";

import type { PathApiFailure, PathApiResponse } from "@/lib/path-api";
import { StudentProfileSchema } from "@/lib/schemas";
import {
  generatePathBranches,
  PathGenerationError,
} from "@/server/path-generation";

export const runtime = "nodejs";
export const maxDuration = 60;

const PathRequestSchema = z.object({ profile: StudentProfileSchema }).strict();
type GeneratePaths = typeof generatePathBranches;

const ERROR_DETAILS: Record<
  PathGenerationError["code"],
  { message: string; retryable: boolean; status: number }
> = {
  configuration_missing: {
    message: "Path generation is not configured yet. Your confirmed profile is still available.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message: "Path generation is not configured for GPT-5.6 yet. Your confirmed profile is still available.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message: "Steppi took too long to explore these roles. Your confirmed profile is safe; please try again.",
    retryable: true,
    status: 504,
  },
  api_failure: {
    message: "Steppi could not explore roles right now. Your confirmed profile is safe; please try again.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message: "Steppi received roles it could not safely compare. Nothing was shown; please try again.",
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
          message: "The confirmed profile could not be read. Please return to it and try again.",
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
          message: "The confirmed profile is incomplete or invalid. Please review it before exploring roles.",
          retryable: false,
        },
      },
      400,
    );
  }

  try {
    const branches = await generatePaths(parsedInput.data.profile);

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
