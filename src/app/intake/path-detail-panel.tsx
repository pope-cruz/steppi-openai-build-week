import { CornerUpLeft, Footprints } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { PathBranch, StudentProfile } from "@/lib/schemas";

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
  conversation,
  evidence,
  onClear,
  selectionLocked = false,
}: {
  branch: PathBranch;
  conversation?: ReactNode;
  evidence: Map<string, ProfileEvidence>;
  onClear: () => void;
  selectionLocked?: boolean;
}) {
  const relatedDirections = branch.relatedOptions.filter(
    (option) => option.type === "career" || option.type === "major",
  );

  return (
    <section
      aria-labelledby={`path-detail-title-${branch.id}`}
      className="mt-5 overflow-hidden rounded-[var(--radius-panel)] border border-border-strong bg-surface"
      data-path-detail={branch.id}
      id={`path-detail-${branch.id}`}
    >
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0 max-w-[48rem]">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
            Career possibility
          </p>
          <h3
            className="font-display mt-2 max-w-[24ch] text-balance text-[clamp(1.65rem,3vw,2.35rem)] leading-[1.08] tracking-[-0.025em] text-ink [overflow-wrap:anywhere]"
            id={`path-detail-title-${branch.id}`}
          >
            {branch.title}
          </h3>
        </div>
        <Button
          className="self-start px-2.5 text-muted hover:text-ink sm:mt-0.5"
          disabled={selectionLocked}
          onClick={onClear}
          variant="ghost"
        >
          <CornerUpLeft aria-hidden="true" />
          Back to all paths
        </Button>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-7">
        <div className="max-w-[54rem]">
          <p className="text-sm font-semibold text-primary">
            What this role is
          </p>
          <p className="font-display mt-2 text-balance text-[clamp(1.3rem,2.4vw,1.8rem)] leading-snug text-ink">
            {branch.summary}
          </p>
        </div>

        <div className="mt-6 grid border-y border-border lg:grid-cols-2">
          <section className="py-5 lg:border-e lg:border-border lg:pe-7">
            <p className="text-sm font-semibold text-primary">
              Why it may fit you
            </p>
            <div className="mt-2.5 space-y-2 text-sm leading-6 text-graphite sm:text-[0.95rem] sm:leading-6">
              {branch.whyItAppeared.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
            </div>
          </section>

          <section className="border-t border-border py-5 lg:border-t-0 lg:ps-7">
            <p className="text-sm font-semibold text-graphite">
              Why it may not fit you
            </p>
            <div className="mt-2.5 space-y-2 text-sm leading-6 text-graphite sm:text-[0.95rem] sm:leading-6">
              {branch.drawbacks.map((drawback) => (
                <p key={drawback}>{drawback}</p>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-start lg:gap-8">
          <section>
            <p className="text-sm font-semibold text-graphite">
              What the day-to-day can feel like
            </p>
            <div className="mt-2.5 space-y-2 text-sm leading-6 text-graphite sm:text-[0.95rem] sm:leading-6">
              {branch.dayToDay.map((sentence) => (
                <p key={sentence}>{sentence}</p>
              ))}
            </div>
          </section>

          <section className="border-s-2 border-primary bg-primary-soft/45 px-4 py-4 sm:px-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Footprints aria-hidden="true" className="size-4" />
              Try it before committing
            </p>
            <p className="mt-2.5 text-sm leading-6 text-graphite">
              {branch.lowRiskExploration}
            </p>
          </section>
        </div>

        <details className="group border-t border-border pt-4">
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
      {conversation}
    </section>
  );
}
