"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  LoaderCircle,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import {
  InitialPathMap,
  type DevelopmentConversationFixture,
} from "@/app/intake/path-branch-preview";
import { Button } from "@/components/ui/button";
import { DEMO_PATH_BRANCHES, DEMO_PATH_BRANCHES_MAX } from "@/lib/demo-paths";
import { PathApiResponseSchema } from "@/lib/path-api";
import { pathFlowReducer } from "@/lib/path-flow";
import { validatePathGeneration } from "@/lib/path-validation";
import {
  ConfirmedSummarySchema,
  ConfirmationSummarySchema,
  type StudentProfile,
} from "@/lib/schemas";

const SUMMARY_LIMIT = 1_200;

export type DevelopmentPathFixture =
  | "success"
  | "success_12"
  | "success_15"
  | "api_failure"
  | "timeout"
  | "malformed_model_output";

export function pathGenerationRequest(
  profile: StudentProfile,
  confirmedSummary: string,
) {
  return {
    profile,
    confirmedSummary: ConfirmedSummarySchema.parse(confirmedSummary),
  };
}

function DetailList({
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
      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
        {title}
      </h3>
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

export function ProfileDetails({ profile }: { profile: StudentProfile }) {
  return (
    <details
      className="group mt-7 border-y border-border"
      data-profile-details=""
    >
      <summary
        className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-graphite outline-none marker:content-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] [&::-webkit-details-marker]:hidden"
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          event.preventDefault();
          const details = event.currentTarget.parentElement;
          if (details instanceof HTMLDetailsElement) {
            details.open = !details.open;
          }
        }}
      >
        See the details Steppi is using
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="grid gap-7 border-t border-border py-6 sm:grid-cols-2 sm:gap-x-10">
        <DetailList
          empty="No direct detail was recorded here."
          items={profile.facts.map((fact) => fact.statement)}
          title="What you shared"
        />
        <DetailList
          empty="Steppi is keeping its interpretation open."
          items={profile.inferences.map(
            (inference) => `${inference.statement} ${inference.rationale}`,
          )}
          title="Steppi’s tentative read"
        />
        <DetailList
          empty="No practical consideration surfaced clearly."
          items={profile.constraints.map((constraint) => constraint.statement)}
          title="Practical considerations"
        />
        <DetailList
          empty="There is enough context to explore without forcing an answer."
          items={[
            ...profile.uncertainties.map((uncertainty) => uncertainty.question),
            ...profile.tensions.map((tension) => tension.description),
          ]}
          title="What can stay open"
        />
      </div>
    </details>
  );
}

