import OpenAI from "openai";
import type {
  ResponseFunctionWebSearch,
  ResponseOutputMessage,
} from "openai/resources/responses/responses";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  AUDIT_AFFORDABILITY_QUESTION,
  AUDIT_CIIT_AFFORDABILITY_NODE,
  AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
  DEMO_RETRIEVED_SOURCE_URLS,
} from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  buildBackgroundResearchResponseParams,
  buildResearchResponseParams,
  cancelBackgroundResearch,
  classifyResearchProviderError,
  extractResearchProviderResult,
  generateResearchExpansion,
  retrieveBackgroundResearch,
  ResearchGenerationError,
  startBackgroundResearch,
} from "./research-generation";

async function expectResearchError(
  promise: Promise<unknown>,
  code: ResearchGenerationError["code"],
) {
  await expect(promise).rejects.toMatchObject({
    name: "ResearchGenerationError",
    code,
    message: code,
  });
}

const baseOptions = {
  apiKey: "test-key-not-real",
  model: "gpt-5.6",
  dateChecked: "2026-07-16",
};

function completedSearchCall(sourceUrls: string[]): ResponseFunctionWebSearch {
  return {
    id: "ws_test",
    type: "web_search_call",
    status: "completed",
    action: {
      type: "search",
      sources: sourceUrls.map((url) => ({ type: "url", url })),
    },
  };
}

function completedMessage(
  text: string,
  citationUrls: string[],
): ResponseOutputMessage {
  return {
    id: "msg_test",
    type: "message",
    status: "completed",
    role: "assistant",
    content: [
      {
        type: "output_text",
        text,
        annotations: citationUrls.map((url) => ({
          type: "url_citation",
          start_index: 0,
          end_index: 0,
          title: "Provider citation",
          url,
        })),
        logprobs: [],
      },
    ],
  };
}

