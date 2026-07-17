"use client";

import {
  AlertCircle,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  ProfileConfirmation,
  type DevelopmentPathFixture,
} from "@/app/intake/profile-confirmation";
import type { DevelopmentResearchFixture } from "@/app/intake/path-branch-preview";
import { Button } from "@/components/ui/button";
import {
  developmentIntakeTurnPayload,
  type DevelopmentIntakeFixture,
} from "@/lib/demo-intake-conversation";
import { DEMO_PROFILE_FIXTURE } from "@/lib/demo-profile";
import {
  EMPTY_CONVERSATION_STATE,
  IntakeTurnApiResponseSchema,
  applyConversationPatch,
  fallbackConversationQuestion,
  questionFromPatch,
  type ConversationQuestion,
  type ConversationState,
  type ConversationTurn,
} from "@/lib/intake-conversation";
import {
  appendConversationTurn,
  buildConversationIntakeAnswers,
  canStartRequest,
  conversationOrientation,
  firstConversationQuestion,
  reviseConversationTurn,
  stateBeforeRevision,
  validateConversationAnswer,
} from "@/lib/intake-flow";
import { ProfileApiResponseSchema } from "@/lib/profile-api";
import type { StudentProfile } from "@/lib/schemas";

type FlowStage = "conversation" | "profile";

type ProfileRequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; retryable: boolean }
  | { status: "success"; profile: StudentProfile };

type TurnRequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; retryable: boolean };

type InterpretationInput = {
  turns: ConversationTurn[];
  baseState: ConversationState;
  priorCheckpoints: ConversationState[];
};

function subscribeToFixtureLocation() {
  return () => undefined;
}

type DevelopmentFixtureMode =
  | "profile"
  | "profile-live-paths"
  | "paths-api-failure"
  | "paths-timeout"
  | "paths-malformed"
  | "research-live"
  | "research-success"
  | "research-partial-success"
  | "research-no-sources"
  | "research-retrieval-failure"
  | "research-api-failure"
  | "research-malformed"
  | "research-cancel"
  | "research-timeout"
  | DevelopmentIntakeFixture;

function getDevelopmentFixtureSnapshot(): DevelopmentFixtureMode | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const fixture = new URLSearchParams(window.location.search).get("fixture");
  const fixtures: DevelopmentFixtureMode[] = [
    "profile",
    "profile-live-paths",
    "paths-api-failure",
    "paths-timeout",
    "paths-malformed",
    "research-live",
    "research-success",
    "research-partial-success",
    "research-no-sources",
    "research-retrieval-failure",
    "research-api-failure",
    "research-malformed",
    "research-cancel",
    "research-timeout",
    "intake-success",
    "intake-alternate",
    "intake-uncertain",
    "intake-retry",
    "intake-malformed",
  ];

  return fixtures.includes(fixture as DevelopmentFixtureMode)
    ? (fixture as DevelopmentFixtureMode)
    : null;
}

function isIntakeFixture(
  fixture: DevelopmentFixtureMode | null,
): fixture is DevelopmentIntakeFixture {
  return fixture?.startsWith("intake-") ?? false;
}

function pathFixtureFor(
  fixture: DevelopmentFixtureMode,
): DevelopmentPathFixture | undefined {
  if (fixture === "profile-live-paths") {
    return undefined;
  }
  if (fixture === "paths-api-failure") {
    return "api_failure";
  }
  if (fixture === "paths-timeout") {
    return "timeout";
  }
  if (fixture === "paths-malformed") {
    return "malformed_model_output";
  }

  return "success";
}

function researchFixtureFor(
  fixture: DevelopmentFixtureMode,
): DevelopmentResearchFixture | undefined {
  if (fixture === "research-success") {
    return "success";
  }
  if (fixture === "research-partial-success") {
    return "partial_success";
  }
  if (fixture === "research-no-sources") {
    return "no_useful_sources";
  }
  if (fixture === "research-retrieval-failure") {
    return "retrieval_failure";
  }
  if (fixture === "research-api-failure") {
    return "api_failure";
  }
  if (fixture === "research-malformed") {
    return "malformed_model_output";
  }
  if (fixture === "research-timeout") {
    return "polling_timeout";
  }
  if (fixture === "research-cancel") {
    return "polling_cancel";
  }
  return undefined;
}

