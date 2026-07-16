"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { InitialPathMap } from "@/app/intake/path-branch-preview";
import { Button } from "@/components/ui/button";
import { DEMO_PATH_BRANCHES } from "@/lib/demo-paths";
import { PathApiResponseSchema } from "@/lib/path-api";
import { pathFlowReducer } from "@/lib/path-flow";
import { validatePathGeneration } from "@/lib/path-validation";
import {
  applyProfilePatch,
  profilePatchHasChanges,
} from "@/lib/profile-patch";
import type { ProfilePatch, StudentProfile } from "@/lib/schemas";

const CORRECTION_LIMIT = 600;

export type DevelopmentPathFixture =
  | "success"
  | "api_failure"
  | "timeout"
  | "malformed_model_output";

type InferenceEditor = {
  targetId: string;
  mode: "replace" | "remove";
  statement: string;
  error: string | null;
};

function ProfileList({
  items,
  label,
  title,
}: {
  items: string[];
  label: string;
  title: string;
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2.5 text-sm leading-6 text-graphite">
          {items.map((item, index) => (
            <li className="border-s border-border-strong ps-3" key={`${index}-${item}`}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Nothing surfaced in this group.</p>
      )}
    </section>
  );
}

function constraintIdFor(profile: StudentProfile) {
  const existingIds = new Set(profile.constraints.map((constraint) => constraint.id));
  let index = profile.constraints.length + 1;
  let candidate = `constraint-student-added-${index}`;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `constraint-student-added-${index}`;
  }

  return candidate;
}

