---
title: Steppi Operational Handoff
project: Steppi
event: OpenAI Build Week
status: active
version: 0.2
last_updated: 2026-07-18
---

# Steppi Operational Handoff

See [SPEC.md](./SPEC.md) for the current Build Week implementation contract,
[VISION.md](./VISION.md) for product direction, and
[BUILD_LOG.md](./BUILD_LOG.md) for historical implementation and verification
evidence. [DESIGN.md](./DESIGN.md) retains useful visual-craft guidance, but its
former exact-three graph structure is explicitly superseded pending realignment.

## Current Product Direction

Steppi is a guided career-exploration companion for high-school students with
limited exposure to available roles. The product follows **breadth before depth**:

1. discover several varied roles;
2. understand each role quickly; and
3. explore an interesting role through an extended conversation.

The intended Build Week experience presents approximately seven unranked career
roles in a floating possibility space. Selecting a role should explain what it
is, why it may fit, why it may not fit, and what its day-to-day work is like.
The student can then ask natural follow-up questions. Current-source research is
used only when an answer requires unstable external facts.

The visualization supports discovery, switching, and orientation. It is not a
living graph that every response must mutate.

## Current Implemented Behavior

- A clear landing page introduces exploration rather than prediction.
- The in-memory intake is a persistent conversation with three ordered anchors,
  one or two controller-selected follow-ups, one final consideration question,
  multiline composition, revision, request locking, transcript preservation,
  loading, failure, malformed-output, fallback, and retry behavior.
- Server-only GPT-5.6 profile generation now returns the unchanged validated
  structured profile plus an exactly two-sentence, direct-address
  `confirmationSummary` in the same request.
- Confirmation leads with only that warm reflection. The complete structured
  profile is collapsed by default in a secondary disclosure. The student can
  accept it with **Good to go!** or directly edit it with **Let me refine this**.
- A saved edit becomes `confirmedSummary` without another model request or a
  reverse transformation into profile fields. The legacy profile-refinement API
  remains in the repository but no longer drives the normal confirmation screen.
- Role generation receives the unchanged profile followed by `confirmedSummary`.
  The approved wording resolves contradictions and priorities or adds context;
  stylistic omissions do not discard useful structured details.
- Path generation now returns one validated set of 6–8 unranked career roles,
  targeting seven, in a single request. Every role includes the complete concise
  selected-role explanation contract and valid profile-evidence references.
- The desktop overview is a deterministic floating field of title-only role pills
  with no edges, rankings, scores, or graph controls. Mobile renders the complete
  same role set as a vertical list of large title-only pills.
- Selecting one role opens a concise, student-facing role brief and preserves
  the other roles. Supporting profile evidence, the unresolved question, and
  related directions remain available through progressive disclosure. Its
  presentation is now lighter and more compact, uses balanced fit/mismatch
  sections, and translates internal confidence into warm exploration framing.
- Selected-path research exists as a one-shot focused question followed by a
  source-backed expansion. It is not yet an extended role conversation.
- Research output uses strict structured validation, provider-retrieved source
  allow-listing, atomic claim citations, safe partial acceptance, honest
  no-result behavior, explicit retry, and state preservation.
- The fixed post-research action **Prioritize affordable options near Manila** is
  implemented. It performs a second validated affordability-focused research
  pass, preserves baseline findings while loading or failing, supports explicit
  retry, and preserves unrelated profile and map state.
- All active student, transcript, profile, path, research, and refinement state is
  in memory and clears on refresh.

## Important Product-contract Correction

The implementation previously reflected the former exact-three, graph-first,
research-then-refinement demo contract. That completed history remains real, but
the normal generation and overview flow is now aligned to the unranked role space.

The current intended product differs in these ways:

- approximately seven varied career roles replace exactly three ranked-like
  branch roles as the Build Week target;
- the role space is an unranked floating discovery surface rather than a fixed
  central-student branch graph;
- every role needs a short role-first explanation before research;
- natural follow-up questions and an extended role conversation provide depth;
- research is conditional on unstable external facts rather than mandatory after
  role selection; and
- the fixed Manila affordability action is optional historical demo capability,
  not part of the default golden path or definition of completion.

Do not delete the existing fixed refinement, its tests, or its validation and
state-preservation mechanisms during product alignment. They remain useful
technical evidence and may inform later work.

## Product-alignment Gaps

### Extended role conversation

The current product supports one research-question composer for a selected path.
It does not yet maintain an extended message history grounded in the selected
role and student context, support interpretive answers without retrieval, or
restore an existing role conversation after switching roles.

### Research presentation

The source-trust boundary is strong, but the default rendered result emphasizes
atomic claim labels, title-source indices, confidence, URLs, and source directories.
The intended presentation should lead with the direct answer, relevance, and
caveats, with detailed provenance progressively disclosed.

