"use client";

import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";

import {
  PathDetailPanel,
  profileEvidence,
} from "@/app/intake/path-detail-panel";
import { RoleConversationPanel } from "@/app/intake/role-conversation";
import { developmentRoleConversationMessage } from "@/lib/demo-role-conversation";
import { createPathMapState, pathMapReducer } from "@/lib/path-map-state";
import {
  RoleConversationApiResponseSchema,
  conversationHistoryForRequest,
  emptyRoleConversationThread,
  roleConversationThreadsReducer,
  validateRoleConversationQuestion,
  type RoleConversationApiResponse,
  type RoleConversationThreads,
  type RoleConversationUserMessage,
} from "@/lib/role-conversation";
import type { PathBranch, StudentProfile } from "@/lib/schemas";

export const ROLE_BAND_DISTRIBUTIONS = {
  12: [3, 3, 3, 3],
  13: [3, 4, 3, 3],
  14: [3, 4, 4, 3],
  15: [4, 4, 4, 3],
} as const;

const ROLE_BAND_ALIGNMENT_CLASSES = [
  "justify-around",
  "justify-between",
  "justify-evenly",
  "justify-center",
] as const;

const ROLE_NODE_OFFSET_CLASSES = ["-mt-3", "mt-4", "mt-0", "-mt-1"] as const;

export function roleBands<T>(roles: T[]) {
  const distribution = ROLE_BAND_DISTRIBUTIONS[
    roles.length as keyof typeof ROLE_BAND_DISTRIBUTIONS
  ];

  if (!distribution) return [roles];

  let offset = 0;
  return distribution.map((size) => {
    const band = roles.slice(offset, offset + size);
    offset += size;
    return band;
  });
}

export function rolePillWidthClass(title: string) {
  if (title.length <= 22) return "flex-[0_1_11rem] lg:max-w-[13rem]";
  if (title.length <= 34) return "flex-[0_1_14rem] lg:max-w-[16rem]";
  return "flex-[0_1_17rem] lg:max-w-[18rem]";
}

export function mobileRoleSpanClass(title: string) {
  return title.length <= 30
    ? "min-[370px]:col-span-1"
    : "min-[370px]:col-span-2";
}

export function roleNodeOffsetClass(index: number) {
  return ROLE_NODE_OFFSET_CLASSES[index % ROLE_NODE_OFFSET_CLASSES.length];
}

export type DevelopmentConversationFixture =
  | "success"
  | "researched"
  | "unavailable"
  | "api_failure"
  | "malformed_model_output";

function unavailableDevelopmentMessage(branchId: string, requestId: string) {
  return {
    id: `assistant-${requestId}`,
    role: "assistant" as const,
    branchId,
    createdAt: "2026-07-20T12:00:00.000+08:00",
    mode: "unavailable" as const,
    answerBlocks: [
      {
        id: "unavailable-answer",
        text: "I could not verify enough current information to answer that safely right now.",
        sourceUrls: [],
      },
    ],
    relevanceToStudent: "The question is still useful; it just needs stronger current evidence.",
    caveat: "No unsupported current claim was added.",
    nextStep: "Try narrowing the location or specific fact you want to check.",
    sources: [],
  };
}

