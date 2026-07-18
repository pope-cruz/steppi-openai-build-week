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
- Server-only GPT-5.6 profile generation uses structured output and runtime
  validation. Direct facts, model inferences, constraints, uncertainty, and
  tensions remain distinct in the current validated profile.
- Profile correction exists as a separate server-only structured-output boundary.
  Validated patches apply atomically, and failure preserves the last valid profile.
- Path generation currently returns exactly three validated branches: strongest
  current fit, adjacent possibility, and underexplored possibility. Each branch
  now includes a one-sentence role definition, one or two profile-grounded fit
  and possible-mismatch sentences, two or three concrete day-to-day sentences,
  and one low-risk exploration action in the same validated generation response.
- The current desktop overview is a fixed student-and-three-branch SVG layout with
  a synchronized side navigator. Mobile uses the three-item navigator rather than
  the graph.
- Selecting one branch opens a concise, student-facing role brief and preserves
  the other branches. Supporting profile evidence, the unresolved question, and
  related directions remain available through progressive disclosure.
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

The current implementation reflects the former exact-three, graph-first,
research-then-refinement demo contract. That implementation remains real and must
not be described as nonexistent.

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

### Possibility breadth and visual model

The implementation still generates exactly three branches and uses a fixed
four-node graph. It does not yet generate approximately seven varied career roles
or render an unranked floating role space.

### Student-context confirmation

The current confirmation is a deterministic decision statement plus three lists.
It remains denser than the intended concise human understanding and still uses
`Build my map` / `Refine this first` language.

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

**Milestone 2 alignment — Concise Student-context Confirmation**

Milestone 4 — Lightweight Role Understanding is implemented and deterministically
verified for the current exact-three path boundary. The next slice is to align the
student-facing profile confirmation with the concise, natural-language contract
in SPEC.md while preserving its detailed validated internal profile and all
working downstream behavior.

## Recommended Implementation Sequence

1. ~~Enrich the selected-role explanation and validated path data contract.~~
2. **Align the concise student-context confirmation.**
3. Replace exact-three branch generation with the approximately-seven varied-role
   contract and validation.
4. Replace the fixed branch graph with the unranked floating role space and
   accessible mobile fallback.
5. Add one role-specific extended conversation with natural questions and
   conditional retrieval.
6. Simplify researched-answer presentation through progressive disclosure while
   preserving source validation.
7. Run full reliability, accessibility, deployment, and submission verification.

Do not combine these into one broad refactor. Preserve working downstream behavior
until the corresponding alignment step explicitly changes it.

## Exact Next Recommended Task

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/TASKS.md, and the latest
relevant docs/BUILD_LOG.md entries. Inspect the current StudentProfile contract,
profile-confirmation UI, correction flow, fixtures, and tests.

Implement only the concise student-context confirmation alignment in SPEC.md.
Present exactly three natural-language sentences that communicate what Steppi
understood, followed by “Is there anything we missed or misunderstood?” and the
actions “Looks right” and “Make a correction”. Keep the public copy warm,
tentative, easy to scan, and grounded in the validated profile.

Preserve the detailed validated StudentProfile, correction API, conversational
intake, exact-three path generation, enriched role explanations, path overview,
research, and optional fixed Manila affordability refinement. Do not implement
approximately-seven generation, the floating role-space redesign, extended role
chat, conditional-research orchestration, or a new graph system.

Add focused deterministic tests for the three-sentence contract, correction,
failure, retry, and downstream state preservation. Verify the normal and error
flows in a real browser on desktop and mobile, including keyboard use and the
console. Run lint, typecheck, tests, build, and git diff --check. Update TASKS.md
and BUILD_LOG.md with verified results and the next smallest alignment task. Do
not make a live or paid OpenAI request unless strictly necessary, and report
whether one occurred.
```

## Current Blockers

- No known technical blocker prevents the student-context confirmation work.
- Vercel Authentication still blocks anonymous Preview access; the current
  deployed golden path remains unverified for judges.

## Non-blocking Reliability Debt

- Profile and path timeout classification may report an SDK timeout as generic
  `api_failure` because those routes still rely on `error.name`.
- Refresh clears all active state.
- Intake duration and screen-reader behavior remain unmeasured.
- Revised intake interpretation and profile refinement have deterministic but not
  fresh live GPT-5.6 verification.
- The current three-path generation has not been calibrated with a materially
  different persona.
- The enriched path contract and role brief are fixture-verified but have not had
  a fresh live or paid GPT-5.6 generation; active path state is in memory, so no
  persisted-data migration was required.
- The fixed affordability refinement has deterministic provider-boundary and
  browser evidence but no live or paid GPT-5.6 verification.
