"use client";

import { ArrowRight, Check, UserRound } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import { BranchRefinementPanel } from "@/app/intake/branch-refinement";
import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import { ResearchComposer } from "@/app/intake/path-research";
import { ResearchExpansion } from "@/app/intake/research-expansion";
import {
  AUDIT_CIIT_AFFORDABILITY_NODE,
  DEMO_RESEARCH_NODES,
} from "@/lib/demo-research";
import {
  BRANCH_REFINEMENT_CONSTRAINT,
  BranchRefinementRequestSchema,
  buildBranchRefinementResearchRequest,
  validateBranchRefinementResult,
} from "@/lib/branch-refinement";
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
  isAnyResearchRequestActive,
  isResearchRequestActive,
  researchFlowReducer,
  visibleResearchForBranch,
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
    index: "01",
    nodeClass: "border-[var(--color-branch-blue-edge)] bg-[var(--color-branch-blue)]",
    positionClass: "lg:left-[4%] lg:top-[11%]",
  },
  adjacent: {
    label: "Adjacent possibility",
    index: "02",
    nodeClass: "border-[var(--color-branch-peach-edge)] bg-[var(--color-branch-peach)]",
    positionClass: "lg:right-[4%] lg:top-[11%]",
  },
  underexplored: {
    label: "Underexplored possibility",
    index: "03",
    nodeClass: "border-[var(--color-branch-green-edge)] bg-[var(--color-branch-green)]",
    positionClass: "lg:bottom-[8%] lg:left-1/2 lg:-translate-x-1/2",
  },
} as const;

const EDGE_PATHS = {
  "strongest-fit": "M 360 270 C 305 245, 250 178, 150 145",
  adjacent: "M 360 270 C 415 245, 470 178, 570 145",
  underexplored: "M 360 270 C 360 335, 360 385, 360 455",
} as const;

export type DevelopmentResearchFixture =
  | "success"
  | "partial_success"
  | "no_useful_sources"
  | "retrieval_failure"
  | "api_failure"
  | "malformed_model_output"
  | "polling_cancel"
  | "polling_timeout"
  | "refinement_success"
  | "refinement_no_useful_sources"
  | "refinement_retry"
  | "refinement_malformed_model_output"
  | "refinement_polling_timeout";

