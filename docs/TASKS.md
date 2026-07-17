---
title: Steppi Operational Handoff
project: Steppi
event: OpenAI Build Week
status: active
version: 0.1
last_updated: 2026-07-17
---

# Steppi Operational Handoff

See [SPEC.md](./SPEC.md) for the current implementation contract and acceptance
criteria, [VISION.md](./VISION.md) for product direction, [DESIGN.md](./DESIGN.md)
for interaction guidance, and [BUILD_LOG.md](./BUILD_LOG.md) for historical
implementation and verification evidence.

## Current State

- The end-to-end exploration loop is implemented: landing, in-memory
  conversational intake, server-only schema-validated GPT-5.6 profile generation,
  profile correction, exact-three path generation, graph-first exploration,
  selected-branch source-backed research, and branch-local refinement that
  preserves unaffected map areas.
- The existing intake has a persistent transcript, stable multiline composer,
  keyboard submission, revision, loading, failure, malformed-output, retry, and
  transcript-preservation behavior. Its hybrid interpreter and deterministic
  patch/validation boundary are working foundations.
- The existing public profile supports validated profile patches, retry, and
  proceeding with the last valid profile.
- The map preserves one student node, exactly three meaningfully different initial
  branches, synchronized desktop/mobile exploration, selected-node detail,
  source-backed research under one branch, and unaffected graph state.
- Research validation, current-claim sourcing, item-scoped partial acceptance,
  and safe no-result/failure behavior remain implemented and accepted for the MVP.
- Active student, transcript, map, and research state remain intentionally in
  memory.

## Product and UX Debt

- **Intake question policy:** the current broad opener, freely selected follow-up
  purposes, early completion, and 12-answer boundary do not match the required
  sequence of three ordered anchors, one or two deterministic-purpose follow-ups,
  and one final consideration question.
- **Intake experience:** the transcript foundation works, but the implementation
  must be audited against the locked requirements for one clear question per turn,
  useful acknowledgements, no filler or repeated information, multi-dimension
  answers, uncertainty, and transcript stability through profile generation.
- **Profile data contract:** the current validated profile separates facts and
  inferences, but it does not yet express every required direction, appeal,
  concern, school/outside-school experience, concrete activity, priority, and
  transcript-reference distinction in the new `StudentProfile` contract.
- **Public profile:** the current presentation remains overly dense relative to
  the locked confirmation contract, is not guaranteed to be exactly three
  sentences, and still uses the old prompt and `Build my map` / `Refine this
  first` actions instead of **Looks right** / **Make a correction**.
- **Path data and detail:** current details remain too profile-focused and
  insufficiently explanatory. The payload and panel do not yet guarantee path
  snapshots, three or four explained activities, work characteristics, paired
  tradeoffs, exploration routes, differentiated nearby paths, and concise
  personalization.
- Former supporting-profile grids, repeated fact cards, unexplained confidence or
  skill labels, generic related-option pills, long justifications, vague multi-role
  titles, and unsupported current claims are deprecated.

## Important Active Decisions

- Intake asks exactly three anchor questions in this order: existing
  possibilities, school experiences, outside-school experiences.
- Deterministic code chooses the purpose of one or two follow-ups only for a
  material gap, contradiction, plausible-direction distinction, or
  recommendation-changing practical constraint. GPT-5.6 may make that purpose
  conversational but may not invent arbitrary personality-test topics.
- Intake then asks the specified final consideration question exactly once.
  “Nothing,” “no,” and “I don't know” complete intake immediately.
- The transcript remains visible and stable; answers may satisfy several profile
  dimensions; supplied information is not requested again; uncertainty is valid.
- The internal profile remains detailed. Direct student statements and model
  inferences are separate and retain transcript-turn references.
- The public confirmation contains exactly three natural-language sentences,
  followed by “Is there anything we missed or misunderstood?” and **Looks right**
  / **Make a correction**. Corrections patch the validated profile atomically.
- Each initial path has one focused title and primarily explains the path:
  snapshot, activities, work characteristics, tradeoffs, exploration routes, and
  nearby-path differences. Personalization is brief and includes one possible
  mismatch or open question.
- Initial path details target approximately 70 percent path explanation, 20
  percent student connection, and 10 percent uncertainty/refinement.
- Salary, demand, degree prevalence, program availability, admissions, cost, and
  location claims remain out of the initial hypothesis unless retrieved from
  current sources.
- Intentionally unchanged: exactly three initial directions and their roles; the
  graph-first interaction; selected-branch research; current source validation;
  and branch-local refinement that preserves unaffected graph areas.
- No authentication, persistence, database, comprehensive dataset, or global
  search is part of this alignment work.

## Implementation Sequence

1. Conversational intake question-policy and transcript experience.
2. Three-sentence profile confirmation and correction flow.
3. Path data contract and path-detail refinement.
4. Regression verification of graph and research.
5. Final UX and submission polish.

Do not mark working downstream features incomplete while their contracts or
presentation are being refined. Verify and preserve them at the regression step.

## Exact Next Recommended Task

Overhaul the conversational intake to implement the three ordered anchors, one or
two deterministically purposed adaptive follow-ups, and the exact final
consideration question. Preserve the working hybrid server-side interpretation,
validated state patches, persistent transcript, revision, multiline and keyboard
input, loading, failure, malformed-output, retry, and downstream profile handoff.
Add deterministic tests and real-browser verification for the intake acceptance
criteria in `SPEC.md`; do not change the exact-three graph, research architecture,
or branch-local behavior.

## Current Blockers

- No known blocker prevents the conversational intake overhaul.
- Vercel Authentication still blocks anonymous Preview access; the audited flow
  is not yet deployed for judge verification.

## Non-blocking Reliability Debt

- The visible research cancel control did not leave polling in one deterministic
  browser fixture; the live provider-cancel boundary was not retested to avoid an
  unnecessary paid request.
- Profile and path timeout classification may report an SDK timeout as generic
  `api_failure` because those routes still rely on `error.name`.
- Refresh clears intake, profile, map, selection, and research state.
- Intake duration and screen-reader behavior remain unmeasured.
- Profile refinement has deterministic but not live GPT-5.6 verification.
- Path browsing has not been calibrated with a materially different persona.
- The public deployed golden path remains unverified.
