import { describe, expect, it, vi } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "../lib/demo-intake";
import { DEMO_CONFIRMATION_SUMMARY } from "../lib/demo-profile";
import { VALID_PROFILE_FIXTURE } from "../test/profile-fixture";
import {
  generateStudentProfile,
  PROFILE_INSTRUCTIONS,
  ProfileGenerationError,
  requireParsedProfileOutput,
} from "./profile-generation";

const VALID_GENERATION = {
  profile: VALID_PROFILE_FIXTURE,
  confirmationSummary: DEMO_CONFIRMATION_SUMMARY,
};

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
  it("returns a validated profile and two-sentence confirmation from one request", async () => {
    const requestProfile = vi.fn().mockResolvedValue(VALID_GENERATION);

    await expect(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile,
      }),
    ).resolves.toEqual(VALID_GENERATION);
    expect(requestProfile).toHaveBeenCalledWith({
      answers: DEMO_INTAKE_ANSWERS,
      apiKey: "test-key-not-real",
      model: "gpt-5.6",
    });
  });

  it("asks for a warm, direct, exactly two-sentence confirmation", () => {
    expect(PROFILE_INSTRUCTIONS).toContain("high-school and college students");
    expect(PROFILE_INSTRUCTIONS).toContain("stage-neutral");
    expect(PROFILE_INSTRUCTIONS).toContain("exactly two concise sentences");
    expect(PROFILE_INSTRUCTIONS).toContain('using "you"');
    expect(PROFILE_INSTRUCTIONS).toContain("interests, experiences, or activities");
    expect(PROFILE_INSTRUCTIONS).toContain("preferences, dislikes, priorities");
    expect(PROFILE_INSTRUCTIONS).toContain("Do not mechanically list fields");
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
        requestProfile: vi.fn().mockResolvedValue({
          profile: { facts: [] },
          confirmationSummary: DEMO_CONFIRMATION_SUMMARY,
        }),
      }),
      "malformed_model_output",
    );
  });

  it("rejects a summary that is not exactly two direct-address sentences", async () => {
    await expectGenerationError(
      generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile: vi.fn().mockResolvedValue({
          profile: VALID_PROFILE_FIXTURE,
          confirmationSummary: "The student likes creative work.",
        }),
      }),
      "malformed_model_output",
    );
  });

  it.each([
    ["max_output_tokens", "incomplete_max_output_tokens"],
    ["content_filter", "incomplete_content_filter"],
    [null, "parsed_output_missing"],
  ] as const)(
    "classifies a null parsed provider output with %s safely",
    (incompleteReason, expectedReason) => {
      expect(() =>
        requireParsedProfileOutput({ output: null, incompleteReason }),
      ).toThrowError(expectedReason);
    },
  );

  it("retains only schema paths in malformed-output diagnostics", async () => {
    try {
      await generateStudentProfile(DEMO_INTAKE_ANSWERS, {
        apiKey: "test-key-not-real",
        model: "gpt-5.6",
        requestProfile: vi.fn().mockResolvedValue({
          profile: VALID_PROFILE_FIXTURE,
          confirmationSummary: "You like creative work.",
        }),
      });
      throw new Error("Expected malformed output");
    } catch (error) {
      expect(error).toBeInstanceOf(ProfileGenerationError);
      expect((error as ProfileGenerationError).diagnostic).toEqual({
        stage: "structured_validation",
        reason: "schema_validation_failed",
        issuePaths: ["confirmationSummary"],
      });
    }
  });
});
