"use client";

import { Check, UserRound } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import { ResearchComposer } from "@/app/intake/path-research";
import { ResearchExpansion } from "@/app/intake/research-expansion";
import { DEMO_RESEARCH_NODES } from "@/lib/demo-research";
import {
  createPathMapState,
  pathMapReducer,
} from "@/lib/path-map-state";
import {
  ResearchApiResponseSchema,
  type ResearchApiResponse,
} from "@/lib/research-api";
import { recordClientResearchDiagnostic } from "@/lib/research-diagnostics";
import {
  createResearchFlowState,
  isResearchRequestActive,
  researchFlowReducer,
} from "@/lib/research-flow";
import { pollResearchJob } from "@/lib/research-polling";
import {
  ResearchQuestionSchema,
  type PathBranch,
  type StudentProfile,
} from "@/lib/schemas";

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

export type DevelopmentResearchFixture =
  | "success"
  | "no_useful_sources"
  | "retrieval_failure"
  | "api_failure"
  | "malformed_model_output"
  | "polling_cancel"
  | "polling_timeout";

export function InitialPathMap({
  branches,
  developmentResearchFixture,
  profile,
}: {
  branches: PathBranch[];
  developmentResearchFixture?: DevelopmentResearchFixture;
  profile: StudentProfile;
}) {
  const [state, dispatch] = useReducer(
    pathMapReducer,
    createPathMapState(profile, branches),
  );
  const branchButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [researchFlow, dispatchResearch] = useReducer(
    researchFlowReducer,
    createResearchFlowState(profile, branches),
  );
  const [researchQuestion, setResearchQuestion] = useState("");
  const [researchQuestionError, setResearchQuestionError] = useState<string | null>(null);
  const researchController = useRef<AbortController | null>(null);
  const researchActive = useRef(false);
  const cancellationRequested = useRef(false);
  const fixturePollCount = useRef(0);
  const evidence = profileEvidence(state.profile);
  const selectedBranch = state.branches.find(
    (branch) => branch.id === state.selectedBranchId,
  );
  const visibleResearch =
    selectedBranch &&
    researchFlow.request.status === "success" &&
    researchFlow.request.branchId === selectedBranch.id
      ? researchFlow.request
      : null;

  useEffect(
    () => () => {
      researchController.current?.abort();
    },
    [],
  );

  async function fixtureResponse(
    method: "POST" | "PUT",
    branch: PathBranch,
    question: string,
  ): Promise<unknown> {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (method === "POST") {
      fixturePollCount.current = 0;
      return { ok: true, status: "queued" };
    }

    fixturePollCount.current += 1;
    if (
      (developmentResearchFixture === "polling_timeout" ||
        developmentResearchFixture === "polling_cancel") ||
      fixturePollCount.current === 1
    ) {
      return { ok: true, status: "in_progress" };
    }
    if (developmentResearchFixture === "success") {
      return {
        ok: true,
        status: "completed",
        outcome: "success",
        question,
        nodes: DEMO_RESEARCH_NODES.map((node) => ({
          ...node,
          parentBranchId: branch.id,
        })),
      };
    }
    if (developmentResearchFixture === "no_useful_sources") {
      return {
        ok: true,
        status: "completed",
        outcome: "no_useful_sources",
        question,
        nodes: [],
      };
    }
    if (developmentResearchFixture === "malformed_model_output") {
      return {
        ok: true,
        status: "completed",
        outcome: "success",
        question,
        nodes: [{ ...DEMO_RESEARCH_NODES[0], parentBranchId: branch.id, sources: [] }],
      };
    }
    return {
      ok: false,
      status: "failed",
      error: {
        code: developmentResearchFixture ?? "api_failure",
        message:
          developmentResearchFixture === "retrieval_failure"
            ? "Steppi could not reach useful sources right now. Your map and question are safe; please try again."
            : "Steppi could not finish this research right now. Your map and question are safe; please try again.",
        retryable: true,
      },
    };
  }

  async function cancelResearchJob(reason: "user" | "timeout") {
    if (cancellationRequested.current) return;
    cancellationRequested.current = true;
    if (process.env.NODE_ENV === "development" && developmentResearchFixture) {
      return;
    }
    await fetch("/api/research", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
  }

  function applyTerminalResponse(
    response: ResearchApiResponse,
    branch: PathBranch,
    question: string,
  ) {
    if (!response.ok) {
      dispatchResearch({
        type: "fail",
        branchId: branch.id,
        question,
        code: response.error.code,
        message: response.error.message,
        retryable: response.error.retryable,
      });
      return;
    }
    if (response.status === "cancelled") {
      dispatchResearch({ type: "cancelled", branchId: branch.id, question });
      return;
    }
    if (response.status !== "completed") return;

    if (response.question !== question) {
      recordClientResearchDiagnostic({
        category: "rendering",
        stage: "client_response_validation",
        reason: "question_mismatch",
      });
      dispatchResearch({
        type: "fail",
        branchId: branch.id,
        question,
        code: "malformed_model_output",
        message: "Steppi received research for a different question. Nothing new was added; please try again.",
        retryable: true,
      });
      return;
    }
    if (response.outcome === "no_useful_sources") {
      dispatchResearch({ type: "no_useful_sources", branchId: branch.id, question });
      return;
    }
    if (response.nodes.some((node) => node.parentBranchId !== branch.id)) {
      recordClientResearchDiagnostic({
        category: "rendering",
        stage: "client_response_validation",
        reason: "parent_branch_mismatch",
      });
      dispatchResearch({
        type: "fail",
        branchId: branch.id,
        question,
        code: "malformed_model_output",
        message: "Steppi received research attached to a different path. Nothing new was added; please try again.",
        retryable: true,
      });
      return;
    }
    dispatchResearch({
      type: "succeed",
      branchId: branch.id,
      question,
      nodes: response.nodes,
    });
  }

  async function researchSelectedBranch(questionOverride?: string) {
    if (!selectedBranch || researchActive.current) {
      return;
    }

    const candidate = questionOverride ?? researchQuestion;
    const parsedQuestion = ResearchQuestionSchema.safeParse(candidate);
    if (!parsedQuestion.success) {
      setResearchQuestionError(
        candidate.trim()
          ? "Use at least 6 characters and keep the question under 300."
          : "Enter or choose one focused question first.",
      );
      return;
    }

    const question = parsedQuestion.data;
    const branch = selectedBranch;
    setResearchQuestion(question);
    setResearchQuestionError(null);
    const controller = new AbortController();
    researchController.current = controller;
    researchActive.current = true;
    cancellationRequested.current = false;
    dispatchResearch({ type: "start", branchId: branch.id, question });

    try {
      const requestBody = { profile: state.profile, branch, question };
      const responseBody =
        process.env.NODE_ENV === "development" && developmentResearchFixture
          ? await fixtureResponse("POST", branch, question)
          : await fetch("/api/research", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            }).then((response) => response.json());
      if (controller.signal.aborted) return;
      const parsedResponse = ResearchApiResponseSchema.safeParse(responseBody);
      if (!parsedResponse.success) {
        recordClientResearchDiagnostic({
          category: "rendering",
          stage: "client_response_validation",
          reason: "api_response_schema",
        });
        dispatchResearch({
          type: "fail",
          branchId: branch.id,
          question,
          code: "malformed_model_output",
          message: "Steppi received research it could not safely verify. Nothing new was added; please try again.",
          retryable: true,
        });
        return;
      }
      if (
        !parsedResponse.data.ok ||
        (parsedResponse.data.status !== "queued" &&
          parsedResponse.data.status !== "in_progress")
      ) {
        applyTerminalResponse(parsedResponse.data, branch, question);
        return;
      }
      dispatchResearch({
        type: "pending",
        branchId: branch.id,
        question,
        status: parsedResponse.data.status,
      });

      const polling = await pollResearchJob({
        signal: controller.signal,
        intervalMs: developmentResearchFixture ? 350 : undefined,
        budgetMs:
          developmentResearchFixture === "polling_timeout" ? 1_200 : undefined,
        retrieve: async () => {
          const body =
            process.env.NODE_ENV === "development" && developmentResearchFixture
              ? await fixtureResponse("PUT", branch, question)
              : await fetch("/api/research", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(requestBody),
                  signal: controller.signal,
                }).then((response) => response.json());
          const parsed = ResearchApiResponseSchema.safeParse(body);
          if (!parsed.success) {
            recordClientResearchDiagnostic({
              category: "rendering",
              stage: "client_response_validation",
              reason: "api_response_schema",
            });
            return {
              ok: false,
              status: "failed",
              error: {
                code: "malformed_model_output",
                message: "Steppi received research it could not safely verify. Nothing new was added; please try again.",
                retryable: true,
              },
            };
          }
          return parsed.data;
        },
        cancel: async () => cancelResearchJob("timeout"),
        onPending: (status) =>
          dispatchResearch({
            type: "pending",
            branchId: branch.id,
            question,
            status,
          }),
      });
      if (polling.kind === "terminal") {
        applyTerminalResponse(polling.response, branch, question);
      } else if (polling.kind === "timed_out") {
        dispatchResearch({
          type: "fail",
          branchId: branch.id,
          question,
          code: "timeout",
          message: "Steppi reached the research time limit. Nothing was added, and your map and question are safe.",
          retryable: true,
        });
      }
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      dispatchResearch({
        type: "fail",
        branchId: branch.id,
        question,
        code: "api_failure",
        message: "Steppi could not reach the research service. Your map and question are safe; please try again.",
        retryable: true,
      });
    } finally {
      researchActive.current = false;
      if (researchController.current === controller) {
        researchController.current = null;
      }
    }
  }

  async function cancelSelectedResearch() {
    const request = researchFlow.request;
    if (!isResearchRequestActive(request) || cancellationRequested.current) return;
    dispatchResearch({
      type: "cancelling",
      branchId: request.branchId,
      question: request.question,
    });
    researchController.current?.abort();
    try {
      await cancelResearchJob("user");
    } finally {
      researchActive.current = false;
      dispatchResearch({
        type: "cancelled",
        branchId: request.branchId,
        question: request.question,
      });
    }
  }

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
                disabled={isResearchRequestActive(researchFlow.request)}
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

      {selectedBranch && visibleResearch ? (
        <ResearchExpansion
          branch={selectedBranch}
          nodes={visibleResearch.nodes}
          question={visibleResearch.question}
        />
      ) : null}

      {selectedBranch ? (
        <PathDetailPanel
          branch={selectedBranch}
          evidence={evidence}
          onClear={clearSelection}
          selectionLocked={isResearchRequestActive(researchFlow.request)}
          research={
              <ResearchComposer
                branch={selectedBranch}
                fieldError={researchQuestionError}
                onCancel={() => void cancelSelectedResearch()}
                onQuestionChange={(question) => {
                setResearchQuestion(question);
                setResearchQuestionError(null);
              }}
              onRetry={() => {
                if (researchFlow.request.status !== "idle") {
                  void researchSelectedBranch(researchFlow.request.question);
                }
              }}
              onSubmit={() => void researchSelectedBranch()}
              question={researchQuestion}
              request={researchFlow.request}
            />
          }
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
