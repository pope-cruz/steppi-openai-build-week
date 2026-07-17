import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  ConversationPatchError,
  ConversationTurnPatchSchema,
  applyConversationPatch,
  type ConversationState,
  type ConversationTurn,
  type ConversationTurnPatch,
} from "@/lib/intake-conversation";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 25_000;

const INTAKE_TURN_INSTRUCTIONS = `You are Steppi's intake turn interpreter for high-school students.
Interpret only the latest student message in the context of the supplied transcript and structured conversation state.

Return a small validated state patch plus either one concise next question or a completion decision.

Rules:
- Extract explicit student facts separately from tentative interpretations.
- Put tentative interests only in interpretedInterests with basis tentative-interpretation.
- Preserve uncertainty, mixed feelings, and “I don't know” without treating them as failure.
- When the student corrects or contradicts active information, identify the exact prior item IDs in supersedeItemIds and add the corrected information with new IDs.
- Every added item must cite one or more exact transcript turn IDs in sourceTurnIds.
- Never reuse an active item ID. Keep IDs short, descriptive, and unique.
- Ask only one follow-up, and only when ambiguity or missing context materially affects an honest initial profile.
- Do not ask for information the structured state already contains.
- Decide enoughContext from the usefulness and coverage of the context, never from a minimum message count.
- Rich context may complete intake after fewer than four messages. Several shallow messages may still require a follow-up.
- Acknowledge one meaningful detail from the latest answer in plain, restrained language.
- Do not recommend careers, majors, colleges, programs, or paths during intake.
- Do not diagnose aptitude or personality, predict outcomes, expose reasoning, or use schema/category language in acknowledgement or nextQuestion.
- Keep acknowledgement and nextQuestion concise and natural for a high-school student.`;

type IntakeTurnRequest = (input: {
  state: ConversationState;
  turns: ConversationTurn[];
  apiKey: string;
  model: string;
}) => Promise<unknown>;

type InterpretIntakeTurnOptions = {
  apiKey?: string;
  model?: string;
  requestTurn?: IntakeTurnRequest;
};

export type IntakeTurnErrorCode =
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "api_failure"
  | "malformed_model_output";

export class IntakeTurnGenerationError extends Error {
  readonly code: IntakeTurnErrorCode;

  constructor(code: IntakeTurnErrorCode) {
    super(code);
    this.name = "IntakeTurnGenerationError";
    this.code = code;
  }
}

function isTimeoutError(error: unknown) {
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

async function requestIntakeTurnFromOpenAI({
  state,
  turns,
  apiKey,
  model,
}: Parameters<IntakeTurnRequest>[0]) {
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const response = await client.responses.parse({
    model,
    instructions: INTAKE_TURN_INSTRUCTIONS,
    input: JSON.stringify({ conversationState: state, transcript: turns }),
    max_output_tokens: 2_000,
    text: {
      format: zodTextFormat(
        ConversationTurnPatchSchema,
        "intake_turn_interpretation",
      ),
    },
  });

  return response.output_parsed;
}

export async function interpretIntakeTurn(
  state: ConversationState,
  turns: ConversationTurn[],
  options: InterpretIntakeTurnOptions = {},
): Promise<ConversationTurnPatch> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey.trim()) {
    throw new IntakeTurnGenerationError("configuration_missing");
  }

  if (!/^gpt-5\.6(?:-|$)/.test(model)) {
    throw new IntakeTurnGenerationError("invalid_model_configuration");
  }

  let output: unknown;

  try {
    output = await (options.requestTurn ?? requestIntakeTurnFromOpenAI)({
      state,
      turns,
      apiKey,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof ConversationPatchError) {
      throw new IntakeTurnGenerationError("malformed_model_output");
    }

    if (isTimeoutError(error)) {
      throw new IntakeTurnGenerationError("timeout");
    }

    throw new IntakeTurnGenerationError("api_failure");
  }

  const parsed = ConversationTurnPatchSchema.safeParse(output);
  if (!parsed.success) {
    throw new IntakeTurnGenerationError("malformed_model_output");
  }

  try {
    applyConversationPatch(state, parsed.data, turns);
  } catch {
    throw new IntakeTurnGenerationError("malformed_model_output");
  }

  return parsed.data;
}
