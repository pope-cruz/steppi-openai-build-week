import type { ResearchApiResponse } from "@/lib/research-api";

export const RESEARCH_POLL_INTERVAL_MS = 2_500;
export const RESEARCH_POLL_BUDGET_MS = 120_000;

export type ResearchPollingResult =
  | { kind: "terminal"; response: ResearchApiResponse }
  | { kind: "timed_out" }
  | { kind: "aborted" };

type PollResearchOptions = {
  signal: AbortSignal;
  retrieve: () => Promise<ResearchApiResponse>;
  cancel: (reason: "timeout") => Promise<void>;
  onPending: (status: "queued" | "in_progress") => void;
  intervalMs?: number;
  budgetMs?: number;
  now?: () => number;
};

function waitFor(milliseconds: number, signal: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve(true);
    }, milliseconds);
    function abort() {
      clearTimeout(timeout);
      resolve(false);
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function pollResearchJob({
  signal,
  retrieve,
  cancel,
  onPending,
  intervalMs = RESEARCH_POLL_INTERVAL_MS,
  budgetMs = RESEARCH_POLL_BUDGET_MS,
  now = Date.now,
}: PollResearchOptions): Promise<ResearchPollingResult> {
  const startedAt = now();
  let cancelRequested = false;

  while (!signal.aborted) {
    const remaining = budgetMs - (now() - startedAt);
    if (remaining <= 0) {
      if (!cancelRequested) {
        cancelRequested = true;
        await cancel("timeout");
      }
      return { kind: "timed_out" };
    }

    const waited = await waitFor(Math.min(intervalMs, remaining), signal);
    if (!waited || signal.aborted) return { kind: "aborted" };
    if (now() - startedAt >= budgetMs) continue;

    const response = await retrieve();
    if (response.ok && (response.status === "queued" || response.status === "in_progress")) {
      onPending(response.status);
      continue;
    }
    return { kind: "terminal", response };
  }

  return { kind: "aborted" };
}
