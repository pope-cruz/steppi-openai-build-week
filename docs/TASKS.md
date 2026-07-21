---
title: Steppi Operational Handoff
project: Steppi
event: OpenAI Build Week
status: active
version: 0.3
last_updated: 2026-07-20
---

# Steppi Operational Handoff

See [SPEC.md](./SPEC.md) for the active Build Week contract,
[VISION.md](./VISION.md) for product direction, and
[BUILD_LOG.md](./BUILD_LOG.md) for implementation and verification history.

## Current Product Direction

Steppi is a career-exploration companion for high-school students. Its polished
demo loop follows breadth before depth:

1. complete a short conversational intake;
2. confirm or directly edit Steppi's student-context hypothesis;
3. scan approximately seven varied, unranked career roles;
4. understand one selected role in under a minute; and
5. ask concise follow-ups in a role-specific conversation, using current-source
   research only when the question requires unstable external facts.

The role space supports discovery and switching. It is not a ranking, prediction,
or technical graph editor.

## Current Implemented Behavior

- The in-memory intake has three ordered anchors, controller-selected follow-ups,
  one final consideration question, revision, transcript preservation, request
  locking, loading, failure, malformed-output, fallback, and retry behavior.
- Server-only GPT-5.6 profile generation returns a validated structured profile
  and an exactly two-sentence `confirmationSummary` in one request.
- The student can accept or directly rewrite the summary. Role generation receives
  both the unchanged profile and latest approved `confirmedSummary`.
- Path generation returns one validated set of 6–8 unranked, meaningfully varied
  roles, targeting seven. Each role includes a concise explanation and valid
  profile-evidence references. It may make up to three sequential GPT-5.6
  attempts per click, stopping at the first complete validated set; SDK retries
  remain disabled and no partial set reaches the client.
- Desktop shows a deterministic floating field of title-only role pills. Mobile
  shows the same complete role set as a vertical list.
- Each selected role explains what it is, why it may fit, why it may not fit,
  its day-to-day rhythm, and one low-risk experiment.
- A compact conversation now sits directly beneath the selected-role brief and
  visually continues the intake at a smaller scale.
- The student can type a natural question or use one of three concise starter
  prompts. Enter submits and Shift+Enter adds a line break.
- Conversation messages and drafts are held separately per role during the active
  visit. Switching roles restores the prior role conversation without leakage.
- Interpretive answers target 2–4 sentences and roughly 50–90 words. Researched
  answers target 3–5 sentences and roughly 70–120 words before source details.
- The synchronous `/api/role-conversation` boundary validates the complete
  profile, approved summary, selected role, role-scoped history, question,
  request identity, and anonymous safety identifier.
- GPT-5.6 receives one stateless Responses API request per message with automatic
  web-search access. Search is forced for deterministically recognized unstable
  topics such as current programs, costs, admissions, licensing, salary, and
  location-specific opportunities.
- Researched answers only keep provider-retrieved HTTPS URLs. Unsupported source
  blocks are removed; if trustworthy evidence does not survive, Steppi returns an
  honest unavailable response instead of an unsupported current claim.
- Source links appear beside supported prose. Source title, publisher, and date
  checked remain collapsed until the student opens the provenance disclosure.
- Loading differentiates interpretation from current-source checking. API,
  retrieval, timeout, and malformed-output failures preserve the question and
  offer safe retry without duplicating the user message.
- The former one-shot selected-role research, polling, research-node expansion,
  and fixed Manila affordability refinement have been removed. Research now
  exists only as a conditional capability inside the role conversation.
- All active intake, profile, path, and role-conversation state is in memory and
  clears on refresh.

## Important Active Decisions

- The product provides breadth before depth and possibilities rather than
  predictions or rankings.
- The initial audience is high-school students beginning college and career
  exploration.
- The selected-role conversation is a compact tidbit below the existing brief,
  not a separate full-screen chat or dense report.
- The normal answer targets are 50–90 words for interpretation and 70–120 words
  for researched prose; collapsed source metadata is excluded.
- Conversation history is separate per role during the active visit.
- Interpretive guidance grounded in validated existing context does not require
  retrieval by default.
- Unstable current claims require current retrieved support and progressively
  disclosed provenance.
- A missing or malformed source-backed answer fails safely; it does not degrade
  into an unsupported factual response.
- The three-attempt application retry policy applies only to path generation.
  Non-recoverable input, configuration, authentication, permission, and content-
  filter failures stop immediately; other model calls are unchanged.
- No authentication, persistence, database, comprehensive dataset, global search,
  or general agent architecture is in scope for the Build Week demo.

## Active Milestone

**Milestone 7 — Reliability and Submission**

Milestone 5 (Extended Role Conversation) and Milestone 6 (Conditional Research)
are implemented and deterministically verified. Path-generation assignment now
has an explicit, bounded three-attempt reliability policy.

## Verification Completed on 2026-07-20

- `npm run lint` — passed.
- `npm run typecheck` — passed after Next.js regenerated its development route
  types without the deleted `/api/research` route.
- `npm run test` — passed, 26 files and 194 tests.
- `npm run build` — passed; production output contains
  `/api/role-conversation` and no `/api/research` route.
- `git diff --check` — passed.
- Desktop browser fixture verification passed for role selection, unchanged role
  brief, interpretive loading/answer, current-source loading/answer, 80-word
  researched fixture prose, collapsed and expanded provenance, role switching,
  role-history restoration, retry without a duplicate question, and safe
  malformed-output rejection.
- Mobile browser verification at 390×844 passed with the complete vertical role
  fallback, complete seven-role success state, exhausted-retry error fixture,
  retry control, and no horizontal overflow.
- The inspected browser session had no console errors and no framework error
  overlay. The home route also rendered normally.
- One authorized live local `profile-live-paths` action succeeded on the first
  GPT-5.6 attempt and assigned seven validated roles. The dev logger collapsed
  that completion object's fields; diagnostics now serialize as one safe JSON
  message, covered by a deterministic regression test. No second paid call was
  made.

## Current Blockers

- Vercel Authentication still blocks anonymous Preview access; the deployed
  golden path remains unavailable to judges until that project setting changes.

## Non-blocking Reliability Debt

- Refresh clears all active state, including per-role conversations.
- The new role-conversation provider boundary has deterministic mocked coverage
  but no fresh live or paid GPT-5.6 quality pass.
- The browser-control surface focused native role buttons but did not dispatch
  Enter or Space activation in this run. The controls remain semantic native
  buttons with visible focus styles; real-browser keyboard activation should be
  repeated with a keyboard-capable runner before final submission.
- Intake duration and screen-reader behavior remain unmeasured.
- The 6–8-role generation contract has not been calibrated against a materially
  different live persona.

## Exact Next Recommended Task

```text
Run the final submission reliability pass using deterministic fixtures only.
Repeat the complete landing → intake/profile fixture → confirmation → seven-role
space → selected-role brief → interpretive follow-up → researched follow-up flow
with a real keyboard-capable browser runner and confirm Enter/Space role
activation, focus return, Tab order, and screen-reader labels. Then recheck the
public deployment configuration and remove Vercel Authentication if authorized.
Do not make another live or paid GPT-5.6 request or deploy unless separately
authorized.
```