export function InitialPathMap({
  branches,
  confirmedSummary,
  developmentConversationFixture,
  profile,
}: {
  branches: PathBranch[];
  confirmedSummary: string;
  developmentConversationFixture?: DevelopmentConversationFixture;
  profile: StudentProfile;
}) {
  const [state, dispatch] = useReducer(
    pathMapReducer,
    createPathMapState(profile, branches),
  );
  const [threads, dispatchThreads] = useReducer(
    roleConversationThreadsReducer,
    {} as RoleConversationThreads,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [requestCount, setRequestCount] = useState(0);
  const [roleSpaceEntered, setRoleSpaceEntered] = useState(false);
  const roleButtonRefs = useRef(
    new Map<string, { desktop?: HTMLButtonElement; mobile?: HTMLButtonElement }>(),
  );
  const requestController = useRef<AbortController | null>(null);
  const requestActive = useRef(false);
  const safetyIdentifier = useRef("steppi-session-pending");
  const evidence = profileEvidence(state.profile);
  const selectedBranch = state.branches.find(
    (branch) => branch.id === state.selectedBranchId,
  );
  const conversationActive = Object.values(threads).some(
    (thread) => thread.request.status === "loading",
  );

  useEffect(
    () => () => {
      requestController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    safetyIdentifier.current = `steppi-session-${crypto.randomUUID()}`;
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setRoleSpaceEntered(true), 900);
    return () => window.clearTimeout(timeout);
  }, []);

  function threadFor(branchId: string) {
    return threads[branchId] ?? emptyRoleConversationThread();
  }

  function setFieldError(branchId: string, message: string | null) {
    setFieldErrors((current) => ({ ...current, [branchId]: message }));
  }

  async function developmentResponse(
    fixture: DevelopmentConversationFixture,
    branchId: string,
    requestId: string,
  ): Promise<unknown> {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    if (fixture === "api_failure") {
      return {
        ok: false,
        error: {
          code: "api_failure",
          message: "Steppi could not answer right now. Your question is still here.",
          retryable: true,
        },
      };
    }
    if (fixture === "malformed_model_output") {
      return { ok: true, branchId, requestId, message: { role: "assistant" } };
    }
    return {
      ok: true,
      branchId,
      requestId,
      message:
        fixture === "unavailable"
          ? unavailableDevelopmentMessage(branchId, requestId)
          : developmentRoleConversationMessage({
              branchId,
              requestId,
              researched: fixture === "researched",
            }),
    };
  }

  async function submitConversation(retry = false) {
    if (!selectedBranch || requestActive.current) return;

    const branch = selectedBranch;
    const currentThread = threadFor(branch.id);
    const failedRequest = currentThread.request.status === "error"
      ? currentThread.request
      : null;
    const question = retry && failedRequest
      ? failedRequest.question
      : currentThread.draft.trim();
    const questionError = validateRoleConversationQuestion(question);
    if (questionError) {
      setFieldError(branch.id, questionError);
      return;
    }

    const requestId = `role-request-${crypto.randomUUID()}`;
    let userMessageId: string;
    let history = currentThread.messages;

    if (retry && failedRequest) {
      userMessageId = failedRequest.userMessageId;
      history = conversationHistoryForRequest(currentThread, userMessageId);
      dispatchThreads({
        type: "retry",
        branchId: branch.id,
        requestId,
        question,
        userMessageId,
      });
    } else {
      userMessageId = `user-${crypto.randomUUID()}`;
      const userMessage: RoleConversationUserMessage = {
        id: userMessageId,
        role: "user",
        branchId: branch.id,
        content: question,
        createdAt: new Date().toISOString(),
      };
      dispatchThreads({
        type: "start",
        branchId: branch.id,
        requestId,
        userMessage,
      });
    }

    setFieldError(branch.id, null);
    requestActive.current = true;
    setRequestCount((count) => count + 1);
    const controller = new AbortController();
    requestController.current = controller;

    try {
      const body =
        process.env.NODE_ENV === "development" && developmentConversationFixture
          ? await developmentResponse(
              developmentConversationFixture,
              branch.id,
              requestId,
            )
          : await fetch("/api/role-conversation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profile: state.profile,
                confirmedSummary,
                branch,
                history,
                question,
                requestId,
                safetyIdentifier: safetyIdentifier.current,
              }),
              signal: controller.signal,
            }).then((response) => response.json());

      if (controller.signal.aborted) return;
      const parsed = RoleConversationApiResponseSchema.safeParse(body);
      if (!parsed.success) {
        dispatchThreads({
          type: "fail",
          branchId: branch.id,
          requestId,
          message: "Steppi received an answer it could not safely show. Please try again.",
          retryable: true,
        });
        return;
      }

      const response: RoleConversationApiResponse = parsed.data;
      if (!response.ok) {
        dispatchThreads({
          type: "fail",
          branchId: branch.id,
          requestId,
          message: response.error.message,
          retryable: response.error.retryable,
        });
        return;
      }
      if (
        response.branchId !== branch.id ||
        response.requestId !== requestId ||
        response.message.branchId !== branch.id
      ) {
        dispatchThreads({
          type: "fail",
          branchId: branch.id,
          requestId,
          message: "Steppi received an answer for a different role. Please try again.",
          retryable: true,
        });
        return;
      }
      dispatchThreads({
        type: "succeed",
        branchId: branch.id,
        requestId,
        message: response.message,
      });
    } catch {
      if (!controller.signal.aborted) {
        dispatchThreads({
          type: "fail",
          branchId: branch.id,
          requestId,
          message: "Steppi could not answer right now. Your question is still here.",
          retryable: true,
        });
      }
    } finally {
      requestActive.current = false;
      if (requestController.current === controller) requestController.current = null;
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

  function selectRole(branchId: string) {
    setRoleSpaceEntered(true);
    dispatch({ type: "select", branchId });
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
    if (next.desktop || next.mobile) roleButtonRefs.current.set(branchId, next);
    else roleButtonRefs.current.delete(branchId);
  }

  return (
    <section
      aria-labelledby="path-map-title"
      className="w-full"
      data-development-conversation-request-count={
        process.env.NODE_ENV === "development" ? requestCount : undefined
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-[47rem]">
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-primary">Your role space</p>
          <h1 className="font-display mt-2 text-balance text-[clamp(2.35rem,6vw,4.5rem)] leading-[1.02] text-ink" id="path-map-title">
            A field of possibilities. Start anywhere.
          </h1>
          <p className="mt-4 max-w-[40rem] text-sm leading-6 text-muted sm:text-base">
            Scan the role titles first, then open any possibility that catches your attention. Nothing here is ranked or predicted.
          </p>
        </div>
        <p className="max-w-[17rem] text-xs leading-5 text-muted">
          Ask short follow-ups inside any role. Current facts are checked only when needed.
        </p>
      </div>

      <div
        aria-describedby="path-map-instructions"
        aria-label="Career role possibilities based on what you confirmed"
        className="relative mt-8 isolate overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface"
        data-mobile-fallback="role-cloud"
        data-role-count={state.branches.length}
      >
        <div aria-label="Constellation of career role possibilities" className="relative hidden min-h-[36rem] flex-col justify-between bg-surface-muted/55 px-8 py-7 lg:flex xl:px-12 xl:py-9" data-role-overview="desktop">
          {roleBands(state.branches).map((band, bandIndex) => (
            <div
              className={`flex min-h-[7rem] w-full items-center gap-3 px-1 xl:gap-5 ${ROLE_BAND_ALIGNMENT_CLASSES[bandIndex]}`}
              data-role-band={bandIndex}
              key={`role-band-${bandIndex}`}
            >
              {band.map((branch) => {
                const index = state.branches.findIndex((candidate) => candidate.id === branch.id);
                const selected = state.selectedBranchId === branch.id;
                return (
                  <div
                    className={`${roleSpaceEntered ? "" : "role-constellation-node"} min-w-0 ${rolePillWidthClass(branch.title)} ${roleNodeOffsetClass(index)}`}
                    data-role-index={index}
                    key={branch.id}
                    style={{ "--role-index": index } as CSSProperties}
                  >
                    <button
                      aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                      aria-label={`Explore ${branch.title}`}
                      aria-pressed={selected}
                      className={`min-h-14 w-full rounded-full border px-4 py-3 text-center text-sm font-semibold leading-5 text-ink outline-none transition-[transform,border-color,background-color,box-shadow] [overflow-wrap:anywhere] hover:border-primary hover:bg-surface active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted ${selected ? "border-ink bg-primary-soft ring-2 ring-ink ring-offset-3 ring-offset-surface-muted" : "border-border-strong bg-surface"}`}
                      data-role-pill={branch.id}
                      data-role-surface="desktop"
                      disabled={conversationActive}
                      onClick={() => selectRole(branch.id)}
                      ref={(node) => registerRoleButton(branch.id, "desktop", node)}
                      type="button"
                    >
                      {branch.title}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <ul aria-label="Career role possibilities" className="grid grid-cols-1 gap-3 bg-surface-muted/40 p-4 min-[370px]:grid-cols-2 sm:p-6 lg:hidden" data-role-overview="mobile">
          {state.branches.map((branch, index) => {
            const selected = state.selectedBranchId === branch.id;
            return (
              <li
                className={`${roleSpaceEntered ? "" : "role-constellation-node"} ${mobileRoleSpanClass(branch.title)}`}
                data-role-index={index}
                key={branch.id}
                style={{ "--role-index": index } as CSSProperties}
              >
                <button
                  aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                  aria-label={`Explore ${branch.title}`}
                  aria-pressed={selected}
                  className={`min-h-16 w-full rounded-[2rem] border px-4 py-3.5 text-center text-sm font-semibold leading-5 text-ink outline-none transition-[transform,border-color,background-color,box-shadow] [overflow-wrap:anywhere] hover:border-primary hover:bg-surface active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] sm:text-base sm:leading-6 ${selected ? "border-ink bg-primary-soft ring-2 ring-ink" : "border-border-strong bg-surface"}`}
                  data-role-pill={branch.id}
                  data-role-surface="mobile"
                  disabled={conversationActive}
                  onClick={() => selectRole(branch.id)}
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

      {selectedBranch ? (
        <PathDetailPanel
          branch={selectedBranch}
          conversation={
            <RoleConversationPanel
              branch={selectedBranch}
              fieldError={fieldErrors[selectedBranch.id] ?? null}
              onDraftChange={(value) => {
                dispatchThreads({ type: "draft", branchId: selectedBranch.id, value });
                setFieldError(selectedBranch.id, null);
              }}
              onReset={() => dispatchThreads({ type: "reset", branchId: selectedBranch.id })}
              onRetry={() => void submitConversation(true)}
              onSubmit={() => void submitConversation(false)}
              thread={threadFor(selectedBranch.id)}
            />
          }
          evidence={evidence}
          onClear={clearSelection}
          selectionLocked={conversationActive}
        />
      ) : (
        <p aria-live="polite" className="mt-6 border-y border-border px-4 py-4 text-center text-sm text-muted">
          No role selected. Every possibility remains open for exploration.
        </p>
      )}
    </section>
  );
}