function SteppiMessage({
  acknowledgement,
  children,
}: {
  acknowledgement?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:gap-4">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full border border-primary bg-primary-soft font-display text-base font-semibold text-primary"
      >
        S
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          Steppi
        </p>
        {acknowledgement ? (
          <p className="mt-2 text-sm leading-6 text-muted">{acknowledgement}</p>
        ) : null}
        <div className="mt-1 text-pretty text-[1.05rem] leading-7 text-ink sm:text-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

function ConversationTranscript({
  completionAcknowledgement,
  currentQuestion,
  editingIndex,
  loadingKind,
  onRevise,
  turns,
}: {
  completionAcknowledgement: string | null;
  currentQuestion: ConversationQuestion | null;
  editingIndex: number | null;
  loadingKind: "turn" | "profile" | null;
  onRevise: (index: number) => void;
  turns: ConversationTurn[];
}) {
  return (
    <section
      aria-label="Conversation with Steppi"
      aria-live="polite"
      className="space-y-9"
      data-conversation-transcript=""
    >
      {turns.map((turn, index) => (
        <div className="space-y-4" key={`${turn.id}-${turn.answeredAt}`}>
          <SteppiMessage acknowledgement={turn.acknowledgement}>
            {turn.question}
          </SteppiMessage>
          <div className="flex justify-end pl-10 sm:pl-20">
            <div
              className={`max-w-[38rem] rounded-[1.1rem_1.1rem_0.25rem_1.1rem] border px-4 py-3 sm:px-5 ${
                editingIndex === index
                  ? "border-primary bg-primary-soft ring-[3px] ring-[color:var(--color-focus)]"
                  : editingIndex !== null && index > editingIndex
                    ? "border-border bg-surface-muted opacity-45"
                    : "border-border-strong bg-surface"
              }`}
              data-student-turn={turn.id}
            >
              <p className="whitespace-pre-wrap break-words text-[0.98rem] leading-7 text-graphite">
                {turn.answer}
              </p>
              <button
                className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-muted outline-none hover:text-primary focus-visible:focus-ring disabled:opacity-40"
                disabled={loadingKind !== null}
                onClick={() => onRevise(index)}
                type="button"
              >
                <Pencil aria-hidden="true" className="size-3.5" />
                Revise this answer
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingIndex === null && currentQuestion ? (
        <SteppiMessage acknowledgement={currentQuestion.acknowledgement}>
          {currentQuestion.prompt}
        </SteppiMessage>
      ) : null}

      {loadingKind ? (
        <SteppiMessage
          acknowledgement={
            loadingKind === "profile" ? completionAcknowledgement : null
          }
        >
          <span className="inline-flex items-center gap-2">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary" />
            {loadingKind === "turn"
              ? "Taking that in…"
              : "Building what I understood…"}
          </span>
        </SteppiMessage>
      ) : null}
    </section>
  );
}

function ConversationComposer({
  editingIndex,
  error,
  isLoading,
  onCancelRevision,
  onChange,
  onSubmit,
  question,
  value,
}: {
  editingIndex: number | null;
  error: string | null;
  isLoading: boolean;
  onCancelRevision: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  question: ConversationQuestion | null;
  value: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [editingIndex, isLoading, question?.id]);

  if (isLoading || (!question && editingIndex === null)) {
    return null;
  }

  return (
    <form
      className="sticky bottom-3 z-10 mt-10 rounded-[var(--radius-panel)] border border-border-strong bg-[color:rgb(255_255_255_/_96%)] p-3 shadow-[var(--shadow-panel)] backdrop-blur sm:p-4"
      data-conversation-composer=""
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {editingIndex !== null ? (
        <div className="mb-3 flex flex-col gap-2 border-b border-border pb-3 text-sm leading-6 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Revising this answer will remove the later conversation so Steppi can adjust.
          </p>
          <Button className="shrink-0 px-3" onClick={onCancelRevision} variant="ghost">
            Keep original
          </Button>
        </div>
      ) : null}

      {question?.quickResponses && editingIndex === null ? (
        <div aria-label="Optional quick replies" className="mb-3 flex flex-wrap gap-2">
          {question.quickResponses.map((response) => (
            <button
              className="min-h-9 rounded-full border border-border-strong bg-surface px-3 text-xs font-semibold text-graphite outline-none hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)]"
              key={response}
              onClick={() => onChange(response)}
              type="button"
            >
              {response}
            </button>
          ))}
        </div>
      ) : null}

      <label className="sr-only" htmlFor="conversation-answer">
        {editingIndex !== null ? "Revised answer" : question?.prompt}
      </label>
      <div className="flex items-end gap-2">
        <textarea
          aria-describedby={error ? "conversation-answer-error" : undefined}
          aria-invalid={Boolean(error)}
          className="max-h-52 min-h-20 min-w-0 flex-1 resize-y rounded-[var(--radius-control)] border border-transparent bg-surface-muted px-3.5 py-3 text-base leading-6 text-ink outline-none placeholder:text-faint focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)]"
          id="conversation-answer"
          maxLength={800}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) {
              return;
            }
            if (event.shiftKey) {
              return;
            }
            event.preventDefault();
            onSubmit();
          }}
          placeholder={
            editingIndex !== null
              ? "Update what you want Steppi to use…"
              : question?.placeholder
          }
          ref={inputRef}
          value={value}
        />
        <Button
          aria-label={editingIndex !== null ? "Save revised answer" : "Send answer"}
          className="mb-0.5 shrink-0 px-4"
          type="submit"
        >
          <Send aria-hidden="true" />
          <span className="hidden sm:inline">
            {editingIndex !== null ? "Save revision" : "Send"}
          </span>
        </Button>
      </div>
      <div className="mt-2 flex min-h-6 items-start justify-between gap-4 px-1">
        <p
          className="text-sm leading-5 text-error"
          id="conversation-answer-error"
          role={error ? "alert" : undefined}
        >
          {error}
        </p>
        <p className="shrink-0 text-xs text-muted">
          Enter to send · Shift+Enter for a new line · {value.length}/800
        </p>
      </div>
    </form>
  );
}

export function IntakeProfileDemo() {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(
    EMPTY_CONVERSATION_STATE,
  );
  const [checkpoints, setCheckpoints] = useState<ConversationState[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<ConversationQuestion | null>(firstConversationQuestion());
  const [completionAcknowledgement, setCompletionAcknowledgement] = useState<
    string | null
  >(null);
  const [composerValue, setComposerValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [turnRequestState, setTurnRequestState] = useState<TurnRequestState>({
    status: "idle",
  });
  const [profileRequestState, setProfileRequestState] =
    useState<ProfileRequestState>({ status: "idle" });
  const [stage, setStage] = useState<FlowStage>("conversation");
  const [fixtureDismissed, setFixtureDismissed] = useState(false);
  const [turnAttemptCount, setTurnAttemptCount] = useState(0);
  const [profileAttemptCount, setProfileAttemptCount] = useState(0);
  const [lastInterpretationInput, setLastInterpretationInput] =
    useState<InterpretationInput | null>(null);
  const turnRequestController = useRef<AbortController | null>(null);
  const profileRequestController = useRef<AbortController | null>(null);
  const messageSubmissionLock = useRef(false);
  const turnSubmissionLock = useRef(false);
  const profileSubmissionLock = useRef(false);
  const turnAttemptRef = useRef(0);
  const profileAttemptRef = useRef(0);
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const developmentFixtureMode = useSyncExternalStore(
    subscribeToFixtureLocation,
    getDevelopmentFixtureSnapshot,
    () => null,
  );
  const isTurnLoading = turnRequestState.status === "loading";
  const isProfileLoading = profileRequestState.status === "loading";
  const isLoading = isTurnLoading || isProfileLoading;
  const hasProgress = turns.length > 0;

  useEffect(
    () => () => {
      turnRequestController.current?.abort();
      profileRequestController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: "nearest" });
  }, [currentQuestion, editingIndex, profileRequestState.status, turnRequestState.status, turns]);

  function restart() {
    turnRequestController.current?.abort();
    profileRequestController.current?.abort();
    turnRequestController.current = null;
    profileRequestController.current = null;
    messageSubmissionLock.current = false;
    turnSubmissionLock.current = false;
    profileSubmissionLock.current = false;
    turnAttemptRef.current = 0;
    profileAttemptRef.current = 0;
    setTurns([]);
    setConversationState(EMPTY_CONVERSATION_STATE);
    setCheckpoints([]);
    setCurrentQuestion(firstConversationQuestion());
    setCompletionAcknowledgement(null);
    setComposerValue("");
    setFieldError(null);
    setEditingIndex(null);
    setTurnRequestState({ status: "idle" });
    setProfileRequestState({ status: "idle" });
    setTurnAttemptCount(0);
    setProfileAttemptCount(0);
    setLastInterpretationInput(null);
    setStage("conversation");
  }

  if (
    developmentFixtureMode &&
    !isIntakeFixture(developmentFixtureMode) &&
    !fixtureDismissed
  ) {
    return (
      <div className="mx-auto w-full max-w-[64rem]">
        <ProfileConfirmation
          developmentPathFixture={pathFixtureFor(developmentFixtureMode)}
          developmentResearchFixture={researchFixtureFor(developmentFixtureMode)}
          onRestart={() => {
            setFixtureDismissed(true);
            restart();
          }}
          profile={DEMO_PROFILE_FIXTURE}
        />
      </div>
    );
  }

  async function generateProfile(conversationTurns: ConversationTurn[]) {
    if (
      profileSubmissionLock.current ||
      !canStartRequest(
        profileRequestState.status === "success"
          ? "idle"
          : profileRequestState.status,
      )
    ) {
      return;
    }

    let answers;
    try {
      answers = buildConversationIntakeAnswers(conversationTurns);
    } catch {
      setProfileRequestState({
        status: "error",
        message:
          "One or more answers need attention. Revise the conversation before trying again.",
        retryable: false,
      });
      return;
    }

    profileSubmissionLock.current = true;
    setProfileRequestState({ status: "loading" });
    profileRequestController.current?.abort();
    const controller = new AbortController();
    profileRequestController.current = controller;
    profileAttemptRef.current += 1;
    const attempt = profileAttemptRef.current;
    setProfileAttemptCount(attempt);

    try {
      let payload: unknown;

      if (isIntakeFixture(developmentFixtureMode)) {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
        if (controller.signal.aborted) {
          return;
        }
        payload = { ok: true, profile: DEMO_PROFILE_FIXTURE };
      } else {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
          signal: controller.signal,
        });
        payload = await response.json();
      }

      const parsedResult = ProfileApiResponseSchema.safeParse(payload);
      if (!parsedResult.success) {
        setProfileRequestState({
          status: "error",
          message:
            "Steppi received a profile it could not safely use. Nothing was shown; please try again.",
          retryable: true,
        });
        return;
      }

      if (!parsedResult.data.ok) {
        setProfileRequestState({
          status: "error",
          message: parsedResult.data.error.message,
          retryable: parsedResult.data.error.retryable,
        });
        return;
      }

      setProfileRequestState({
        status: "success",
        profile: parsedResult.data.profile,
      });
      setStage("profile");
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setProfileRequestState({
        status: "error",
        message:
          "Steppi could not reach the profile service. Your conversation is safe on this page; please try again.",
        retryable: true,
      });
    } finally {
      profileSubmissionLock.current = false;
      if (profileRequestController.current === controller) {
        profileRequestController.current = null;
      }
    }
  }

  function showSafeFallback(
    input: InterpretationInput,
    message: string,
    retryable: boolean,
  ) {
    setConversationState(input.baseState);
    setCheckpoints([...input.priorCheckpoints, input.baseState]);
    setCurrentQuestion(fallbackConversationQuestion(input.turns.length));
    setCompletionAcknowledgement(null);
    setTurnRequestState({ status: "error", message, retryable });
  }

  async function interpretConversation(input: InterpretationInput) {
    if (turnSubmissionLock.current) {
      return;
    }

    turnSubmissionLock.current = true;
    setLastInterpretationInput(input);
    setTurnRequestState({ status: "loading" });
    setProfileRequestState({ status: "idle" });
    setCurrentQuestion(null);
    turnRequestController.current?.abort();
    const controller = new AbortController();
    turnRequestController.current = controller;
    turnAttemptRef.current += 1;
    const attempt = turnAttemptRef.current;
    setTurnAttemptCount(attempt);

    try {
      let payload: unknown;

      if (isIntakeFixture(developmentFixtureMode)) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        if (controller.signal.aborted) {
          return;
        }
        payload = developmentIntakeTurnPayload({
          fixture: developmentFixtureMode,
          state: input.baseState,
          turns: input.turns,
          attempt,
        });
      } else {
        const response = await fetch("/api/intake/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: input.baseState,
            turns: input.turns,
          }),
          signal: controller.signal,
        });
        payload = await response.json();
      }

      const parsedResult = IntakeTurnApiResponseSchema.safeParse(payload);
      if (!parsedResult.success) {
        showSafeFallback(
          input,
          "Steppi could not safely use that interpretation. Your original answer is still here.",
          true,
        );
        return;
      }

      if (!parsedResult.data.ok) {
        showSafeFallback(
          input,
          parsedResult.data.error.message,
          parsedResult.data.error.retryable,
        );
        return;
      }

      let nextState: ConversationState;
      try {
        nextState = applyConversationPatch(
          input.baseState,
          parsedResult.data.patch,
          input.turns,
        );
      } catch {
        showSafeFallback(
          input,
          "Steppi could not safely use that interpretation. Your original answer is still here.",
          true,
        );
        return;
      }

      setConversationState(nextState);
      setCheckpoints([...input.priorCheckpoints, nextState]);
      setTurnRequestState({ status: "idle" });
      setCompletionAcknowledgement(parsedResult.data.patch.acknowledgement);

      const nextQuestion = questionFromPatch(
        parsedResult.data.patch,
        input.turns.length,
      );
      setCurrentQuestion(nextQuestion);

      if (nextState.enoughContext) {
        void generateProfile(input.turns);
      }
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      showSafeFallback(
        input,
        "Steppi could not reach the conversation service. Your answer is still here.",
        true,
      );
    } finally {
      turnSubmissionLock.current = false;
      if (turnRequestController.current === controller) {
        turnRequestController.current = null;
      }
    }
  }

  function submitAnswer() {
    if (messageSubmissionLock.current || isLoading) {
      return;
    }

    const error = validateConversationAnswer(composerValue);
    if (error) {
      setFieldError(error);
      return;
    }

    messageSubmissionLock.current = true;
    const answeredAt = new Date().toISOString();
    let nextTurns: ConversationTurn[];
    let baseState = conversationState;
    let priorCheckpoints = checkpoints;

    try {
      if (editingIndex !== null) {
        nextTurns = reviseConversationTurn(
          turns,
          editingIndex,
          composerValue,
          answeredAt,
        );
        baseState = stateBeforeRevision(
          checkpoints,
          editingIndex,
          EMPTY_CONVERSATION_STATE,
        );
        priorCheckpoints = checkpoints.slice(0, editingIndex);
      } else if (currentQuestion) {
        nextTurns = appendConversationTurn(
          turns,
          currentQuestion,
          composerValue,
          answeredAt,
        );
      } else {
        messageSubmissionLock.current = false;
        return;
      }
    } catch (submitError) {
      setFieldError(
        submitError instanceof Error
          ? submitError.message
          : "Steppi could not use that answer.",
      );
      messageSubmissionLock.current = false;
      return;
    }

    const input = { turns: nextTurns, baseState, priorCheckpoints };
    setTurns(nextTurns);
    setConversationState(baseState);
    setCheckpoints(priorCheckpoints);
    setComposerValue("");
    setFieldError(null);
    setEditingIndex(null);
    setTurnRequestState({ status: "idle" });
    setProfileRequestState({ status: "idle" });
    setCompletionAcknowledgement(null);
    void interpretConversation(input);

    window.setTimeout(() => {
      messageSubmissionLock.current = false;
    }, 0);
  }

  function beginRevision(index: number) {
    const turn = turns[index];
    if (!turn || isLoading) {
      return;
    }

    setEditingIndex(index);
    setComposerValue(turn.answer);
    setFieldError(null);
    setTurnRequestState({ status: "idle" });
    setProfileRequestState({ status: "idle" });
  }

  if (stage === "profile" && profileRequestState.status === "success") {
    return (
      <div className="mx-auto w-full max-w-[64rem]">
        <ProfileConfirmation
          developmentPathFixture={
            isIntakeFixture(developmentFixtureMode) ? "success" : undefined
          }
          onRestart={restart}
          profile={profileRequestState.profile}
        />
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[54rem]"
      data-profile-attempt-count={profileAttemptCount}
      data-turn-attempt-count={turnAttemptCount}
    >
      <header className="mb-10 flex items-start justify-between gap-6 border-b border-border pb-5 sm:mb-14">
        <div>
          <p className="eyebrow">A conversation, not an assessment</p>
          <h1 className="font-display mt-4 max-w-[36rem] text-balance text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.03] tracking-[-0.045em] text-ink">
            Tell Steppi what you’re working through.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted" role="status">
            {conversationOrientation({
              enoughContext: conversationState.enoughContext,
              isInterpreting: isTurnLoading,
              turnCount: turns.length,
            })}
          </p>
        </div>
        {hasProgress ? (
          <Button
            aria-label="Start over"
            className="shrink-0 px-3"
            disabled={isLoading}
            onClick={restart}
            variant="ghost"
          >
            <RotateCcw aria-hidden="true" />
            <span className="hidden sm:inline">Start over</span>
          </Button>
        ) : null}
      </header>

      <ConversationTranscript
        completionAcknowledgement={completionAcknowledgement}
        currentQuestion={currentQuestion}
        editingIndex={editingIndex}
        loadingKind={
          isTurnLoading ? "turn" : isProfileLoading ? "profile" : null
        }
        onRevise={beginRevision}
        turns={turns}
      />

      {turnRequestState.status === "error" ? (
        <section
          aria-labelledby="turn-error-title"
          className="mt-10 border-s-2 border-border-strong bg-surface-muted px-5 py-4"
          data-turn-error=""
        >
          <h2 className="font-semibold text-ink" id="turn-error-title">
            Your answer is still in the conversation
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {turnRequestState.message} Steppi has offered a simple fallback question below.
          </p>
          {turnRequestState.retryable && lastInterpretationInput ? (
            <Button
              className="mt-4"
              onClick={() => void interpretConversation(lastInterpretationInput)}
              variant="secondary"
            >
              <RotateCcw aria-hidden="true" />
              Try interpreting that answer again
            </Button>
          ) : null}
        </section>
      ) : null}

      {profileRequestState.status === "error" ? (
        <section
          aria-labelledby="profile-error-title"
          className="mt-10 border-s-2 border-error bg-surface-muted px-5 py-4"
          data-profile-error=""
        >
          <div className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
            <div>
              <h2 className="font-semibold text-ink" id="profile-error-title">
                The profile was not created
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {profileRequestState.message}
              </p>
              {profileRequestState.retryable ? (
                <Button
                  className="mt-4"
                  onClick={() => void generateProfile(turns)}
                  variant="secondary"
                >
                  <RotateCcw aria-hidden="true" />
                  Try again with this conversation
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <ConversationComposer
        editingIndex={editingIndex}
        error={fieldError}
        isLoading={isLoading}
        onCancelRevision={() => {
          setEditingIndex(null);
          setComposerValue("");
          setFieldError(null);
        }}
        onChange={(value) => {
          setComposerValue(value);
          if (fieldError) {
            setFieldError(null);
          }
        }}
        onSubmit={submitAnswer}
        question={currentQuestion}
        value={composerValue}
      />
      <div aria-hidden="true" className="h-1" ref={transcriptEnd} />
    </div>
  );
}
