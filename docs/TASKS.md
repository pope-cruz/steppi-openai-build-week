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
  transcript-preservation behavior. It now uses the three required anchors,
  deterministic follow-up purposes, the exact final consideration question,
  revision/source-turn scoped interpretation, and deterministic failure
  progression into the existing profile handoff.
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
- Deterministic code chooses the purpose of one or two follow-ups in this fixed
  priority: resolve a contradiction, distinguish plausible directions, clarify a
  recommendation-changing practical constraint, then fill a material evidence
  gap. GPT-5.6 may make that purpose conversational but may not invent arbitrary
  personality-test topics or request sufficiently supplied information.
- Intake then asks “Before I put this together, is there anything else Steppi
  should consider?” exactly once using `final-consideration`. “Nothing,” “no,” and
  “I don't know” stay unchanged in the transcript and profile payload, skip turn
  interpretation, and begin profile generation immediately.
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

1. Conversational intake question-policy and transcript experience — complete.
2. Three-sentence profile confirmation and correction flow — next.
3. Path data contract and path-detail refinement.
4. Regression verification of graph and research.
5. Final UX and submission polish.

Do not mark working downstream features incomplete while their contracts or
presentation are being refined. Verify and preserve them at the regression step.

## Exact Next Recommended Task

Implement the exactly three-sentence public profile confirmation and correction
flow in `SPEC.md`: concise sentence ordering, “Is there anything we missed or
misunderstood?”, and **Looks right** / **Make a correction** actions. Preserve the
detailed validated internal profile, transcript references, direct-fact versus
inference distinction, corrected intake handoff, exact-three graph, research
architecture, and branch-local behavior.

## Current Blockers

- No known blocker prevents the public profile confirmation alignment.
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
- Intake interpretation has deterministic fixture coverage but no live GPT-5.6
  verification for the revised candidate contract.
- Profile refinement has deterministic but not live GPT-5.6 verification.
- Path browsing has not been calibrated with a materially different persona.
- The public deployed golden path remains unverified.
