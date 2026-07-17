---
title: Steppi Operational Handoff
project: Steppi
event: OpenAI Build Week
status: active
version: 0.1
last_updated: 2026-07-17
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
- The desktop map now pairs its dominant four-node graph with a synchronized
  three-item path index. Both surfaces use the existing branch titles, roles,
  and summaries; selecting either focuses the same graph node and reveals only
  that branch's detail. Mobile uses the path index as its non-graph fallback.
- Research now starts exactly one server-only background Responses API job,
  keeps its provider ID inside an encrypted HttpOnly same-site cookie, and polls
  that same response every 2.5 seconds for up to 120 seconds. Status and cancel
  never create another response; cancel is provider-idempotent per local handle.
- Completed output now uses atomic source-backed claims: every title and factual
  claim names one or more URLs attached to its node and present in the existing
  provider-retrieved allow-list. Detached evidence and unused source records fail
  validation; the server check date, branch parent, and five-node cap remain.
- Fixture-backed queued, in-progress, success, no-source, provider-failure,
  malformed-output, cancel, timeout, retry, and duplicate-prevention states are
  covered by tests. The 2026-07-17 browser audit reconfirmed every listed state
  except cancellation, which remained stuck in polling and is now a known defect.
- Diagnostics now distinguish configuration, upstream API, parsing, schema,
  source processing, timeout, and client-rendering boundaries without recording
  prompts, raw output, API keys, or student data.
- Creation and every background status retrieval now request
  `web_search_call.action.sources`; creation still requires web search. The
  completed-response extractor allow-lists provider-backed URLs from both
  search-call sources and output-text `url_citation` annotations; model-authored
  URLs still cannot pass without matching provider evidence.
- A 2026-07-17 clean-browser audit completed one local live profile request, one
  live path request, and one live research creation. All three succeeded without
  retry. Research completed after 24 status polls and rendered five nodes with 13
  displayed citations across 11 unique HTTPS destinations; every destination
  resolved and the nodes remained attached only to the selected branch.
- The audit's trust gap is corrected deterministically. The UI renders each atomic
  claim beside its exact source references and labels profile-based relevance as a
  Steppi connection, not a sourced fact. Affordability results require sourced
  cost, eligibility, and conditional-aid claims together or show unavailable.
- Audit regressions prevent unsupported UP Visual Communication curriculum claims
  and require the CIIT PHP 135,000–165,000 annual estimate plus conditional-aid
  caveat when that fixture appears in an affordability result.
- Active student, map, and research state remain intentionally in memory.

## Active Milestone

Milestone 4 reliability boundary — Source-backed Research Expansion. The
claim-to-source contract is corrected and fixture-verified, but the revised
Structured Outputs contract has not yet had a separately authorized live request
and claim-by-claim source audit. Milestone 5 refinement remains unimplemented.

## Immediate Objective

Perform one separately authorized live research request using the revised atomic
claim contract, then audit every rendered claim against its linked source. Do not
begin refinement until that live boundary passes.

## In Progress

- No implementation is currently in progress.

## Next Recommended Tasks

1. Authorize exactly one live background research request. Audit every rendered
   atomic claim, title, source, date, caveat, confidence, and selected-branch-only
   expansion; do not retry automatically.
2. Fix and real-browser verify research cancellation. The 2026-07-17 deterministic
   `research-cancel` fixture stayed in polling after repeated pointer and Enter
   activation of the visible cancel control.
3. Reuse the research timeout classifier for profile and path generation so real
   SDK timeouts are not mislabeled as generic API failures, and add equivalent safe
   category/stage/reason/status/code/request-ID diagnostics.
4. Implement one validated branch-local refinement, preserving the selected
   branch's sources and every unaffected graph area, then deploy and verify an
   anonymously accessible golden path.

