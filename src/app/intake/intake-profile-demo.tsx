"use client";

import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  ProfileConfirmation,
  type DevelopmentPathFixture,
} from "@/app/intake/profile-confirmation";
import type { DevelopmentResearchFixture } from "@/app/intake/path-branch-preview";
import { DEMO_PROFILE_FIXTURE } from "@/lib/demo-profile";
import {
  applyQuickResponse,
  buildIntakeAnswers,
  getIntakeQuestions,
  intakePhase,
  type IntakeDraft,
  type IntakeQuestion,
  type IntakeQuestionId,
  validateIntakeValue,
} from "@/lib/intake-flow";
import { ProfileApiResponseSchema } from "@/lib/profile-api";
import type { StudentProfile } from "@/lib/schemas";

type FlowStage = "questions" | "review" | "profile";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; retryable: boolean }
  | { status: "success"; profile: StudentProfile };

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
  | "research-no-sources"
  | "research-retrieval-failure"
  | "research-api-failure"
  | "research-malformed";

function getDevelopmentFixtureSnapshot(): DevelopmentFixtureMode | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const fixture = new URLSearchParams(window.location.search).get("fixture");
  return fixture === "profile" ||
    fixture === "profile-live-paths" ||
    fixture === "paths-api-failure" ||
    fixture === "paths-timeout" ||
    fixture === "paths-malformed" ||
    fixture === "research-live" ||
    fixture === "research-success" ||
    fixture === "research-no-sources" ||
    fixture === "research-retrieval-failure" ||
    fixture === "research-api-failure" ||
    fixture === "research-malformed"
    ? fixture
    : null;
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
  return undefined;
}

function ProgressIndicator({ index }: { index: number }) {
  const phase = intakePhase(index);

  return (
    <div aria-label={phase.label} className="min-w-0 flex-1">
      <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-primary">
        {phase.label}
      </p>
      <div
        aria-valuemax={3}
        aria-valuemin={1}
        aria-valuenow={phase.segment}
        className="mt-2 grid grid-cols-3 gap-1.5"
        role="progressbar"
      >
        {[1, 2, 3].map((segment) => (
          <span
            aria-hidden="true"
            className={`h-1 rounded-full ${
              segment <= phase.segment ? "bg-primary" : "bg-border"
            }`}
            key={segment}
          />
        ))}
      </div>
    </div>
  );
}

