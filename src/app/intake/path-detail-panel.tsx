import { CornerUpLeft, Footprints } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { PathBranch, StudentProfile } from "@/lib/schemas";

const BRANCH_LABELS = {
  "strongest-fit": "Strongest current fit",
  adjacent: "Adjacent possibility",
  underexplored: "Underexplored possibility",
} as const;

export type ProfileEvidence = {
  id: string;
  label: string;
  statement: string;
  isInference: boolean;
};

export function profileEvidence(profile: StudentProfile) {
  const evidence = new Map<string, ProfileEvidence>();

  for (const fact of profile.facts) {
    evidence.set(fact.id, {
      id: fact.id,
      label: "Student fact",
      statement: fact.statement,
      isInference: false,
    });
  }
  for (const inference of profile.inferences) {
    evidence.set(inference.id, {
      id: inference.id,
      label: "Steppi inference",
      statement: inference.statement,
      isInference: true,
    });
  }
  for (const constraint of profile.constraints) {
    evidence.set(constraint.id, {
      id: constraint.id,
      label: "Student constraint",
      statement: constraint.statement,
      isInference: false,
    });
  }
  for (const uncertainty of profile.uncertainties) {
    evidence.set(uncertainty.id, {
      id: uncertainty.id,
      label: "Open question",
      statement: uncertainty.question,
      isInference: false,
    });
  }
  for (const tension of profile.tensions) {
    evidence.set(tension.id, {
      id: tension.id,
      label: "Steppi noted tension",
      statement: tension.description,
      isInference: true,
    });
  }

  return evidence;
}

export function PathDetailPanel({
  branch,
  evidence,
  onClear,
  research,
  selectionLocked = false,
}: {
  branch: PathBranch;
  evidence: Map<string, ProfileEvidence>;
  onClear: () => void;
  research?: ReactNode;
  selectionLocked?: boolean;
}) {
  const relatedDirections = branch.relatedOptions.filter(
    (option) => option.type === "career" || option.type === "major",
  );

  return (
    <section
      aria-labelledby={`path-detail-title-${branch.id}`}
      className="mt-6 overflow-hidden rounded-[var(--radius-panel)] border border-border-strong bg-surface shadow-[var(--shadow-panel)]"
      data-path-detail={branch.id}
      id={`path-detail-${branch.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border bg-surface-muted px-5 py-5 sm:px-7">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
            {BRANCH_LABELS[branch.kind]} · {branch.confidence} confidence
          </p>
          <h3
            className="font-display mt-1 text-balance text-[clamp(1.8rem,4vw,2.7rem)] leading-tight text-ink"
            id={`path-detail-title-${branch.id}`}
          >
            {branch.title}
          </h3>
        </div>
        <Button disabled={selectionLocked} onClick={onClear} variant="secondary">
          <CornerUpLeft aria-hidden="true" />
          Back to all paths
        </Button>
      </div>

      <div className="px-5 py-7 sm:px-7 sm:py-8">
        <div className="max-w-[50rem]">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
            What this role is
          </p>
          <p className="font-display mt-2 text-balance text-[clamp(1.45rem,3vw,2.05rem)] leading-snug text-ink">
            {branch.summary}
          </p>
        </div>

        <div className="mt-8 grid border-y border-border lg:grid-cols-2">
          <section className="py-6 lg:border-e lg:border-border lg:pe-8">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
              Why it may fit you
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-graphite sm:text-base sm:leading-7">
              {branch.whyItAppeared.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
            </div>
          </section>

          <section className="border-t border-border py-6 lg:border-t-0 lg:ps-8">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
              Why it may not fit you
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-graphite sm:text-base sm:leading-7">
              {branch.drawbacks.map((drawback) => (
                <p key={drawback}>{drawback}</p>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-7 py-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:gap-12">
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
              What the day-to-day can feel like
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-graphite sm:text-base sm:leading-7">
              {branch.dayToDay.map((sentence) => (
                <p key={sentence}>{sentence}</p>
              ))}
            </div>
          </section>

          <section className="border-s-2 border-primary bg-primary-soft/55 px-5 py-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-primary">
              <Footprints aria-hidden="true" className="size-4" />
              Try it before committing
            </p>
            <p className="mt-3 text-sm leading-6 text-graphite">
              {branch.lowRiskExploration}
            </p>
          </section>
        </div>

        <details className="group border-t border-border pt-5">
          <summary className="cursor-pointer list-none rounded-[var(--radius-control)] text-sm font-semibold text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="text-primary group-open:rotate-45">+</span>
              See what Steppi connected from your profile
            </span>
          </summary>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <ul className="grid gap-3 sm:grid-cols-2">
              {branch.supportingProfileIds.map((id) => {
                const item = evidence.get(id);
                if (!item) {
                  return null;
                }

                return (
                  <li className="border-t border-border pt-3 text-sm leading-5" key={item.id}>
                    <span
                      className={`block text-[0.68rem] font-bold uppercase tracking-[0.08em] ${
                        item.isInference ? "text-primary" : "text-muted"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="mt-1 block text-graphite">{item.statement}</span>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-5 text-sm leading-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                  Still worth exploring
                </p>
                <p className="mt-2 text-graphite">{branch.unresolvedQuestions[0]}</p>
              </div>
              <div className="border-t border-border pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                  Related careers or majors
                </p>
                {relatedDirections.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {relatedDirections.map((option) => (
                      <li
                        className="rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-xs font-semibold text-graphite"
                        key={option.id}
                      >
                        {option.label} · {option.type}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    No related career or major was included in this hypothesis.
                  </p>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
      {research}
    </section>
  );
}
