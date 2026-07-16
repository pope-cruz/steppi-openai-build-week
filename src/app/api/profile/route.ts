import { NextResponse } from "next/server";

import type {
  ProfileApiFailure,
  ProfileApiResponse,
} from "@/lib/profile-api";
import { IntakeRequestSchema } from "@/lib/schemas";
import {
  generateStudentProfile,
  ProfileGenerationError,
} from "@/server/profile-generation";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateProfile = typeof generateStudentProfile;

const ERROR_DETAILS: Record<
  ProfileGenerationError["code"],
  { message: string; retryable: boolean; status: number }
> = {
  configuration_missing: {
    message: "Profile generation is not configured yet. Please try again later.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message: "Profile generation is not configured for GPT-5.6 yet.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message: "Steppi took too long to build the profile. Your sample answers are safe; please try again.",
    retryable: true,
    status: 504,
  },
  api_failure: {
    message: "Steppi could not build the profile right now. Your sample answers are safe; please try again.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message: "Steppi received a profile it could not safely use. Nothing was shown; please try again.",
    retryable: true,
    status: 502,
  },
};

function failureResponse(
  body: ProfileApiFailure,
  status: number,
) {
  return NextResponse.json<ProfileApiResponse>(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleProfileRequest(
  request: Request,
  generateProfile: GenerateProfile = generateStudentProfile,
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
          message: "The intake answers could not be read. Please review them and try again.",
          retryable: false,
        },
      },
      400,
    );
  }

  const parsedInput = IntakeRequestSchema.safeParse(input);

  if (!parsedInput.success) {
    return failureResponse(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: "The intake answers are incomplete or invalid. Please review them and try again.",
          retryable: false,
        },
      },
      400,
    );
  }

  try {
    const profile = await generateProfile(parsedInput.data.answers);

    return NextResponse.json<ProfileApiResponse>(
      { ok: true, profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const generationError =
      error instanceof ProfileGenerationError
        ? error
        : new ProfileGenerationError("api_failure");
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
  return handleProfileRequest(request);
}
