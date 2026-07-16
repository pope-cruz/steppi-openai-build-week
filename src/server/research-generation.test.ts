import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import {
  DEMO_RESEARCH_NODES,
  DEMO_RESEARCH_QUESTION,
  DEMO_RETRIEVED_SOURCE_URLS,
} from "@/lib/demo-research";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  generateResearchExpansion,
  ResearchGenerationError,
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

describe("generateResearchExpansion", () => {
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
