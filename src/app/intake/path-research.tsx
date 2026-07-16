"use client";

import { LoaderCircle, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ResearchRequestState } from "@/lib/research-flow";
import type { PathBranch } from "@/lib/schemas";

export function suggestedResearchQuestions(branch: PathBranch) {
  return [
    `What could I study for ${branch.title}?`,
    "How much coding or technical work does this involve?",
    "How can I try this before committing?",
  ] as const;
}

export function ResearchComposer({
  branch,
  fieldError,
  onQuestionChange,
  onRetry,
  onSubmit,
  question,
  request,
}: {
  branch: PathBranch;
  fieldError: string | null;
  onQuestionChange: (question: string) => void;
  onRetry: () => void;
  onSubmit: () => void;
  question: string;
  request: ResearchRequestState;
}) {
  const isActiveRequest =
    request.status !== "idle" && request.branchId === branch.id;
  const isLoading = isActiveRequest && request.status === "loading";
  const isSuccess = isActiveRequest && request.status === "success";
  const activeError =
    isActiveRequest && request.status === "error" ? request : null;
  const noSources =
    isActiveRequest && request.status === "no_useful_sources";
  const helpId = `research-question-help-${branch.id}`;
  const errorId = `research-question-error-${branch.id}`;

  if (isSuccess) {
    return (
      <div className="border-t border-border bg-primary-soft/35 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
          Research added to this branch
        </p>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Steppi kept the original map stable and connected the sourced findings above this detail panel.
        </p>
      </div>
    );
  }

  return (
    <form
      className="border-t border-border bg-surface-muted px-5 py-6 sm:px-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
        Ask this path
      </p>
      <h4 className="font-display mt-1 text-2xl text-ink">
        What should Steppi research next?
      </h4>
      <p className="mt-2 max-w-[42rem] text-sm leading-6 text-muted">
        Choose a starting question or write a focused question about {branch.title}.
        Current claims will only appear with retrieved sources.
      </p>

      <div aria-label="Suggested research questions" className="mt-4 flex flex-wrap gap-2">
        {suggestedResearchQuestions(branch).map((suggestion) => (
          <button
            className="min-h-11 rounded-full border border-border-strong bg-surface px-3.5 py-2 text-left text-xs font-semibold leading-5 text-graphite outline-none transition-colors hover:border-primary hover:text-primary focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            key={suggestion}
            onClick={() => onQuestionChange(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {noSources ? (
        <div className="mt-5 border-s-2 border-border-strong bg-surface px-4 py-3" role="status">
          <p className="text-sm font-semibold text-ink">No useful source was found</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Nothing was added to the map. Try narrowing the question or asking about a different part of this path.
          </p>
        </div>
      ) : null}

      {activeError ? (
        <div className="mt-5 border-s-2 border-error bg-surface px-4 py-3" role="alert">
          <p className="text-sm font-semibold text-ink">Research was not added</p>
          <p className="mt-1 text-sm leading-6 text-muted">{activeError.message}</p>
          {activeError.retryable ? (
            <Button className="mt-3" onClick={onRetry} type="button" variant="secondary">
              <RotateCcw aria-hidden="true" />
              Retry this question
            </Button>
          ) : null}
        </div>
      ) : null}

      <label className="mt-5 block text-sm font-semibold text-graphite" htmlFor={`research-question-${branch.id}`}>
        Question about {branch.title}
      </label>
      <textarea
        aria-describedby={fieldError ? errorId : helpId}
        aria-invalid={Boolean(fieldError)}
        className="mt-2 min-h-24 w-full resize-y rounded-[var(--radius-control)] border border-border-strong bg-surface px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-faint focus:border-primary focus:ring-[3px] focus:ring-[color:var(--color-focus)] disabled:cursor-wait disabled:opacity-70"
        disabled={isLoading}
        id={`research-question-${branch.id}`}
        maxLength={300}
        onChange={(event) => onQuestionChange(event.target.value)}
        placeholder="For example: What affordable options exist near Manila?"
        value={question}
      />
      <div className="mt-1 flex items-start justify-between gap-3 text-xs">
        <p className={fieldError ? "text-error" : "text-muted"} id={fieldError ? errorId : helpId} role={fieldError ? "alert" : undefined}>
          {fieldError ?? "Keep it to one specific question so the sources stay useful."}
        </p>
        <span className="shrink-0 text-muted">{question.length}/300</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={isLoading} type="submit">
          {isLoading ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Search aria-hidden="true" />
          )}
          {isLoading ? `Researching ${branch.title}…` : "Research this question"}
        </Button>
        <p aria-live="polite" className="text-xs leading-5 text-muted" role="status">
          {isLoading
            ? "Searching current sources and checking a concise expansion."
            : "One source-backed expansion will be added beneath this branch."}
        </p>
      </div>
    </form>
  );
}
