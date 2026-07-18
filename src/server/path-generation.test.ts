import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  generatePathBranches,
  PATH_INSTRUCTIONS,
  PathGenerationError,
} from "./path-generation";

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
  it("prompts for the complete concise student-facing role explanation", () => {
    expect(PATH_INSTRUCTIONS).toContain("one plain-language sentence");
    expect(PATH_INSTRUCTIONS).toContain("one or two concise, student-facing sentences");
    expect(PATH_INSTRUCTIONS).toContain("why the role may not fit");
    expect(PATH_INSTRUCTIONS).toContain("two or three concrete sentences");
    expect(PATH_INSTRUCTIONS).toContain("one specific, low-cost, low-commitment activity");
    expect(PATH_INSTRUCTIONS).toContain("never present a mismatch as a verdict");
    expect(PATH_INSTRUCTIONS).toContain("under one minute");
  });

  it("returns one validated complete three-branch result", async () => {
    const requestPaths = vi.fn().mockResolvedValue({
      branches: DEMO_PATH_BRANCHES,
    });

    await expect(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestPaths,
      }),
    ).resolves.toEqual(DEMO_PATH_BRANCHES);
    expect(requestPaths).toHaveBeenCalledTimes(1);
    expect(requestPaths).toHaveBeenCalledWith({
      profile: VALID_PROFILE_FIXTURE,
      apiKey: "test-key-not-real",
      model: "gpt-5.6",
    });
  });

  it("fails before requesting when configuration is missing or invalid", async () => {
    const requestPaths = vi.fn();
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "",
        model: "gpt-5.6",
        requestPaths,
      }),
      "configuration_missing",
    );
    expect(requestPaths).not.toHaveBeenCalled();

    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        model: "gpt-5.5",
        requestPaths,
      }),
      "invalid_model_configuration",
    );
    expect(requestPaths).not.toHaveBeenCalled();
  });

  it("maps upstream API failures and timeouts to public error classes", async () => {
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestPaths: vi.fn().mockRejectedValue(new Error("private SDK detail")),
      }),
      "api_failure",
    );

    const timeout = new Error("timed out");
    timeout.name = "APIConnectionTimeoutError";
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestPaths: vi.fn().mockRejectedValue(timeout),
      }),
      "timeout",
    );
  });

  it("rejects malformed, invalid-evidence, and duplicate output", async () => {
    const missingBranch = { branches: DEMO_PATH_BRANCHES.slice(0, 2) };
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        requestPaths: vi.fn().mockResolvedValue(missingBranch),
      }),
      "malformed_model_output",
    );

    const invalidEvidence = structuredClone(DEMO_PATH_BRANCHES);
    invalidEvidence[0].supportingProfileIds = ["missing-profile-item"];
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        requestPaths: vi.fn().mockResolvedValue({ branches: invalidEvidence }),
      }),
      "malformed_model_output",
    );

    const duplicate = structuredClone(DEMO_PATH_BRANCHES);
    duplicate[1].title = "Design in digital products";
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        requestPaths: vi.fn().mockResolvedValue({ branches: duplicate }),
      }),
      "malformed_model_output",
    );

    const incompleteExplanation = structuredClone(DEMO_PATH_BRANCHES);
    for (const branch of incompleteExplanation) {
      Reflect.deleteProperty(branch, "dayToDay");
    }
    await expectGenerationError(
      generatePathBranches(VALID_PROFILE_FIXTURE, {
        apiKey: "test-key-not-real",
        requestPaths: vi.fn().mockResolvedValue({ branches: incompleteExplanation }),
      }),
      "malformed_model_output",
    );
  });
});
