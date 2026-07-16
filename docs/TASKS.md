---
title: Steppi Operational Handoff
project: Steppi
event: OpenAI Build Week
status: active
version: 0.1
last_updated: 2026-07-16
---

# Steppi Operational Handoff

See [SPEC.md](./SPEC.md) for acceptance criteria and
[BUILD_LOG.md](./BUILD_LOG.md) for implementation history, detailed checks,
deployment records, and audit evidence.

## Current State

- Implemented: landing shell; eight-question in-memory intake; server-only,
  schema-validated GPT-5.6 profile and exact-three path generation; local profile
  correction; the graph-first map; and one branch-local research expansion.
- A selected branch now offers three suggestions and free text, preserves the
  confirmed profile and all original branches, and renders at most five concise,
  validated research nodes beneath only that branch.
- Research uses one server-only Responses API attempt with required hosted web
  search. Every rendered source must be among the URLs retrieved during that
  request and includes title, URL, date checked, relevance, caveat, and confidence.
- Fixture-backed success, no-source, retrieval, API, malformed-output, and retry
  states are covered. Current factual research is **not yet verified live**: the
  single permitted local attempt returned the safe `api_failure` response.
- Active student, map, and research state remain intentionally in memory.

## Active Milestone

Milestone 4 — Source-backed Research Expansion. The scoped implementation and
deterministic verification are present; the required live retrieval/synthesis
success remains open. See [SPEC.md](./SPEC.md).

## Immediate Objective

Implement one branch-local refinement using the validated researched branch,
without rebuilding the graph or changing unaffected branches. Keep the live
research failure visible as reliability debt; do not add persistence, auth, or
a database.

## In Progress

- No implementation is currently in progress.
- Live research verification is pending a reliability pass on the upstream
  `api_failure`; do not consume repeated paid attempts while diagnosing it.

## Next Recommended Tasks

1. Implement one fixture-first branch-local refinement using the researched
   branch. Preserve the profile, source evidence, original branches, and all
   unaffected nodes; validate the patch before applying it.
2. During the reliability pass, diagnose the live research `api_failure` without
   exposing credentials, then perform one deliberate end-to-end re-verification.
3. Complete the deferred second-persona and native Enter/Space graph checks.

## Current Blockers

- The single local live `/api/research` attempt returned HTTP 502 with the safe
  `api_failure` code. No live current-factual research result has therefore been
  accepted or rendered.
- Vercel Authentication blocks anonymous Preview access; the research changes
  have not been deployed.

## Known Issues

- Intake is a multi-step questionnaire, not the intended continuous transcript;
  it must be revisited before final feature freeze.
- The confirmed-profile presentation remains long and report-like; profile
  evidence should become contextual rather than repeated.
- Refresh clears intake, profile, map, selection, and researched expansion state.
- The intended three-to-five-minute intake duration has not been measured.
- Two moderate `npm audit` findings remain in Next.js's pinned PostCSS; the forced
  remediation is an unsafe framework downgrade.
- A first local build may need network access for Google-hosted fonts.
- Duplicate path detection is lexical and may need multi-persona calibration.

## Important Active Decisions

- Steppi explores possibilities for Grade 11 students; it does not predict
  outcomes. Philippine examples are useful where the student context calls for them.
- The graph is primary: one student, exactly three equal initial branches,
  progressive disclosure, secondary context panels, and branch-local updates.
- Milestone 4 uses the official OpenAI SDK, one stateless server-only Responses
  API call, required hosted web search, GPT-5.6 structured output, zero automatic
  retries, strict Zod validation, and a retrieved-URL allow-list.
- Research adds no more than five nodes to one selected branch. Insufficient
  evidence and all failures render honest, retryable states without changing the map.
- No authentication, persistence, database, comprehensive dataset, global search,
  or refinement infrastructure is part of the research slice.
- The questionnaire intake is temporary UX debt; the intended final interaction
  is a continuous transcript with a stable composer and contextual follow-ups.

## Unverified Behavior

- A live GPT-5.6 web-search response has not succeeded for `/api/research`; the
  one allowed attempt failed safely and was not retried.
- The research loop is not deployed or verified in Vercel.
- A materially different map persona and native Enter/Space activation remain
  verification debt for the reliability pass; do not block refinement on them.
- Real upstream no-source, timeout, malformed-output, and retrieval-failure
  responses were not induced; deterministic service and route tests cover them.
- Root error/loading foundations were not deliberately forced in-browser.
