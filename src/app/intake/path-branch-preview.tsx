"use client";

import { Check, UserRound } from "lucide-react";
import { useReducer, useRef } from "react";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import {
  createPathMapState,
  pathMapReducer,
} from "@/lib/path-map-state";
import type { PathBranch, StudentProfile } from "@/lib/schemas";

const BRANCH_PRESENTATION = {
  "strongest-fit": {
    label: "Strongest current fit",
    nodeClass: "border-[var(--color-branch-blue-edge)] bg-[var(--color-branch-blue)]",
    positionClass: "lg:left-[4%] lg:top-[11%]",
  },
  adjacent: {
    label: "Adjacent possibility",
    nodeClass: "border-[var(--color-branch-peach-edge)] bg-[var(--color-branch-peach)]",
    positionClass: "lg:right-[4%] lg:top-[11%]",
  },
  underexplored: {
    label: "Underexplored possibility",
    nodeClass: "border-[var(--color-branch-green-edge)] bg-[var(--color-branch-green)]",
    positionClass: "lg:bottom-[8%] lg:left-1/2 lg:-translate-x-1/2",
  },
} as const;

const EDGE_PATHS = {
  "strongest-fit": "M 500 270 C 390 245, 310 178, 190 145",
  adjacent: "M 500 270 C 610 245, 690 178, 810 145",
  underexplored: "M 500 270 C 500 335, 500 385, 500 455",
} as const;

export function InitialPathMap({
  branches,
  profile,
}: {
  branches: PathBranch[];
  profile: StudentProfile;
}) {
  const [state, dispatch] = useReducer(
    pathMapReducer,
    createPathMapState(profile, branches),
  );
  const branchButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const evidence = profileEvidence(state.profile);
  const selectedBranch = state.branches.find(
    (branch) => branch.id === state.selectedBranchId,
  );

  function clearSelection() {
    const branchId = state.selectedBranchId;
    dispatch({ type: "clear" });
    if (branchId) {
      window.requestAnimationFrame(() => branchButtonRefs.current.get(branchId)?.focus());
    }
  }

  return (
    <section aria-labelledby="path-map-title" className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-[47rem]">
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-primary">
            Your first path map
          </p>
          <h1
            className="font-display mt-2 text-balance text-[clamp(2.35rem,6vw,4.5rem)] leading-[1.02] text-ink"
            id="path-map-title"
          >
            Three directions. One place to explore them.
          </h1>
          <p className="mt-4 max-w-[40rem] text-sm leading-6 text-muted sm:text-base">
            Choose a connected direction to see why it surfaced. These are hypotheses—not a ranking or prediction.
          </p>
        </div>
        <p className="max-w-[17rem] text-xs leading-5 text-muted">
          Current programs, costs, and opportunities still require sourced research.
        </p>
      </div>

      <div
        aria-describedby="path-map-instructions"
        aria-label="Your confirmed profile connected to three path directions"
        className="relative mt-8 isolate overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface-muted p-4 sm:p-6 lg:min-h-[35rem] lg:p-0"
        data-mobile-fallback="hierarchical"
        data-relationship-count="3"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(to_right,rgba(30,33,31,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,33,31,0.035)_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <svg
          aria-hidden="true"
          className="absolute inset-0 hidden size-full lg:block"
          preserveAspectRatio="none"
          viewBox="0 0 1000 560"
        >
          {state.branches.map((branch) => (
            <path
              className={
                state.selectedBranchId === branch.id
                  ? "fill-none stroke-ink [stroke-width:2.5]"
                  : "fill-none stroke-border-strong [stroke-width:1.5]"
              }
              d={EDGE_PATHS[branch.kind]}
              data-path-edge={branch.kind}
              key={branch.id}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div
          className="relative z-10 flex min-h-28 w-full items-center gap-4 rounded-[var(--radius-card)] border border-primary bg-surface px-5 py-4 shadow-[var(--shadow-card)] lg:absolute lg:top-1/2 lg:left-1/2 lg:size-40 lg:min-h-0 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:flex-col lg:justify-center lg:gap-1 lg:rounded-full lg:px-4 lg:text-center"
          data-path-node="student"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary lg:size-9">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <strong className="font-display block text-2xl font-medium text-ink lg:text-[1.7rem]">
              You
            </strong>
            <span className="mt-0.5 block text-xs leading-5 text-muted">
              {state.profile.facts.length} {state.profile.facts.length === 1 ? "fact" : "facts"} ·{" "}
              {state.profile.constraints.length} {state.profile.constraints.length === 1 ? "constraint" : "constraints"}
            </span>
          </span>
        </div>

        <div className="relative mt-4 ml-8 grid gap-3 border-s border-border-strong ps-6 lg:contents">
          {state.branches.map((branch) => {
            const presentation = BRANCH_PRESENTATION[branch.kind];
            const selected = state.selectedBranchId === branch.id;

            return (
              <button
                aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                aria-label={`Explore ${presentation.label}: ${branch.title}`}
                aria-pressed={selected}
                className={`relative z-10 w-full min-w-0 rounded-[var(--radius-card)] border px-4 py-4 text-left outline-none before:absolute before:top-1/2 before:right-full before:h-px before:w-6 before:bg-border-strong before:content-[''] hover:border-ink focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:absolute lg:w-[30%] lg:max-w-[20rem] lg:min-h-36 lg:px-5 lg:py-5 lg:before:hidden ${presentation.nodeClass} ${presentation.positionClass} ${
                  selected
                    ? "ring-2 ring-ink ring-offset-4 ring-offset-surface-muted"
                    : "shadow-[var(--shadow-card)]"
                }`}
                data-path-node="branch"
                data-path-role={branch.kind}
                key={branch.id}
                onClick={() => dispatch({ type: "select", branchId: branch.id })}
                ref={(node) => {
                  if (node) {
                    branchButtonRefs.current.set(branch.id, node);
                  } else {
                    branchButtonRefs.current.delete(branch.id);
                  }
                }}
                type="button"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.09em] text-graphite">
                    {presentation.label}
                  </span>
                  {selected ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink bg-surface px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink">
                      <Check aria-hidden="true" className="size-3" />
                      Selected
                    </span>
                  ) : null}
                </span>
                <strong className="mt-2 block text-base font-semibold leading-5 text-ink">
                  {branch.title}
                </strong>
                <span className="mt-2 block text-sm leading-5 text-graphite">
                  {branch.summary}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted" id="path-map-instructions">
        Select a path with a pointer, or focus a path and press Enter or Space. The graph does not require dragging.
      </p>

      {selectedBranch ? (
        <PathDetailPanel
          branch={selectedBranch}
          evidence={evidence}
          onClear={clearSelection}
        />
      ) : (
        <p
          aria-live="polite"
          className="mt-6 border-y border-border px-4 py-4 text-center text-sm text-muted"
        >
          No direction selected. Your three paths remain equally open for exploration.
        </p>
      )}
    </section>
  );
}