type ResearchPurpose = "research" | "refinement";

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
  const [researchCreateCount, setResearchCreateCount] = useState(0);
  const [refinementCreateCount, setRefinementCreateCount] = useState(0);
  const researchController = useRef<AbortController | null>(null);
  const researchActive = useRef(false);
  const cancellationRequested = useRef(false);
  const fixturePollCount = useRef(0);
  const fixtureRefinementAttempt = useRef(0);
  const evidence = profileEvidence(state.profile);
  const selectedBranch = state.branches.find(
    (branch) => branch.id === state.selectedBranchId,
  );
  const originalResearch =
    selectedBranch &&
    researchFlow.request.status === "success" &&
    researchFlow.request.branchId === selectedBranch.id
      ? researchFlow.request
      : null;
  const visibleResearch = selectedBranch
    ? visibleResearchForBranch(researchFlow, selectedBranch.id)
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
    purpose: ResearchPurpose,
  ): Promise<unknown> {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (method === "POST") {
      fixturePollCount.current = 0;
      if (purpose === "refinement") {
        fixtureRefinementAttempt.current += 1;
      }
      return { ok: true, status: "queued" };
    }

    fixturePollCount.current += 1;
    if (
      (developmentResearchFixture === "polling_timeout" ||
        developmentResearchFixture === "polling_cancel" ||
        (purpose === "refinement" &&
          developmentResearchFixture === "refinement_polling_timeout")) ||
      fixturePollCount.current === 1
    ) {
      return { ok: true, status: "in_progress" };
    }
    if (purpose === "refinement") {
      if (developmentResearchFixture === "refinement_no_useful_sources") {
        return {
          ok: true,
          status: "completed",
          outcome: "no_useful_sources",
          question,
          nodes: [],
        };
      }
      if (developmentResearchFixture === "refinement_malformed_model_output") {
        return {
          ok: true,
          status: "completed",
          outcome: "success",
          question,
          nodes: [
            {
              ...AUDIT_CIIT_AFFORDABILITY_NODE,
              parentBranchId: branch.id,
              sources: [],
            },
          ],
        };
      }
      if (
        developmentResearchFixture === "refinement_retry" &&
        fixtureRefinementAttempt.current === 1
      ) {
        return {
          ok: false,
          status: "failed",
          error: {
            code: "api_failure",
            message:
              "Steppi could not finish this research right now. Your map and question are safe; please try again.",
            retryable: true,
          },
        };
      }
      return {
        ok: true,
        status: "completed",
        outcome: "success",
        question,
        nodes: [
          {
            ...AUDIT_CIIT_AFFORDABILITY_NODE,
            parentBranchId: branch.id,
          },
        ],
      };
    }
    if (
      developmentResearchFixture === "success" ||
      developmentResearchFixture === "partial_success" ||
      developmentResearchFixture?.startsWith("refinement_")
    ) {
      const fixtureNodes =
        developmentResearchFixture === "partial_success"
          ? [DEMO_RESEARCH_NODES[0], DEMO_RESEARCH_NODES[2]]
          : DEMO_RESEARCH_NODES;
      return {
        ok: true,
        status: "completed",
        outcome: "success",
        question,
        nodes: fixtureNodes.map((node) => ({
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
    purpose: ResearchPurpose,
  ) {
    if (!response.ok) {
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_fail",
              branchId: branch.id,
              question,
              code: response.error.code,
              message: response.error.message,
              retryable: response.error.retryable,
            }
          : {
              type: "fail",
              branchId: branch.id,
              question,
              code: response.error.code,
              message: response.error.message,
              retryable: response.error.retryable,
            },
      );
      return;
    }
    if (response.status === "cancelled") {
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_cancelled",
              branchId: branch.id,
              question,
            }
          : { type: "cancelled", branchId: branch.id, question },
      );
      return;
    }
    if (response.status !== "completed") return;

    if (response.question !== question) {
      recordClientResearchDiagnostic({
        category: "rendering",
        stage: "client_response_validation",
        reason: "question_mismatch",
      });
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_fail",
              branchId: branch.id,
              question,
              code: "malformed_model_output",
              message:
                "Steppi received research for a different question. Nothing new was added; please try again.",
              retryable: true,
            }
          : {
              type: "fail",
              branchId: branch.id,
              question,
              code: "malformed_model_output",
              message:
                "Steppi received research for a different question. Nothing new was added; please try again.",
              retryable: true,
            },
      );
      return;
    }
    if (response.outcome === "no_useful_sources") {
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_no_useful_sources",
              branchId: branch.id,
              question,
            }
          : { type: "no_useful_sources", branchId: branch.id, question },
      );
      return;
    }
    if (response.nodes.some((node) => node.parentBranchId !== branch.id)) {
      recordClientResearchDiagnostic({
        category: "rendering",
        stage: "client_response_validation",
        reason: "parent_branch_mismatch",
      });
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_fail",
              branchId: branch.id,
              question,
              code: "malformed_model_output",
              message:
                "Steppi received research attached to a different path. Nothing new was added; please try again.",
              retryable: true,
            }
          : {
              type: "fail",
              branchId: branch.id,
              question,
              code: "malformed_model_output",
              message:
                "Steppi received research attached to a different path. Nothing new was added; please try again.",
              retryable: true,
            },
      );
      return;
    }
    if (purpose === "refinement") {
      try {
        const result = validateBranchRefinementResult({
          branchId: branch.id,
          constraint: question,
          nodes: response.nodes,
        });
        dispatchResearch({
          type: "refinement_succeed",
          branchId: result.branchId,
          question: result.constraint,
          nodes: result.nodes,
        });
      } catch {
        dispatchResearch({
          type: "refinement_fail",
          branchId: branch.id,
          question,
          code: "malformed_model_output",
          message:
            "Steppi received a refinement it could not safely attach. Nothing new was added; please try again.",
          retryable: true,
        });
      }
      return;
    }
    dispatchResearch({
      type: "succeed",
      branchId: branch.id,
      question,
      nodes: response.nodes,
    });
  }

  function dispatchRequestFailure(
    purpose: ResearchPurpose,
    branch: PathBranch,
    question: string,
    code: string,
    message: string,
    retryable = true,
  ) {
    dispatchResearch(
      purpose === "refinement"
        ? {
            type: "refinement_fail",
            branchId: branch.id,
            question,
            code,
            message,
            retryable,
          }
        : {
            type: "fail",
            branchId: branch.id,
            question,
            code,
            message,
            retryable,
          },
    );
  }

  async function runResearchJob(
    purpose: ResearchPurpose,
    questionOverride?: string,
  ) {
    if (!selectedBranch || researchActive.current) {
      return;
    }

    const candidate =
      purpose === "refinement"
        ? BRANCH_REFINEMENT_CONSTRAINT
        : (questionOverride ?? researchQuestion);
    const parsedQuestion = ResearchQuestionSchema.safeParse(candidate);
    if (!parsedQuestion.success) {
      if (purpose === "research") {
        setResearchQuestionError(
          candidate.trim()
            ? "Use at least 6 characters and keep the question under 300."
            : "Enter or choose one focused question first.",
        );
      }
      return;
    }

    const question = parsedQuestion.data;
    const branch = selectedBranch;
    let requestBody;
    if (purpose === "refinement") {
      if (
        researchFlow.request.status !== "success" ||
        researchFlow.request.branchId !== branch.id
      ) {
        return;
      }
      try {
        const input = BranchRefinementRequestSchema.parse({
          profile: state.profile,
          branch,
          constraint: BRANCH_REFINEMENT_CONSTRAINT,
          originalResearch: {
            branchId: researchFlow.request.branchId,
            question: researchFlow.request.question,
            nodes: researchFlow.request.nodes,
          },
        });
        requestBody = buildBranchRefinementResearchRequest(input);
      } catch {
        dispatchRequestFailure(
          purpose,
          branch,
          question,
          "malformed_model_output",
          "Steppi could not safely prepare this refinement. Your original research remains unchanged.",
          false,
        );
        return;
      }
    } else {
      requestBody = { profile: state.profile, branch, question };
      setResearchQuestion(question);
      setResearchQuestionError(null);
    }
    const controller = new AbortController();
    researchController.current = controller;
    researchActive.current = true;
    cancellationRequested.current = false;
    if (purpose === "refinement") {
      setRefinementCreateCount((count) => count + 1);
      dispatchResearch({
        type: "refinement_start",
        branchId: branch.id,
        question,
      });
    } else {
      setResearchCreateCount((count) => count + 1);
      dispatchResearch({ type: "start", branchId: branch.id, question });
    }

    try {
      const responseBody =
        process.env.NODE_ENV === "development" && developmentResearchFixture
          ? await fixtureResponse("POST", branch, question, purpose)
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
        dispatchRequestFailure(
          purpose,
          branch,
          question,
          "malformed_model_output",
          "Steppi received research it could not safely verify. Nothing new was added; please try again.",
        );
        return;
      }
      if (
        !parsedResponse.data.ok ||
        (parsedResponse.data.status !== "queued" &&
          parsedResponse.data.status !== "in_progress")
      ) {
        applyTerminalResponse(parsedResponse.data, branch, question, purpose);
        return;
      }
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_pending",
              branchId: branch.id,
              question,
              status: parsedResponse.data.status,
            }
          : {
              type: "pending",
              branchId: branch.id,
              question,
              status: parsedResponse.data.status,
            },
      );

      const polling = await pollResearchJob({
        signal: controller.signal,
        intervalMs: developmentResearchFixture ? 350 : undefined,
        budgetMs:
          developmentResearchFixture === "polling_timeout" ||
          (purpose === "refinement" &&
            developmentResearchFixture === "refinement_polling_timeout")
            ? 1_200
            : undefined,
        retrieve: async () => {
          const body =
            process.env.NODE_ENV === "development" && developmentResearchFixture
              ? await fixtureResponse("PUT", branch, question, purpose)
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
          dispatchResearch(
            purpose === "refinement"
              ? {
                  type: "refinement_pending",
                  branchId: branch.id,
                  question,
                  status,
                }
              : {
                  type: "pending",
                  branchId: branch.id,
                  question,
                  status,
                },
          ),
      });
      if (polling.kind === "terminal") {
        applyTerminalResponse(polling.response, branch, question, purpose);
      } else if (polling.kind === "timed_out") {
        dispatchRequestFailure(
          purpose,
          branch,
          question,
          "timeout",
          "Steppi reached the research time limit. Nothing was added, and your map and question are safe.",
        );
      }
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      dispatchRequestFailure(
        purpose,
        branch,
        question,
        "api_failure",
        "Steppi could not reach the research service. Your map and question are safe; please try again.",
      );
    } finally {
      researchActive.current = false;
      if (researchController.current === controller) {
        researchController.current = null;
      }
    }
  }

  async function cancelSelectedResearch() {
    const purpose: ResearchPurpose = isResearchRequestActive(
      researchFlow.refinement,
    )
      ? "refinement"
      : "research";
    const request =
      purpose === "refinement"
        ? researchFlow.refinement
        : researchFlow.request;
    if (!isResearchRequestActive(request) || cancellationRequested.current) return;
    dispatchResearch(
      purpose === "refinement"
        ? {
            type: "refinement_cancelling",
            branchId: request.branchId,
            question: request.question,
          }
        : {
            type: "cancelling",
            branchId: request.branchId,
            question: request.question,
          },
    );
    researchController.current?.abort();
    try {
      await cancelResearchJob("user");
    } finally {
      researchActive.current = false;
      dispatchResearch(
        purpose === "refinement"
          ? {
              type: "refinement_cancelled",
              branchId: request.branchId,
              question: request.question,
            }
          : {
              type: "cancelled",
              branchId: request.branchId,
              question: request.question,
            },
      );
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
    <section
      aria-labelledby="path-map-title"
      className="w-full"
      data-development-refinement-create-count={
        process.env.NODE_ENV === "development" ? refinementCreateCount : undefined
      }
      data-development-research-create-count={
        process.env.NODE_ENV === "development" ? researchCreateCount : undefined
      }
    >
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
        className="relative mt-8 isolate overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface"
        data-mobile-fallback="path-list"
        data-relationship-count="3"
      >
        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
          <div
            aria-label="Interactive path graph"
            className="relative hidden min-h-[35rem] overflow-hidden bg-surface-muted lg:block"
            data-path-graph="primary"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(30,33,31,0.09)_1px,transparent_1.5px)] [background-size:32px_32px]"
            />
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-full"
              preserveAspectRatio="none"
              viewBox="0 0 720 560"
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
              className="absolute top-1/2 left-1/2 z-10 flex size-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border border-primary bg-surface px-4 text-center shadow-[var(--shadow-card)]"
              data-path-node="student"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <UserRound aria-hidden="true" className="size-5" />
              </span>
              <strong className="font-display block text-[1.6rem] font-medium text-ink">
                You
              </strong>
              <span className="block text-[0.68rem] leading-4 text-muted">
                {state.profile.facts.length} {state.profile.facts.length === 1 ? "fact" : "facts"} ·{" "}
                {state.profile.constraints.length} {state.profile.constraints.length === 1 ? "constraint" : "constraints"}
              </span>
            </div>

            {state.branches.map((branch) => {
              const presentation = BRANCH_PRESENTATION[branch.kind];
              const selected = state.selectedBranchId === branch.id;

              return (
                <button
                  aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                  aria-label={`Explore ${presentation.label}: ${branch.title}`}
                  aria-pressed={selected}
                  className={`absolute z-10 w-[38%] max-w-[17rem] min-h-36 rounded-[var(--radius-card)] border px-5 py-5 text-left outline-none hover:border-ink focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted ${presentation.nodeClass} ${presentation.positionClass} ${
                    selected
                      ? "ring-2 ring-ink ring-offset-4 ring-offset-surface-muted shadow-[var(--shadow-panel)]"
                      : "shadow-[var(--shadow-card)]"
                  }`}
                  data-focused={selected ? "true" : undefined}
                  data-path-node="branch"
                  data-path-role={branch.kind}
                  disabled={isAnyResearchRequestActive(researchFlow)}
                  key={branch.id}
                  onClick={() => dispatch({ type: "select", branchId: branch.id })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      dispatch({ type: "select", branchId: branch.id });
                    }
                  }}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.09em] text-graphite">
                      {presentation.label}
                    </span>
                    {selected ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink bg-surface px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-ink">
                        <Check aria-hidden="true" className="size-3" />
                        Focused
                      </span>
                    ) : null}
                  </span>
                  <strong className="mt-2 block text-base font-semibold leading-5 text-ink">
                    {branch.title}
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-graphite">
                    {branch.summary}
                  </span>
                </button>
              );
            })}
          </div>

          <aside
            aria-labelledby="path-browser-title"
            className="relative border-border-strong bg-surface px-4 py-5 sm:px-6 sm:py-7 lg:border-s lg:px-7"
            data-path-browser="index"
          >
            <div className="flex items-start gap-3 border-b border-border pb-5 lg:block">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary bg-primary-soft text-primary lg:hidden">
                <UserRound aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.11em] text-primary">
                  Paths connected to you
                </p>
                <h2 className="font-display mt-1 text-2xl leading-tight text-ink" id="path-browser-title">
                  Browse your directions
                </h2>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Start anywhere. Each path opens its own evidence, tradeoffs, and questions.
                </p>
              </div>
            </div>

            <ol className="relative mt-1 before:absolute before:top-0 before:bottom-0 before:left-[0.68rem] before:w-px before:bg-border-strong before:content-[''] lg:before:hidden">
              {state.branches.map((branch) => {
                const presentation = BRANCH_PRESENTATION[branch.kind];
                const selected = state.selectedBranchId === branch.id;

                return (
                  <li className="relative border-b border-border last:border-b-0" key={branch.id}>
                    <button
                      aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                      aria-label={`Browse ${presentation.label}: ${branch.title}`}
                      aria-pressed={selected}
                      className={`group relative w-full py-5 ps-9 pe-1 text-left outline-none transition-colors before:absolute before:top-7 before:left-[0.35rem] before:size-[0.7rem] before:rounded-full before:border-2 before:border-surface before:bg-border-strong before:ring-1 before:ring-border-strong before:content-[''] hover:bg-surface-muted focus-visible:rounded-[var(--radius-control)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] lg:px-3 lg:before:hidden ${
                        selected ? "bg-surface-muted before:bg-ink before:ring-ink" : ""
                      }`}
                      data-path-browser-item={branch.kind}
                      disabled={isAnyResearchRequestActive(researchFlow)}
                      onClick={() => dispatch({ type: "select", branchId: branch.id })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          dispatch({ type: "select", branchId: branch.id });
                        }
                      }}
                      ref={(node) => {
                        if (node) {
                          branchButtonRefs.current.set(branch.id, node);
                        } else {
                          branchButtonRefs.current.delete(branch.id);
                        }
                      }}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">
                          {presentation.index} · {presentation.label}
                        </span>
                        {selected ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink">
                            <Check aria-hidden="true" className="size-3" />
                            Open now
                          </span>
                        ) : null}
                      </span>
                      <strong className="mt-2 block text-[1.05rem] font-semibold leading-6 text-ink">
                        {branch.title}
                      </strong>
                      <span className="mt-1.5 block text-sm leading-5 text-graphite">
                        {branch.summary}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        {selected ? "Viewing this path" : "Explore this path"}
                        <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
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
          selectionLocked={isAnyResearchRequestActive(researchFlow)}
          research={
            originalResearch ? (
              <BranchRefinementPanel
                branch={selectedBranch}
                onCancel={() => void cancelSelectedResearch()}
                onRetry={() =>
                  void runResearchJob("refinement", BRANCH_REFINEMENT_CONSTRAINT)
                }
                onSubmit={() =>
                  void runResearchJob("refinement", BRANCH_REFINEMENT_CONSTRAINT)
                }
                originalFindingCount={originalResearch.nodes.length}
                state={researchFlow.refinement}
              />
            ) : (
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
                    void runResearchJob(
                      "research",
                      researchFlow.request.question,
                    );
                  }
                }}
                onSubmit={() => void runResearchJob("research")}
                question={researchQuestion}
                request={researchFlow.request}
              />
            )
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
