import { describe, expect, it } from "vitest";

import { ProfileRefinementApiResponseSchema } from "@/lib/profile-refinement-api";
import {
  PROFILE_REFINEMENT_OPENING_QUESTION,
  type ProfileRefinementRequest,
} from "@/lib/profile-refinement";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import { developmentProfileRefinementPayload } from "./demo-profile-refinement";

function request(turnCount = 1): ProfileRefinementRequest {
  return {
    profile: structuredClone(VALID_PROFILE_FIXTURE),
    turns: Array.from({ length: turnCount }, (_, index) => ({
      id: `profile-refinement-${index + 1}`,
      question:
        index === 0
          ? PROFILE_REFINEMENT_OPENING_QUESTION
          : `Contextual follow-up ${index}`,
      answer: `Student clarification ${index + 1}`,
      answeredAt: `2026-07-17T10:0${index}:00+08:00`,
    })),
  };
}

describe("profile refinement development fixtures", () => {
  it("completes a direct correction without another question", () => {
    const parsed = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("direct", request(), 1),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.decision).toBe("complete");
      expect(parsed.nextQuestion).toBeNull();
      expect(parsed.profile.constraints).toHaveLength(2);
    }
  });

  it("supports one adaptive follow-up and then returns to a choice", () => {
    const first = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("follow-up", request(), 1),
    );
    const second = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("follow-up", request(2), 2),
    );
    expect(first.ok && first.decision).toBe("follow_up");
    expect(second.ok && second.decision).toBe("offer_choice");
  });

  it("allows several useful follow-ups without requiring all three", () => {
    const first = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("several", request(), 1),
    );
    const second = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("several", request(2), 2),
    );
    const third = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("several", request(3), 3),
    );
    expect(first.ok && first.decision).toBe("follow_up");
    expect(second.ok && second.decision).toBe("follow_up");
    expect(third.ok && third.decision).toBe("offer_choice");
  });

  it("preserves an explicit failure for user-initiated retry", () => {
    const failed = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("failure", request(), 1),
    );
    const retried = ProfileRefinementApiResponseSchema.parse(
      developmentProfileRefinementPayload("failure", request(), 2),
    );
    expect(failed.ok).toBe(false);
    expect(retried.ok).toBe(true);
  });

  it("returns a malformed first shape and a valid retry fixture", () => {
    expect(
      ProfileRefinementApiResponseSchema.safeParse(
        developmentProfileRefinementPayload("malformed", request(), 1),
      ).success,
    ).toBe(false);
    expect(
      ProfileRefinementApiResponseSchema.safeParse(
        developmentProfileRefinementPayload("malformed", request(), 2),
      ).success,
    ).toBe(true);
  });
});
