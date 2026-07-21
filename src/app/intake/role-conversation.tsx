"use client";

import {
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  MAX_ROLE_CONVERSATION_MESSAGES,
  ROLE_QUESTION_MAX_LENGTH,
  questionRequiresCurrentSources,
  type RoleConversationAssistantMessage,
  type RoleConversationThread,
} from "@/lib/role-conversation";
import type { PathBranch } from "@/lib/schemas";

export function suggestedRoleQuestions(branch: PathBranch) {
  return [
    `What might surprise me about ${branch.title}?`,
    "What could be difficult about it?",
    "How can I try a small version of this?",
  ] as const;
}

function AssistantAnswer({
  message,
}: {
  message: RoleConversationAssistantMessage;
}) {
  const sourceNumberByUrl = new Map(
    message.sources.map((source, index) => [source.url, index + 1]),
  );

  return (
    <div className="min-w-0" data-role-conversation-answer={message.mode}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.09em] text-primary">
        Steppi
        {message.mode === "researched" ? " · current sources checked" : ""}
      </p>
      <div className="mt-2 space-y-2 text-sm leading-6 text-graphite sm:text-[0.95rem]">
        {message.answerBlocks.map((block) => (
          <p key={block.id}>
            {block.text}
            {block.sourceUrls.map((url) => (
              <a
                aria-label={`Source ${sourceNumberByUrl.get(url)}`}
                className="ms-1 inline-flex font-semibold text-primary underline decoration-primary/35 underline-offset-2 focus-visible:focus-ring"
                href={url}
                key={`${block.id}-${url}`}
                rel="noreferrer"
                target="_blank"
              >
                [{sourceNumberByUrl.get(url)}]
              </a>
            ))}
          </p>
        ))}
      </div>

      <p className="mt-2 text-xs leading-5 text-muted">
        {message.relevanceToStudent}
      </p>
      {message.caveat ? (
        <p className="mt-2 border-s border-border-strong ps-3 text-xs leading-5 text-muted">
          {message.caveat}
        </p>
      ) : null}
      {message.nextStep ? (
        <p className="mt-3 text-sm leading-6 text-graphite">
          <span className="font-semibold text-ink">Try this next:</span>{" "}
          {message.nextStep}
        </p>
      ) : null}

      {message.sources.length > 0 ? (
        <details className="group mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer list-none rounded-[var(--radius-control)] text-xs font-semibold text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--color-focus)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="group-open:rotate-45">+</span>
              {message.sources.length} current {message.sources.length === 1 ? "source" : "sources"}
            </span>
          </summary>
          <ol className="mt-3 space-y-2 text-xs leading-5 text-muted">
            {message.sources.map((source, index) => (
              <li key={source.url}>
                <a
                  className="inline-flex items-start gap-1.5 font-semibold text-primary underline decoration-primary/35 underline-offset-3 focus-visible:focus-ring"
                  href={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>[{index + 1}] {source.title}</span>
                  <ExternalLink aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                </a>
                <span className="block">
                  {source.publisher ? `${source.publisher} · ` : ""}checked {source.dateChecked}
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}

export function RoleConversationPanel({
  branch,
  fieldError,
  onDraftChange,
  onReset,
  onRetry,
  onSubmit,
  thread,
}: {
  branch: PathBranch;
  fieldError: string | null;
  onDraftChange: (value: string) => void;
  onReset: () => void;
  onRetry: () => void;
  onSubmit: () => void;
  thread: RoleConversationThread;
}) {
  const input = useRef<HTMLTextAreaElement | null>(null);
  const isLoading = thread.request.status === "loading";
  const loadingQuestion =
    thread.request.status === "loading" ? thread.request.question : "";
  const isAtLimit = thread.messages.length >= MAX_ROLE_CONVERSATION_MESSAGES;
  const helpId = `role-conversation-help-${branch.id}`;
  const errorId = `role-conversation-error-${branch.id}`;

  useEffect(() => {
    if (!isLoading) input.current?.focus();
  }, [branch.id, isLoading]);

  return (
    <section
      aria-labelledby={`role-conversation-title-${branch.id}`}
      className="border-t border-border bg-surface-muted/45 px-4 py-5 sm:px-6 sm:py-6"
      data-role-conversation={branch.id}
    >
      <div className="mx-auto max-w-[47rem]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-primary">
              Keep exploring
            </p>
            <h4
              className="font-display mt-1 text-[clamp(1.25rem,2.5vw,1.65rem)] leading-tight text-ink"
              id={`role-conversation-title-${branch.id}`}
            >
              Ask one thing about {branch.title}
            </h4>
          </div>
          {thread.messages.length > 0 && !isLoading ? (
            <button
              className="shrink-0 rounded-[var(--radius-control)] text-xs font-semibold text-muted outline-none hover:text-ink focus-visible:focus-ring"
              onClick={onReset}
              type="button"
            >
              Start over
            </button>
          ) : null}
        </div>

        {thread.messages.length === 0 ? (
          <p className="mt-2 max-w-[38rem] text-sm leading-6 text-muted">
            A short follow-up is enough. Steppi will check current sources only when the question needs them.
          </p>
        ) : (
          <ol className="mt-5 space-y-4 border-y border-border py-4" aria-label={`Conversation about ${branch.title}`}>
            {thread.messages.map((message) => (
              <li
                className={
                  message.role === "user"
                    ? "ms-auto max-w-[38rem] border-s-2 border-primary ps-3"
                    : "max-w-[42rem]"
                }
                key={message.id}
              >
                {message.role === "user" ? (
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.09em] text-muted">You</p>
                    <p className="mt-1 text-sm leading-6 text-ink">{message.content}</p>
                  </div>
                ) : (
                  <AssistantAnswer message={message} />
                )}
              </li>
            ))}
            {isLoading ? (
              <li aria-live="polite" className="flex items-center gap-2 text-sm text-muted" role="status">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-primary" />
                {questionRequiresCurrentSources(loadingQuestion)
                  ? "Checking current sources…"
                  : "Thinking about what you shared…"}
              </li>
            ) : null}
          </ol>
        )}

        {thread.request.status === "error" ? (
          <div className="mt-4 border-s-2 border-error bg-surface px-4 py-3" role="alert">
            <p className="text-sm font-semibold text-ink">That answer did not come through.</p>
            <p className="mt-1 text-sm leading-6 text-muted">{thread.request.message}</p>
            {thread.request.retryable ? (
              <Button className="mt-3" onClick={onRetry} type="button" variant="secondary">
                <RotateCcw aria-hidden="true" />
                Retry this question
              </Button>
            ) : null}
          </div>
        ) : null}

        {isAtLimit ? (
          <div className="mt-4 border-s-2 border-border-strong bg-surface px-4 py-3">
            <p className="text-sm font-semibold text-ink">This demo conversation is full.</p>
            <p className="mt-1 text-sm leading-6 text-muted">Start this role conversation over to ask something new.</p>
          </div>
        ) : (
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            {thread.messages.length === 0 ? (
              <div aria-label="Suggested role questions" className="mb-3 flex flex-wrap gap-2">
                {suggestedRoleQuestions(branch).map((suggestion) => (
                  <button
                    className="min-h-10 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-left text-xs font-semibold leading-5 text-graphite outline-none hover:border-primary hover:text-primary focus-visible:focus-ring"
                    key={suggestion}
                    onClick={() => onDraftChange(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <label className="sr-only" htmlFor={`role-conversation-input-${branch.id}`}>
              Ask a question about {branch.title}
            </label>
            <div className="flex items-end gap-2 rounded-[var(--radius-control)] border border-border-strong bg-surface p-2 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-[color:var(--color-focus)]">
              <textarea
                aria-describedby={fieldError ? errorId : helpId}
                aria-invalid={Boolean(fieldError)}
                className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-ink outline-none placeholder:text-faint disabled:cursor-wait disabled:opacity-70"
                disabled={isLoading}
                id={`role-conversation-input-${branch.id}`}
                maxLength={ROLE_QUESTION_MAX_LENGTH}
                onChange={(event) => onDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder="Ask a short follow-up…"
                ref={input}
                rows={1}
                value={thread.draft}
              />
              <Button aria-label="Send role question" disabled={isLoading} type="submit">
                {isLoading ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Send aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
            <div className="mt-1 flex items-start justify-between gap-3 text-xs leading-5">
              <p
                className={fieldError ? "text-error" : "text-muted"}
                id={fieldError ? errorId : helpId}
                role={fieldError ? "alert" : undefined}
              >
                {fieldError ?? "Enter to send · Shift+Enter for a new line"}
              </p>
              <span className="shrink-0 text-muted">{thread.draft.length}/{ROLE_QUESTION_MAX_LENGTH}</span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
