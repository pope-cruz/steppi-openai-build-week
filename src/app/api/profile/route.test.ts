import { describe, expect, it, vi } from "vitest";

import { DEMO_INTAKE_ANSWERS } from "../../../lib/demo-intake";
import type { ProfileApiResponse } from "../../../lib/profile-api";
import { ProfileGenerationError } from "../../../server/profile-generation";
import { VALID_PROFILE_FIXTURE } from "../../../test/profile-fixture";
import { handleProfileRequest } from "./route";

function profileRequest(body: unknown) {
  return new Request("http://localhost/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("profile API route", () => {
  it("returns only the validated profile on success", async () => {
    const response = await handleProfileRequest(
      profileRequest({ answers: DEMO_INTAKE_ANSWERS }),
      vi.fn().mockResolvedValue(VALID_PROFILE_FIXTURE),
    );
    const body = (await response.json()) as ProfileApiResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ ok: true, profile: VALID_PROFILE_FIXTURE });
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("rejects invalid intake before profile generation", async () => {
    const generateProfile = vi.fn();
    const response = await handleProfileRequest(
      profileRequest({ answers: [] }),
      generateProfile,
    );
    const body = (await response.json()) as ProfileApiResponse;

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(generateProfile).not.toHaveBeenCalled();
  });

  it.each([
    ["configuration_missing", 503, false],
    ["invalid_model_configuration", 503, false],
    ["timeout", 504, true],
    ["api_failure", 502, true],
    ["malformed_model_output", 502, true],
  ] as const)("maps %s to a safe public response", async (code, status, retryable) => {
    const response = await handleProfileRequest(
      profileRequest({ answers: DEMO_INTAKE_ANSWERS }),
      vi.fn().mockRejectedValue(new ProfileGenerationError(code)),
    );
    const body = (await response.json()) as ProfileApiResponse;

    expect(response.status).toBe(status);
    expect(body).toMatchObject({ ok: false, error: { code, retryable } });
    expect(JSON.stringify(body)).not.toContain("OPENAI_API_KEY");
  });
});
