import { describe, expect, it, vi } from "vitest";

import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { DEMO_RESEARCH_NODES, DEMO_RESEARCH_QUESTION } from "@/lib/demo-research";
import type { ResearchApiResponse } from "@/lib/research-api";
import { ResearchGenerationError } from "@/server/research-generation";
import { VALID_PROFILE_FIXTURE } from "@/test/profile-fixture";

import {
  handleResearchCancel,
  handleResearchStart,
  handleResearchStatus,
  RESEARCH_JOB_COOKIE,
} from "./route";

const testSecret = "test-secret-not-an-api-key";
const validBody = {
  profile: VALID_PROFILE_FIXTURE,
  branch: DEMO_PATH_BRANCHES[0],
  question: DEMO_RESEARCH_QUESTION,
};

function researchRequest(
  method: "POST" | "PUT" | "DELETE",
  body: unknown,
  cookie?: string,
) {
  return new Request("http://localhost/api/research", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function responseCookie(response: Response) {
  const value = response.headers.get("set-cookie")?.match(
    new RegExp(`${RESEARCH_JOB_COOKIE}=([^;]+)`),
  )?.[1];
  if (!value) throw new Error("Expected a research job cookie.");
  return `${RESEARCH_JOB_COOKIE}=${value}`;
}

function routeDependencies() {
  return {
    jobSecret: () => testSecret,
    now: () => 1_752_643_200_000,
    recordDiagnostic: vi.fn(),
    startResearch: vi.fn().mockResolvedValue({
      responseId: "resp_background_123",
      dateChecked: "2026-07-16",
      status: "queued" as const,
    }),
    retrieveResearch: vi.fn().mockResolvedValue({ status: "in_progress" as const }),
    cancelResearch: vi.fn().mockResolvedValue({ status: "cancelled" as const }),
  };
}

async function startJob(deps = routeDependencies()) {
  const response = await handleResearchStart(
    researchRequest("POST", validBody),
    deps,
  );
  return { response, cookie: responseCookie(response), deps };
}

describe("background research API route", () => {
  it("starts exactly one opaque background job and returns immediately", async () => {
    const { response, deps } = await startJob();
    const body = (await response.json()) as ResearchApiResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, status: "queued" });
    expect(deps.startResearch).toHaveBeenCalledOnce();
    expect(deps.startResearch).toHaveBeenCalledWith(
      VALID_PROFILE_FIXTURE,
      DEMO_PATH_BRANCHES[0],
      DEMO_RESEARCH_QUESTION,
    );
    expect(JSON.stringify(body)).not.toContain("resp_background_123");
    expect(response.headers.get("set-cookie")).not.toContain("resp_background_123");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
  });

  it("blocks a duplicate start while the same job is active", async () => {
    const { cookie, deps } = await startJob();
    const duplicate = await handleResearchStart(
      researchRequest("POST", validBody, cookie),
      deps,
    );

    expect(duplicate.status).toBe(409);
    expect(deps.startResearch).toHaveBeenCalledOnce();
  });

  it("retrieves queued and in-progress jobs without creating another response", async () => {
    const { cookie, deps } = await startJob();
    deps.retrieveResearch.mockResolvedValueOnce({ status: "queued" });
    const queued = await handleResearchStatus(
      researchRequest("PUT", validBody, cookie),
      deps,
    );
    deps.retrieveResearch.mockResolvedValueOnce({ status: "in_progress" });
    const inProgress = await handleResearchStatus(
      researchRequest("PUT", validBody, cookie),
      deps,
    );

    expect(await queued.json()).toEqual({ ok: true, status: "queued" });
    expect(await inProgress.json()).toEqual({ ok: true, status: "in_progress" });
    expect(deps.startResearch).toHaveBeenCalledOnce();
    expect(deps.retrieveResearch).toHaveBeenCalledTimes(2);
  });

  it("returns only validated completed research and clears the job cookie", async () => {
    const { cookie, deps } = await startJob();
    deps.retrieveResearch.mockResolvedValueOnce({
      status: "completed",
      result: { status: "success", nodes: DEMO_RESEARCH_NODES },
    });
    const response = await handleResearchStatus(
      researchRequest("PUT", validBody, cookie),
      deps,
    );

    expect(await response.json()).toEqual({
      ok: true,
      status: "completed",
      outcome: "success",
      question: DEMO_RESEARCH_QUESTION,
      nodes: DEMO_RESEARCH_NODES,
    });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(deps.startResearch).toHaveBeenCalledOnce();
  });

  it("handles honest no-source, failed, incomplete, and cancelled terminal states", async () => {
    const scenarios = [
      {
        state: {
          status: "completed" as const,
          result: { status: "no_useful_sources" as const, nodes: [] },
        },
        expected: { ok: true, status: "completed", outcome: "no_useful_sources" },
      },
      {
        state: {
          status: "failed" as const,
          diagnostic: { category: "upstream_api" as const, stage: "provider_terminal_state", reason: "response_failed" },
        },
        expected: { ok: false, status: "failed" },
      },
      {
        state: {
          status: "incomplete" as const,
          diagnostic: { category: "parsing" as const, stage: "provider_terminal_state", reason: "response_incomplete" },
        },
        expected: { ok: false, status: "incomplete" },
      },
      {
        state: {
          status: "cancelled" as const,
          diagnostic: { category: "upstream_api" as const, stage: "provider_terminal_state", reason: "response_cancelled" },
        },
        expected: { ok: false, status: "cancelled" },
      },
    ];

    for (const scenario of scenarios) {
      const { cookie, deps } = await startJob();
      deps.retrieveResearch.mockResolvedValueOnce(scenario.state);
      const response = await handleResearchStatus(
        researchRequest("PUT", validBody, cookie),
        deps,
      );
      expect(await response.json()).toMatchObject(scenario.expected);
    }
  });

  it("maps malformed completed output to a safe public failure", async () => {
    const { cookie, deps } = await startJob();
    deps.retrieveResearch.mockRejectedValueOnce(
      new ResearchGenerationError("malformed_model_output", {
        category: "schema_validation",
        stage: "model_output_validation",
        reason: "output_schema",
      }),
    );
    const response = await handleResearchStatus(
      researchRequest("PUT", validBody, cookie),
      deps,
    );
    const body = await response.json();

    expect(body).toMatchObject({
      ok: false,
      status: "failed",
      error: { code: "malformed_model_output" },
    });
    expect(JSON.stringify(body)).not.toContain("model_output_validation");
  });

  it("cancels the provider at most once and classifies client polling timeout safely", async () => {
    const { cookie, deps } = await startJob();
    const first = await handleResearchCancel(
      researchRequest("DELETE", { reason: "timeout" }, cookie),
      deps,
    );
    const cancelledCookie = responseCookie(first);
    const second = await handleResearchCancel(
      researchRequest("DELETE", { reason: "timeout" }, cancelledCookie),
      deps,
    );

    expect(await first.json()).toEqual({ ok: true, status: "cancelled" });
    expect(await second.json()).toEqual({ ok: true, status: "cancelled" });
    expect(deps.cancelResearch).toHaveBeenCalledOnce();
    expect(deps.recordDiagnostic).toHaveBeenCalledWith({
      category: "timeout",
      stage: "client_polling",
      reason: "polling_budget_exceeded",
    });
  });

  it("rejects invalid input without starting or logging student content", async () => {
    const deps = routeDependencies();
    const response = await handleResearchStart(
      researchRequest("POST", { ...validBody, question: "private student text".repeat(30) }),
      deps,
    );

    expect(response.status).toBe(400);
    expect(deps.startResearch).not.toHaveBeenCalled();
    expect(JSON.stringify(deps.recordDiagnostic.mock.calls)).not.toContain(
      "private student text",
    );
  });
});