describe("generateResearchExpansion", () => {
  it("builds the structured web-search request before any API call", () => {
    const params = buildResearchResponseParams({
      profile: VALID_PROFILE_FIXTURE,
      branch: DEMO_PATH_BRANCHES[0],
      question: DEMO_RESEARCH_QUESTION,
      dateChecked: "2026-07-16",
      model: "gpt-5.6",
    });

    expect(params.tool_choice).toBe("required");
    expect(params.tools).toEqual([
      expect.objectContaining({ type: "web_search", search_context_size: "medium" }),
    ]);
    expect(params.include).toEqual(["web_search_call.action.sources"]);
    expect(params.text.format).toMatchObject({
      type: "json_schema",
      name: "research_generation",
      strict: true,
    });
    expect(JSON.stringify(params.text.format.schema)).not.toContain(
      '"format":"uri"',
    );
    expect(JSON.stringify(params.text.format.schema)).toContain('"claims"');
    expect(JSON.stringify(params.text.format.schema)).toContain('"sourceUrls"');
    expect(JSON.stringify(params.text.format.schema)).not.toContain('"supports"');
  });

  it("classifies upstream rejections without retaining raw messages", () => {
    const error = new OpenAI.BadRequestError(
      400,
      {
        code: "invalid_request_error",
        message: "private upstream message",
        type: "invalid_request_error",
      },
      "private upstream message",
      new Headers({ "x-request-id": "req_safe123" }),
    );

    const diagnostic = classifyResearchProviderError(error);
    expect(diagnostic).toEqual({
      category: "upstream_api",
      stage: "openai_request",
      reason: "request_rejected",
      upstreamStatus: 400,
      upstreamCode: "invalid_request_error",
      requestId: "req_safe123",
    });
    expect(JSON.stringify(diagnostic)).not.toContain("private upstream message");
  });

  it("recognizes the installed SDK timeout class despite its generic Error name", () => {
    const error = new OpenAI.APIConnectionTimeoutError();

    expect({
      name: error.name,
      constructorName: error.constructor.name,
      isTimeout: error instanceof OpenAI.APIConnectionTimeoutError,
      isConnection: error instanceof OpenAI.APIConnectionError,
      isApiError: error instanceof OpenAI.APIError,
      status: error.status,
      code: error.code,
      requestId: error.requestID,
      hasCause: "cause" in error,
    }).toEqual({
      name: "Error",
      constructorName: "APIConnectionTimeoutError",
      isTimeout: true,
      isConnection: true,
      isApiError: true,
      status: undefined,
      code: undefined,
      requestId: undefined,
      hasCause: false,
    });
    expect(classifyResearchProviderError(error)).toEqual({
      category: "timeout",
      stage: "openai_request",
      reason: "request_timeout",
    });
  });

  it("keeps a generic SDK connection error distinct from a timeout", () => {
    const error = new OpenAI.APIConnectionError({});

    expect(classifyResearchProviderError(error)).toEqual({
      category: "upstream_api",
      stage: "openai_request",
      reason: "connection_failed",
    });
  });

  it.each([
    ["nested timeout code", new OpenAI.APIConnectionError({
      cause: Object.assign(new Error(), { code: "ETIMEDOUT" }),
    })],
    ["safe abort name", Object.assign(new Error(), { name: "AbortError" })],
    ["safe connection-timeout code", Object.assign(new Error(), {
      code: "UND_ERR_CONNECT_TIMEOUT",
    })],
  ])("recognizes %s without inspecting an error message", (_label, error) => {
    expect(classifyResearchProviderError(error)).toEqual({
      category: "timeout",
      stage: "openai_request",
      reason: "request_timeout",
    });
  });

  it("extracts provider-backed URLs from search sources and URL citations", () => {
    const searchSource = "https://example.edu/program";
    const citedSource = "https://example.gov/resource";
    expect(
      extractResearchProviderResult({
        output: [
          completedSearchCall([searchSource]),
          completedMessage("Provider-backed result", [citedSource]),
        ],
        output_parsed: { status: "no_useful_sources", nodes: [] },
      }),
    ).toEqual({
      output: { status: "no_useful_sources", nodes: [] },
      retrievedSourceUrls: [searchSource, citedSource],
      retrievalStatus: "completed",
    });
  });

  it("returns a validated source-backed expansion from one provider request", async () => {
    const requestResearch = vi.fn().mockResolvedValue({
      output: { status: "success", nodes: DEMO_RESEARCH_NODES },
      retrievedSourceUrls: DEMO_RETRIEVED_SOURCE_URLS,
      retrievalStatus: "completed",
    });

    await expect(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { ...baseOptions, requestResearch },
      ),
    ).resolves.toEqual({ status: "success", nodes: DEMO_RESEARCH_NODES });
    expect(requestResearch).toHaveBeenCalledTimes(1);
    expect(requestResearch).toHaveBeenCalledWith({
      profile: VALID_PROFILE_FIXTURE,
      branch: DEMO_PATH_BRANCHES[0],
      question: DEMO_RESEARCH_QUESTION,
      dateChecked: "2026-07-16",
      apiKey: "test-key-not-real",
      model: "gpt-5.6",
    });
  });

  it("returns an honest no-useful-source result after completed retrieval", async () => {
    await expect(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        {
          ...baseOptions,
          requestResearch: vi.fn().mockResolvedValue({
            output: { status: "no_useful_sources", nodes: [] },
            retrievedSourceUrls: [],
            retrievalStatus: "completed",
          }),
        },
      ),
    ).resolves.toEqual({ status: "no_useful_sources", nodes: [] });
  });

  it("enforces complete affordability evidence at the service boundary", async () => {
    const incomplete = vi.fn().mockResolvedValue({
      output: { status: "success", nodes: DEMO_RESEARCH_NODES },
      retrievedSourceUrls: DEMO_RETRIEVED_SOURCE_URLS,
      retrievalStatus: "completed",
    });
    await expect(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { ...baseOptions, requestResearch: incomplete },
      ),
    ).rejects.toMatchObject({
      code: "malformed_model_output",
      diagnostic: { reason: "affordability_evidence_incomplete" },
    });

    const complete = vi.fn().mockResolvedValue({
      output: { status: "success", nodes: [AUDIT_CIIT_AFFORDABILITY_NODE] },
      retrievedSourceUrls: AUDIT_CIIT_RETRIEVED_SOURCE_URLS,
      retrievalStatus: "completed",
    });
    await expect(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        AUDIT_AFFORDABILITY_QUESTION,
        { ...baseOptions, dateChecked: "2026-07-17", requestResearch: complete },
      ),
    ).resolves.toEqual({
      status: "success",
      nodes: [AUDIT_CIIT_AFFORDABILITY_NODE],
    });
  });

  it("maps retrieval, API, and timeout failures without retrying", async () => {
    const retrieval = vi.fn().mockResolvedValue({
      output: null,
      retrievedSourceUrls: [],
      retrievalStatus: "failed",
    });
    await expectResearchError(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { ...baseOptions, requestResearch: retrieval },
      ),
      "retrieval_failure",
    );
    expect(retrieval).toHaveBeenCalledTimes(1);

    await expectResearchError(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        {
          ...baseOptions,
          requestResearch: vi.fn().mockRejectedValue(new Error("private SDK detail")),
        },
      ),
      "api_failure",
    );

    const timeout = new Error("timed out");
    timeout.name = "APIConnectionTimeoutError";
    await expectResearchError(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { ...baseOptions, requestResearch: vi.fn().mockRejectedValue(timeout) },
      ),
      "timeout",
    );
  });

  it("rejects malformed, unsupported, and wrong-branch source output", async () => {
    await expectResearchError(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        {
          ...baseOptions,
          requestResearch: vi.fn().mockResolvedValue({
            output: { status: "success", nodes: [] },
            retrievedSourceUrls: [],
            retrievalStatus: "completed",
          }),
        },
      ),
      "malformed_model_output",
    );

    await expect(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        {
          ...baseOptions,
          requestResearch: vi.fn().mockResolvedValue({
            output: { status: "success", nodes: [] },
            retrievedSourceUrls: [],
            retrievalStatus: "completed",
          }),
        },
      ),
    ).rejects.toMatchObject({
      diagnostic: {
        category: "schema_validation",
        stage: "model_output_validation",
        reason: "output_schema",
      },
    });

    const unsupported = structuredClone(DEMO_RESEARCH_NODES);
    unsupported[0].sources[0].url = "https://unretrieved.example/source";
    await expectResearchError(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        {
          ...baseOptions,
          requestResearch: vi.fn().mockResolvedValue({
            output: { status: "success", nodes: unsupported },
            retrievedSourceUrls: DEMO_RETRIEVED_SOURCE_URLS,
            retrievalStatus: "completed",
          }),
        },
      ),
      "malformed_model_output",
    );
  });

  it("fails before a provider request when configuration is missing", async () => {
    const requestResearch = vi.fn();
    await expectResearchError(
      generateResearchExpansion(
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        { ...baseOptions, apiKey: "", requestResearch },
      ),
      "configuration_missing",
    );
    expect(requestResearch).not.toHaveBeenCalled();
  });
});

