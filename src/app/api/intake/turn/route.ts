import { NextResponse } from "next/server";

import {
  IntakeTurnRequestSchema,
  type IntakeTurnApiResponse,
} from "@/lib/intake-conversation";
import {
  IntakeTurnGenerationError,
  interpretIntakeTurn,
} from "@/server/intake-turn";

export const runtime = "nodejs";
export const maxDuration = 35;

type InterpretTurn = typeof interpretIntakeTurn;

const ERROR_DETAILS: Record<
  IntakeTurnGenerationError["code"],
  { message: string; retryable: boolean; status: number }
> = {
  configuration_missing: {
    message:
      "Steppi cannot interpret the conversation right now. You can keep going with a simple follow-up.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message:
      "Steppi cannot interpret the conversation right now. You can keep going with a simple follow-up.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message:
      "Steppi took too long to interpret that answer. Your conversation is still here.",
    retryable: true,
    status: 504,
  },
  api_failure: {
    message:
      "Steppi could not interpret that answer right now. Your conversation is still here.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message:
      "Steppi could not safely use that interpretation. Your original answer is still here.",
    retryable: true,
    status: 502,
  },
};

function failureResponse(
  body: Extract<IntakeTurnApiResponse, { ok: false }>,
  status: number,
) {
  return NextResponse.json<IntakeTurnApiResponse>(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleIntakeTurnRequest(
  request: Request,
  interpretTurn: InterpretTurn = interpretIntakeTurn,
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
          message: "The conversation update could not be read.",
          retryable: false,
        },
      },
      400,
    );
  }

  const parsedInput = IntakeTurnRequestSchema.safeParse(input);
  if (!parsedInput.success) {
    return failureResponse(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: "The conversation update was incomplete or invalid.",
          retryable: false,
        },
      },
      400,
    );
  }

  try {
    const patch = await interpretTurn(
      parsedInput.data.state,
      parsedInput.data.turns,
    );

    return NextResponse.json<IntakeTurnApiResponse>(
      { ok: true, patch },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const turnError =
      error instanceof IntakeTurnGenerationError
        ? error
        : new IntakeTurnGenerationError("api_failure");
    const details = ERROR_DETAILS[turnError.code];

    return failureResponse(
      {
        ok: false,
        error: {
          code: turnError.code,
          message: details.message,
          retryable: details.retryable,
        },
      },
      details.status,
    );
  }
}

export async function POST(request: Request) {
  return handleIntakeTurnRequest(request);
}
