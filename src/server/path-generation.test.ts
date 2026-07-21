import OpenAI from "openai";
import { ContentFilterFinishReasonError } from "openai/error";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import { PathGenerationSchema } from "@/lib/schemas";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  generatePathBranches,
  MAX_PATH_ATTEMPTS,
  PATH_INSTRUCTIONS,
  PATH_MAX_OUTPUT_TOKENS,
  PATH_REASONING_EFFORT,
  PATH_TEXT_VERBOSITY,
  pathGenerationContext,
  PathGenerationError,
  requireParsedPathOutput,
  type PathGenerationDiagnostic,
} from "./path-generation";

function pathResult(output: unknown, requestId?: string) {
  return { output, ...(requestId ? { requestId } : {}) };
}

function deterministicOptions() {
  return {
    apiKey: "test-key-not-real",
    model: "gpt-5.6",
    sleep: vi.fn().mockResolvedValue(undefined),
    diagnosticSink: vi.fn<(diagnostic: PathGenerationDiagnostic) => void>(),
  };
}

async function expectGenerationError(
  promise: Promise<unknown>,
  code: PathGenerationError["code"],
) {
  await expect(promise).rejects.toMatchObject({
    name: "PathGenerationError",
    code,
    message: code,
  });
}

describe("generatePathBranches", () => {
  it("prompts for complete roles and exact allowed evidence IDs", () => {
    expect(PATH_INSTRUCTIONS).toContain("high-school and college students");
    expect(PATH_INSTRUCTIONS).toContain("stage-neutral");
    expect(PATH_INSTRUCTIONS).toContain("Target thirteen roles");
    expect(PATH_INSTRUCTIONS).toContain("no fewer than twelve and no more than fifteen");
    expect(PATH_MAX_OUTPUT_TOKENS).toBe(15_000);
    expect(PATH_REASONING_EFFORT).toBe("low");
    expect(PATH_TEXT_VERBOSITY).toBe("low");
    expect(PATH_INSTRUCTIONS).toContain("Never rank, score, tier, order, or label");
    expect(PATH_INSTRUCTIONS).toContain("student's latest clarification");
    expect(PATH_INSTRUCTIONS).toContain("allowedSupportingProfileIds");
    expect(PATH_INSTRUCTIONS).toContain("retryCorrection");
    expect(PATH_INSTRUCTIONS).toContain("complete profile for breadth");
    expect(PATH_INSTRUCTIONS).toContain("one occupation family");
    expect(PATH_INSTRUCTIONS).toContain("one plain-language sentence");
    expect(PATH_INSTRUCTIONS).toContain("why the role may not fit");
    expect(PATH_INSTRUCTIONS).toContain("array of two or three items");
    expect(PATH_INSTRUCTIONS).toContain("Put exactly one sentence in each array item");
    expect(PATH_INSTRUCTIONS).toContain("one specific, low-cost, low-commitment activity");
    expect(PATH_INSTRUCTIONS).toContain("never present a mismatch as a verdict");
    expect(PATH_INSTRUCTIONS).toContain("under one minute");
  });

  it("returns the first validated role set after exactly one request", async () => {
    const options = deterministicOptions();
    const requestPaths = vi
      .fn()
      .mockResolvedValue(pathResult({ branches: DEMO_PATH_BRANCHES }, "req_valid"));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(1);
    expect(requestPaths).toHaveBeenCalledWith({
      profile: VALID_PROFILE_FIXTURE,
      confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
      apiKey: "test-key-not-real",
      model: "gpt-5.6",
      attempt: 1,
    });
    expect(options.sleep).not.toHaveBeenCalled();
    expect(options.diagnosticSink).toHaveBeenCalledWith({
      attempt: 1,
      stage: "complete",
      reason: "validated_output",
      retryable: false,
      elapsedMs: expect.any(Number),
      requestId: "req_valid",
    });
  });

  it("places the approved summary and exact evidence allow-list in model context", () => {
    const additiveSummary =
      "You want creative teamwork and would also like to explore community projects.";
    const context = pathGenerationContext(
      VALID_PROFILE_FIXTURE,
      additiveSummary,
    );

    expect(Object.keys(context)).toEqual([
      "confirmedProfile",
      "studentApprovedSummary",
      "allowedSupportingProfileIds",
    ]);
    expect(context.confirmedProfile).toBe(VALID_PROFILE_FIXTURE);
    expect(context.studentApprovedSummary).toBe(additiveSummary);
    expect(context.allowedSupportingProfileIds).toEqual([
      ...VALID_PROFILE_FIXTURE.facts.map((item) => item.id),
      ...VALID_PROFILE_FIXTURE.inferences.map((item) => item.id),
      ...VALID_PROFILE_FIXTURE.constraints.map((item) => item.id),
      ...VALID_PROFILE_FIXTURE.uncertainties.map((item) => item.id),
      ...VALID_PROFILE_FIXTURE.tensions.map((item) => item.id),
    ]);
  });

  it("passes the approved clarification without changing the profile", async () => {
    const options = deterministicOptions();
    const clarification =
      "You are open to programming after all, despite the older hesitation. You also want community impact to be a priority.";
    const requestPaths = vi.fn().mockImplementation(
      async ({ profile, confirmedSummary }) => {
        expect(profile).toBe(VALID_PROFILE_FIXTURE);
        expect(profile.facts[1].statement).toContain("does not enjoy programming");
        expect(confirmedSummary).toBe(clarification);
        return pathResult({ branches: DEMO_PATH_BRANCHES });
      },
    );

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, clarification, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(1);
  });

  it("fails before requesting when configuration or input is invalid", async () => {
    const options = deterministicOptions();
    const requestPaths = vi.fn();
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        apiKey: "",
        requestPaths,
      }),
      "configuration_missing",
    );
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        model: "gpt-5.5",
        requestPaths,
      }),
      "invalid_model_configuration",
    );
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, "", {
        ...options,
        requestPaths,
      }),
      "malformed_model_output",
    );
    expect(requestPaths).not.toHaveBeenCalled();
  });

  it("retries schema-invalid output twice and stops on the first valid assignment", async () => {
    const options = deterministicOptions();
    const requestPaths = vi
      .fn()
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES.slice(0, 11) }))
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES.slice(0, 10) }))
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(3);
    expect(options.sleep).toHaveBeenNthCalledWith(1, 250);
    expect(options.sleep).toHaveBeenNthCalledWith(2, 750);
    expect(requestPaths.mock.calls[1][0]).toMatchObject({
      attempt: 2,
      retryCorrection: expect.stringContaining("schema-valid object"),
    });
    expect(requestPaths.mock.calls[1][0].retryCorrection).toContain(
      "twelve to fifteen",
    );
  });

  it("corrects invalid evidence and prunes one duplicate without another provider request", async () => {
    const options = deterministicOptions();
    const invalidEvidence = structuredClone(DEMO_PATH_BRANCHES);
    invalidEvidence[0].supportingProfileIds = ["missing-profile-item"];
    const duplicate = structuredClone(DEMO_PATH_BRANCHES);
    duplicate[1].title = "Design in digital products";
    const requestPaths = vi
      .fn()
      .mockResolvedValueOnce(pathResult({ branches: invalidEvidence }))
      .mockResolvedValueOnce(pathResult({ branches: duplicate }));

    const expected = duplicate.filter((_, index) => index !== 1);

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(expected);
    expect(requestPaths).toHaveBeenCalledTimes(2);
    expect(requestPaths.mock.calls[1][0].retryCorrection).toContain(
      "copy every supportingProfileIds value exactly",
    );
    expect(options.diagnosticSink).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "validated_output",
        prunedRoleCount: 1,
      }),
    );
  });

  it("retries similar roles when pruning would leave fewer than twelve", async () => {
    const options = deterministicOptions();
    const duplicate = structuredClone(DEMO_PATH_BRANCHES.slice(0, 12));
    duplicate[1].title = "Design in digital products";
    const requestPaths = vi
      .fn()
      .mockResolvedValueOnce(pathResult({ branches: duplicate }))
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(2);
    expect(requestPaths.mock.calls[1][0].retryCorrection).toContain(
      "meaningfully different occupation families",
    );
  });

  it("retries null parsed output and output-token exhaustion", async () => {
    const options = deterministicOptions();
    const requestPaths = vi
      .fn()
      .mockResolvedValueOnce(pathResult(null))
      .mockResolvedValueOnce({ output: null, incompleteReason: "max_output_tokens" })
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(options.diagnosticSink).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "parsed_output_missing", retryable: true }),
    );
    expect(options.diagnosticSink).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "incomplete_max_output_tokens",
        retryable: true,
      }),
    );
  });

  it("retries a Zod parsing failure before accepting a valid result", async () => {
    const options = deterministicOptions();
    const requestPaths = vi
      .fn()
      .mockImplementationOnce(async () =>
        PathGenerationSchema.parse({ branches: [] }),
      )
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(2);
    expect(options.diagnosticSink).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "structured_validation",
        reason: "schema_validation_failed",
      }),
    );
  });

  it("gives targeted retry guidance when day-to-day items contain multiple sentences", async () => {
    const options = deterministicOptions();
    const invalidDayToDay = structuredClone(DEMO_PATH_BRANCHES);
    invalidDayToDay[0].dayToDay[0] =
      "You plan a project with teammates. You also present the result.";
    const requestPaths = vi
      .fn()
      .mockResolvedValueOnce(pathResult({ branches: invalidDayToDay }))
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);

    expect(requestPaths).toHaveBeenCalledTimes(2);
    expect(requestPaths.mock.calls[1][0].retryCorrection).toContain(
      "exactly one sentence in each dayToDay item",
    );
  });

  it("retries a provider JSON parsing failure with a safe category", async () => {
    const options = deterministicOptions();
    const requestPaths = vi
      .fn()
      .mockRejectedValueOnce(new SyntaxError("private malformed JSON"))
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(2);
    expect(options.diagnosticSink).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "provider_response",
        reason: "provider_parse_failed",
        retryable: true,
      }),
    );
    expect(JSON.stringify(options.diagnosticSink.mock.calls)).not.toContain(
      "private malformed JSON",
    );
  });

  it("retries timeout, connection, and retryable upstream failures", async () => {
    const options = deterministicOptions();
    const timeout = new OpenAI.APIConnectionTimeoutError();
    const connection = new OpenAI.APIConnectionError({});
    const retryableRequestTimeout = new OpenAI.APIError(
      408,
      { code: "request_timeout" },
      "private provider detail",
      new Headers({ "x-request-id": "req_408" }),
    );
    const retryableConflict = new OpenAI.ConflictError(
      409,
      { code: "conflict" },
      "private provider detail",
      new Headers({ "x-request-id": "req_409" }),
    );
    const retryableRateLimit = new OpenAI.RateLimitError(
      429,
      { code: "rate_limit" },
      "private provider detail",
      new Headers({ "x-request-id": "req_429" }),
    );
    const retryableServerError = new OpenAI.InternalServerError(
      500,
      { code: "server_error" },
      "private provider detail",
      new Headers({ "x-request-id": "req_server" }),
    );

    for (const providerError of [
      timeout,
      connection,
      retryableRequestTimeout,
      retryableConflict,
      retryableRateLimit,
      retryableServerError,
    ]) {
      const requestPaths = vi
        .fn()
        .mockRejectedValueOnce(providerError)
        .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES }));
      await expect(
        generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
          ...options,
          requestPaths,
        }),
      ).resolves.toEqual(DEMO_PATH_BRANCHES);
      expect(requestPaths).toHaveBeenCalledTimes(2);
    }
  });

  it.each([
    new OpenAI.AuthenticationError(
      401,
      { code: "invalid_api_key" },
      "private auth detail",
      new Headers({ "x-request-id": "req_auth" }),
    ),
    new OpenAI.PermissionDeniedError(
      403,
      { code: "permission_denied" },
      "private permission detail",
      new Headers({ "x-request-id": "req_permission" }),
    ),
    new OpenAI.BadRequestError(
      400,
      { code: "invalid_request" },
      "private request detail",
      new Headers({ "x-request-id": "req_bad" }),
    ),
    new ContentFilterFinishReasonError(),
  ])("does not retry non-recoverable provider failure %#", async (providerError) => {
    const options = deterministicOptions();
    const requestPaths = vi.fn().mockRejectedValue(providerError);
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
      providerError instanceof ContentFilterFinishReasonError
        ? "malformed_model_output"
        : "api_failure",
    );
    expect(requestPaths).toHaveBeenCalledTimes(1);
    expect(options.sleep).not.toHaveBeenCalled();
  });

  it("does not retry an explicit content-filter incomplete response", async () => {
    const options = deterministicOptions();
    const requestPaths = vi.fn().mockResolvedValue({
      output: null,
      incompleteReason: "content_filter",
    });
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
      "malformed_model_output",
    );
    expect(requestPaths).toHaveBeenCalledTimes(1);
  });

  it("caps mixed retryable failures at three calls and prefers malformed output", async () => {
    const options = deterministicOptions();
    const requestPaths = vi
      .fn()
      .mockRejectedValueOnce(new OpenAI.APIConnectionError({}))
      .mockRejectedValueOnce(new OpenAI.APIConnectionTimeoutError())
      .mockResolvedValueOnce(pathResult({ branches: DEMO_PATH_BRANCHES.slice(0, 2) }));

    try {
      await generatePathBranches(
        VALID_PROFILE_FIXTURE,
        DEMO_CONFIRMATION_SUMMARY,
        { ...options, requestPaths },
      );
      throw new Error("Expected generation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(PathGenerationError);
      expect(error).toMatchObject({
        code: "malformed_model_output",
        diagnostics: [
          { reason: "connection_failed" },
          { reason: "request_timeout" },
          { reason: "schema_validation_failed" },
        ],
      });
    }
    expect(requestPaths).toHaveBeenCalledTimes(MAX_PATH_ATTEMPTS);
  });

  it("emits only bounded diagnostics rather than raw errors or student data", async () => {
    const options = deterministicOptions();
    const requestPaths = vi.fn().mockRejectedValue(
      new OpenAI.BadRequestError(
        400,
        { code: "invalid_request", secret: "do-not-log" },
        "private provider body",
        new Headers({ "x-request-id": "req_safe" }),
      ),
    );

    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, DEMO_CONFIRMATION_SUMMARY, {
        ...options,
        requestPaths,
      }),
      "api_failure",
    );
    const serialized = JSON.stringify(options.diagnosticSink.mock.calls);
    expect(serialized).toContain("req_safe");
    expect(serialized).toContain("invalid_request");
    expect(serialized).not.toContain("do-not-log");
    expect(serialized).not.toContain("private provider body");
    expect(serialized).not.toContain(VALID_PROFILE_FIXTURE.facts[0].statement);
  });

  it("serializes safe default diagnostics as one log message", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const requestPaths = vi.fn().mockResolvedValue(
      pathResult({ branches: DEMO_PATH_BRANCHES }, "req_logged"),
    );

    await generatePathBranches(
      VALID_PROFILE_FIXTURE,
      DEMO_CONFIRMATION_SUMMARY,
      {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestPaths,
      },
    );

    expect(info).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[path-generation\] \{"attempt":1,"stage":"complete","reason":"validated_output","retryable":false,"elapsedMs":\d+,"requestId":"req_logged"\}$/,
      ),
    );
    info.mockRestore();
  });
});

describe("requireParsedPathOutput", () => {
  it.each([
    ["max_output_tokens", "incomplete_max_output_tokens"],
    ["content_filter", "incomplete_content_filter"],
    [null, "parsed_output_missing"],
  ] as const)(
    "classifies a null parsed provider output with %s",
    (incompleteReason, expectedReason) => {
      expect(() =>
        requireParsedPathOutput({ output: null, incompleteReason }),
      ).toThrowError(expectedReason);
    },
  );
});
