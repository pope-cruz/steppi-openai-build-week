import { describe, expect, it, vi } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "../lib/demo-intake";
import { VALID_PROFILE_FIXTURE } from "../test/profile-fixture";
import {
  generateStudentProfile,
  ProfileGenerationError,
} from "./profile-generation";

async function expectGenerationError(
  promise: Promise<unknown>,
  code: ProfileGenerationError["code"],
) {
  await expect(promise).rejects.toMatchObject({
    name: "ProfileGenerationError",
    code,
    message: code,
  });
}

describe("generateStudentProfile", () => {
  it("returns a validated profile from the request adapter", async () => {
    const requestProfile = vi.fn().mockResolvedValue(VALID_PROFILE_FIXTURE);

    await expect(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile,
      }),
    ).resolves.toEqual(VALID_PROFILE_FIXTURE);
    expect(requestProfile).toHaveBeenCalledWith({
      answers: DEMO_INTAKE_ANSWERS,
      apiKey: "test-key-not-real",
      model: "gpt-5.6",
    });
  });

  it("fails before making a request when the API key is missing", async () => {
    const requestProfile = vi.fn();

    await expectGenerationError(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "",
        model: "gpt-5.6",
        requestProfile,
      }),
      "configuration_missing",
    );
    expect(requestProfile).not.toHaveBeenCalled();
  });

  it("rejects a model configuration outside the GPT-5.6 family", async () => {
    await expectGenerationError(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.5",
        requestProfile: vi.fn(),
      }),
      "invalid_model_configuration",
    );
  });

  it("maps an upstream SDK failure to a safe API failure", async () => {
    await expectGenerationError(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile: vi.fn().mockRejectedValue(new Error("private upstream detail")),
      }),
      "api_failure",
    );
  });

  it("maps SDK timeouts to a retryable timeout class", async () => {
    const timeout = new Error("timed out");
    timeout.name = "APIConnectionTimeoutError";

    await expectGenerationError(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile: vi.fn().mockRejectedValue(timeout),
      }),
      "timeout",
    );
  });

  it("rejects malformed model output before it can be rendered", async () => {
    await expectGenerationError(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile: vi.fn().mockResolvedValue({ facts: [] }),
      }),
      "malformed_model_output",
    );
  });
});
