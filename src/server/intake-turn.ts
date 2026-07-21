import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  ConversationPatchError,
  ConversationTurnPatchSchema,
  applyConversationPatch,
  prepareConversationPatchForController,
  type ConversationState,
  type ConversationTurn,
  type ConversationTurnPatch,
} from "@/lib/intake-conversation";

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 25_000;

export const INTAKE_TURN_INSTRUCTIONS = `You are Steppi's intake turn interpreter for high-school and college students.
Interpret only the latest student message in the context of the supplied transcript and structured conversation state.

Return a small validated state patch, an optional useful acknowledgement, and zero or more allowed follow-up candidates. Deterministic application code owns the anchor order, follow-up selection, final question, and completion.

Rules:
- Extract explicit student facts separately from tentative interpretations.
- Put tentative interests only in interpretedInterests with basis tentative-interpretation.
- Preserve uncertainty, mixed feelings, and “I don't know” without treating them as failure.
- When the student corrects or contradicts active information, identify the exact prior item IDs in supersedeItemIds and add the corrected information with new IDs.
- Every added item must cite one or more exact transcript turn IDs in sourceTurnIds.
- Never reuse an active item ID. Keep IDs short, descriptive, and unique.
- Propose follow-up candidates only for the allowed purposes: resolve-contradiction, distinguish-directions, clarify-practical-constraint, or material-evidence-gap.
- Give every candidate a concise rationale, exact source turn IDs, valid target item IDs or unresolved dimensions, and one focused question.
- A candidate may contain a related contrast such as enjoy versus avoid or include versus exclude. It must not combine multiple independent questions or separate topics.
- Check the full transcript and active structured state before asking. Never repeat a prior question or ask for information already supplied, declined, corrected, or recorded as uncertain.
- Treat unresolvedDimensions as planning context, not a checklist. Do not propose a candidate merely to fill every dimension.
- Treat “I don't know,” mixed feelings, little exposure, and no known constraints as useful answers. Do not keep pushing for a definite preference the student does not have.
- When practical context would materially change viable options, sensitively invite relevant details such as affordability, location, family expectations, access to devices or programs, or transportation. Do not assume hardship, ask for exact household income, or imply that family influence is negative.
- If affordability or location is already known, do not ask for it again; explore a different high-value gap or complete.
- Return an acknowledgement only when it can name one meaningful detail from the latest answer in plain, restrained language. Otherwise return null. Never use generic filler such as “Thanks for sharing,” “That makes sense,” or “Great answer.”
- Never propose generic personality-test questions equivalent to “What are your strengths?”, “What are your weaknesses?”, “What kind of person are you?”, “Do you prefer working alone or with others?”, or “Where do you see yourself in five years?”.
- Keep language stage-neutral unless the student has explicitly disclosed their education stage. Do not ask whether they are in high school or college unless that distinction is materially needed for a later question.
- Do not recommend careers, majors, colleges, programs, or paths during intake.
- Do not diagnose aptitude or personality, predict outcomes, expose reasoning, or use schema/category language in acknowledgement or candidate questions.
- Keep acknowledgement and candidate questions concise and natural for a student.`;

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

  let pacedPatch: ConversationTurnPatch;
  try {
    pacedPatch = prepareConversationPatchForController(state, parsed.data, turns);
    applyConversationPatch(state, pacedPatch, turns);
  } catch {
    throw new IntakeTurnGenerationError("malformed_model_output");
  }

  return pacedPatch;
}
