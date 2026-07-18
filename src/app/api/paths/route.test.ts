import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_CONFIRMATION_SUMMARY } from "@/lib/demo-profile";
import type { PathApiResponse } from "@/lib/path-api";
import { PathGenerationError } from "@/server/path-generation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import { handlePathRequest } from "./route";

function pathRequest(body: unknown) {
  return new Request("http://localhost/api/paths", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("path API route", () => {
  it("returns only the validated branches on success", async () => {
    const generatePaths = vi.fn().mockResolvedValue(DEMO_PATH_BRANCHES);
    const response = await handlePathRequest(
      pathRequest({
        profile: VALID_PROFILE_FIXTURE,
        confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
      }),
      generatePaths,
    );
    const body = (await response.json()) as PathApiResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ ok: true, branches: DEMO_PATH_BRANCHES });
    expect(generatePaths).toHaveBeenCalledWith(
      VALID_PROFILE_FIXTURE,
      DEMO_CONFIRMATION_SUMMARY,
    );
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("rejects an invalid profile before generation", async () => {
    const generatePaths = vi.fn();
    const response = await handlePathRequest(
      pathRequest({
        profile: { facts: [] },
        confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
      }),
      generatePaths,
    );
    const body = (await response.json()) as PathApiResponse;

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(generatePaths).not.toHaveBeenCalled();
  });

  it.each([
    ["configuration_missing", 503, false],
    ["invalid_model_configuration", 503, false],
    ["timeout", 504, true],
    ["api_failure", 502, true],
    ["malformed_model_output", 502, true],
  ] as const)("maps %s to a safe public response", async (code, status, retryable) => {
    const response = await handlePathRequest(
      pathRequest({
        profile: VALID_PROFILE_FIXTURE,
        confirmedSummary: DEMO_CONFIRMATION_SUMMARY,
      }),
      vi.fn().mockRejectedValue(new PathGenerationError(code)),
    );
    const body = (await response.json()) as PathApiResponse;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ ok: false, error: { code, retryable } });
    expect(serialized).not.toContain("OPENAI_API_KEY");
    expect(serialized).not.toContain("private SDK detail");
  });

  it("rejects a missing or empty approved summary before generation", async () => {
    const generatePaths = vi.fn();
    const response = await handlePathRequest(
      pathRequest({ profile: VALID_PROFILE_FIXTURE, confirmedSummary: "" }),
      generatePaths,
    );

    expect(response.status).toBe(400);
    expect(generatePaths).not.toHaveBeenCalled();
  });
});
