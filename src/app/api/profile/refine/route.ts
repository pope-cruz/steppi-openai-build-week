import { NextResponse } from "next/server";

import type {
  ProfileRefinementApiFailure,
  ProfileRefinementApiResponse,
} from "@/lib/profile-refinement-api";
import { ProfileRefinementRequestSchema } from "@/lib/profile-refinement";
import {
  ProfileRefinementError,
  refineStudentProfile,
} from "@/server/profile-refinement";

export const runtime = "nodejs";
export const maxDuration = 60;

type RefineProfile = typeof refineStudentProfile;

const ERROR_DETAILS: Record<
  ProfileRefinementError["code"],
  { message: string; retryable: boolean; status: number }
> = {
  configuration_missing: {
    message: "Profile refinement is not configured yet. You can still build your map from the current summary.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message: "Profile refinement is not configured for GPT-5.6 yet. You can still build your map from the current summary.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message: "Steppi took too long to refine this summary. Your current profile and wording are safe; please try again.",
    retryable: true,
    status: 504,
  },
  api_failure: {
    message: "Steppi could not refine this summary right now. Your current profile and wording are safe; please try again.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message: "Steppi received a refinement it could not safely apply. Your current profile is unchanged; please try again.",
    retryable: true,
    status: 502,
  },
};

function failureResponse(
  body: ProfileRefinementApiFailure,
  status: number,
) {
  return NextResponse.json<ProfileRefinementApiResponse>(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleProfileRefinementRequest(
  request: Request,
  refineProfile: RefineProfile = refineStudentProfile,
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
          message: "The refinement could not be read. Your current profile is unchanged.",
          retryable: false,
        },
      },
      400,
    );
  }

  const parsed = ProfileRefinementRequestSchema.safeParse(input);
  if (!parsed.success) {
    return failureResponse(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: "The refinement is incomplete or invalid. Your current profile is unchanged.",
          retryable: false,
        },
      },
      400,
    );
  }

  try {
    const result = await refineProfile(parsed.data);
    return NextResponse.json<ProfileRefinementApiResponse>(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const refinementError =
      error instanceof ProfileRefinementError
        ? error
        : new ProfileRefinementError("api_failure");
    const details = ERROR_DETAILS[refinementError.code];

    return failureResponse(
      {
        ok: false,
        error: {
          code: refinementError.code,
          message: details.message,
          retryable: details.retryable,
        },
      },
      details.status,
    );
  }
}

export async function POST(request: Request) {
  return handleProfileRefinementRequest(request);
}