## Important Active Decisions

- The product provides breadth before depth.
- Initial audience: high-school students beginning college and career exploration.
- The intake remains conversational, concrete, correctable, and non-diagnostic.
- The initial confirmation is exactly two generated sentences; direct student
  edits take precedence over the formatting constraint and do not mutate the
  original structured profile.
- Role generation uses the complete profile for breadth and the approved summary
  to resolve contradictions, additions, and priorities.
- The normal Build Week target is approximately seven career roles; roughly seven
  to ten may be acceptable when context and layout justify it.
- Roles must be meaningfully varied and must not be presented as an objective
  ranking or prediction.
- The possibility space supports discovery and navigation; arbitrary graph
  mutation is not required.
- Every role must explain what it is, possible fit, possible mismatch, and
  day-to-day work before deep research.
- Students ask natural follow-up questions in an extended role conversation.
- Interpretive guidance based on validated existing context does not require a
  new retrieval pass.
- Unstable external factual claims require current retrieved support.
- Detailed claim-to-source provenance remains validated but should be
  progressively disclosed.
- The fixed Manila affordability refinement is implemented but optional and
  outside the default golden path.
- No authentication, persistence, database, comprehensive dataset, graph library,
  or speculative infrastructure is part of the immediate alignment work.

## Active Milestone

**Milestone 5 — Extended Role Conversation**

Milestone 2 — Student-context Confirmation is now implemented and deterministically
verified with the two-sentence generation contract, direct student refinement,
secondary details, and approved-summary precedence. The next product gap is one
role-specific extended conversation with conditional retrieval.

## Recommended Implementation Sequence

1. ~~Enrich the selected-role explanation and validated path data contract.~~
2. ~~Refine the selected-role explanation presentation.~~
3. ~~Replace exact-three branch generation and overview with the
   approximately-seven varied-role contract, unranked floating role space, and
   accessible mobile fallback.~~
4. ~~Align the concise student-context confirmation.~~
5. **Add one role-specific extended conversation with natural questions and
   conditional retrieval.**
6. Simplify researched-answer presentation through progressive disclosure while
   preserving source validation.
7. Run full reliability, accessibility, deployment, and submission verification.

Do not combine these into one broad refactor. Preserve working downstream behavior
until the corresponding alignment step explicitly changes it.

## Exact Next Recommended Task

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/TASKS.md, and the latest
relevant docs/BUILD_LOG.md entries. Inspect the confirmed StudentProfile and
confirmedSummary flow, selected-role state, existing research boundary, fixtures,
and tests.

Implement the smallest complete selected-role extended conversation in SPEC.md.
Keep one conversation history scoped to one selected role, accept natural
free-text follow-up questions, and ground each response in the validated profile,
student-approved confirmedSummary, selected-role explanation, and prior messages.
Answer interpretive questions without retrieval; use the existing validated
research boundary only when a question requires unstable external facts.

Preserve the conversational intake, two-sentence confirmation and direct editing,
6–8 unranked role generation, floating role space, selected-role explanation,
source trust boundary, and optional Manila refinement. Do not add authentication,
persistence, a database, global search, per-role generation calls, or a general
agent architecture.

Use deterministic fixtures and mocked model/retrieval boundaries. Verify role-
scoped history, natural questions, interpretive no-retrieval answers, conditional
research, failure/retry, switching without cross-role leakage, desktop/mobile,
keyboard use, and the console. Run lint, typecheck, tests, build, and
git diff --check; update TASKS.md and BUILD_LOG.md accurately. Do not make a live
or paid request unless separately authorized.
```

## Current Blockers

- No known technical blocker prevents the selected-role conversation work.
- Vercel Authentication still blocks anonymous Preview access; the current
  deployed golden path remains unverified for judges.

## Non-blocking Reliability Debt

- Profile and path timeout classification may report an SDK timeout as generic
  `api_failure` because those routes still rely on `error.name`.
- Refresh clears all active state.
- Intake duration and screen-reader behavior remain unmeasured.
- Revised intake interpretation and profile refinement have deterministic but not
  fresh live GPT-5.6 verification.
- The generated two-sentence confirmation and role-generation precedence rules
  are deterministically verified but have no fresh live GPT-5.6 quality check or
  representative-student comprehension study.
- The 6–8-role generation contract and seven-role fixture have not been calibrated
  through a fresh live GPT-5.6 response or a materially different persona.
- The enriched path contract and role brief are fixture-verified but have not had
  a fresh live or paid GPT-5.6 generation; active path state is in memory, so no
  persisted-data migration was required.
- The fixed affordability refinement has deterministic provider-boundary and
  browser evidence but no live or paid GPT-5.6 verification.
