"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  InitialPathMap,
  type DevelopmentResearchFixture,
} from "@/app/intake/path-branch-preview";
import { Button } from "@/components/ui/button";
import {
  developmentProfileRefinementPayload,
  type DevelopmentProfileRefinementFixture,
} from "@/lib/demo-profile-refinement";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { PathApiResponseSchema } from "@/lib/path-api";
import { pathFlowReducer } from "@/lib/path-flow";
import { validatePathGeneration } from "@/lib/path-validation";
import { ProfileRefinementApiResponseSchema } from "@/lib/profile-refinement-api";
import {
  PROFILE_REFINEMENT_OPENING_QUESTION,
  ProfileRefinementRequestSchema,
  appendProfileRefinementTurn,
  buildProfileSummary,
  type ProfileRefinementRequest,
  type ProfileRefinementTurn,
} from "@/lib/profile-refinement";
import type { StudentProfile } from "@/lib/schemas";

const REFINEMENT_LIMIT = 800;

export type DevelopmentPathFixture =
  | "success"
  | "api_failure"
  | "timeout"
  | "malformed_model_output";

type RefinementRequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; retryable: boolean };

export function pathGenerationRequest(profile: StudentProfile) {
  return { profile };
}

function SummaryList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: string[];
  title: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-graphite">
          {items.map((item) => (
            <li className="border-s border-border-strong ps-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">{empty}</p>
      )}
    </section>
  );
}

export function ProfileSummary({ profile }: { profile: StudentProfile }) {
  const summary = buildProfileSummary(profile);

  return (
    <div className="mt-8 border-y border-border" data-profile-summary="">
      <section className="py-6 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
          The choice in front of you
        </p>
        <p className="mt-2 max-w-[44rem] font-display text-xl leading-8 text-ink sm:text-2xl">
          {summary.decision}
        </p>
      </section>
      <div className="grid gap-7 border-t border-border py-7 md:grid-cols-3 md:gap-8">
        <SummaryList
          empty="Steppi is keeping this open rather than guessing."
          items={summary.signals}
          title="What seems to matter"
        />
        <SummaryList
          empty="No practical boundary surfaced clearly yet."
          items={summary.practicalContext}
          title="What should shape the options"
        />
        <SummaryList
          empty="There is enough context to explore without forcing another answer."
          items={summary.openQuestions}
          title="What can stay open"
        />
      </div>
    </div>
  );
}

