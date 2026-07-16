import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_RESEARCH_NODES, DEMO_RESEARCH_QUESTION } from "@/lib/demo-research";
import type { ResearchApiResponse } from "@/lib/research-api";
import { ResearchGenerationError } from "@/server/research-generation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import { handleResearchRequest } from "./route";

function researchRequest(body: unknown) {
  return new Request("http://localhost/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  profile: VALID_PROFILE_FIXTURE,
  branch: DEMO_PATH_BRANCHES[0],
  question: DEMO_RESEARCH_QUESTION,
};

describe("research API route", () => {
  it("returns only validated branch-local research on success", async () => {
    const generateResearch = vi.fn().mockResolvedValue({
      status: "success",
      nodes: DEMO_RESEARCH_NODES,
    });
    const response = await handleResearchRequest(researchRequest(validBody), generateResearch);
    const body = (await response.json()) as ResearchApiResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      ok: true,
      status: "success",
      question: DEMO_RESEARCH_QUESTION,
      nodes: DEMO_RESEARCH_NODES,
    });
    expect(generateResearch).toHaveBeenCalledWith(
      VALID_PROFILE_FIXTURE,
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
    );
  });

  it("returns a safe no-useful-source state", async () => {
    const response = await handleResearchRequest(
      researchRequest(validBody),
      vi.fn().mockResolvedValue({ status: "no_useful_sources", nodes: [] }),
    );
    expect(await response.json()).toEqual({
      ok: true,
      status: "no_useful_sources",
      question: DEMO_RESEARCH_QUESTION,
      nodes: [],
    });
  });

  it("rejects invalid input before research", async () => {
    const generateResearch = vi.fn();
    const response = await handleResearchRequest(
      researchRequest({ ...validBody, question: " " }),
      generateResearch,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(generateResearch).not.toHaveBeenCalled();
  });

  it.each([
    ["configuration_missing", 503, false],
    ["invalid_model_configuration", 503, false],
    ["timeout", 504, true],
    ["retrieval_failure", 502, true],
    ["api_failure", 502, true],
    ["malformed_model_output", 502, true],
  ] as const)("maps %s to a public-safe response", async (code, status, retryable) => {
    const response = await handleResearchRequest(
      researchRequest(validBody),
      vi.fn().mockRejectedValue(new ResearchGenerationError(code)),
    );
    const body = (await response.json()) as ResearchApiResponse;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ ok: false, error: { code, retryable } });
    expect(serialized).not.toContain("OPENAI_API_KEY");
    expect(serialized).not.toContain("private SDK detail");
  });
});
