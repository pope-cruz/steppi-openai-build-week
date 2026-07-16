"use client";

import { AlertCircle, Check, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEMO_INTAKE_ANSWERS } from "@/lib/demo-intake";
import type { ProfileApiResponse } from "@/lib/profile-api";
import type { StudentProfile } from "@/lib/schemas";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; profile: StudentProfile }
  | { status: "error"; message: string; retryable: boolean };

function ProfileResult({ profile }: { profile: StudentProfile }) {
  return (
    <section aria-labelledby="profile-title" className="mt-12 border-t border-border pt-10">
      <div className="mb-8 flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Check aria-hidden="true" className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Validated profile</p>
          <h2 className="font-display mt-1 text-3xl leading-tight text-ink" id="profile-title">
            Here is what Steppi understood.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This is a working hypothesis for correction—not a prediction or final recommendation.
          </p>
        </div>
      </div>

      <div className="grid gap-x-10 gap-y-9 md:grid-cols-2">
        <ProfileList
          items={profile.facts.map((item) => item.statement)}
          label="Based on your answers"
          title="What you shared"
        />
        <ProfileList
          items={profile.inferences.map(
            (item) => `${item.statement} — ${item.rationale} (${item.confidence} confidence)`,
          )}
          label="Steppi inference"
          title="Working hypotheses"
        />
        <ProfileList
          items={profile.constraints.map((item) => item.statement)}
          label="Constraints that matter"
          title="Practical context"
        />
        <ProfileList
          items={profile.uncertainties.map(
            (item) => `${item.question} ${item.whyItMatters}`,
          )}
          label="Still uncertain"
          title="Useful questions"
        />
      </div>

      {profile.tensions.length > 0 ? (
        <div className="mt-9 border-t border-border pt-7">
          <ProfileList
            items={profile.tensions.map((item) => item.description)}
            label="Worth checking"
            title="Tensions in the answers"
          />
        </div>
      ) : null}
    </section>
  );
}

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
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2.5 text-sm leading-6 text-graphite">
          {items.map((item) => (
            <li className="border-s border-border-strong ps-3" key={item}>
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

export function IntakeProfileDemo() {
  const [state, setState] = useState<RequestState>({ status: "idle" });

  async function generateProfile() {
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: DEMO_INTAKE_ANSWERS }),
      });
      const result = (await response.json()) as ProfileApiResponse;

      if (!result.ok) {
        setState({
          status: "error",
          message: result.error.message,
          retryable: result.error.retryable,
        });
        return;
      }

      setState({ status: "success", profile: result.profile });
    } catch {
      setState({
        status: "error",
        message: "Steppi could not reach the profile service. Your sample answers are safe; please try again.",
        retryable: true,
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-[54rem]">
      <div className="max-w-[43rem]">
        <p className="eyebrow">Representative intake smoke test</p>
        <h1 className="font-display mt-5 text-balance text-[clamp(2.45rem,6vw,4rem)] leading-[1.02] tracking-[-0.048em] text-ink">
          Start with what matters to you.
        </h1>
        <p className="mt-5 max-w-[40rem] text-pretty text-base leading-7 text-graphite sm:text-lg">
          This first end-to-end slice uses Steppi’s demo student answers to test a secure, structured profile request.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          The answers are sent only when you choose “Build the sample profile.” Nothing is saved.
        </p>
      </div>

      <section aria-labelledby="sample-answers-title" className="mt-10 border-y border-border py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink" id="sample-answers-title">
            Sample student answers
          </h2>
          <span className="text-xs font-medium text-muted">Demo data</span>
        </div>
        <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {DEMO_INTAKE_ANSWERS.map((answer) => (
            <div key={answer.questionId}>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                {answer.question}
              </dt>
              <dd className="mt-1.5 text-sm leading-6 text-graphite">
                {Array.isArray(answer.answer) ? answer.answer.join(" · ") : answer.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Button
          disabled={state.status === "loading"}
          onClick={generateProfile}
          size="lg"
        >
          {state.status === "loading" ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {state.status === "loading" ? "Building a careful profile…" : "Build the sample profile"}
        </Button>
        <p aria-live="polite" className="text-sm text-muted" role="status">
          {state.status === "idle" ? "Uses GPT-5.6 from a server-only route." : null}
          {state.status === "loading" ? "This can take a few moments." : null}
        </p>
      </div>

      {state.status === "error" ? (
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
              <p className="mt-1 text-sm leading-6 text-muted">{state.message}</p>
              {state.retryable ? (
                <Button className="mt-4" onClick={generateProfile} size="default" variant="secondary">
                  <RotateCcw />
                  Try again
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {state.status === "success" ? <ProfileResult profile={state.profile} /> : null}
    </div>
  );
}