export function ProfileConfirmation({
  confirmationSummary,
  developmentConversationFixture,
  developmentPathFixture,
  onRestart,
  profile,
}: {
  confirmationSummary: string;
  developmentConversationFixture?: DevelopmentConversationFixture;
  developmentPathFixture?: DevelopmentPathFixture;
  onRestart: () => void;
  profile: StudentProfile;
}) {
  const validatedInitialSummary = ConfirmationSummarySchema.parse(
    confirmationSummary,
  );
  const [confirmedSummary, setConfirmedSummary] = useState(
    validatedInitialSummary,
  );
  const [draftSummary, setDraftSummary] = useState(validatedInitialSummary);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);
  const [pathFlow, dispatchPathFlow] = useReducer(pathFlowReducer, null);
  const pathRequestController = useRef<AbortController | null>(null);
  const pathSubmissionLock = useRef(false);
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const refineButton = useRef<HTMLButtonElement | null>(null);
  const mapSection = useRef<HTMLElement | null>(null);

  const confirmedProfile = pathFlow?.confirmedProfile ?? null;
  const pathRequestState = pathFlow?.request ?? { status: "idle" as const };
  const isPathLoading = pathRequestState.status === "loading";

  useEffect(
    () => () => {
      pathRequestController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (isEditing) {
      editor.current?.focus();
      editor.current?.setSelectionRange(
        editor.current.value.length,
        editor.current.value.length,
      );
    }
  }, [isEditing]);

  useEffect(() => {
    if (pathRequestState.status === "success") {
      mapSection.current?.scrollIntoView({ block: "start" });
    }
  }, [pathRequestState.status]);

  async function generatePaths(
    profileForRequest: StudentProfile,
    summaryForRequest: string,
  ) {
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

      if (process.env.NODE_ENV === "development" && developmentPathFixture) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        if (controller.signal.aborted) {
          return;
        }

        if (
          developmentPathFixture === "success" ||
          developmentPathFixture === "success_12" ||
          developmentPathFixture === "success_15"
        ) {
          responseBody = {
            ok: true,
            branches:
              developmentPathFixture === "success_12"
                ? DEMO_PATH_BRANCHES.slice(0, 12)
                : developmentPathFixture === "success_15"
                  ? DEMO_PATH_BRANCHES_MAX
                  : DEMO_PATH_BRANCHES,
          };
        } else if (developmentPathFixture === "malformed_model_output") {
          responseBody = { ok: true, branches: DEMO_PATH_BRANCHES.slice(0, 2) };
        } else {
          responseBody = {
            ok: false,
            error: {
              code: developmentPathFixture,
              message:
                developmentPathFixture === "timeout"
                  ? "Steppi tried three times but took too long to explore these roles. Your profile is safe; please try again."
                  : "Steppi could not explore roles after up to three attempts. Your profile is safe; please try again.",
              retryable: true,
            },
          };
        }
      } else {
        const response = await fetch("/api/paths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            pathGenerationRequest(profileForRequest, summaryForRequest),
          ),
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
            "Steppi could not reach the role service. Your profile is safe; please try again.",
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

  function openEditor() {
    if (isPathLoading) {
      return;
    }
    setDraftSummary(confirmedSummary);
    setFieldError(null);
    setSummaryNotice(null);
    setIsEditing(true);
  }

  function saveRefinement() {
    const parsed = ConfirmedSummarySchema.safeParse(draftSummary);
    if (!parsed.success) {
      setFieldError("Add the correction or context you want Steppi to carry forward.");
      return;
    }

    setConfirmedSummary(parsed.data);
    setDraftSummary(parsed.data);
    setFieldError(null);
    setSummaryNotice("Your wording will guide the role space.");
    setIsEditing(false);
    window.setTimeout(() => refineButton.current?.focus(), 0);
  }

  function continueToRoles() {
    if (isPathLoading) {
      return;
    }
    dispatchPathFlow({ type: "confirm", profile });
    setIsEditing(false);
    void generatePaths(profile, confirmedSummary);
  }

  if (confirmedProfile && pathRequestState.status === "success") {
    return (
      <section
        className="relative left-1/2 w-[min(75rem,calc(100vw-2rem))] -translate-x-1/2 scroll-mt-6"
        ref={mapSection}
      >
        <InitialPathMap
          branches={pathRequestState.branches}
          confirmedSummary={confirmedSummary}
          developmentConversationFixture={developmentConversationFixture}
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
    <section aria-labelledby="profile-title" className="mx-auto max-w-[56rem]">
      <header className="border-b border-border pb-6 sm:pb-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Check aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
              Before we open your role space
            </p>
            <h1
              className="font-display mt-2 text-balance text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.04] text-ink"
              id="profile-title"
            >
              Here’s what Steppi heard.
            </h1>
            <p className="mt-3 max-w-[38rem] text-sm leading-6 text-muted sm:text-base">
              A short reflection, not a verdict. Keep it, rewrite it in your own words, or check the details behind it.
            </p>
          </div>
        </div>
      </header>

      <div className="pt-7 sm:pt-9" data-profile-confirmation="">
        {isEditing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveRefinement();
            }}
          >
            <label
              className="text-sm font-semibold text-ink"
              htmlFor="confirmed-summary"
            >
              Put this in your own words
            </label>
            <p className="mt-1 text-sm leading-6 text-muted">
              Correct anything that feels off or add context Steppi should prioritize.
            </p>
            <textarea
              aria-describedby={fieldError ? "confirmed-summary-error" : undefined}
              aria-invalid={Boolean(fieldError)}
              className="mt-4 min-h-40 w-full resize-y rounded-[var(--radius-control)] border border-border-strong bg-surface px-4 py-4 text-base leading-7 text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)] sm:text-lg"
              id="confirmed-summary"
              maxLength={SUMMARY_LIMIT}
              onChange={(event) => {
                setDraftSummary(event.target.value);
                setFieldError(null);
              }}
              ref={editor}
              value={draftSummary}
            />
            <div className="mt-2 flex min-h-6 items-start justify-between gap-4">
              <p
                className="text-sm leading-5 text-error"
                id="confirmed-summary-error"
                role={fieldError ? "alert" : undefined}
              >
                {fieldError}
              </p>
              <p className="shrink-0 text-xs text-muted">
                {draftSummary.length}/{SUMMARY_LIMIT}
              </p>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  event.preventDefault();
                  setDraftSummary(confirmedSummary);
                  setFieldError(null);
                  setIsEditing(false);
                  window.setTimeout(() => refineButton.current?.focus(), 0);
                }}
                onClick={() => {
                  setDraftSummary(confirmedSummary);
                  setFieldError(null);
                  setIsEditing(false);
                  window.setTimeout(() => refineButton.current?.focus(), 0);
                }}
                type="button"
                variant="ghost"
              >
                Keep current wording
              </Button>
              <Button
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  event.preventDefault();
                  saveRefinement();
                }}
                type="submit"
              >
                <Check />
                Save refinement
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p
              className="max-w-[55rem] font-display text-[clamp(1.4rem,2.8vw,2.5rem)] leading-[1.35] text-ink"
              data-confirmed-summary=""
            >
              {confirmedSummary}
            </p>
            {summaryNotice ? (
              <p
                aria-live="polite"
                className="mt-4 border-s-2 border-primary ps-3 text-sm leading-6 text-muted"
              >
                {summaryNotice}
              </p>
            ) : null}
          </>
        )}

        {!isEditing ? (
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              disabled={isPathLoading}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }
                event.preventDefault();
                openEditor();
              }}
              onClick={openEditor}
              ref={refineButton}
              size="lg"
              variant="secondary"
            >
              <Pencil />
              Let me refine this
            </Button>
            <Button
              disabled={isPathLoading}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }
                event.preventDefault();
                continueToRoles();
              }}
              onClick={continueToRoles}
              size="lg"
            >
              {isPathLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
              {isPathLoading ? "Opening your role space…" : "Good to go!"}
            </Button>
          </div>
        ) : null}

        <ProfileDetails profile={profile} />

        {pathRequestState.status === "loading" ? (
          <div
            aria-live="polite"
            className="mt-7 flex items-center gap-3 border-s-2 border-primary bg-primary-soft/35 px-4 py-4"
            role="status"
          >
            <LoaderCircle
              aria-hidden="true"
              className="size-5 shrink-0 animate-spin text-primary"
            />
            <div>
              <p className="font-semibold text-ink">Opening a varied role space…</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Steppi is using your full profile and approved wording. It may try
                up to three times, stopping as soon as one complete role set is ready.
              </p>
            </div>
          </div>
        ) : null}

        {pathRequestState.status === "error" ? (
          <div
            aria-live="assertive"
            className="mt-7 border-s-2 border-error bg-surface-muted px-5 py-5"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-error"
              />
              <div>
                <p className="font-semibold text-ink">The role space is not ready yet.</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {pathRequestState.message}
                </p>
                {pathRequestState.retryable && confirmedProfile ? (
                  <Button
                    className="mt-4"
                    onClick={() =>
                      void generatePaths(confirmedProfile, confirmedSummary)
                    }
                    variant="secondary"
                  >
                    <RotateCcw />
                    Try opening the role space again
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
