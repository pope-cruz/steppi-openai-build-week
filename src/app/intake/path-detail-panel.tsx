import { CornerUpLeft } from "lucide-react";
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

      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-border px-5 py-6 sm:px-7 lg:border-e lg:border-b-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
            Why this appeared
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-graphite">
            {branch.whyItAppeared.map((reason) => (
              <li className="border-s border-border-strong ps-3" key={reason}>
                {reason}
              </li>
            ))}
          </ul>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.1em] text-muted">
            Supporting profile context
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
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
        </div>

        <div className="px-5 py-6 sm:px-7">
          <dl className="space-y-5 text-sm leading-6">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                Main tradeoff
              </dt>
              <dd className="mt-2 text-graphite">{branch.drawbacks[0]}</dd>
            </div>
            <div className="border-t border-border pt-5">
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                Still unresolved
              </dt>
              <dd className="mt-2 text-graphite">{branch.unresolvedQuestions[0]}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border pt-5">
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
      {research}
    </section>
  );
}
