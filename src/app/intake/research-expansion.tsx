import { ArrowDown, ExternalLink } from "lucide-react";

import type { PathBranch, ResearchNode } from "@/lib/schemas";

const CONFIDENCE_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
} as const;

const CLAIM_LABELS = {
  fact: "Current fact",
  cost: "Cost",
  eligibility: "Eligibility",
  "conditional-aid": "Conditional aid",
  limitation: "Limitation",
} as const;

export function ResearchExpansion({
  branch,
  nodes,
  question,
}: {
  branch: PathBranch;
  nodes: ResearchNode[];
  question: string;
}) {
  return (
    <section
      aria-labelledby={`research-expansion-title-${branch.id}`}
      className="relative mt-5 overflow-hidden rounded-[var(--radius-panel)] border border-primary/45 bg-surface px-4 pt-8 pb-5 shadow-[var(--shadow-card)] sm:px-6 sm:pb-6"
      data-research-branch={branch.id}
      data-research-expansion="true"
    >
      <span aria-hidden="true" className="absolute top-0 left-1/2 h-6 w-px bg-primary" />
      <div className="mx-auto flex max-w-[48rem] flex-col items-center text-center">
        <span className="flex size-8 items-center justify-center rounded-full border border-primary bg-primary-soft text-primary">
          <ArrowDown aria-hidden="true" className="size-4" />
        </span>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-primary">
          Current research · {nodes.length} {nodes.length === 1 ? "finding" : "findings"}
        </p>
        <h2 className="font-display mt-1 text-2xl text-ink" id={`research-expansion-title-${branch.id}`}>
          Added beneath {branch.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">“{question}”</p>
      </div>

      <ol className="mt-6 grid gap-4 lg:grid-cols-3">
        {nodes.map((node) => {
          const sourceNumberByUrl = new Map(
            node.sources.map((source, index) => [source.url, index + 1]),
          );

          return (
            <li
              className="relative min-w-0 rounded-[var(--radius-card)] border border-border-strong bg-surface-muted px-4 py-4 before:absolute before:-top-4 before:left-1/2 before:h-4 before:w-px before:bg-border-strong before:content-['']"
              data-research-node={node.id}
              key={node.id}
            >
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.09em] text-primary">
                {node.type} · {CONFIDENCE_LABELS[node.confidence]}
              </p>
              <h3 className="mt-2 text-base font-semibold leading-5 text-ink">{node.title}</h3>
              <p className="mt-1.5 text-[0.68rem] leading-5 text-muted">
                Title sources:{" "}
                {node.titleSourceUrls.map((url, index) => (
                  <span key={`${node.id}-title-${url}`}>
                    {index > 0 ? ", " : ""}
                    <a
                      className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 focus-visible:focus-ring"
                      data-title-source-url={url}
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      [{sourceNumberByUrl.get(url)}]
                    </a>
                  </span>
                ))}
              </p>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">
                  Cited factual claims
                </p>
                <ul className="mt-2 space-y-3">
                  {node.claims.map((claim) => (
                    <li data-research-claim={claim.id} key={claim.id}>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-primary">
                        {CLAIM_LABELS[claim.kind]}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-graphite">{claim.statement}</p>
                      <p className="mt-1 text-[0.68rem] leading-5 text-muted">
                        {claim.sourceUrls.length === 1 ? "Source" : "Sources"}:{" "}
                        {claim.sourceUrls.map((url, index) => (
                          <span key={`${claim.id}-${url}`}>
                            {index > 0 ? ", " : ""}
                            <a
                              className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 focus-visible:focus-ring"
                              data-claim-source-url={url}
                              href={url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              [{sourceNumberByUrl.get(url)}]
                            </a>
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-4 border-t border-border pt-4 text-xs leading-5">
                <div>
                  <dt className="font-bold uppercase tracking-[0.08em] text-muted">
                    Steppi connection · not a sourced fact
                  </dt>
                  <dd className="mt-1 text-graphite">{node.relevanceToStudent}</dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">
                  Source directory
                </p>
                <ul className="mt-2 space-y-3">
                  {node.sources.map((source, index) => (
                    <li className="min-w-0 text-xs leading-5" key={`${node.id}-${source.url}`}>
                      <a
                        className="inline-flex items-start gap-1.5 font-semibold text-primary underline decoration-primary/35 underline-offset-4 hover:text-primary-hover focus-visible:focus-ring"
                        href={source.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span>[{index + 1}] {source.title}</span>
                        <ExternalLink aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                      </a>
                      <span className="mt-1 block break-all text-[0.68rem] text-muted">{source.url}</span>
                      <span className="mt-1 block text-muted">
                        {source.publisher ? `${source.publisher} · ` : ""}checked {source.dateChecked}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
