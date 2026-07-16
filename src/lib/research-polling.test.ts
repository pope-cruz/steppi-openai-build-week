import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_RESEARCH_NODES, DEMO_RESEARCH_QUESTION } from "@/lib/demo-research";

import { pollResearchJob } from "./research-polling";

const completed = {
  ok: true,
  status: "completed",
  outcome: "success",
  question: DEMO_RESEARCH_QUESTION,
  nodes: DEMO_RESEARCH_NODES,
} as const;

describe("research polling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("polls pending states and stops on the first terminal response", async () => {
    const controller = new AbortController();
    const retrieve = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: "in_progress" })
      .mockResolvedValueOnce(completed);
    const onPending = vi.fn();
    const polling = pollResearchJob({
      signal: controller.signal,
      retrieve,
      cancel: vi.fn(),
      onPending,
    });

    await vi.advanceTimersByTimeAsync(2_500);
    await vi.advanceTimersByTimeAsync(2_500);

    await expect(polling).resolves.toEqual({ kind: "terminal", response: completed });
    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(onPending).toHaveBeenCalledWith("in_progress");
  });

  it("stops without another status request when cancellation or unmount aborts", async () => {
    const controller = new AbortController();
    const retrieve = vi.fn();
    const polling = pollResearchJob({
      signal: controller.signal,
      retrieve,
      cancel: vi.fn(),
      onPending: vi.fn(),
    });

    controller.abort();
    await vi.runAllTimersAsync();

    await expect(polling).resolves.toEqual({ kind: "aborted" });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("cancels once at the overall budget and never retries automatically", async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const retrieve = vi.fn().mockResolvedValue({ ok: true, status: "queued" });
    const polling = pollResearchJob({
      signal: new AbortController().signal,
      retrieve,
      cancel,
      onPending: vi.fn(),
      intervalMs: 2_500,
      budgetMs: 5_000,
    });

    await vi.advanceTimersByTimeAsync(5_000);

    await expect(polling).resolves.toEqual({ kind: "timed_out" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledWith("timeout");
    expect(retrieve).toHaveBeenCalledOnce();
  });

  it("returns provider failure, incomplete, and cancelled states unchanged", async () => {
    for (const status of ["failed", "incomplete", "cancelled"] as const) {
      const response = {
        ok: false,
        status,
        error: {
          code: "api_failure",
          message: "Safe public error.",
          retryable: true,
        },
      } as const;
      const polling = pollResearchJob({
        signal: new AbortController().signal,
        retrieve: vi.fn().mockResolvedValue(response),
        cancel: vi.fn(),
        onPending: vi.fn(),
      });
      await vi.advanceTimersByTimeAsync(2_500);
      await expect(polling).resolves.toEqual({ kind: "terminal", response });
    }
  });
});