## Exact Next Recommended Prompt

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/TASKS.md, and the latest
2026-07-17 research trust-boundary entry in docs/BUILD_LOG.md. Make exactly one
live background `/api/research` request using the current atomic-claim schema; do
not retry, redesign, refine, deploy, or change the contract first. Render the
exact result in the real app and audit every title and claim against its linked
provider-retrieved source, including date, limitation, confidence, and any cost,
eligibility, or conditional-aid statement. Confirm the student, three original
branches, selected branch, and unrelated graph state remain stable. Run the full
validation suite and update TASKS/BUILD_LOG. Mark Milestone 4 complete only if
the live result renders and every displayed factual claim passes its source audit.
```

## Current Blockers

- The revised atomic-claim Structured Outputs contract has not yet been exercised
  by a live research request or claim-by-claim source audit.
- Branch-local refinement is not implemented, so the complete student exploration
  loop stops after research.
- Vercel Authentication blocks anonymous Preview access, and the audited research
  flow is not deployed for judge verification.

## Known Issues

- The visible research cancel control did not transition out of polling in the
  deterministic browser fixture after pointer or keyboard activation. The actual
  live provider-cancel boundary was not retested to avoid a second paid request.
- Profile and path timeout classification still checks `error.name`; the installed
  OpenAI SDK's timeout class can retain the generic `Error` name. Those routes can
  therefore report an actual timeout as generic `api_failure` and do not retain the
  safe diagnostic detail available on the research route.
- Research validation enforces explicit claim-to-source addressing and URL
  provenance, but deterministic code cannot prove semantic entailment from URL
  structure alone; the next live result still requires a human-readable source audit.
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
  API background response, required hosted web search, GPT-5.6 structured output,
  zero automatic retries, strict Zod validation, and a retrieved-URL allow-list.
- The background job handle is an encrypted HttpOnly same-site cookie containing
  only the provider response ID, a context hash, check date, creation time, and
  cancellation flag. It expires quickly, does not make jobs resumable after a
  reload, and does not expose the provider ID.
- OpenAI-facing schemas use only the documented Structured Outputs subset. URL
  protocol and syntax remain strict runtime checks after parsing instead of
  emitting the unsupported JSON Schema `format: uri` keyword.
- Research timeout classification uses the installed SDK timeout class identity first,
  then bounded safe name/code signals with at most one nested cause. Generic SDK
  connection errors remain `connection_failed`; there is no speculative
  hosted-search diagnostic without a returned tool-call signal.
- Provider source evidence may come from completed web-search call sources or
  output-text URL-citation annotations. Both are allow-list inputs; model-authored
  source URLs remain untrusted unless they match that provider evidence.
- Current research output separates atomic factual claims from the student-specific
  relevance note. Every title and claim points to attached provider-backed URLs,
  every attached source must be visibly used, and affordability output is rejected
  unless cost, eligibility, and conditional-aid claims are all present.
- Path discovery uses one synchronized state across the desktop graph and its
  browseable path index. The index improves scanability but does not replace the
  graph, add branches, or reveal multiple branches' evidence at once.
- Research adds no more than five nodes to one selected branch. Insufficient
  evidence and all failures render honest, retryable states without changing the map.
- No authentication, persistence, database, comprehensive dataset, global search,
  or refinement infrastructure is part of the research slice.
- The questionnaire intake is temporary UX debt; the intended final interaction
  is a continuous transcript with a stable composer and contextual follow-ups.

## Unverified Behavior

- The public deployed golden path remains unverified; the audited flow ran locally.
- No live model request was made after the atomic-claim schema change, so live
  Structured Outputs acceptance and semantic source support remain unverified.
- A real live cancellation was not induced. The deterministic browser cancellation
  check failed, while unit tests still pass.
- Profile and path upstream status, code, and request ID remain unavailable in
  their current error model. The controlled profile configuration failure returned
  HTTP 503 with no upstream code or request ID, as expected before any SDK request.
- Native Enter activation of the landing CTA could not be dispatched by the audit
  browser surface; pointer navigation worked, branch Enter/Space activation worked,
  and visible focus styling was verified.
- Path browsing remains unverified with a materially different persona. The live
  persona did exercise materially longer branch titles without overflow.
- Real upstream no-source, timeout, malformed-output, and retrieval-failure
  responses were not induced; deterministic service and route tests cover them.
- Root error/loading foundations were not deliberately forced in-browser.
