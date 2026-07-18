"use client";

import {
  Check,
  LoaderCircle,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRANCH_REFINEMENT_CONSTRAINT } from "@/lib/branch-refinement";
import {
  isResearchRequestActive,
  type BranchRefinementState,
} from "@/lib/research-flow";
import type { PathBranch } from "@/lib/schemas";

export function BranchRefinementPanel({
  branch,
  onCancel,
  onRetry,
  onSubmit,
  originalFindingCount,
  state,
}: {
  branch: PathBranch;
  onCancel: () => void;
  onRetry: () => void;
  onSubmit: () => void;
  originalFindingCount: number;
  state: BranchRefinementState;
}) {
  const belongsToBranch =
    state.status === "idle" || state.branchId === branch.id;
  const activeState = belongsToBranch ? state : { status: "idle" as const };
  const isLoading = isResearchRequestActive(activeState);

  return (
    <section
      aria-labelledby={`branch-refinement-title-${branch.id}`}
      className="border-t border-border bg-surface-muted px-5 py-6 sm:px-7"
      data-branch-refinement={branch.id}
      data-original-research-count={originalFindingCount}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary bg-primary-soft text-primary">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
            One practical refinement
          </p>
          <h4
            className="font-display mt-1 text-2xl leading-tight text-ink"
            id={`branch-refinement-title-${branch.id}`}
          >
            Re-check this path against a real constraint.
          </h4>
          <p className="mt-2 max-w-[42rem] text-sm leading-6 text-muted">
            Steppi can run one more source-backed pass beneath {branch.title}.
            Your original research and the rest of your map stay in place.
          </p>
        </div>
      </div>

      {activeState.status === "success" ? (
        <div
          aria-live="polite"
          className="mt-5 border-s-2 border-primary bg-surface px-4 py-4"
          data-refinement-result="success"
          role="status"
        >
          <div className="flex items-start gap-3">
            <Check
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <div>
              <p className="font-semibold text-ink">
                This branch now reflects the constraint.
              </p>
              <dl className="mt-3 grid gap-3 text-sm leading-6 text-graphite sm:grid-cols-3">
                <div className="border-t border-border pt-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                    What changed
                  </dt>
                  <dd className="mt-1">
                    The visible research neighborhood now contains{" "}
                    {activeState.nodes.length} source-validated affordability{" "}
                    {activeState.nodes.length === 1 ? "finding" : "findings"}.
                  </dd>
                </div>
                <div className="border-t border-border pt-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                    Why
                  </dt>
                  <dd className="mt-1">{BRANCH_REFINEMENT_CONSTRAINT}.</dd>
                </div>
                <div className="border-t border-border pt-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                    What stayed the same
                  </dt>
                  <dd className="mt-1">
                    Your profile, the complete starting role set, this branch’s
                    identity, and {originalFindingCount} original{" "}
                    {originalFindingCount === 1 ? "finding" : "findings"} remain
                    unchanged.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}

      {activeState.status === "no_useful_sources" ? (
        <div
          className="mt-5 border-s-2 border-border-strong bg-surface px-4 py-4"
          data-refinement-result="no-useful-sources"
          role="status"
        >
          <p className="font-semibold text-ink">
            Affordability could not be established.
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Steppi did not find cost, eligibility, and conditional-aid evidence strong enough to replace the visible research. Your original findings are still here.
          </p>
          <Button
            className="mt-3"
            onClick={onRetry}
            type="button"
            variant="secondary"
          >
            <RotateCcw aria-hidden="true" />
            Try this refinement again
          </Button>
        </div>
      ) : null}

      {activeState.status === "error" ? (
        <div
          className="mt-5 border-s-2 border-error bg-surface px-4 py-4"
          data-refinement-result="error"
          role="alert"
        >
          <p className="font-semibold text-ink">This branch was not changed.</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {activeState.message} Your original source-backed findings remain visible.
          </p>
          {activeState.retryable ? (
            <Button
              className="mt-3"
              onClick={onRetry}
              type="button"
              variant="secondary"
            >
              <RotateCcw aria-hidden="true" />
              Retry this refinement
            </Button>
          ) : null}
        </div>
      ) : null}

      {activeState.status === "cancelled" ? (
        <div
          className="mt-5 border-s-2 border-border-strong bg-surface px-4 py-4"
          data-refinement-result="cancelled"
          role="status"
        >
          <p className="font-semibold text-ink">Refinement cancelled.</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Your original research and every map relationship remain unchanged.
          </p>
          <Button
            className="mt-3"
            onClick={onRetry}
            type="button"
            variant="secondary"
          >
            <RotateCcw aria-hidden="true" />
            Try this refinement again
          </Button>
        </div>
      ) : null}

      {activeState.status !== "success" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {activeState.status === "idle" ? (
            <Button onClick={onSubmit} type="button">
              <MapPin aria-hidden="true" />
            {BRANCH_REFINEMENT_CONSTRAINT}
            </Button>
          ) : null}
          {isLoading ? (
            <>
              <Button disabled type="button">
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Checking costs and conditions…
              </Button>
              <Button
                disabled={activeState.status === "cancelling"}
                onClick={onCancel}
                type="button"
                variant="secondary"
              >
                <X aria-hidden="true" />
                {activeState.status === "cancelling"
                  ? "Cancelling…"
                  : "Cancel refinement"}
              </Button>
            </>
          ) : null}
          <p
            aria-live="polite"
            className="text-xs leading-5 text-muted"
            role="status"
          >
            {isLoading
              ? activeState.status === "starting"
                ? "Starting one secure background research job."
                : activeState.status === "queued"
                  ? "The refinement is queued; no additional response will be created."
                  : activeState.status === "cancelling"
                    ? "Stopping this job without changing the branch."
                    : "Checking current cost, eligibility, and conditional-aid sources."
              : activeState.status === "idle"
                ? "This fixed action creates one source-backed refinement under this branch."
                : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}
