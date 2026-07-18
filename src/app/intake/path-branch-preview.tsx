"use client";

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

export const DESKTOP_ROLE_SLOTS = [
  "col-start-1 col-span-4 row-start-1 self-end justify-self-start",
  "col-start-5 col-span-4 row-start-1 self-start justify-self-center",
  "col-start-9 col-span-4 row-start-1 self-end justify-self-end",
  "col-start-2 col-span-4 row-start-2 self-center justify-self-center",
  "col-start-7 col-span-5 row-start-2 self-end justify-self-center",
  "col-start-1 col-span-4 row-start-3 self-start justify-self-end",
  "col-start-5 col-span-5 row-start-4 self-start justify-self-center",
  "col-start-9 col-span-4 row-start-3 self-end justify-self-start",
] as const;

export function rolePillWidthClass(title: string) {
  if (title.length <= 22) {
    return "w-[12rem]";
  }
  if (title.length <= 34) {
    return "w-[15.5rem]";
  }
  return "w-[19rem]";
}

export function desktopRoleSlot(index: number) {
  return (
    DESKTOP_ROLE_SLOTS[index % DESKTOP_ROLE_SLOTS.length] ??
    DESKTOP_ROLE_SLOTS[0]
  );
}

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
  const roleButtonRefs = useRef(
    new Map<string, { desktop?: HTMLButtonElement; mobile?: HTMLButtonElement }>(),
  );
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
      window.requestAnimationFrame(() => {
        const buttons = roleButtonRefs.current.get(branchId);
        const visibleButton = [buttons?.desktop, buttons?.mobile].find(
          (button) => (button?.getBoundingClientRect().width ?? 0) > 0,
        );
        visibleButton?.focus();
      });
    }
  }

  function registerRoleButton(
    branchId: string,
    surface: "desktop" | "mobile",
    node: HTMLButtonElement | null,
  ) {
    const current = roleButtonRefs.current.get(branchId) ?? {};
    if (node) {
      roleButtonRefs.current.set(branchId, { ...current, [surface]: node });
      return;
    }

    const next = { ...current };
    delete next[surface];
    if (next.desktop || next.mobile) {
      roleButtonRefs.current.set(branchId, next);
    } else {
      roleButtonRefs.current.delete(branchId);
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
            Your role space
          </p>
          <h1
            className="font-display mt-2 text-balance text-[clamp(2.35rem,6vw,4.5rem)] leading-[1.02] text-ink"
            id="path-map-title"
          >
            A field of possibilities. Start anywhere.
          </h1>
          <p className="mt-4 max-w-[40rem] text-sm leading-6 text-muted sm:text-base">
            Scan the role titles first, then open any possibility that catches your attention. Nothing here is ranked or predicted.
          </p>
        </div>
        <p className="max-w-[17rem] text-xs leading-5 text-muted">
          Current programs, costs, and opportunities still require sourced research.
        </p>
      </div>

      <div
        aria-describedby="path-map-instructions"
        aria-label="Career role possibilities based on your confirmed profile"
        className="relative mt-8 isolate overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface"
        data-mobile-fallback="role-list"
        data-role-count={state.branches.length}
      >
        <div
          aria-label="Floating career role possibilities"
          className="relative hidden min-h-[34rem] grid-cols-12 grid-rows-4 gap-x-4 gap-y-5 bg-surface-muted/55 px-8 py-8 lg:grid xl:px-12 xl:py-10"
          data-role-overview="desktop"
        >
          {state.branches.map((branch, index) => {
            const selected = state.selectedBranchId === branch.id;

            return (
              <button
                  aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                  aria-label={`Explore ${branch.title}`}
                  aria-pressed={selected}
                  className={`min-h-14 max-w-full rounded-full border px-5 py-3 text-center text-sm font-semibold leading-5 text-ink outline-none transition-[border-color,background-color,box-shadow] [overflow-wrap:anywhere] hover:border-primary hover:bg-surface focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted ${rolePillWidthClass(branch.title)} ${desktopRoleSlot(index)} ${
                    selected
                      ? "border-ink bg-primary-soft ring-2 ring-ink ring-offset-3 ring-offset-surface-muted"
                      : "border-border-strong bg-surface"
                  }`}
                  data-role-pill={branch.id}
                  data-role-slot={index}
                  data-role-surface="desktop"
                  disabled={isAnyResearchRequestActive(researchFlow)}
                  key={branch.id}
                  onClick={() => dispatch({ type: "select", branchId: branch.id })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      dispatch({ type: "select", branchId: branch.id });
                    }
                  }}
                  ref={(node) => registerRoleButton(branch.id, "desktop", node)}
                  type="button"
                >
                  {branch.title}
              </button>
            );
          })}
        </div>

        <ul
          aria-label="Career role possibilities"
          className="space-y-3 bg-surface-muted/40 p-4 sm:p-6 lg:hidden"
          data-role-overview="mobile"
        >
          {state.branches.map((branch) => {
            const selected = state.selectedBranchId === branch.id;

            return (
              <li key={branch.id}>
                    <button
                      aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                      aria-label={`Explore ${branch.title}`}
                      aria-pressed={selected}
                      className={`min-h-16 w-full rounded-[2rem] border px-5 py-3.5 text-center text-base font-semibold leading-6 text-ink outline-none transition-[border-color,background-color,box-shadow] [overflow-wrap:anywhere] hover:border-primary hover:bg-surface focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] ${
                        selected
                          ? "border-ink bg-primary-soft ring-2 ring-ink"
                          : "border-border-strong bg-surface"
                      }`}
                      data-role-pill={branch.id}
                      data-role-surface="mobile"
                      disabled={isAnyResearchRequestActive(researchFlow)}
                      onClick={() => dispatch({ type: "select", branchId: branch.id })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          dispatch({ type: "select", branchId: branch.id });
                        }
                      }}
                      ref={(node) => registerRoleButton(branch.id, "mobile", node)}
                      type="button"
                    >
                      {branch.title}
                    </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted" id="path-map-instructions">
        Select a role with a pointer, or focus a role and press Enter or Space. No dragging is required.
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
          No role selected. Every possibility remains open for exploration.
        </p>
      )}
    </section>
  );
}
