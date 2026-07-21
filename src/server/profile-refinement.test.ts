import { describe, expect, it, vi } from "vitest";

import {
  EMPTY_PROFILE_REFINEMENT_PATCH,
  PROFILE_REFINEMENT_OPENING_QUESTION,
  type ProfileRefinementRequest,
} from "@/lib/profile-refinement";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  PROFILE_REFINEMENT_INSTRUCTIONS,
  ProfileRefinementError,
  refineStudentProfile,
} from "./profile-refinement";

function request(): ProfileRefinementRequest {
  return {
    profile: structuredClone(VALID_PROFILE_FIXTURE),
    turns: [
      {
        id: "profile-refinement-1",
        question: PROFILE_REFINEMENT_OPENING_QUESTION,
        answer: "I like technology, but I do not want a technical career.",
        answeredAt: "2026-07-17T10:00:00+08:00",
      },
    ],
  };
}

function directOutput() {
  return {
    patch: {
      ...EMPTY_PROFILE_REFINEMENT_PATCH,
      replaceInferences: [
        {
          targetId: "inference-collaboration",
          statement: "Technology is a tool, not the intended focus of future work.",
          rationale: "The student directly corrected the tentative interpretation.",
          confidence: "high" as const,
        },
      ],
    },
    acknowledgement: "That changes how Steppi should read your interest in technology.",
    decision: "complete" as const,
    nextQuestion: null,
  };
}

async function expectError(
  promise: Promise<unknown>,
  code: ProfileRefinementError["code"],
) {
  await expect(promise).rejects.toMatchObject({ code });
}

describe("profile refinement generation", () => {
  it("applies one validated direct correction and calls the model boundary once", async () => {
    const requestRefinement = vi.fn().mockResolvedValue(directOutput());
    const result = await refineStudentProfile(request(), {
      apiKey: "test-key",
      model: "gpt-5.6",
      requestRefinement,
    });

    expect(requestRefinement).toHaveBeenCalledTimes(1);
    expect(result.decision).toBe("complete");
    expect(result.nextQuestion).toBeNull();
    expect(result.profile.inferences[0].statement).toContain("not the intended focus");
    expect(result.profile.facts).toEqual(VALID_PROFILE_FIXTURE.facts);
  });

  it("accepts one contextual follow-up without forcing profile changes", async () => {
    const result = await refineStudentProfile(request(), {
      apiKey: "test-key",
      model: "gpt-5.6",
      requestRefinement: vi.fn().mockResolvedValue({
        patch: EMPTY_PROFILE_REFINEMENT_PATCH,
        acknowledgement: "That distinction is useful.",
        decision: "follow_up",
        nextQuestion:
          "Would you rather use technology in creative work or avoid it in day-to-day tasks?",
      }),
    });

    expect(result.decision).toBe("follow_up");
    expect(result.profile).toEqual(VALID_PROFILE_FIXTURE);
  });

  it("rejects malformed output and an invalid patch before returning a profile", async () => {
    await expectError(
      refineStudentProfile(request(), {
        apiKey: "test-key",
        model: "gpt-5.6",
        requestRefinement: vi.fn().mockResolvedValue({ decision: "complete" }),
      }),
      "malformed_model_output",
    );
    await expectError(
      refineStudentProfile(request(), {
        apiKey: "test-key",
        model: "gpt-5.6",
        requestRefinement: vi.fn().mockResolvedValue({
          ...directOutput(),
          patch: {
            ...EMPTY_PROFILE_REFINEMENT_PATCH,
            removeInferenceIds: ["missing-inference"],
          },
        }),
      }),
      "malformed_model_output",
    );
  });

  it("classifies configuration, model, timeout, and upstream failures safely", async () => {
    await expectError(refineStudentProfile(request(), { apiKey: "" }), "configuration_missing");
    await expectError(
      refineStudentProfile(request(), { apiKey: "test", model: "gpt-4.1" }),
      "invalid_model_configuration",
    );
    await expectError(
      refineStudentProfile(request(), {
        apiKey: "test",
        requestRefinement: vi.fn().mockRejectedValue(
          Object.assign(new Error("safe test timeout"), {
            name: "APIConnectionTimeoutError",
          }),
        ),
      }),
      "timeout",
    );
    await expectError(
      refineStudentProfile(request(), {
        apiKey: "test",
        requestRefinement: vi.fn().mockRejectedValue(new Error("safe test failure")),
      }),
      "api_failure",
    );
  });

  it("instructs the model to avoid unnecessary follow-ups and path recommendations", () => {
    expect(PROFILE_REFINEMENT_INSTRUCTIONS).toContain("high-school or college student");
    expect(PROFILE_REFINEMENT_INSTRUCTIONS).toContain("stage-neutral");
    expect(PROFILE_REFINEMENT_INSTRUCTIONS).toContain(
      "Direct corrections should usually be applied immediately",
    );
    expect(PROFILE_REFINEMENT_INSTRUCTIONS).toContain(
      "Ask one follow-up only when its answer would materially change the role possibility set",
    );
    expect(PROFILE_REFINEMENT_INSTRUCTIONS).toContain(
      "Never recommend careers, majors, colleges, programs, or paths",
    );
    expect(PROFILE_REFINEMENT_INSTRUCTIONS).toContain("zero to three follow-up questions");
  });
});
