---
title: Steppi Operational Handoff
project: Steppi
event: OpenAI Build Week
status: active
version: 0.3
last_updated: 2026-07-21
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
3. scan twelve to fifteen varied, unranked career roles;
4. understand one selected role in under a minute; and
5. ask concise follow-ups in a role-specific conversation, using current-source
   research only when the question requires unstable external facts.

The role space supports discovery and switching. It is not a ranking, prediction,
or technical graph editor.

## Current Implemented Behavior

- The landing page now positions Steppi explicitly as an AI guidance counsellor
  for high-school students while stating that it does not predict the right
  career or replace a school counsellor. An open-notebook hero connects student
  notes to a curated sample from the larger unranked role space, then previews
  the intake, role brief, low-risk experiment, extended conversation, and
  conditional sourcing.
- The landing page uses the original Steppi light palette, Bricolage Grotesque
  display type, CSS-only notebook entry motion with an opacity-only reduced-motion
  fallback, a single-column mobile notebook, and a Steppi icon. Bricolage is also
  the shared display face across the intake, confirmation, role space, and role
  conversation; Geist remains the body face.
- The in-memory intake has three ordered anchors, controller-selected follow-ups,
  one final consideration question, revision, transcript preservation, request
  locking, loading, failure, malformed-output, fallback, and retry behavior.
- Server-only GPT-5.6 profile generation returns a validated structured profile
  and an exactly two-sentence `confirmationSummary` in one request.
- The student can accept or directly rewrite the summary. Role generation receives
  both the unchanged profile and latest approved `confirmedSummary`.
- Path generation returns one validated set of 12–15 unranked, meaningfully varied
  roles, targeting thirteen. Each role includes a concise explanation and valid
  profile-evidence references. It may make up to three sequential GPT-5.6
  attempts per click, stopping at the first complete validated set; SDK retries
  remain disabled and no partial set reaches the client.
- Desktop shows four deterministic constellation bands with three or four
  title-only role pills per band. Mobile shows the same complete role set as a
  compact one- or two-column role cloud.
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

- Hackathon-facing landing copy may describe Steppi as an AI guidance counsellor,
  but it must also preserve the product boundary that Steppi supports exploration
  and does not replace professional guidance.
- The open notebook is a landing-page explanation of the product flow, not a new
  literal intake or role-space interface.
- The original light palette remains the shared visual baseline across the
  landing page and product flow; the landing route does not introduce a separate
  automatic dark theme.
- The product provides breadth before depth and possibilities rather than
  predictions or rankings.
- The normal role-space target is thirteen, with twelve to fifteen accepted as
  one complete unranked set. The constellation is spatial presentation only: it
  has no edges, relationship claims, physics, or dragging.
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

## Verification Completed on 2026-07-21

- `npm run lint` and `npm run typecheck` passed.
- `npm run test` passed, 27 files and 197 tests, including landing-page coverage
  for positioning, safety copy, seven unique unranked roles, and intake CTAs.
- `npm run build` passed after network access allowed `next/font` to fetch the
  configured Google fonts. `/` and `/icon.svg` are statically generated.
- Real Chrome verification passed at 1440×900 and 390×844 with the original
  Steppi light palette, including when the browser requested dark mode. Desktop
  keeps the two-line headline, CTA, and full notebook in the initial viewport;
  mobile has no horizontal overflow and keeps the CTA visible before the
  single-column notebook.
- Full-page desktop and mobile inspection passed for the trust strip, intake
  example, selected-role brief, low-risk experiment, role conversation, source
  disclosure, final CTA, and footer.
- Keyboard Tab order and visible focus passed across the wordmark, navigation,
  primary CTAs, section link, and source disclosure. Reduced-motion emulation
  removed spatial transforms and retained a 160ms opacity reveal.
- Browser console errors: none. Framework error overlay: absent. No live or paid
  GPT-5.6 request was made.
- Follow-up verification confirmed Bricolage Grotesque on shared display text
  across `/` and `/intake`, Geist on body copy, and the original light canvas and
  blue accent on both routes without layout or overflow regressions.
- Role generation now accepts one complete 12–15-role assignment, targets
  thirteen, and uses a 15,000-token structured-output allowance. Deterministic
  fixtures cover the normal thirteen-role flow and the fifteen-role upper bound.
- Real Chrome verification passed for 12, 13, and 15 roles at 1440×900, the
  fifteen-role upper bound at the 1024px desktop breakpoint, and the fifteen-role
  mobile cloud at 390×844. The approved band counts rendered without overlap or
  horizontal overflow, and mobile condensed the set into ten visual rows.
- Native Enter and Space selection, active state, focus return, selected-role
  rendering, and the one-time-only entry animation passed. Reduced-motion mode
  used a short opacity reveal with no transform.
- Browser console errors: none. Framework error overlay: absent. No live or paid
  GPT-5.6 request was made and no deployment was performed.
- Final checks passed: `npm run lint`, `npm run typecheck`, `npm run test`
  (27 files, 205 tests), `npm run build`, and `git diff --check`.

## Current Blockers

- Vercel Authentication still blocks anonymous Preview access; the deployed
  golden path remains unavailable to judges until that project setting changes.

## Non-blocking Reliability Debt

- Refresh clears all active state, including per-role conversations.
- The new role-conversation provider boundary has deterministic mocked coverage
  but no fresh live or paid GPT-5.6 quality pass.
- Intake duration and screen-reader behavior remain unmeasured.
- The 12–15-role generation contract has deterministic coverage but has not been
  calibrated with a fresh live or paid GPT-5.6 request.

## Exact Next Recommended Task

```text
Run the final submission reliability pass using deterministic fixtures only.
Repeat the complete landing → intake/profile fixture → confirmation → thirteen-role
space → selected-role brief → interpretive follow-up → researched follow-up flow
with deterministic fixtures and confirm the full conversation handoff still
works with the larger role set. Then recheck the public deployment configuration
and remove Vercel Authentication if authorized. Screen-reader behavior remains a
separate accessibility check.
Do not make another live or paid GPT-5.6 request or deploy unless separately
authorized.
```
