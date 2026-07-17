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

- Implemented: landing shell; in-memory conversational intake; server-only,
  schema-validated GPT-5.6 profile and exact-three path generation; local profile
  correction; the graph-first map; and one branch-local research expansion.
- Intake now uses a constrained hybrid conversation: one broad opening, a
  persistent transcript and stable composer, plus a server-only GPT-5.6 turn
  interpreter that proposes a strictly validated state patch and either one
  context-specific question or completion. Deterministic code applies patches,
  resolves corrections, owns transcript checkpoints and request locks, and falls
  back safely without losing the student's words.
- Intake can complete from rich context before four student messages and can
  continue after four shallow answers. Uncertainty is valid context. Revision
  predictably removes later turns and restores the earlier structured checkpoint.
- The adapter still sends the existing validated `IntakeAnswer[]` body to
  `/api/profile`; early completion uses exact-answer compatibility copies only to
  satisfy that unchanged boundary's four-record minimum. Profile, path, graph,
  research, and refinement contracts were not changed.
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
- Completed output now uses atomic source-backed claims: every rendered title and
  factual claim names one or more URLs attached to its node and present in the
  provider-retrieved allow-list. Unsupported claims and invalid nodes are omitted,
  unused source records are removed, and every retained node is reparsed through
  the full strict render schema. The server check date, branch parent, and
  five-node cap remain.
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
- The one authorized live atomic-claim request succeeded: one background creation
  and 17 status polls rendered four nodes with 14 factual claims across seven
  provider-backed source pages under only Digital product design. All links
  resolved, the browser console was clean, and the original graph remained stable.
- The live audit accepted 13 claims but rejected one compound Figma claim. The
  cited education page supports interface mockups and interactive prototypes, not
  the added qualifier “without writing code.” The unsupported qualifier remained
  visible in a high-confidence node; the later grounding fix addressed this
  specific trust-boundary defect.
- The narrow grounding fix is now implemented. The Structured Outputs contract
  defines each claim as one independently verifiable clause, the research prompt
  requires separate claims and omission of unsupported qualifiers using the exact
  Figma failure as its counterexample, and the UI labels confidence as source
  confidence. Fixture-backed schema, service, and rendering regressions pass; no
  live `/api/research` request was made during the fix.
- The one fresh post-fix live verification made exactly one background creation
  and 22 status polls, then failed safely at the source-provenance boundary. The
  terminal route response was HTTP 502 with diagnostic category
  `source_processing`, stage `model_output_validation`, and reason
  `citation_not_retrieved`; no upstream error code or request ID was available.
  No research node, claim, or source link rendered. The student node, three
  original branches and relationships, Digital product design selection, and
  unrelated map state were preserved, and the browser console was clean.
- Milestone 4's completed boundary is resilient source-backed branch expansion
  for the Build Week MVP. One invalid or unmatched citation no longer discards valid siblings:
  claim-level failures remove the claim, node-level failures remove the node, and
  zero retained nodes still produce the existing safe retry state.
- Deterministic partial-result verification rendered two validated nodes while
  omitting the invalid sibling. It preserved one student node, all three initial
  branches, three relationships, the Digital product design selection, and the
  exact research question; the browser console was clean and no `/api/research`
  request occurred.
- Milestone 4 is complete for the Build Week MVP. Live research has rendered
  useful source-backed results, every retained claim and node crosses the strict
  provider-source validation boundary, invalid content is omitted without losing
  valid siblings, selected-branch locality and original graph state are preserved,
  and deterministic tests cover success, partial success, no-source,
  malformed-output, timeout, cancellation, retry, and duplicate prevention.
- Safe individual provider or citation failures are acceptable MVP behavior when
  valid results remain available or Steppi preserves the graph and shows an honest
  retry state. No further paid `/api/research` request is required to close or
  reconfirm Milestone 4.
- Active student, map, and research state remain intentionally in memory.

## Active Milestone

Milestone 5 — One Validated Branch-local Refinement. Milestone 4 is complete for
the Build Week MVP; do not make another paid `/api/research` request or reopen it
solely because an individual live request can fail safely.

## Immediate Objective

Implement the demo refinement, “Prioritize affordable options near Manila,” so
only the selected researched branch changes while its valid sources and every
unaffected graph area remain preserved.

## In Progress

- No implementation is currently in progress.

## Next Recommended Tasks

1. Implement the demo refinement, “Prioritize affordable options near Manila,” so
   only the selected researched branch changes while its valid sources and every
   unaffected graph area remain preserved.
2. Browser-verify the full refinement flow, including loading, success, empty,
   failure, malformed-output, retry, mobile, keyboard, and console states.
3. After Milestone 5 passes, deploy and verify an anonymously accessible golden
   path, then complete the remaining submission work.

