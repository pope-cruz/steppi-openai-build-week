import { NextResponse } from "next/server";

import {
  RoleConversationRequestSchema,
  type RoleConversationApiResponse,
  type RoleConversationErrorCode,
} from "@/lib/role-conversation";
import {
  generateRoleConversationMessage,
  RoleConversationGenerationError,
} from "@/server/role-conversation";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteDependencies = {
  generateMessage: typeof generateRoleConversationMessage;
};

const defaultDependencies: RouteDependencies = {
  generateMessage: generateRoleConversationMessage,
};

const ERROR_DETAILS: Record<
  RoleConversationErrorCode,
  { message: string; retryable: boolean; status: number }
> = {
  invalid_input: {
    message: "That role question is incomplete. Please review it and try again.",
    retryable: false,
    status: 400,
  },
  configuration_missing: {
    message: "Steppi cannot answer this role question yet. Please try again later.",
    retryable: false,
    status: 503,
  },
  invalid_model_configuration: {
    message: "Steppi cannot answer this role question yet. Please try again later.",
    retryable: false,
    status: 503,
  },
  timeout: {
    message: "Steppi took too long to answer. Your question is still here.",
    retryable: true,
    status: 504,
  },
  retrieval_failure: {
    message: "Steppi could not check current sources right now. Your question is still here.",
    retryable: true,
    status: 502,
  },
  api_failure: {
    message: "Steppi could not answer right now. Your question is still here.",
    retryable: true,
    status: 502,
  },
  malformed_model_output: {
    message: "Steppi received an answer it could not safely show. Please try again.",
    retryable: true,
    status: 502,
  },
};

function response(body: RoleConversationApiResponse, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleRoleConversationRequest(
  request: Request,
  overrides: Partial<RouteDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...overrides };
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    const details = ERROR_DETAILS.invalid_input;
    return response(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: details.message,
          retryable: details.retryable,
        },
      },
      details.status,
    );
  }

  const parsed = RoleConversationRequestSchema.safeParse(input);
  if (!parsed.success) {
    const details = ERROR_DETAILS.invalid_input;
    return response(
      {
        ok: false,
        error: {
          code: "invalid_input",
          message: details.message,
          retryable: details.retryable,
        },
      },
      details.status,
    );
  }

  try {
    const message = await dependencies.generateMessage(parsed.data);
    return response({
      ok: true,
      branchId: parsed.data.branch.id,
      requestId: parsed.data.requestId,
      message,
    });
  } catch (error) {
    const code =
      error instanceof RoleConversationGenerationError
        ? error.code
        : "api_failure";
    const details = ERROR_DETAILS[code];
    return response(
      {
        ok: false,
        error: {
          code,
          message: details.message,
          retryable: details.retryable,
        },
      },
      details.status,
    );
  }
}

export async function POST(request: Request) {
  return handleRoleConversationRequest(request);
}