function providerResponse(
  status: "queued" | "in_progress" | "completed" | "failed" | "cancelled" | "incomplete",
  output: unknown[] = [],
) {
  return {
    id: "resp_background_test",
    status,
    output,
    error: status === "failed" ? { code: "server_error", message: "private" } : null,
  } as never;
}

function backgroundProvider() {
  return {
    create: vi.fn().mockResolvedValue(providerResponse("queued")),
    retrieve: vi.fn().mockResolvedValue(providerResponse("in_progress")),
    cancel: vi.fn().mockResolvedValue(providerResponse("cancelled")),
  };
}

describe("background research generation", () => {
  it("preserves the existing web-search and Structured Outputs request with background enabled", () => {
    const params = buildBackgroundResearchResponseParams({
      profile: VALID_PROFILE_FIXTURE,
      branch: DEMO_PATH_BRANCHES[0],
      question: DEMO_RESEARCH_QUESTION,
      dateChecked: "2026-07-16",
      model: "gpt-5.6",
    });

    expect(params.background).toBe(true);
    expect(params.tool_choice).toBe("required");
    expect(params.include).toEqual(["web_search_call.action.sources"]);
    expect(params.text?.format).toMatchObject({
      type: "json_schema",
      name: "research_generation",
      strict: true,
    });
  });

  it("creates exactly one background response and returns its pending state", async () => {
    const provider = backgroundProvider();
    const result = await startBackgroundResearch(
      VALID_PROFILE_FIXTURE,
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
      { ...baseOptions, provider },
    );

    expect(result).toEqual({
      responseId: "resp_background_test",
      dateChecked: "2026-07-16",
      status: "queued",
    });
    expect(provider.create).toHaveBeenCalledOnce();
    expect(provider.create.mock.calls[0][0]).toMatchObject({ background: true });
    expect(provider.retrieve).not.toHaveBeenCalled();
  });

  it("retrieves the existing response without creating another response", async () => {
    const provider = backgroundProvider();
    await retrieveBackgroundResearch(
      "resp_background_test",
      VALID_PROFILE_FIXTURE,
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
      "2026-07-16",
      { ...baseOptions, provider },
    );
    await retrieveBackgroundResearch(
      "resp_background_test",
      VALID_PROFILE_FIXTURE,
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
      "2026-07-16",
      { ...baseOptions, provider },
    );

    expect(provider.retrieve).toHaveBeenCalledTimes(2);
    expect(provider.create).not.toHaveBeenCalled();
  });

  it("polls the same response with source inclusion and validates completed search sources", async () => {
    const provider = backgroundProvider();
    provider.retrieve
      .mockResolvedValueOnce(providerResponse("in_progress"))
      .mockResolvedValueOnce(
        providerResponse("completed", [
          completedSearchCall(DEMO_RETRIEVED_SOURCE_URLS),
          completedMessage(
            JSON.stringify({ status: "success", nodes: DEMO_RESEARCH_NODES }),
            [],
          ),
        ]),
      );

    await expect(
      retrieveBackgroundResearch(
        "resp_background_test",
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        "2026-07-16",
        { ...baseOptions, provider },
      ),
    ).resolves.toEqual({ status: "in_progress" });

    await expect(
      retrieveBackgroundResearch(
        "resp_background_test",
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        "2026-07-16",
        { ...baseOptions, provider },
      ),
    ).resolves.toEqual({
      status: "completed",
      result: { status: "success", nodes: DEMO_RESEARCH_NODES },
    });

    expect(provider.retrieve).toHaveBeenCalledTimes(2);
    expect(provider.retrieve).toHaveBeenNthCalledWith(1, "resp_background_test", {
      include: ["web_search_call.action.sources"],
    });
    expect(provider.retrieve).toHaveBeenNthCalledWith(2, "resp_background_test", {
      include: ["web_search_call.action.sources"],
    });
    expect(provider.create).not.toHaveBeenCalled();
  });

  it("parses a completed response through the existing schema and source validation", async () => {
    const provider = backgroundProvider();
    provider.retrieve.mockResolvedValueOnce(
      providerResponse("completed", [
        completedSearchCall([]),
        completedMessage(
          JSON.stringify({ status: "success", nodes: DEMO_RESEARCH_NODES }),
          DEMO_RETRIEVED_SOURCE_URLS,
        ),
      ]),
    );

    await expect(
      retrieveBackgroundResearch(
        "resp_background_test",
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        "2026-07-16",
        { ...baseOptions, provider },
      ),
    ).resolves.toEqual({
      status: "completed",
      result: { status: "success", nodes: DEMO_RESEARCH_NODES },
    });
    expect(provider.create).not.toHaveBeenCalled();
  });

  it("rejects completed model URLs when provider evidence is missing", async () => {
    const provider = backgroundProvider();
    provider.retrieve.mockResolvedValueOnce(
      providerResponse("completed", [
        completedSearchCall([]),
        completedMessage(
          JSON.stringify({ status: "success", nodes: DEMO_RESEARCH_NODES }),
          [],
        ),
      ]),
    );

    await expect(
      retrieveBackgroundResearch(
        "resp_background_test",
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        "2026-07-16",
        { ...baseOptions, provider },
      ),
    ).rejects.toMatchObject({
      code: "malformed_model_output",
      diagnostic: {
        category: "source_processing",
        reason: "retrieved_sources_missing",
      },
    });
    expect(provider.create).not.toHaveBeenCalled();
  });

  it("fails safely when a completed response is malformed", async () => {
    const provider = backgroundProvider();
    provider.retrieve.mockResolvedValueOnce(
      providerResponse("completed", [
        {
          type: "message",
          status: "completed",
          role: "assistant",
          content: [
            { type: "output_text", text: "not-json", annotations: [], logprobs: [] },
          ],
        },
      ]),
    );

    await expect(
      retrieveBackgroundResearch(
        "resp_background_test",
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        "2026-07-16",
        { ...baseOptions, provider },
      ),
    ).rejects.toMatchObject({
      code: "malformed_model_output",
      diagnostic: { category: "parsing", stage: "structured_output_parse" },
    });
  });

  it.each(["failed", "incomplete", "cancelled"] as const)(
    "normalizes a provider %s terminal response without parsing output",
    async (status) => {
      const provider = backgroundProvider();
      provider.retrieve.mockResolvedValueOnce(providerResponse(status));
      const result = await retrieveBackgroundResearch(
        "resp_background_test",
        VALID_PROFILE_FIXTURE,
        DEMO_PATH_BRANCHES[0],
        DEMO_RESEARCH_QUESTION,
        "2026-07-16",
        { ...baseOptions, provider },
      );

      expect(result).toMatchObject({ status });
      expect(provider.create).not.toHaveBeenCalled();
    },
  );

  it("cancels the existing response without creating another", async () => {
    const provider = backgroundProvider();
    await cancelBackgroundResearch("resp_background_test", {
      ...baseOptions,
      provider,
    });
    expect(provider.cancel).toHaveBeenCalledOnce();
    expect(provider.create).not.toHaveBeenCalled();
  });
});
