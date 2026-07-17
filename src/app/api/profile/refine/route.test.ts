import { describe, expect, it, vi } from "vitest";

import type { ProfileRefinementApiResponse } from "@/lib/profile-refinement-api";
import {
  PROFILE_REFINEMENT_OPENING_QUESTION,
  type ProfileRefinementRequest,
} from "@/lib/profile-refinement";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";
import { ProfileRefinementError } from "@/server/profile-refinement";

import { handleProfileRefinementRequest } from "./route";

function body(): ProfileRefinementRequest {
  return {
    profile: VALID_PROFILE_FIXTURE,
    turns: [
      {
        id: "profile-refinement-1",
        question: PROFILE_REFINEMENT_OPENING_QUESTION,
        answer: "Please make staying near Manila more important.",
        answeredAt: "2026-07-17T10:00:00+08:00",
      },
    ],
  };
}

function request(input: unknown) {
  return new Request("http://localhost/api/profile/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

describe("POST /api/profile/refine", () => {
  it("returns only the validated profile and conversational decision", async () => {
    const refineProfile = vi.fn().mockResolvedValue({
      profile: VALID_PROFILE_FIXTURE,
      acknowledgement: "Location will carry more weight.",
      decision: "complete",
      nextQuestion: null,
    });
    const response = await handleProfileRefinementRequest(
      request(body()),
      refineProfile,
    );
    const payload = (await response.json()) as ProfileRefinementApiResponse;

    expect(response.status).toBe(200);
    expect(refineProfile).toHaveBeenCalledTimes(1);
    expect(payload).toMatchObject({ ok: true, decision: "complete" });
    expect(JSON.stringify(payload)).not.toContain("patch");
  });

  it("rejects invalid input before calling the model boundary", async () => {
    const refineProfile = vi.fn();
    const response = await handleProfileRefinementRequest(
      request({ profile: VALID_PROFILE_FIXTURE, turns: [] }),
      refineProfile,
    );
    const payload = (await response.json()) as ProfileRefinementApiResponse;

    expect(response.status).toBe(400);
    expect(refineProfile).not.toHaveBeenCalled();
    expect(payload).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  });

  it.each([
    ["configuration_missing", 503],
    ["invalid_model_configuration", 503],
    ["timeout", 504],
    ["api_failure", 502],
    ["malformed_model_output", 502],
  ] as const)("maps %s to a safe response", async (code, status) => {
    const response = await handleProfileRefinementRequest(
      request(body()),
      vi.fn().mockRejectedValue(new ProfileRefinementError(code)),
    );
    const payload = (await response.json()) as ProfileRefinementApiResponse;

    expect(response.status).toBe(status);
    expect(payload).toMatchObject({ ok: false, error: { code } });
    expect(JSON.stringify(payload)).not.toContain("OPENAI_API_KEY");
  });
});