## Exact Next Recommended Prompt

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/TASKS.md, and the latest
Milestone 4 and Milestone 5 entries in docs/BUILD_LOG.md. Treat Milestone 4 as
complete and do not perform another paid `/api/research` request. Implement the
demo refinement, “Prioritize affordable options near Manila,” so only the selected
researched branch changes while its valid sources and every unaffected graph area
remain preserved. Validate the branch-local patch before rendering; cover normal,
loading, empty, failure, malformed-output, retry, duplicate-prevention, and
preservation behavior with deterministic tests; verify desktop, mobile, keyboard,
and console behavior in a real browser; run lint, typecheck, tests, build, and
`git diff --check`; then update TASKS.md and BUILD_LOG.md with verified results.
```

## Current Blockers

- No known blocker prevents implementation of the Milestone 5 demo refinement.
- Vercel Authentication blocks anonymous Preview access, and the audited research
  flow is not deployed for judge verification.

## Non-blocking Reliability Debt

- The visible research cancel control did not transition out of polling in the
  deterministic browser fixture after pointer or keyboard activation. The actual
  live provider-cancel boundary was not retested to avoid another paid request.
  This does not block Milestone 5 or reopen Milestone 4.
- Profile and path timeout classification still checks `error.name`; the installed
  OpenAI SDK's timeout class can retain the generic `Error` name. Those routes can
  therefore report an actual timeout as generic `api_failure` and do not retain the
  safe diagnostic detail available on the research route. This classification gap
  does not block the validated refinement slice.

## Known Issues

- Research validation enforces explicit claim-to-source addressing and URL
  provenance, but deterministic code cannot prove semantic entailment from URL
  structure alone; readable source audits remain appropriate for future changes to
  the research contract.
- The confirmed-profile presentation remains long and report-like; profile
  evidence should become contextual rather than repeated.
- Refresh clears intake, profile, map, selection, and researched expansion state.
- Early intake completion currently repeats exact student answer records only at
  the internal `/api/profile` compatibility boundary because its existing schema
  requires four entries. No inferred content is added, but removing that legacy
  minimum would require a separately authorized downstream contract change.
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
  zero automatic retries, structurally strict candidate parsing, full strict Zod
  validation for every retained node, and a retrieved-URL allow-list.
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
- Atomicity is semantic, not merely sentence-level: each independently verifiable
  assertion is a separate claim, unsupported clauses are omitted, and source
  confidence reflects evidence strength rather than general plausibility.
- Research acceptance is item-scoped. Missing, unmatched, or unsupported claim
  citations remove the claim; an invalid title, parent, freshness boundary,
  affordability evidence set, or final strict parse removes the node. Valid sibling
  nodes render, while zero valid nodes preserve the existing safe retry state.
- Path discovery uses one synchronized state across the desktop graph and its
  browseable path index. The index improves scanability but does not replace the
  graph, add branches, or reveal multiple branches' evidence at once.
- Research adds no more than five nodes to one selected branch. Insufficient
  evidence and all failures render honest, retryable states without changing the map.
- No authentication, persistence, database, comprehensive dataset, or global
  search is part of the MVP. The completed research slice did not include
  refinement infrastructure; Milestone 5 now adds only the single validated demo
  refinement.
- Intake is a constrained hybrid conversation. GPT-5.6 controls contextual
  interpretation, tentative-vs-explicit extraction, correction proposals,
  whether a follow-up is useful, its concise wording, and the completion proposal.
  Deterministic code controls schema/reference validation, patch application,
  supersession, transcript checkpoints, duplicate prevention, safe fallback, and
  the unchanged profile handoff. Intake does not generate path recommendations.

## Unverified Behavior

- The public deployed golden path remains unverified; the audited flow ran locally.
- The item-scoped partial-result path is verified deterministically but has not
  been separately exercised by another paid live response; that additional call
  is not required for the Build Week MVP and must not reopen Milestone 4.
- Native Enter activation of the landing CTA could not be dispatched by the audit
  browser surface; pointer navigation worked, branch Enter/Space activation worked,
  and visible focus styling was verified.
- Path browsing remains unverified with a materially different persona. The live
  persona did exercise materially longer branch titles without overflow.
- Real upstream no-source, timeout, malformed-output, and retrieval-failure
  responses were not induced; deterministic service and route tests cover them.
- Root error/loading foundations were not deliberately forced in-browser.
- Intake timing has not been measured with representative students, and the new
  transcript has not been tested with a screen reader. Desktop and 390×844 mobile
  fixture checks covered two distinct follow-up paths, correction, five shallow
  uncertainty turns, keyboard submission, multiline input, loading, failure/retry,
  malformed fallback, transcript scrolling, sticky-composer bounds, focus, and a
  clean console. The live GPT-5.6 turn interpreter was deliberately not exercised.