export function ProfileConfirmation({
  developmentPathFixture,
  onRestart,
  profile: originalProfile,
}: {
  developmentPathFixture?: DevelopmentPathFixture;
  onRestart: () => void;
  profile: StudentProfile;
}) {
  const [pendingPatch, setPendingPatch] = useState<ProfilePatch | null>(null);
  const [confirmedPatch, setConfirmedPatch] = useState<ProfilePatch | null>(null);
  const [pathFlow, dispatchPathFlow] = useReducer(pathFlowReducer, null);
  const [inferenceEditor, setInferenceEditor] = useState<InferenceEditor | null>(
    null,
  );
  const [constraintEditorOpen, setConstraintEditorOpen] = useState(false);
  const [constraintStatement, setConstraintStatement] = useState("");
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const pathRequestController = useRef<AbortController | null>(null);
  const mapSection = useRef<HTMLElement | null>(null);

  const hasPendingChanges = profilePatchHasChanges(pendingPatch);
  const previewProfile = useMemo(
    () =>
      hasPendingChanges && pendingPatch
        ? applyProfilePatch(originalProfile, pendingPatch)
        : originalProfile,
    [hasPendingChanges, originalProfile, pendingPatch],
  );
  const confirmedProfile = pathFlow?.confirmedProfile ?? null;
  const pathRequestState = pathFlow?.request ?? { status: "idle" as const };
  const displayedProfile = confirmedProfile ?? previewProfile;
  const pendingRemovalId = pendingPatch?.removeInferenceIds?.[0];
  const pendingReplacement = pendingPatch?.replaceStatements?.[0];
  const hasPendingInferenceChange = Boolean(
    pendingRemovalId || pendingReplacement,
  );
  const hasPendingConstraint = Boolean(pendingPatch?.addConstraints?.length);

  useEffect(
    () => () => {
      pathRequestController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (pathRequestState.status === "success") {
      mapSection.current?.scrollIntoView({ block: "start" });
    }
  }, [pathRequestState.status]);

  function openInferenceEditor(targetId: string) {
    const inference = originalProfile.inferences.find((item) => item.id === targetId);
    if (!inference) {
      return;
    }

    const existingReplacement =
      pendingReplacement?.targetId === targetId ? pendingReplacement : null;
    setInferenceEditor({
      targetId,
      mode: pendingRemovalId === targetId ? "remove" : "replace",
      statement: existingReplacement?.newStatement ?? inference.statement,
      error: null,
    });
  }

  function saveInferenceCorrection() {
    if (!inferenceEditor) {
      return;
    }

    if (inferenceEditor.mode === "replace") {
      const statement = inferenceEditor.statement.trim();
      if (!statement) {
        setInferenceEditor((current) =>
          current ? { ...current, error: "Enter the corrected wording first." } : null,
        );
        return;
      }

      setPendingPatch((current) => ({
        ...(current ?? {}),
        removeInferenceIds: undefined,
        replaceStatements: [
          { targetId: inferenceEditor.targetId, newStatement: statement },
        ],
      }));
    } else {
      setPendingPatch((current) => ({
        ...(current ?? {}),
        removeInferenceIds: [inferenceEditor.targetId],
        replaceStatements: undefined,
      }));
    }

    setInferenceEditor(null);
  }

  function addConstraint() {
    const statement = constraintStatement.trim();
    if (!statement) {
      setConstraintError("Describe the constraint before adding it.");
      return;
    }

    setPendingPatch((current) => ({
      ...(current ?? {}),
      addConstraints: [
        {
          id: constraintIdFor(originalProfile),
          type: "other",
          statement,
          priority: "medium",
        },
      ],
    }));
    setConstraintEditorOpen(false);
    setConstraintStatement("");
    setConstraintError(null);
  }

  function discardPendingChanges() {
    setPendingPatch(null);
    setInferenceEditor(null);
    setConstraintEditorOpen(false);
    setConstraintStatement("");
    setConstraintError(null);
  }

  function confirmProfile() {
    const patch = pendingPatch ?? {};
    dispatchPathFlow({
      type: "confirm",
      profile: applyProfilePatch(originalProfile, patch),
    });
    setConfirmedPatch(hasPendingChanges ? patch : null);
    setPendingPatch(null);
    setInferenceEditor(null);
    setConstraintEditorOpen(false);
  }

  async function generatePaths() {
    if (!confirmedProfile) {
      return;
    }

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
                  ? "Steppi took too long to explore these paths. Your confirmed profile is safe; please try again."
                  : "Steppi could not explore paths right now. Your confirmed profile is safe; please try again.",
              retryable: true,
            },
          };
        }
      } else {
        const response = await fetch("/api/paths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: confirmedProfile }),
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
            "Steppi received paths it could not safely compare. Nothing was shown; please try again.",
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
        branches = validatePathGeneration(confirmedProfile, {
          branches: parsedResponse.data.branches,
        });
      } catch {
        dispatchPathFlow({
          type: "fail",
          code: "malformed_model_output",
          message:
            "Steppi received paths it could not safely compare. Nothing was shown; please try again.",
          retryable: true,
        });
        return;
      }

      dispatchPathFlow({ type: "succeed", branches });
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      dispatchPathFlow({
        type: "fail",
        code: "api_failure",
        message:
          "Steppi could not reach the path service. Your confirmed profile is safe; please try again.",
        retryable: true,
      });
    } finally {
      if (pathRequestController.current === controller) {
        pathRequestController.current = null;
      }
    }
  }

  const stateLabel = confirmedProfile
    ? "Confirmed profile"
    : hasPendingChanges
      ? "Pending correction"
      : "Original profile";

  if (confirmedProfile && pathRequestState.status === "success") {
    return (
      <section
        className="relative left-1/2 w-[min(75rem,calc(100vw-2rem))] -translate-x-1/2 scroll-mt-6"
        ref={mapSection}
      >
        <InitialPathMap
          branches={pathRequestState.branches}
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
          <Check aria-hidden="true" className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            {stateLabel}
          </p>
          <h1
            className="font-display mt-1 text-balance text-[clamp(2.35rem,6vw,3.75rem)] leading-tight text-ink"
            id="profile-title"
          >
            Here is what Steppi understood.
          </h1>
          <p className="mt-3 max-w-[42rem] text-sm leading-6 text-muted sm:text-base">
            This is a working hypothesis for correction—not a prediction or final recommendation.
          </p>
        </div>
      </div>

      {hasPendingChanges ? (
        <div
          aria-live="polite"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-primary/25 bg-primary-soft/45 px-4 py-3"
        >
          <p className="text-sm font-medium text-graphite">
            Your correction is only a preview until you confirm this profile.
          </p>
          <Button onClick={discardPendingChanges} variant="ghost">
            <Undo2 />
            Discard pending changes
          </Button>
        </div>
      ) : null}

      {confirmedProfile ? (
        <p
          aria-live="polite"
          className="mt-8 border-y border-border bg-surface-muted px-4 py-3 text-sm font-medium text-graphite"
        >
          Profile confirmed
          {profilePatchHasChanges(confirmedPatch)
            ? " with your corrections. The original profile remains unchanged in this session."
            : ". No corrections were added."}
        </p>
      ) : null}

      <div className="mt-10 grid gap-x-10 gap-y-9 border-y border-border py-9 md:grid-cols-2">
        <section>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Based on your answers
            </p>
            <span className="text-xs font-medium text-muted">Read-only</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-ink">What you shared</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-graphite">
            {displayedProfile.facts.map((fact) => (
              <li className="border-s border-border-strong ps-3" key={fact.id}>
                {fact.statement}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Steppi inference
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">Working hypotheses</h3>
          {originalProfile.inferences.length > 0 ? (
            <ul className="mt-3 space-y-4">
              {(confirmedProfile ? displayedProfile.inferences : originalProfile.inferences).map(
                (inference) => {
                  const isPendingRemoval = pendingRemovalId === inference.id;
                  const replacement =
                    pendingReplacement?.targetId === inference.id
                      ? pendingReplacement.newStatement
                      : null;

                  return (
                    <li className="border-s border-border-strong ps-3" key={inference.id}>
                      <p
                        className={`text-sm leading-6 text-graphite ${
                          isPendingRemoval ? "line-through opacity-55" : ""
                        }`}
                      >
                        {replacement ?? inference.statement}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {inference.rationale} · {inference.confidence} confidence
                      </p>
                      {isPendingRemoval || replacement ? (
                        <p className="mt-1 text-xs font-semibold text-primary">
                          {isPendingRemoval ? "Pending removal" : "Pending replacement"}
                        </p>
                      ) : null}
                      {!confirmedProfile &&
                      (!hasPendingInferenceChange ||
                        pendingRemovalId === inference.id ||
                        pendingReplacement?.targetId === inference.id) ? (
                        <button
                          aria-expanded={inferenceEditor?.targetId === inference.id}
                          className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-primary outline-none hover:bg-primary-soft focus-visible:focus-ring"
                          onClick={() => openInferenceEditor(inference.id)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-3.5" />
                          {replacement || isPendingRemoval ? "Review correction" : "Correct this"}
                        </button>
                      ) : null}
                    </li>
                  );
                },
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No working hypotheses were added.</p>
          )}

          {inferenceEditor ? (
            <form
              className="mt-5 border-y border-border bg-surface-muted px-4 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveInferenceCorrection();
              }}
            >
              <fieldset>
                <legend className="text-sm font-semibold text-ink">Correct this inference</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["replace", "remove"] as const).map((mode) => (
                    <button
                      aria-pressed={inferenceEditor.mode === mode}
                      className={`min-h-10 rounded-[var(--radius-control)] border px-3 text-sm font-semibold outline-none focus-visible:focus-ring ${
                        inferenceEditor.mode === mode
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-strong bg-surface text-graphite"
                      }`}
                      key={mode}
                      onClick={() =>
                        setInferenceEditor((current) =>
                          current ? { ...current, mode, error: null } : null,
                        )
                      }
                      type="button"
                    >
                      {mode === "replace" ? "Replace wording" : "Remove inference"}
                    </button>
                  ))}
                </div>
              </fieldset>

              {inferenceEditor.mode === "replace" ? (
                <div className="mt-4">
                  <label className="text-sm font-semibold text-graphite" htmlFor="inference-correction">
                    Corrected statement
                  </label>
                  <textarea
                    aria-describedby={inferenceEditor.error ? "inference-correction-error" : undefined}
                    className="mt-2 min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-border-strong bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)]"
                    id="inference-correction"
                    maxLength={CORRECTION_LIMIT}
                    onChange={(event) =>
                      setInferenceEditor((current) =>
                        current
                          ? { ...current, statement: event.target.value, error: null }
                          : null,
                      )
                    }
                    value={inferenceEditor.statement}
                  />
                  <div className="mt-1 flex items-start justify-between gap-3 text-xs">
                    {inferenceEditor.error ? (
                      <p className="text-error" id="inference-correction-error" role="alert">
                        {inferenceEditor.error}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="shrink-0 text-muted">
                      {inferenceEditor.statement.length}/{CORRECTION_LIMIT}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted">
                  This removes only this working hypothesis. Facts and the rest of your profile stay unchanged.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit">
                  {inferenceEditor.mode === "replace" ? "Preview replacement" : "Preview removal"}
                </Button>
                <Button onClick={() => setInferenceEditor(null)} variant="ghost">
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Constraints that matter
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">Practical context</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-graphite">
            {displayedProfile.constraints.map((constraint) => (
              <li className="border-s border-border-strong ps-3" key={constraint.id}>
                {constraint.statement}
                {!confirmedProfile &&
                pendingPatch?.addConstraints?.some((item) => item.id === constraint.id) ? (
                  <span className="mt-1 block text-xs font-semibold text-primary">
                    Pending addition
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          {!confirmedProfile && !hasPendingConstraint && !constraintEditorOpen ? (
            <button
              aria-expanded="false"
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-primary outline-none hover:bg-primary-soft focus-visible:focus-ring"
              onClick={() => setConstraintEditorOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              Add a missing constraint
            </button>
          ) : null}

          {constraintEditorOpen ? (
            <form
              className="mt-5 border-y border-border bg-surface-muted px-4 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                addConstraint();
              }}
            >
              <label className="text-sm font-semibold text-ink" htmlFor="missing-constraint">
                What important constraint is missing?
              </label>
              <textarea
                aria-describedby={constraintError ? "constraint-error" : "constraint-hint"}
                className="mt-2 min-h-24 w-full resize-y rounded-[var(--radius-control)] border border-border-strong bg-surface px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)]"
                id="missing-constraint"
                maxLength={CORRECTION_LIMIT}
                onChange={(event) => {
                  setConstraintStatement(event.target.value);
                  setConstraintError(null);
                }}
                placeholder="For example, I need a course schedule that leaves time for family responsibilities."
                value={constraintStatement}
              />
              <div className="mt-1 flex items-start justify-between gap-3 text-xs">
                {constraintError ? (
                  <p className="text-error" id="constraint-error" role="alert">
                    {constraintError}
                  </p>
                ) : (
                  <p className="text-muted" id="constraint-hint">
                    Add one practical limit or need that should shape future paths.
                  </p>
                )}
                <span className="shrink-0 text-muted">
                  {constraintStatement.length}/{CORRECTION_LIMIT}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit">Preview constraint</Button>
                <Button
                  onClick={() => {
                    setConstraintEditorOpen(false);
                    setConstraintStatement("");
                    setConstraintError(null);
                  }}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        <ProfileList
          items={displayedProfile.uncertainties.map(
            (item) => `${item.question} ${item.whyItMatters}`,
          )}
          label="Still uncertain"
          title="Useful questions"
        />
      </div>

      {displayedProfile.tensions.length > 0 ? (
        <div className="mt-9 border-b border-border pb-9">
          <ProfileList
            items={displayedProfile.tensions.map((item) => item.description)}
            label="Worth checking"
            title="Tensions in the answers"
          />
        </div>
      ) : null}

      {confirmedProfile && pathRequestState.status === "loading" ? (
        <div
          aria-live="polite"
          className="mt-9 flex items-center gap-3 border-y border-border bg-surface-muted px-5 py-6"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" />
          <div>
            <p className="font-semibold text-ink">Exploring three different directions…</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Steppi is comparing evidence, tradeoffs, and open questions in one request.
            </p>
          </div>
        </div>
      ) : null}

      {confirmedProfile && pathRequestState.status === "error" ? (
        <div
          aria-live="assertive"
          className="mt-9 border-y border-error/25 bg-[color-mix(in_srgb,var(--color-error)_6%,white)] px-5 py-6"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
            <div>
              <p className="font-semibold text-ink">The paths are not ready yet.</p>
              <p className="mt-1 max-w-[42rem] text-sm leading-6 text-muted">
                {pathRequestState.message}
              </p>
              <p className="mt-2 text-xs font-medium text-graphite">
                Your confirmed profile remains available above.
              </p>
              {pathRequestState.retryable ? (
                <Button className="mt-4" onClick={generatePaths} variant="secondary">
                  Try path generation again
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Button onClick={onRestart} variant="secondary">
          <RotateCcw />
          Restart intake
        </Button>
        {!confirmedProfile ? (
          <Button onClick={confirmProfile} size="lg">
            Confirm this profile
            <Check />
          </Button>
        ) : pathRequestState.status === "idle" ? (
          <Button
            onClick={generatePaths}
            size="lg"
          >
            Confirm and explore paths
            <ArrowRight />
          </Button>
        ) : pathRequestState.status === "loading" ? (
          <Button disabled size="lg">
            <LoaderCircle className="animate-spin" />
            Exploring paths…
          </Button>
        ) : null}
      </div>
    </section>
  );
}