function RefinementConversation({
  acknowledgement,
  currentQuestion,
  turns,
}: {
  acknowledgement: string | null;
  currentQuestion: string | null;
  turns: ProfileRefinementTurn[];
}) {
  return (
    <div
      aria-live="polite"
      className="mt-8 space-y-6 border-y border-border py-7"
      data-profile-refinement-transcript=""
    >
      {turns.map((turn) => (
        <div className="space-y-3" key={turn.id}>
          <div className="max-w-[42rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Steppi
            </p>
            <p className="mt-1 text-base leading-7 text-ink">{turn.question}</p>
          </div>
          <div className="flex justify-end ps-8">
            <p className="max-w-[38rem] whitespace-pre-wrap break-words rounded-[1.1rem_1.1rem_0.25rem_1.1rem] border border-border-strong bg-surface px-4 py-3 text-sm leading-6 text-graphite sm:px-5">
              {turn.answer}
            </p>
          </div>
        </div>
      ))}

      {currentQuestion ? (
        <div className="max-w-[42rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Steppi
          </p>
          {acknowledgement ? (
            <p className="mt-2 text-sm leading-6 text-muted">{acknowledgement}</p>
          ) : null}
          <p className="mt-1 text-base leading-7 text-ink">{currentQuestion}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileConfirmation({
  developmentPathFixture,
  developmentProfileRefinementFixture,
  developmentResearchFixture,
  onRestart,
  profile: originalProfile,
}: {
  developmentPathFixture?: DevelopmentPathFixture;
  developmentProfileRefinementFixture?: DevelopmentProfileRefinementFixture;
  developmentResearchFixture?: DevelopmentResearchFixture;
  onRestart: () => void;
  profile: StudentProfile;
}) {
  const [currentProfile, setCurrentProfile] = useState(originalProfile);
  const [view, setView] = useState<"summary" | "refinement">("summary");
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);
  const [refinementTurns, setRefinementTurns] = useState<ProfileRefinementTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(
    PROFILE_REFINEMENT_OPENING_QUESTION,
  );
  const [currentAcknowledgement, setCurrentAcknowledgement] = useState<string | null>(
    null,
  );
  const [composerValue, setComposerValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [refinementRequestState, setRefinementRequestState] =
    useState<RefinementRequestState>({ status: "idle" });
  const [pendingRefinement, setPendingRefinement] =
    useState<ProfileRefinementRequest | null>(null);
  const [pathFlow, dispatchPathFlow] = useReducer(pathFlowReducer, null);
  const refinementController = useRef<AbortController | null>(null);
  const pathRequestController = useRef<AbortController | null>(null);
  const refinementSubmissionLock = useRef(false);
  const pathSubmissionLock = useRef(false);
  const refinementAttempt = useRef(0);
  const composer = useRef<HTMLTextAreaElement | null>(null);
  const mapSection = useRef<HTMLElement | null>(null);

  const confirmedProfile = pathFlow?.confirmedProfile ?? null;
  const pathRequestState = pathFlow?.request ?? { status: "idle" as const };
  const isRefining = view === "refinement";
  const isRefinementLoading = refinementRequestState.status === "loading";
  const isPathLoading = pathRequestState.status === "loading";

  useEffect(
    () => () => {
      refinementController.current?.abort();
      pathRequestController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (isRefining && !isRefinementLoading) {
      composer.current?.focus();
    }
  }, [currentQuestion, isRefinementLoading, isRefining]);

  useEffect(() => {
    if (pathRequestState.status === "success") {
      mapSection.current?.scrollIntoView({ block: "start" });
    }
  }, [pathRequestState.status]);

  async function generatePaths(profileForRequest: StudentProfile) {
    if (pathSubmissionLock.current) {
      return;
    }

    pathSubmissionLock.current = true;
    pathRequestController.current?.abort();
    const controller = new AbortController();
    pathRequestController.current = controller;
    dispatchPathFlow({ type: "start" });

    try {
      let responseBody: unknown;

      if (
        process.env.NODE_ENV === "development" &&
        developmentPathFixture
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        if (controller.signal.aborted) {
          return;
        }

        if (developmentPathFixture === "success") {
          responseBody = { ok: true, branches: DEMO_PATH_BRANCHES };
        } else if (developmentPathFixture === "malformed_model_output") {
          responseBody = { ok: true, branches: DEMO_PATH_BRANCHES.slice(0, 2) };
        } else {
          responseBody = {
            ok: false,
            error: {
              code: developmentPathFixture,
              message:
                developmentPathFixture === "timeout"
                  ? "Steppi took too long to explore these roles. Your profile is safe; please try again."
                  : "Steppi could not explore roles right now. Your profile is safe; please try again.",
              retryable: true,
            },
          };
        }
      } else {
        const response = await fetch("/api/paths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pathGenerationRequest(profileForRequest)),
          signal: controller.signal,
        });
        responseBody = await response.json();
      }

      const parsedResponse = PathApiResponseSchema.safeParse(responseBody);
      if (!parsedResponse.success) {
        dispatchPathFlow({
          type: "fail",
          code: "malformed_model_output",
          message:
            "Steppi received roles it could not safely compare. Nothing was shown; please try again.",
          retryable: true,
        });
        return;
      }
      if (!parsedResponse.data.ok) {
        dispatchPathFlow({
          type: "fail",
          code: parsedResponse.data.error.code,
          message: parsedResponse.data.error.message,
          retryable: parsedResponse.data.error.retryable,
        });
        return;
      }

      let branches;
      try {
        branches = validatePathGeneration(profileForRequest, {
          branches: parsedResponse.data.branches,
        });
      } catch {
        dispatchPathFlow({
          type: "fail",
          code: "malformed_model_output",
          message:
            "Steppi received roles it could not safely compare. Nothing was shown; please try again.",
          retryable: true,
        });
        return;
      }

      dispatchPathFlow({ type: "succeed", branches });
    } catch {
      if (!controller.signal.aborted) {
        dispatchPathFlow({
          type: "fail",
          code: "api_failure",
          message:
            "Steppi could not reach the path service. Your profile is safe; please try again.",
          retryable: true,
        });
      }
    } finally {
      pathSubmissionLock.current = false;
      if (pathRequestController.current === controller) {
        pathRequestController.current = null;
      }
    }
  }

  function buildMap(profileForRequest = currentProfile) {
    if (isRefinementLoading || isPathLoading) {
      return;
    }
    refinementController.current?.abort();
    dispatchPathFlow({ type: "confirm", profile: profileForRequest });
    setView("summary");
    void generatePaths(profileForRequest);
  }

  async function requestRefinement(input: ProfileRefinementRequest) {
    if (refinementSubmissionLock.current) {
      return;
    }

    refinementSubmissionLock.current = true;
    refinementController.current?.abort();
    const controller = new AbortController();
    refinementController.current = controller;
    setRefinementRequestState({ status: "loading" });
    setPendingRefinement(input);
    refinementAttempt.current += 1;
    const attempt = refinementAttempt.current;

    try {
      let responseBody: unknown;
      if (
        process.env.NODE_ENV === "development" &&
        developmentProfileRefinementFixture
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        if (controller.signal.aborted) {
          return;
        }
        responseBody = developmentProfileRefinementPayload(
          developmentProfileRefinementFixture,
          input,
          attempt,
        );
      } else {
        const response = await fetch("/api/profile/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        responseBody = await response.json();
      }

      const parsed = ProfileRefinementApiResponseSchema.safeParse(responseBody);
      if (!parsed.success) {
        setRefinementRequestState({
          status: "error",
          message:
            "Steppi received a refinement it could not safely apply. Your current profile is unchanged; please try again.",
          retryable: true,
        });
        return;
      }
      if (!parsed.data.ok) {
        setRefinementRequestState({
          status: "error",
          message: parsed.data.error.message,
          retryable: parsed.data.error.retryable,
        });
        return;
      }

      setCurrentProfile(parsed.data.profile);
      setPendingRefinement(null);
      setRefinementRequestState({ status: "idle" });
      if (parsed.data.decision === "follow_up" && parsed.data.nextQuestion) {
        setCurrentAcknowledgement(parsed.data.acknowledgement);
        setCurrentQuestion(parsed.data.nextQuestion);
        return;
      }

      setSummaryNotice(parsed.data.acknowledgement);
      setCurrentAcknowledgement(null);
      setCurrentQuestion(PROFILE_REFINEMENT_OPENING_QUESTION);
      setView("summary");
    } catch {
      if (!controller.signal.aborted) {
        setRefinementRequestState({
          status: "error",
          message:
            "Steppi could not reach the refinement service. Your current profile and wording are safe; please try again.",
          retryable: true,
        });
      }
    } finally {
      refinementSubmissionLock.current = false;
      if (refinementController.current === controller) {
        refinementController.current = null;
      }
    }
  }

  function submitRefinement() {
    if (refinementSubmissionLock.current || isRefinementLoading) {
      return;
    }

    let nextTurns: ProfileRefinementTurn[];
    try {
      nextTurns = appendProfileRefinementTurn(
        refinementTurns,
        currentQuestion,
        composerValue,
        new Date().toISOString(),
      );
    } catch {
      setFieldError("Share at least a couple of words so Steppi can use the clarification.");
      return;
    }
    if (nextTurns === refinementTurns) {
      return;
    }

    const input = ProfileRefinementRequestSchema.parse({
      profile: currentProfile,
      turns: nextTurns,
    });
    setRefinementTurns(nextTurns);
    setComposerValue("");
    setFieldError(null);
    setCurrentAcknowledgement(null);
    void requestRefinement(input);
  }

  const summary = useMemo(() => <ProfileSummary profile={currentProfile} />, [currentProfile]);

  if (confirmedProfile && pathRequestState.status === "success") {
    return (
      <section
        className="relative left-1/2 w-[min(75rem,calc(100vw-2rem))] -translate-x-1/2 scroll-mt-6"
        ref={mapSection}
      >
        <InitialPathMap
          branches={pathRequestState.branches}
          developmentResearchFixture={developmentResearchFixture}
          profile={confirmedProfile}
        />
        <div className="mt-8 flex justify-end border-t border-border pt-6">
          <Button onClick={onRestart} variant="secondary">
            <RotateCcw />
            Restart intake
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="profile-title" className="mx-auto max-w-[54rem]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          {isRefining ? (
            <MessageCircle aria-hidden="true" className="size-4" />
          ) : (
            <Check aria-hidden="true" className="size-4" />
          )}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            {isRefining ? "Optional refinement" : "Your starting point"}
          </p>
          <h1
            className="font-display mt-1 text-balance text-[clamp(2.35rem,6vw,3.75rem)] leading-tight text-ink"
            id="profile-title"
          >
            {isRefining
              ? "Refine what Steppi understood."
              : "Here’s what Steppi understood."}
          </h1>
          <p className="mt-3 max-w-[42rem] text-sm leading-6 text-muted sm:text-base">
            {isRefining
              ? "Correct what matters or think through one uncertainty. You can build the map whenever you’re ready."
              : "This is a useful starting hypothesis, not a verdict. You can explore now or clarify something that would meaningfully change the paths."}
          </p>
        </div>
      </div>

      {summaryNotice && !isRefining ? (
        <p
          aria-live="polite"
          className="mt-7 border-s-2 border-primary bg-primary-soft/45 px-4 py-3 text-sm leading-6 text-graphite"
        >
          {summaryNotice}
        </p>
      ) : null}

      {summary}

      {isRefining ? (
        <>
          <RefinementConversation
            acknowledgement={currentAcknowledgement}
            currentQuestion={
              refinementRequestState.status === "idle" ? currentQuestion : null
            }
            turns={refinementTurns}
          />

          {isRefinementLoading ? (
            <div
              aria-live="polite"
              className="mt-5 flex items-center gap-3 text-sm text-muted"
              role="status"
            >
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary" />
              Applying only what your clarification changes…
            </div>
          ) : null}

          {refinementRequestState.status === "error" ? (
            <div
              aria-live="assertive"
              className="mt-5 border-s-2 border-error bg-surface-muted px-4 py-4"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
                <div>
                  <p className="font-semibold text-ink">That refinement was not applied.</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {refinementRequestState.message}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {refinementRequestState.retryable && pendingRefinement ? (
                      <Button
                        onClick={() => void requestRefinement(pendingRefinement)}
                        variant="secondary"
                      >
                        <RotateCcw />
                        Try this clarification again
                      </Button>
                    ) : null}
                    <Button onClick={() => buildMap()}>
                      Build my map with the current summary
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              aria-busy={isRefinementLoading}
              className="sticky bottom-3 z-10 mt-6 rounded-[var(--radius-panel)] border border-border-strong bg-[color:rgb(255_255_255_/_96%)] p-3 shadow-[var(--shadow-panel)] backdrop-blur sm:p-4"
              data-profile-refinement-composer=""
              onSubmit={(event) => {
                event.preventDefault();
                submitRefinement();
              }}
            >
              <label className="sr-only" htmlFor="profile-refinement-answer">
                {currentQuestion}
              </label>
              <div className="flex items-end gap-2">
                <textarea
                  aria-describedby={fieldError ? "profile-refinement-error" : undefined}
                  aria-invalid={Boolean(fieldError)}
                  className="max-h-52 min-h-20 min-w-0 flex-1 resize-y rounded-[var(--radius-control)] border border-transparent bg-surface-muted px-3.5 py-3 text-base leading-6 text-ink outline-none placeholder:text-faint focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)]"
                  disabled={isRefinementLoading}
                  id="profile-refinement-answer"
                  maxLength={REFINEMENT_LIMIT}
                  onChange={(event) => {
                    setComposerValue(event.target.value);
                    setFieldError(null);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key !== "Enter" ||
                      event.shiftKey ||
                      event.nativeEvent.isComposing
                    ) {
                      return;
                    }
                    event.preventDefault();
                    submitRefinement();
                  }}
                  placeholder={
                    isRefinementLoading
                      ? "Steppi is applying that…"
                      : "Say what feels off, important, or still uncertain…"
                  }
                  ref={composer}
                  value={composerValue}
                />
                <Button
                  aria-label="Send refinement"
                  className="mb-0.5 shrink-0 px-4"
                  disabled={isRefinementLoading}
                  type="submit"
                >
                  <Send aria-hidden="true" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
              <div className="mt-2 flex min-h-6 items-start justify-between gap-4 px-1">
                <p
                  className="text-sm leading-5 text-error"
                  id="profile-refinement-error"
                  role={fieldError ? "alert" : undefined}
                >
                  {fieldError}
                </p>
                <p className="shrink-0 text-xs text-muted">
                  Enter to send · Shift+Enter for a new line · {composerValue.length}/
                  {REFINEMENT_LIMIT}
                </p>
              </div>
            </form>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              disabled={isRefinementLoading || isPathLoading}
              onClick={() => {
                setView("summary");
                setRefinementRequestState({ status: "idle" });
              }}
              variant="ghost"
            >
              Return to summary
            </Button>
            {refinementRequestState.status !== "error" ? (
              <Button
                disabled={isRefinementLoading || isPathLoading}
                onClick={() => buildMap()}
                size="lg"
              >
                Build my map
                <ArrowRight />
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {pathRequestState.status === "loading" ? (
            <div
              aria-live="polite"
              className="mt-8 flex items-center gap-3 border-y border-border bg-surface-muted px-5 py-6"
              role="status"
            >
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" />
              <div>
                <p className="font-semibold text-ink">Building a varied role space…</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Steppi is using this profile without making you review every field.
                </p>
              </div>
            </div>
          ) : null}

          {pathRequestState.status === "error" ? (
            <div
              aria-live="assertive"
              className="mt-8 border-s-2 border-error bg-surface-muted px-5 py-5"
              role="alert"
            >
              <p className="font-semibold text-ink">The map is not ready yet.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {pathRequestState.message}
              </p>
              {pathRequestState.retryable && confirmedProfile ? (
                <Button
                  className="mt-4"
                  onClick={() => void generatePaths(confirmedProfile)}
                  variant="secondary"
                >
                  <RotateCcw />
                  Try map generation again
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              disabled={isPathLoading}
              onClick={() => {
                setSummaryNotice(null);
                setView("refinement");
              }}
              size="lg"
              variant="secondary"
            >
              <MessageCircle />
              Refine this first
            </Button>
            <Button disabled={isPathLoading} onClick={() => buildMap()} size="lg">
              {isPathLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
              {isPathLoading ? "Building your map…" : "Build my map"}
            </Button>
          </div>
          <p className="mt-3 text-right text-xs leading-5 text-muted">
            Refining is optional. You can return to it before building the map.
          </p>
        </>
      )}
    </section>
  );
}
