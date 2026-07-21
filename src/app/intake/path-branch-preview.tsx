"use client";

import { useEffect, useReducer, useRef, useState } from "react";

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
  if (title.length <= 22) return "w-[12rem]";
  if (title.length <= 34) return "w-[15.5rem]";
  return "w-[19rem]";
}

export function desktopRoleSlot(index: number) {
  return DESKTOP_ROLE_SLOTS[index % DESKTOP_ROLE_SLOTS.length] ?? DESKTOP_ROLE_SLOTS[0];
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
          message: "Steppi could not reach the conversation service. Your question is still here.",
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
        aria-label="Career role possibilities based on your confirmed profile"
        className="relative mt-8 isolate overflow-hidden rounded-[1.75rem] border border-border-strong bg-surface"
        data-mobile-fallback="role-list"
        data-role-count={state.branches.length}
      >
        <div aria-label="Floating career role possibilities" className="relative hidden min-h-[34rem] grid-cols-12 grid-rows-4 gap-x-4 gap-y-5 bg-surface-muted/55 px-8 py-8 lg:grid xl:px-12 xl:py-10" data-role-overview="desktop">
          {state.branches.map((branch, index) => {
            const selected = state.selectedBranchId === branch.id;
            return (
              <button
                aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                aria-label={`Explore ${branch.title}`}
                aria-pressed={selected}
                className={`min-h-14 max-w-full rounded-full border px-5 py-3 text-center text-sm font-semibold leading-5 text-ink outline-none transition-[border-color,background-color,box-shadow] [overflow-wrap:anywhere] hover:border-primary hover:bg-surface focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted ${rolePillWidthClass(branch.title)} ${desktopRoleSlot(index)} ${selected ? "border-ink bg-primary-soft ring-2 ring-ink ring-offset-3 ring-offset-surface-muted" : "border-border-strong bg-surface"}`}
                data-role-pill={branch.id}
                data-role-slot={index}
                data-role-surface="desktop"
                disabled={conversationActive}
                key={branch.id}
                onClick={() => dispatch({ type: "select", branchId: branch.id })}
                ref={(node) => registerRoleButton(branch.id, "desktop", node)}
                type="button"
              >
                {branch.title}
              </button>
            );
          })}
        </div>

        <ul aria-label="Career role possibilities" className="space-y-3 bg-surface-muted/40 p-4 sm:p-6 lg:hidden" data-role-overview="mobile">
          {state.branches.map((branch) => {
            const selected = state.selectedBranchId === branch.id;
            return (
              <li key={branch.id}>
                <button
                  aria-controls={selected ? `path-detail-${branch.id}` : undefined}
                  aria-label={`Explore ${branch.title}`}
                  aria-pressed={selected}
                  className={`min-h-16 w-full rounded-[2rem] border px-5 py-3.5 text-center text-base font-semibold leading-6 text-ink outline-none transition-[border-color,background-color,box-shadow] [overflow-wrap:anywhere] hover:border-primary hover:bg-surface focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] ${selected ? "border-ink bg-primary-soft ring-2 ring-ink" : "border-border-strong bg-surface"}`}
                  data-role-pill={branch.id}
                  data-role-surface="mobile"
                  disabled={conversationActive}
                  onClick={() => dispatch({ type: "select", branchId: branch.id })}
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
