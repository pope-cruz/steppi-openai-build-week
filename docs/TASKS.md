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
- Research now starts exactly one server-only background Responses API job,
  keeps its provider ID inside an encrypted HttpOnly same-site cookie, and polls
  that same response every 2.5 seconds for up to 120 seconds. Status and cancel
  never create another response; cancel is provider-idempotent per local handle.
- Completed output still passes through the unchanged Structured Outputs parser,
  research schema, and retrieved-URL allow-list before rendering. The model,
  output meaning, and Structured Outputs schema are unchanged.
- Fixture-backed queued, in-progress, success, no-source, provider-failure,
  malformed-output, cancel, timeout, retry, and duplicate-prevention states are
  covered. Current factual research is **not yet verified live**.
- Diagnostics now distinguish configuration, upstream API, parsing, schema,
  source processing, timeout, and client-rendering boundaries without recording
  prompts, raw output, API keys, or student data.
- One final authorized background request completed at the provider, but source
  normalization rejected it safely as
  `source_processing/model_output_validation/retrieved_sources_missing`; the
  public route returned HTTP 502. No upstream code or request ID was available,
  no result rendered, and no retry occurred.
- Creation and every background status retrieval now request
  `web_search_call.action.sources`; creation still requires web search. The
  completed-response extractor allow-lists provider-backed URLs from both
  search-call sources and output-text `url_citation` annotations; model-authored
  URLs still cannot pass without matching provider evidence.
- Active student, map, and research state remain intentionally in memory.

## Active Milestone

Milestone 4 — Source-backed Research Expansion. The scoped implementation and
deterministic verification are present; the required live retrieval/synthesis
success remains open. See [SPEC.md](./SPEC.md).

## Immediate Objective

Perform one separately authorized final live `/api/research` verification with
no automatic or repeated retries; audit the rendered sources if it succeeds.

## In Progress

- No implementation is currently in progress; the source-extraction fix has
  passed deterministic verification only.

## Next Recommended Tasks

1. Perform one separately authorized final live `/api/research` verification
   with no automatic or repeated retries. If it succeeds, render and source-audit
   the exact result before deciding Milestone 4 status.
2. Complete the deferred second-persona and native Enter/Space graph checks in
   the reliability pass.

## Current Blockers

- Live research still has no renderable result. The single background response
  completed before the extractor handled output-text `url_citation` annotations,
  so the source allow-list received no provider URLs and rejected the output as
  `source_processing/model_output_validation/retrieved_sources_missing` with
  public HTTP 502. The corrected extractor is not yet live-verified.
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
  API background response, required hosted web search, GPT-5.6 structured output,
  zero automatic retries, strict Zod validation, and a retrieved-URL allow-list.
- The background job handle is an encrypted HttpOnly same-site cookie containing
  only the provider response ID, a context hash, check date, creation time, and
  cancellation flag. It expires quickly, does not make jobs resumable after a
  reload, and does not expose the provider ID.
- OpenAI-facing schemas use only the documented Structured Outputs subset. URL
  protocol and syntax remain strict runtime checks after parsing instead of
  emitting the unsupported JSON Schema `format: uri` keyword.
- Timeout classification uses the installed SDK timeout class identity first,
  then bounded safe name/code signals with at most one nested cause. Generic SDK
  connection errors remain `connection_failed`; there is no speculative
  hosted-search diagnostic without a returned tool-call signal.
- Provider source evidence may come from completed web-search call sources or
  output-text URL-citation annotations. Both are allow-list inputs; model-authored
  source URLs remain untrusted unless they match that provider evidence.
- Research adds no more than five nodes to one selected branch. Insufficient
  evidence and all failures render honest, retryable states without changing the map.
- No authentication, persistence, database, comprehensive dataset, global search,
  or refinement infrastructure is part of the research slice.
- The questionnaire intake is temporary UX debt; the intended final interaction
  is a continuous transcript with a stable composer and contextual follow-ups.

## Unverified Behavior

- The corrected retrieval include and dual-location provider-source extractor
  have not been exercised against a live completed GPT-5.6 response. No live
  request was made in this pass.
- Live background creation, polling, and provider completion are verified.
  Live source normalization and research rendering remain unverified at the
  `retrieved_sources_missing` boundary.
- No live factual claim was rendered, so there was nothing to source-audit or
  correct in this pass.
- The research loop is not deployed or verified in Vercel.
- A materially different map persona and native Enter/Space activation remain
  verification debt for the reliability pass; do not block refinement on them.
- Real upstream no-source, timeout, malformed-output, and retrieval-failure
  responses were not induced; deterministic service and route tests cover them.
- Root error/loading foundations were not deliberately forced in-browser.