function PreviousAnswers({
  draft,
  questions,
  currentIndex,
  onEdit,
}: {
  draft: IntakeDraft;
  questions: IntakeQuestion[];
  currentIndex: number;
  onEdit: (questionId: IntakeQuestionId) => void;
}) {
  const answeredQuestions = questions
    .slice(0, currentIndex)
    .filter((question) => draft[question.id]?.trim());

  if (answeredQuestions.length === 0) {
    return null;
  }

  const list = (
    <ol className="mt-4 space-y-4">
      {answeredQuestions.map((question) => (
        <li className="border-s border-border-strong ps-3" key={question.id}>
          <button
            className="group w-full text-left outline-none focus-visible:focus-ring"
            onClick={() => onEdit(question.id)}
            type="button"
          >
            <span className="block text-xs font-semibold text-muted group-hover:text-primary">
              {question.prompt}
            </span>
            <span className="mt-1 line-clamp-2 block text-sm leading-5 text-graphite">
              {draft[question.id]}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <aside aria-label="Previous answers" className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Already shared
        </p>
        {list}
      </aside>
      <details className="mt-8 border-y border-border py-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-graphite outline-none focus-visible:focus-ring">
          Review previous answers
        </summary>
        {list}
      </details>
    </>
  );
}

function QuestionStep({
  canGoBack,
  draft,
  question,
  error,
  onBack,
  onChange,
  onNext,
}: {
  canGoBack: boolean;
  draft: IntakeDraft;
  question: IntakeQuestion;
  error: string | null;
  onBack: () => void;
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const value = draft[question.id] ?? "";
  const helpId = `${question.id}-help`;
  const errorId = `${question.id}-error`;

  useEffect(() => {
    inputRef.current?.focus();
  }, [question.id]);

  return (
    <form
      className="max-w-[43rem]"
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <p className={`eyebrow ${question.adaptive ? "text-success" : ""}`}>
        {question.label}
      </p>
      <h1 className="font-display mt-5 text-balance text-[clamp(2.45rem,6vw,4rem)] leading-[1.02] tracking-[-0.048em] text-ink">
        {question.prompt}
      </h1>
      <p className="mt-5 max-w-[40rem] text-pretty text-base leading-7 text-muted" id={helpId}>
        {question.helper}
      </p>

      {question.quickResponses ? (
        <div aria-label="Quick responses" className="mt-7 flex flex-wrap gap-2">
          {question.quickResponses.map((response) => {
            const isSelected = value
              .toLowerCase()
              .split(",")
              .map((entry) => entry.trim())
              .includes(response.toLowerCase());

            return (
              <button
                aria-pressed={isSelected}
                className="min-h-11 rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-graphite outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary"
                key={response}
                onClick={() =>
                  onChange(
                    applyQuickResponse(
                      value,
                      response,
                      question.quickResponseMode,
                    ),
                  )
                }
                type="button"
              >
                {response}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6">
        <label className="sr-only" htmlFor={question.id}>
          {question.prompt}
        </label>
        <textarea
          aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          className="min-h-36 w-full resize-y rounded-[var(--radius-control)] border border-border-strong bg-surface-muted px-4 py-3 text-base leading-7 text-ink outline-none transition-colors placeholder:text-faint focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)]"
          id={question.id}
          maxLength={800}
          onChange={(event) => onChange(event.target.value)}
          placeholder={question.placeholder}
          ref={inputRef}
          value={value}
        />
        <div className="mt-2 flex min-h-6 items-start justify-between gap-4">
          <p className="text-sm leading-6 text-error" id={errorId} role={error ? "alert" : undefined}>
            {error}
          </p>
          <p className="shrink-0 text-xs text-muted">{value.length}/800</p>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4 border-t border-border pt-6">
        <Button disabled={!canGoBack} onClick={onBack} variant="ghost">
          <ArrowLeft />
          Back
        </Button>
        <Button size="lg" type="submit">
          Continue
          <ChevronRight />
        </Button>
      </div>
    </form>
  );
}

function ReviewStep({
  draft,
  errorState,
  isLoading,
  onBack,
  onEdit,
  onGenerate,
}: {
  draft: IntakeDraft;
  errorState: Extract<RequestState, { status: "error" }> | null;
  isLoading: boolean;
  onBack: () => void;
  onEdit: (questionId: IntakeQuestionId) => void;
  onGenerate: () => void;
}) {
  const questions = getIntakeQuestions(draft);

  return (
    <section aria-labelledby="review-title" className="mx-auto max-w-[50rem]">
      <p className="eyebrow">Ready to summarize</p>
      <h1 className="font-display mt-5 text-balance text-[clamp(2.45rem,6vw,4rem)] leading-[1.02] tracking-[-0.048em] text-ink" id="review-title">
        Does this feel like a fair starting point?
      </h1>
      <p className="mt-5 max-w-[42rem] text-pretty text-base leading-7 text-muted">
        Review what you shared before Steppi builds a profile hypothesis. You can return to any answer, and nothing is saved.
      </p>

      <dl className="mt-10 border-t border-border">
        {questions.map((question) => (
          <div
            className="grid gap-3 border-b border-border py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] sm:items-start"
            key={question.id}
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.07em] text-muted">
              {question.prompt}
            </dt>
            <dd className="text-sm leading-6 text-graphite">
              {draft[question.id]}
            </dd>
            <Button
              aria-label={`Edit answer for: ${question.prompt}`}
              className="justify-self-start px-3 sm:justify-self-end"
              onClick={() => onEdit(question.id)}
              size="default"
              variant="ghost"
            >
              <Pencil />
              Edit
            </Button>
          </div>
        ))}
      </dl>

      {errorState ? (
        <section
          aria-labelledby="profile-error-title"
          className="mt-8 border-s-2 border-error bg-surface-muted px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
            <div>
              <h2 className="font-semibold text-ink" id="profile-error-title">
                The profile was not created
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {errorState.message}
              </p>
              {errorState.retryable ? (
                <Button className="mt-4" onClick={onGenerate} variant="secondary">
                  <RotateCcw />
                  Try again
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
        <Button disabled={isLoading} onClick={onBack} variant="ghost">
          <ArrowLeft />
          Back to the last question
        </Button>
        <div className="sm:text-right">
          <Button disabled={isLoading} onClick={onGenerate} size="lg">
            {isLoading ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {isLoading ? "Building a careful profile…" : "Build my profile"}
          </Button>
          <p aria-live="polite" className="mt-2 text-xs text-muted" role="status">
            {isLoading ? "This can take a few moments." : "Uses GPT-5.6 from a server-only route."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function IntakeProfileDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<IntakeDraft>({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle" });
  const [stage, setStage] = useState<FlowStage>("questions");
  const [fixtureDismissed, setFixtureDismissed] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const developmentFixtureMode = useSyncExternalStore(
    subscribeToFixtureLocation,
    getDevelopmentFixtureSnapshot,
    () => null,
  );
  const questions = getIntakeQuestions(draft);
  const currentQuestion = questions[currentIndex];
  const hasProgress = stage !== "questions" || Object.values(draft).some(Boolean);

  useEffect(
    () => () => {
      requestController.current?.abort();
    },
    [],
  );

  function changeAnswer(value: string) {
    setDraft((current) => ({ ...current, [currentQuestion.id]: value }));
    if (fieldError) {
      setFieldError(null);
    }
  }

  function nextQuestion() {
    const error = validateIntakeValue(draft[currentQuestion.id] ?? "");

    if (error) {
      setFieldError(error);
      return;
    }

    setFieldError(null);
    if (currentIndex === questions.length - 1) {
      setStage("review");
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function previousQuestion() {
    setFieldError(null);
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  }

  function editAnswer(questionId: IntakeQuestionId) {
    const index = questions.findIndex((question) => question.id === questionId);
    setCurrentIndex(index === -1 ? 0 : index);
    setFieldError(null);
    setRequestState({ status: "idle" });
    setStage("questions");
  }

  function restart() {
    requestController.current?.abort();
    requestController.current = null;
    setCurrentIndex(0);
    setDraft({});
    setFieldError(null);
    setRequestState({ status: "idle" });
    setStage("questions");
  }

  if (developmentFixtureMode && !fixtureDismissed) {
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

  async function generateProfile() {
    let answers;

    try {
      answers = buildIntakeAnswers(draft, new Date().toISOString());
    } catch {
      setRequestState({
        status: "error",
        message: "One or more answers need attention. Return to the intake and review them before trying again.",
        retryable: false,
      });
      return;
    }

    setRequestState({ status: "loading" });
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
        signal: controller.signal,
      });
      const parsedResult = ProfileApiResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsedResult.success) {
        setRequestState({
          status: "error",
          message: "Steppi received a profile it could not safely use. Nothing was shown; please try again.",
          retryable: true,
        });
        return;
      }

      if (!parsedResult.data.ok) {
        setRequestState({
          status: "error",
          message: parsedResult.data.error.message,
          retryable: parsedResult.data.error.retryable,
        });
        return;
      }

      setRequestState({ status: "success", profile: parsedResult.data.profile });
      setStage("profile");
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setRequestState({
        status: "error",
        message: "Steppi could not reach the profile service. Your answers are safe on this page; please try again.",
        retryable: true,
      });
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-[64rem]">
      {stage !== "profile" ? (
        <div className="mb-12 flex items-center justify-between gap-6 border-b border-border pb-5">
          <ProgressIndicator
            index={stage === "review" ? questions.length - 1 : currentIndex}
          />
          {hasProgress ? (
            <Button className="shrink-0 px-3" onClick={restart} variant="ghost">
              <RotateCcw />
              <span className="hidden sm:inline">Start over</span>
            </Button>
          ) : null}
        </div>
      ) : null}

      {stage === "questions" ? (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,43rem)_minmax(11rem,15rem)] lg:justify-between">
          <QuestionStep
            canGoBack={currentIndex > 0}
            draft={draft}
            error={fieldError}
            onBack={previousQuestion}
            onChange={changeAnswer}
            onNext={nextQuestion}
            question={currentQuestion}
          />
          <PreviousAnswers
            currentIndex={currentIndex}
            draft={draft}
            onEdit={editAnswer}
            questions={questions}
          />
        </div>
      ) : null}

      {stage === "review" ? (
        <ReviewStep
          draft={draft}
          errorState={requestState.status === "error" ? requestState : null}
          isLoading={requestState.status === "loading"}
          onBack={() => {
            setCurrentIndex(questions.length - 1);
            setRequestState({ status: "idle" });
            setStage("questions");
          }}
          onEdit={editAnswer}
          onGenerate={generateProfile}
        />
      ) : null}

      {stage === "profile" && requestState.status === "success" ? (
        <ProfileConfirmation onRestart={restart} profile={requestState.profile} />
      ) : null}
    </div>
  );
}
