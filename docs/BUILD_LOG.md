---
title: Steppi Build Log
project: Steppi
event: OpenAI Build Week
status: active
version: 0.1
last_updated: 2026-07-17
---

# Steppi Build Log

This file preserves chronological implementation history, detailed test and
browser reports, deployment records, command results, decisions, and verification
evidence through 2026-07-17. Read [TASKS.md](./TASKS.md) for the current handoff
and [SPEC.md](./SPEC.md) for milestone acceptance criteria.

## Archived Milestone Snapshot

This snapshot records status at the time the former task tracker was reorganized;
it is historical evidence, not a second specification.

- Milestone 0 — Foundation: complete.
- Milestone 1 — Static Golden-path Skeleton: partially complete before later
  implementation sequencing superseded its original fixture-first order.
- Milestone 2 — Intake and Structured Profile: complete.
- Milestone 3 — Initial Path Generation and Map: interface implemented; a
  materially different persona and native Enter/Space browser verification remain.
- Milestones 4–6 — Research, refinement, reliability, and submission: not complete.

## Completed

### 2026-07-17 — Optional profile summary and adaptive refinement fork

- Replaced the mandatory, field-heavy profile review and two-step confirmation
  sequence with a concise “Here’s what Steppi understood” summary. The summary is
  derived deterministically from the validated `StudentProfile`, exposes no IDs,
  source references, confidence fields, or raw schema categories, and presents
  `Build my map` as the primary action beside the optional `Refine this first`.
- Added `/api/profile/refine` as a separate server-only GPT-5.6 Structured Outputs
  turn boundary. Each genuine refinement answer can create at most one SDK request
  with `maxRetries: 0`. The model proposes a strict patch plus `complete`,
  `follow_up`, or `offer_choice`; deterministic server code validates references
  and targets, applies the whole patch atomically, reparses the resulting
  `StudentProfile`, and returns no raw patch to React.
- Profile refinement starts from the current valid profile and never restarts
  intake or regenerates the profile from scratch. Direct corrections can return to
  the updated summary without a follow-up; contextual questions are limited to one
  at a time, uncertainty may remain open, and `Build my map` remains available.
- Failure and malformed output preserve the last valid profile and exact student
  wording. Explicit retry reuses the same clarification; proceeding builds paths
  from the last valid profile. Synchronous client locks prevent duplicate answers,
  refinement requests, and path submissions.
- Preserved the adaptive intake, `StudentProfile` schema, `/api/profile` contract,
  exact `{ profile }` path request, exact-three validation, graph state, and all
  research behavior. No intake, path-generation prompt, map, or research file was
  changed for the refinement boundary.
- Added deterministic patch/application, model-output, API-response, service,
  route, fixture, request-shape, and summary-rendering coverage. Focused checks
  passed: 5 files and 28 tests. The full suite passed: 30 files and 198 tests.
- Real-browser fixtures covered 1440×1000 desktop and 390×844 mobile: normal
  intake-to-summary handoff, immediate map building, direct correction, one adaptive
  follow-up, uncertainty, updated summary, map generation after refinement,
  failure/retry, malformed-output proceed-with-last-valid behavior, rapid repeated
  submission, keyboard-only Enter and Shift+Enter, focus restoration, sticky
  composer bounds, scrolling, one student plus three branches, and no horizontal
  overflow. Browser warnings/errors were empty. A duplicate submitted-question
  rendering issue found during the pass was removed and rechecked.
- Dev-server evidence contained only fixture page GETs; no `/api/intake/turn`,
  `/api/profile`, `/api/profile/refine`, `/api/paths`, `/api/research`, live, or paid
  model request occurred. The live quality of refinement interpretation remains
  unverified.
- `npm run lint`, `npm run typecheck`, `npm run test`, the network-enabled `npm run
  build`, and `git diff --check` passed. The first sandboxed build failed only at
  the repository's existing Google Fonts network fetch; the identical permitted
  rerun passed and included `/api/profile/refine`.
- Remaining limitations: in-memory refresh loss, no screen-reader or
  representative-student comprehension study, deterministic summary compression,
  and no live GPT-5.6 refinement turn. Exact next task: implement and
  deterministically verify the single branch-local refinement, “Prioritize
  affordable options near Manila,” while preserving valid sources and every
  unaffected graph area.

### 2026-07-17 — Conversational intake question quality and pacing

- Preserved the fixed broad opening, persistent transcript, stable composer, one
  server-only GPT-5.6 intake-turn request after every genuine answer, strict
  Structured Outputs patches, automatic `enoughContext` profile generation, zero
  automatic SDK retries, and the existing `/api/profile` and downstream contracts.
- Tightened the turn instructions around contextual high-information questions,
  related-detail grouping, transcript/state deduplication, uncertainty and limited
  exposure, sufficiency rather than dimension completion, and sensitive practical
  context covering affordability, location, family expectations, access, and
  transportation without hardship assumptions or exact-income questions.
- Added a narrow deterministic novelty guard for exact repeated questions and a
  shared 12-answer boundary. The twelfth answer still receives one interpreter
  call; a valid incomplete patch retains all updates and unresolved dimensions but
  becomes completion. If that interpretation is unusable, validated prior state and
  the raw transcript are preserved and profile generation continues. No thirteenth
  answer can be appended or requested, and no technical limit is shown to students.
- Kept the composer visible, disabled, and `aria-busy` during interpretation and
  profile loading, improving pacing clarity without redesigning the transcript UI.
- Added deterministic rich-answer, practical-context, alternate-path, repeated-
  uncertainty, retry, malformed-output, and maximum-turn fixtures. Focused tests
  cover multi-dimension early completion, no known constraints, limited exposure,
  Manila/cost/transport/family context, repeated-question rejection, correction,
  compatibility copies, duplicate prevention, and final-turn preservation.
- Real-browser fixture verification covered 1440×1000 desktop and 390×844 mobile:
  one-answer completion, materially different publication and coastal-cleanup
  follow-ups, Enter, Shift+Enter, focus restoration, revision invalidation,
  transcript scrolling, stable loading, rapid duplicate submission, explicit retry,
  malformed fallback, twelve-turn completion, no thirteenth prompt, profile
  transition, composer bounds, and horizontal overflow. The current console had no
  warnings or errors; fixture code made no intake-turn, profile, or paid model call.
- Verification passed: focused intake tests (5 files, 38 tests), `npm run lint`,
  `npm run typecheck`, full `npm run test` (25 files, 170 tests), network-enabled
  `npm run build`, and `git diff --check`. The first sandboxed build failed only
  because the existing Google fonts were unreachable; the allowed rerun passed.
- No live or paid OpenAI request occurred. Remaining limitations are in-memory
  refresh loss, the unchanged four-record profile compatibility adapter, unmeasured
  representative-student duration, no screen-reader session, and no live
  turn-interpreter quality evaluation. Milestone 4 remains complete. Exact next
  task: implement and deterministically verify the single branch-local refinement,
  “Prioritize affordable options near Manila,” while preserving valid sources and
  every unaffected graph area.

### 2026-07-17 — Constrained hybrid conversational intake

- Replaced client keyword matching and fixed missing-dimension routing with a
  server-only GPT-5.6 turn interpreter. Each turn returns a strict Structured
  Outputs patch over supplied facts, tentative interests, experiences,
  preferences, dislikes, constraints, considered paths, uncertainty,
  supersessions, unresolved dimensions, and enough-context state, plus either one
  concise follow-up or completion. The interpreter is forbidden from recommending
  paths during intake and uses zero automatic retries.
- Added deterministic patch application that validates active item identity,
  transcript source references, duplicate IDs, correction targets, supersession
  history, unresolved dimensions, and completion/question consistency before
  state changes. Raw model output never enters React state.
- Preserved the existing transcript and stable composer. Each Steppi turn now
  visibly carries the validated contextual acknowledgement; correction restores
  the checkpoint before the edited turn and removes later state; uncertainty is
  retained; rich context may complete early; shallow context may keep going.
- Added public-safe `/api/intake/turn` configuration, timeout, upstream,
  malformed-output, and input failures. Any unusable interpretation preserves the
  transcript, offers a deterministic fallback question, and supports explicit
  retry without duplicate turn or model requests.
- Preserved `/api/profile` and its exact `IntakeAnswer[]` contract. Because that
  existing schema requires four records, early completion uses uniquely identified
  compatibility copies of exact student wording only; it never synthesizes an
  extracted answer. Profile, path, graph, research, and refinement code and
  contracts were unchanged.
- Added deterministic development fixtures for creative-project, coastal-cleanup,
  uncertainty, retry, and malformed-output paths. Focused tests cover rich opening
  context, personalized direction, skipping supplied context, uncertainty,
  correction/contradiction supersession, invalid source references, early
  completion, continued shallow questioning, empty and multiline input, duplicate
  prevention, safe fallback, malformed output, timeout/API failure, and the
  unchanged profile payload.
- Browser verification at 1440×1000 and 390×844 covered normal completion; two
  meaningfully different follow-ups; earlier-answer revision; five shallow
  uncertainty turns; loading; malformed fallback; failure and retry; rapid
  duplicate submission; Enter; Shift+Enter; focus restoration; transcript scroll;
  sticky-composer bounds; and horizontal overflow. All fixture tabs had no console
  warnings or errors. Dev-server evidence contained only fixture page GETs and no
  `/api/intake/turn`, `/api/profile`, or other model request.
- Verification passed: focused intake tests (4 files, 26 tests), full `npm run
  test` (24 files, 158 tests), `npm run lint`, `npm run typecheck`, network-enabled
  `npm run build`, and `git diff --check`. The first sandboxed build failed only
  because the existing Google fonts were unreachable; the allowed rerun passed.
- No live or paid OpenAI request occurred. Remaining limitations are refresh-loss,
  the legacy four-record profile adapter minimum, unmeasured representative-student
  timing, no screen-reader session, and no live turn-interpreter verification.
  Milestone 4 remains complete. The exact next task remains the single
  branch-local refinement, “Prioritize affordable options near Manila.”

### 2026-07-17 — Conversational intake replaces questionnaire UX debt

- Replaced the eight-screen questionnaire and pre-profile review report with one
  persistent conversation transcript, a stable free-text composer, restrained
  Steppi/student messages, contextual acknowledgements, optional quick replies,
  subtle orientation copy, automatic composer focus, and transcript-aware scroll.
- Added a deterministic gap selector covering grade, interests, subjects and
  activities, experiences, considered paths, strengths and dislikes, practical
  constraints, certainty, and the student's help goal. Already-supplied dimensions
  are skipped; “not sure” satisfies the active prompt; useful enrichment keeps the
  flow compatible with the existing four-answer API minimum without repeating a
  known gap.
- Added predictable revision: editing an earlier answer visibly warns that later
  turns will be removed, truncates those turns on save, and recomputes the next
  question. Empty/whitespace input is rejected, Enter submits, Shift+Enter retains
  a newline, and synchronous locks prevent duplicate messages and profile starts.
- Preserved the backend boundary. The transcript adapter emits the unchanged,
  schema-validated `IntakeAnswer[]` request to `/api/profile`; the existing
  server-side GPT-5.6 profile request remains the first model call. Profile, patch,
  path, graph, and research schemas and behavior were not changed for this task.
- Added development-only `intake-success`, `intake-retry`, and `intake-malformed`
  fixtures. The real browser exercised normal completion, loading, failure, retry,
  malformed output, transcript preservation, rapid double submission, and the
  transition to “Here is what Steppi understood.” The dev server recorded only
  fixture page GETs and no `/api/profile` or `/api/research` request.
- Browser-verified 1440×1000 desktop and 390×844 mobile layouts with no horizontal
  overflow or off-screen composer controls. Mixed pointer/keyboard desktop and
  keyboard-only mobile runs covered long and multiline answers, empty submission,
  autofocus, transcript scrolling, conditional skipping, revision and downstream
  invalidation, loading, retry, malformed output, and refresh clearing. The browser
  console had no warnings or errors.
- Deterministic verification passed: `npx vitest run src/lib/intake-flow.test.ts`
  (11 tests); `npm run test` (21 files, 143 tests); `npm run typecheck`; and `npm
  run lint`. The first sandboxed `npm run build` failed only because the existing
  Google Fonts could not be fetched; the network-enabled `npm run build` passed
  with `/intake`, `/api/profile`, `/api/paths`, and `/api/research` present.
  `git diff --check` passed after documentation and generated-file cleanup.
- No paid or live OpenAI request was made. Remaining intake limitations are
  in-memory-only state, deterministic keyword matching for implicit answers, no
  representative-student timing study, and no screen-reader session. Exact next
  task: implement and deterministically verify the one branch-local refinement,
  “Prioritize affordable options near Manila,” without reopening Milestone 4.

### 2026-07-17 — Milestone 4 accepted for the Build Week MVP

- Marked Milestone 4 — Resilient Source-backed Branch Expansion complete based on
  the accumulated live and deterministic evidence. Live background research has
  successfully rendered useful source-backed results, and the current validation
  boundary retains only provider-grounded claims and nodes while preserving valid
  siblings when other content is invalid.
- Acceptance includes branch-local attachment, preservation of the student node,
  all three initial paths and relationships, selection, submitted question, and
  safe graph state through failures. Deterministic coverage includes success,
  partial success, no-source, malformed-output, timeout, cancellation, retry, and
  duplicate-prevention states.
- Safe individual provider or citation failures are acceptable MVP behavior when
  valid results are preserved or the graph remains unchanged with an honest retry
  state. An occasional safely handled live failure is not a reason to reopen
  Milestone 4, and no additional paid `/api/research` request is required for its
  acceptance.
- Moved the research cancellation defect and the profile/path timeout
  classification gap to non-blocking reliability debt. They remain worth fixing,
  but neither blocks the validated branch-local refinement or invalidates the
  completed research milestone.
- Set Milestone 5 — One Validated Branch-local Refinement as active. Exact next
  task: Implement the demo refinement, “Prioritize affordable options near
  Manila,” so only the selected researched branch changes while its valid sources
  and every unaffected graph area remain preserved.
- This task changed documentation only. It made no application-code change and no
  paid `/api/research` request.

### 2026-07-17 — Resilient partial research acceptance (Milestone 4 remains open)

- Revised the Build Week MVP boundary in `SPEC.md` and `TASKS.md`: Milestone 4 is
  resilient source-backed branch expansion. It does not require every live
  request, retrieved source, generated claim, or generated node to succeed;
  individual request failures are acceptable when the retry state is safe and the
  graph is unchanged.
- Kept the current background POST/PUT flow, hosted-search requirement,
  provider-retrieved URL allow-list, atomic-claim prompt, public errors, and UI.
  The model-facing parser now accepts structurally strict candidate nodes so URL
  relationships can be evaluated independently before rendering.
- Changed only the completed-output validation boundary. An unsupported or
  unmatched claim citation removes that claim; invalid title support, parent,
  freshness, affordability completeness, or final node shape removes that node;
  unused sources are removed. Each retained node is then parsed through the full
  strict `ResearchNodeSchema`, so no rendered validation was weakened.
- Valid siblings now return as a normal successful expansion. If zero valid nodes
  remain, validation raises `no_valid_research_nodes`, which maps to the existing
  public `malformed_model_output` retry state and adds nothing to the map.
- Added deterministic coverage for one invalid citation beside multiple valid
  nodes, a missing claim citation, claim removal, invalid-node omission,
  all-invalid safe failure, provider background parsing of a partial result,
  strict route failure mapping, rendered partial markup, and original profile,
  branches, relationships, selection, and question preservation.
- Browser-verified `?fixture=research-partial-success` through the real intake,
  confirmation, path-selection, question, polling, and render flow. Two retained
  research nodes rendered and the invalid middle node stayed absent. One student
  node, three initial branches, three relationships, the Digital product design
  selection, and “How can I try this before committing?” remained; eight HTTPS
  link instances were present and browser warnings/errors were empty.
- The dev server recorded only `GET /intake?fixture=research-partial-success`; no
  `/api/research` request or paid model call occurred.
- Verification passed: focused partial-flow tests (5 files, 59 tests), followed by
  the expanded validator/schema set (3 files, 51 tests); `npm run lint`; `npm run
  typecheck`; `npm run test` (21 files, 138 tests); network-enabled `npm run build`;
  and `git diff --check` after restoring Next's generated development route
  reference.
- Milestone 4 remains incomplete pending one representative live background
  request that renders useful source-backed results and is verified in the
  browser. That request is the exact next Milestone 4 task; refinement remains
  unimplemented.

### 2026-07-17 — Single post-fix live verification failed safely (Milestone 4 remains open)

- Used `?fixture=research-live` with the deterministic confirmed profile and three
  deterministic path branches. Selected Digital product design and submitted “How
  can I try this before committing?” exactly once. No retry control was activated,
  no manual result modification occurred, and no second model request was made.
- Server evidence showed exactly one successful `POST /api/research` background
  creation followed by 22 `PUT /api/research` status polls for that same response.
  The final poll returned HTTP 502; polling stopped and no later route request was
  observed.
- Captured only the bounded safe diagnostic: category `source_processing`, stage
  `model_output_validation`, reason `citation_not_retrieved`, HTTP status 502.
  Upstream HTTP status, upstream error code, and request ID were not present. No
  prompt, raw model output, student data, secret, or rejected URL was logged.
- The response failed before client rendering. Rendered research nodes: 0. Total
  factual claims: 0. Claims passed/failed: 0/0 because there was no generated
  content to audit. Source-link resolution was not applicable, and no generated
  unsupported clause remained rendered.
- The failure UI kept one student node, the original Digital product design,
  Digital communication strategy, and Community program facilitation branches,
  all three relationships, and the Digital product design selection. It added no
  research node, retained the exact question, showed the safe malformed-output
  message and retry control, and produced no browser console error.
- The requested linked-source audit could not begin because no title, claim, or
  source directory reached rendered state. Milestone 4 remains incomplete, and
  refinement remains blocked. The precise remaining boundary is a cited model URL
  that did not match the provider-retrieved allow-list; the next work must reproduce
  and repair that mismatch deterministically without another live request.
- Post-verification checks passed: `npm run lint`; `npm run typecheck`; `npm run
  test` (21 files, 132 tests); network-enabled `npm run build`; and `git diff
  --check` after restoring Next's generated development route reference.

### 2026-07-17 — Compound-claim grounding fix (Milestone 4 remains open)

- Traced research output through the model prompt, Structured Outputs schema,
  provider-URL validation, state boundary, and rendering. The background request,
  polling, cancellation, and retrieval-source architecture remain unchanged.
- Tightened the model-facing contract so each independently verifiable assertion
  is a separate claim. The prompt now requires direct support for every verb,
  object, qualifier, condition, and scope statement; omits unsupported wording
  instead of lowering confidence; and uses the audited Figma mockup/prototype
  claim plus unsupported “without writing code” qualifier as the exact
  counterexample.
- Added schema descriptions requiring one concise factual clause per claim and
  complete direct support from its linked URLs. Node confidence now explicitly
  represents the directness, authority, specificity, and freshness of source
  support rather than general plausibility, and rendering labels it as source
  confidence.
- Added a deterministic Figma fixture with interface mockups and interactive
  prototypes as separate claim records and no no-code qualifier. Schema, service,
  and server-rendered markup regressions cover the clause split, URL attachment,
  omitted qualifier, and visible source-confidence label.
- Preserved the runtime URL allow-list and attachment checks. They continue to
  reject invented, detached, and unused URLs, while semantic entailment still
  requires a readable linked-source audit because the validator does not receive
  retrieved page bodies.
- Focused verification passed with 4 files and 56 tests. Full `npm run lint`,
  `npm run typecheck`, and `npm run test` passed with 21 files and 132 tests. The
  first sandboxed `npm run build` failed only because the existing Google Fonts
  requests were network-blocked; the approved network-enabled rerun compiled and
  generated every route successfully. `git diff --check` passed.
- The deterministic `research-success` browser fixture rendered three research
  nodes and six claims with high/medium source-confidence labels at the default
  viewport and 390×844. The research expansion contained no “without writing
  code” qualifier, mobile had no horizontal overflow, and the browser reported no
  error overlay or console errors.
- No live `/api/research` request, deployment, refinement, or research-flow change
  occurred. The grounding fix is implemented, but Milestone 4 remains incomplete
  pending exactly one fresh live background request and a full audit of every
  rendered title and claim against its linked source.

### 2026-07-17 — Single live atomic-claim verification (Milestone 4 remains open)

- Used `?fixture=research-live` so the confirmed profile and three original path
  branches stayed deterministic while only `/api/research` crossed the live
  boundary. Selected Digital product design and submitted “How can I try this
  before committing?” exactly once. Retry was never activated.
- Server evidence showed exactly one successful `POST /api/research` background
  creation and 17 successful `PUT /api/research` status polls. The result completed
  and rendered four nodes containing 14 atomic factual claims and seven unique
  provider-backed source pages.
- The live browser retained one student node, all three original branch titles,
  the strongest-fit selection, and one research expansion attached only to
  `path-product-design`. There was no horizontal overflow and browser warnings and
  errors were empty.
- Opened all seven linked pages. Every link resolved to the displayed publisher
  or document; all displayed titles accurately described their destinations; and
  the server check date of 2026-07-17 matched the audit date. Figma pricing,
  education eligibility and K–12 limitations, education-demo schedules and
  recordings, UX Philippines event history and current absence, and Design Center
  educational-tour and location claims were supported with proportionate caveats
  and confidence.
- Thirteen of fourteen factual claims passed. One high-confidence Figma claim said
  the tool can create interface mockups and interactive prototypes “without
  writing code.” The linked Figma education page directly supports mockups and
  interactive prototypes but does not state the no-code qualifier. The compound
  claim therefore exceeded its cited source and remained rendered.
- No claim was softened, no speculative fix was applied, and no second live
  response was created. Because every displayed factual claim did not pass, the
  source audit failed and Milestone 4 remains incomplete. The precise next task is
  a fixture-backed guard against unsupported qualifiers inside otherwise supported
  compound claims; refinement remains blocked.
- Required checks passed after documentation: `npm run lint`; `npm run
  typecheck`; `npm run test` (21 files, 130 tests); network-enabled `npm run
  build`; and `git diff --check` after restoring Next's generated development
  route reference.

### 2026-07-17 — Atomic research claim trust boundary

- Replaced node-level model-authored `summary`, `caveats`, and `supports` prose
  with atomic factual claims. Every title and claim now lists one or more exact
  source URLs; the student-specific relevance note is visibly labeled as a Steppi
  connection rather than a sourced fact.
- Kept the existing provider-retrieved URL allow-list, HTTPS normalization, server
  check date, selected-branch parent validation, and five-node maximum. Validation
  now also rejects title or claim URLs outside the node, claim URLs outside the
  provider allow-list, duplicate claim/source references, attached sources unused
  by visible content, and nodes without a sourced limitation.
- Added affordability intent validation. A successful affordability result must
  include explicit `cost`, `eligibility`, and `conditional-aid` claims for every
  rendered option; otherwise the response fails validation, while an honest
  `no_useful_sources` result renders “Affordability information is unavailable.”
- Added audit fixtures: the UP Visual Communication fixture is restricted to the
  cited program identification and contains no interface-design, prototyping, or
  portfolio-preparation claim; the CIIT fixture visibly includes the cited PHP
  135,000–165,000 annual estimate and states that scholarships are conditional
  and not guaranteed.
- Updated the research instructions and SPEC contract so source URLs are not
  treated as blanket support for a node. This makes every factual sentence
  addressable and auditable, but deterministic URL checks still do not prove
  semantic entailment; a live result must still be read against its pages.
- Rendering therefore labels the mappings as title sources and cited factual
  claims rather than presenting URL retrieval itself as proof of support.
- Focused verification passed: schema, validator, service, route, rendering,
  flow, and polling coverage (7 files, 69 tests), followed by the expanded focused
  trust-boundary set (5 files, 62 tests). No provider or model call occurred.
- Real-browser fixture verification at 1440×1000 and 390×844 covered success,
  no-source affordability, malformed output, and retry. Success rendered three
  nodes with six atomic claims, six claim citations, and three cited titles under
  only the selected branch. No-source and malformed output added no node; retry
  preserved the question, selected branch, student node, confirmed profile, and
  all three original branches. Mobile hid the graph, retained the three-item path
  fallback, and had no overflow or off-screen controls. Browser warnings/errors
  were empty.
- Repository verification passed: `npm run lint`; `npm run typecheck`; `npm run
  test` (21 files, 130 tests); network-enabled `npm run build`; and `git diff
  --check`. The first sandboxed build failed only because the existing Google Font
  fetch was network-blocked; the authorized network-enabled rerun passed.
- No live model request or deployment was made. One separately authorized live
  background research request is now justified to verify Structured Outputs
  acceptance and audit every rendered claim against the linked source. Milestone
  4 remains open until that live audit passes.

### 2026-07-17 — Clean-browser MVP exploration-loop audit

- Audited the current dirty worktree as-is without changing product code or
  redesigning the interface. Read the current product, specification, handoff,
  and relevant implementation history before testing.
- Ran one clean local live golden path with representative Grade 11 answers. The
  landing entry, eight-question intake, adaptive technology follow-up, empty-input
  validation, Back preservation, review step, and server/client profile validation
  passed. The one live profile request returned HTTP 200 in 17.8 seconds.
- The live profile rendered 8 facts, 2 clearly labeled inferences, 6 constraints,
  5 uncertainties, and 1 tension. Replacing one inference and confirming the
  profile preserved the unrelated inference, all facts, constraints,
  uncertainties, and tension without another model request.
- The one live path request returned HTTP 200 in 21.9 seconds and produced exactly
  one strongest-fit, adjacent, and underexplored direction: UX/UI and Digital
  Product Design; Product Management and Digital Project Coordination; and Digital
  Communications and Creative Production. The central node, three equal branches,
  selected-only detail, pointer selection, Enter, Space, and stable branch titles
  passed in the browser.
- The one live research action created exactly one background response. Server
  evidence showed one `POST /api/research`, 24 `PUT /api/research` status polls,
  and no second creation or retry. It completed successfully and rendered five
  nodes under only the selected UX/UI branch with 13 displayed citations across
  11 unique HTTPS destinations. Switching branches hid the research without
  changing any original branch and returning restored the same five nodes.
- Opened all 11 unique destinations independently. Every link resolved to its
  claimed institution or document and every displayed check date was 2026-07-17.
  The source audit nevertheless failed the SPEC's every-claim-supported boundary:
  the UP Visual Communication node synthesized interface design, information
  design, prototyping, and portfolio-development claims not stated by the cited
  BFA page or curriculum checklist; the CIIT option appeared in an affordability
  answer without visibly surfacing its cited PHP 135,000–165,000 annual estimate
  or the conditional nature of scholarship aid. URL provenance passed, but
  semantic claim support did not.
- Verified deterministic path API failure, path timeout, malformed paths, research
  API failure, research retry, malformed research, polling timeout, and no-source
  states without model traffic. Each retained the confirmed profile, selected
  branch, question, and three original paths, and added no unvalidated node.
- Found a real-browser cancellation defect in `?fixture=research-cancel`: the
  visible Cancel research control remained in the polling state after repeated
  pointer activation and Enter. Unit tests still pass. A live provider cancel was
  not induced because that would require a second paid research action.
- Ran one controlled real profile-generation failure with placeholder credentials
  and a deliberately invalid model name. The route returned HTTP 503 once, made no
  SDK request, rendered a calm non-retryable error, and preserved all eight answers.
  Safe code was `invalid_model_configuration`; profile diagnostics do not currently
  retain category, stage, reason, upstream status/code, or request ID, and no
  upstream values existed for this preflight rejection.
- Static inspection found that profile and path timeout classifiers still depend
  on `error.name === "APIConnectionTimeoutError"`, while the installed SDK timeout
  instance can retain the generic `Error` name. Unlike research, those routes can
  misclassify a real timeout as generic `api_failure` and cannot capture the
  requested bounded diagnostic metadata.
- Browser-verified a 390×844 fixture-backed full flow: the desktop graph hides,
  the three-item connected path list remains, Enter selection and the research
  expansion work, all controls stay within the viewport, and horizontal overflow
  is absent. A computed three-pixel focus ring was present. Desktop live branch
  copy also had no horizontal overflow. Browser logs contained no warnings or
  errors; the malformed fixture emitted only its bounded client diagnostic.
- The browser surface could focus the native landing CTA but did not dispatch its
  Enter activation; pointer entry worked. Branch Enter and Space activation were
  genuinely verified. Root loading/error foundations and live upstream failure
  modes were not deliberately induced.
- Confirmed `.env.local` is ignored, the expected local key/model configuration is
  present without printing values, and neither rendered pages nor `.next/static`
  contained an OpenAI key signature or server environment-variable name.
- Verification passed: `npm run lint`; `npm run typecheck`; `npm run test` (21
  files, 122 tests); network-enabled `npm run build`; and `git diff --check`. The
  first sandboxed build failed only because Google Fonts were network-blocked.
- Submission remains blocked by three functional boundaries: source-to-claim trust,
  missing branch-local refinement, and an anonymously usable deployed golden path.
  No milestone was marked complete and no implementation fix was made.

### 2026-07-17 — Browseable career-path exploration layer

- Kept the existing central student node, exactly three validated path branches,
  graph reducer, selected-only detail panel, and research flow. No path or
  research schema, prompt, API behavior, model call, or dependency changed.
- Added a synchronized editorial path index beside the dominant desktop graph.
  Each equal item uses the existing branch role, title, and concise summary;
  selecting either the index or graph focuses the same node and reveals only the
  selected branch's evidence, tradeoff, uncertainty, related options, and research.
- Replaced the small-screen graph with the same three-item connected path list,
  retaining the student-to-three-path relationship without dragging or precise
  graph interaction. No unsupported client-side career information was added.
- Added explicit Enter/Space activation to both native control surfaces and
  preserved clearing with focus restoration to the selected path index item.
- Expanded focused markup coverage for three graph controls, three browse
  controls, all required roles, existing title/summary reuse, no initial detail,
  and the path-list mobile fallback.
- Real-browser fixture verification at 1440×1000 and 390×844 covered initial
  equal presentation, pointer selection, Enter and Space switching, synchronized
  graph/index emphasis, exactly one selected detail, clearing and focus restore,
  hidden mobile graph, three mobile relationships, safe control bounds, no
  horizontal overflow, and no console warnings or errors.
- Verification passed: `npm run lint`; `npm run typecheck`; focused tests (2
  files, 9 tests); `npm run test` (21 files, 122 tests); network-enabled
  `npm run build`; and `git diff --check`. The first sandboxed build attempt was
  blocked only by the existing Google Fonts fetch.
- Remaining UX debt: validate path-index density with a materially different
  persona or unusually long live branch copy. Exact next task: implement one
  validated branch-local refinement while preserving the researched branch's
  sources and every unaffected graph area.

### 2026-07-16 — Background retrieval source inclusion

- Confirmed from the installed OpenAI SDK 6.47.0 types that
  `responses.retrieve(responseID, query)` accepts `include` in its second,
  non-streaming query argument.
- Corrected the background status path so every retrieval of an existing
  response passes `include: ["web_search_call.action.sources"]`; no creation,
  schema, extractor, validator, model, prompt, or UI behavior changed.
- Added one focused two-poll test proving the same provider response ID is used,
  both retrievals receive the sources include query, a completed
  `action.sources` result passes the existing validator, and no response is
  created during polling.
- Made no live request. Verification passed: the focused test (1 passed, 23
  skipped), `npm run typecheck`, and `git diff --check`.

### 2026-07-16 — Completed-response source extraction fix

- Made no live OpenAI request and did not change the model, Structured Outputs
  schema, research parser, source normalization rules, or public errors.
- Confirmed the existing creation parameters already set
  `include: ["web_search_call.action.sources"]` and `tool_choice: "required"`.
- Found one bounded extractor gap: completed web-search action sources were read,
  but provider-backed output-text `url_citation` annotations were ignored. The
  extractor now collects and deduplicates both documented locations using the
  installed SDK response types.
- Preserved the retrieved-source allow-list: model-authored URLs pass only when
  their normalized URL matches provider-backed evidence. Missing provider
  evidence still fails as `retrieved_sources_missing`.
- Added deterministic SDK-shaped mocks proving extraction from both locations,
  successful validation of matching model sources, rejection without provider
  evidence, and no background response creation during retrieval/validation.
  No raw response, URL, prompt, student data, or model output was logged.
- Verification passed: `npm run typecheck`; focused
  `npx vitest run src/server/research-generation.test.ts src/lib/research-validation.test.ts`
  (2 files, 27 tests); conditional full `npm run test` because shared server code
  changed (21 files, 120 tests); and `git diff --check`.
- One separately authorized final live `/api/research` verification is now
  justified. Milestone 4 remains incomplete until a live result renders and its
  displayed claims pass the source audit.

### 2026-07-16 — Background Responses API reliability boundary

- Replaced the previous synchronous 45-second `/api/research` wait with a bounded
  start/status/cancel workflow. Start validates the existing request and creates
  exactly one `background: true` Response; `PUT` status retrieves that same
  response; `DELETE` cancellation calls the provider at most once. The client
  polls every 2.5 seconds only while queued or in progress and cancels once at an
  overall 120-second budget without automatic retry.
- Added an encrypted HttpOnly, same-site job cookie. Its plaintext payload is
  limited to the provider response ID, a SHA-256 context digest, server check
  date, creation time, and cancellation flag. The browser never receives the raw
  provider ID, profile, question, prompt, model output, source URLs, or provider
  body. The handle expires after three minutes and does not make the workflow
  resumable after a reload.
- Preserved GPT-5.6, required hosted web search, zero SDK retries, the existing
  Structured Outputs schema, the installed SDK's local structured parser, the
  validated research parser, output meaning, and source normalization rules.
  Parsing and source validation run only after provider status is `completed`.
- Added safe classification at background creation, retrieval, provider terminal
  failure/cancellation/incomplete states, structured parsing, schema validation,
  source processing, provider cancellation, and client polling timeout. Public
  responses remain generic and contain no provider IDs or sensitive diagnostics.
- Added deterministic route, SDK-boundary, encrypted-handle, polling, reducer,
  and UI tests. Coverage proves one create per action, no create during status,
  repeated retrieval of the same response, queued/in-progress handling,
  completion through the existing parser and validators, malformed completion,
  terminal provider states, single cancel, polling abort/unmount, no automatic
  retry at budget expiry, duplicate-submit prevention, and selected-branch-only
  graph application. Existing fixture-backed behavior remains covered.
- Real-browser fixture verification at 1440×1000 and 390×844 covered queued,
  in-progress, completion, explicit cancellation, provider failure, malformed
  output, overall timeout, manual retry, disabled duplicate controls, selected-
  branch-only expansion, stable student/profile/three branches, visible source
  metadata, no horizontal overflow, and no warning/error console entries in a
  clean tab.
- Validation passed: `npm run lint`; `npm run typecheck`;
  `npx vitest run src/app/api/research/route.test.ts src/server/research-generation.test.ts src/server/research-job-token.test.ts src/lib/research-polling.test.ts src/lib/research-flow.test.ts src/app/intake/path-branch-preview.test.tsx`
  (6 files, 45 tests); `npm run test` (21 files, 119 tests); network-enabled
  `npm run build`; and `git diff --check`. The first sandboxed build attempt was
  blocked only by existing Google Fonts network access; the authorized build
  passed.
- Performed exactly one live research action through the real application. It
  created one OpenAI background Response; 24 status requests retrieved that same
  response and none called create. The provider completed, after which the
  unchanged source validator rejected the result with safe category
  `source_processing`, stage `model_output_validation`, reason
  `retrieved_sources_missing`, public HTTP 502, and no available upstream code or
  request ID. No retry occurred and no follow-up fix was applied.
- No live research node or factual claim rendered, so source audit was not
  applicable. Browser inspection confirmed zero research expansions, the same
  student node, all three unchanged original branches, and the same selected
  branch, with no console warnings/errors or horizontal overflow.
- Milestone 4 remains incomplete. Exact next task: decide whether to use the
  validated fixture-backed research flow for the demo and proceed to branch-local
  refinement, or explicitly authorize one narrowly justified fix based on new
  evidence.

### 2026-07-16 — Final authorized live research verification

- Preserved all existing uncommitted research work and used `fixture=research-live` so only `/api/research` crossed the live boundary. Submitted Digital product design question “How can I try this before committing?” exactly once through the real application; Retry was never activated.
- The corrected classifier reported category `timeout`, stage `openai_request`, reason `request_timeout`. The local public route returned HTTP 504 after 45 seconds; upstream HTTP status, upstream code, and request ID were unavailable. No prompt, raw error, model output, student data, key, URL, header, request body, or provider body was logged or preserved.
- No model output or source evidence reached the application, so source audit was not applicable. Live research remains unverified and Milestone 4 remains incomplete.
- Browser verification confirmed one unchanged student node, all three unchanged original branches, one stable Digital product design selection, the exact retained question, zero research expansions/nodes, one unused retry control, no horizontal overflow, and no console warnings or errors.
- Required checks: `npm run lint` passed; `npm run typecheck` passed; `npm run test` passed with 19 files and 105 tests; the sandboxed `npm run build` failed only because existing Google Fonts were unreachable, then the network-enabled `npm run build` passed with `/api/research` present; `git diff --check` passed after documentation and generated-file cleanup.
- No implementation, schema, model, timeout, retry, refinement, or reliability change was made. Automatic research debugging is closed for Build Week pending a scope decision.
- Exact next task: decide whether to use the validated fixture-backed research flow for the demo and proceed to branch-local refinement, or explicitly authorize one narrowly justified fix based on the new timeout evidence.

### 2026-07-16 — Deterministic SDK timeout-classifier diagnosis

- Made no live OpenAI request and did not change the model, timeout, retries, public error payloads, research architecture, or Structured Outputs schema.
- Inspected OpenAI SDK 6.47.0 source and typings. Its client starts an `AbortController` timer for the configured request timeout; an abort or timeout-shaped fetch rejection is wrapped as `APIConnectionTimeoutError`, while other fetch failures become `APIConnectionError`. Both inherit from `APIError` and have no HTTP status or request ID.
- Reconstructed only the minimum safe runtime shape locally: `{ name: "Error", constructorName: "APIConnectionTimeoutError", isTimeout: true, isConnection: true, isApiError: true, status: undefined, code: undefined, requestId: undefined, hasCause: false }`. No raw error message, stack, prompt, body, header, student data, URL, model output, or secret was inspected or persisted.
- Proven classifier gap: the prior implementation checked `error.name === "APIConnectionTimeoutError"`, but an actual SDK timeout instance has the generic name `Error`. It then fell through the broad `instanceof OpenAI.APIError` branch, where undefined status produced the exact captured `upstream_api/openai_request/connection_failed` diagnostic.
- Minimal fix: recognize `OpenAI.APIConnectionTimeoutError` by class identity; accept only bounded safe timeout names/codes, including one nested `cause`; and explicitly retain unqualified `OpenAI.APIConnectionError` as `connection_failed`. No message inspection or hosted-search-specific category was added.
- Added five focused cases covering the real SDK timeout shape, a generic SDK connection error, a nested `ETIMEDOUT` cause, safe `AbortError` name, and safe `UND_ERR_CONNECT_TIMEOUT` code. `npx vitest run src/server/research-generation.test.ts` passed with 13 tests; the full suite passed with 19 files and 105 tests.
- Diagnosis: a missed SDK timeout class is proven as the classification defect and the exactly 45-second duration strongly indicates the observed request hit the configured local timeout. A lower-level transport failure or upstream hosted-search stall could still be the event that consumed that interval; without a provider response or tool-call item they remain indistinguishable and are not labeled more specifically.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run test` passed. The sandboxed `npm run build` failed only because existing Google Fonts could not be fetched; the network-enabled `npm run build` passed with `/api/research` present. `git diff --check` passed after documentation and generated-file cleanup.
- Exact next task: perform one separately authorized live `/api/research` re-verification with no automatic or repeated retries; source-audit the rendered result if it succeeds. Milestone 4 remains open.

### 2026-07-16 — Corrected-schema live research verification attempt

- Preserved the existing uncommitted research implementation and used `fixture=research-live` so the confirmed profile and exactly three path branches remained deterministic while only `/api/research` crossed the live boundary.
- Prepared Digital product design and submitted “How can I try this before committing?” exactly once through the real browser application. No Retry action or second API request was made.
- The request ran for the configured 45-second provider limit and returned the public generic retryable 502 state. The only safe server diagnostic was category `upstream_api`, stage `openai_request`, reason `connection_failed`; OpenAI supplied no HTTP status, upstream code, or request ID.
- Browser rendering preserved one student node, all three original branch nodes, the selected branch, and the exact question. It rendered zero research expansions/nodes, one retry control, no horizontal overflow, and no browser console warnings or errors.
- Because no model output or source evidence reached the application, no factual claim was rendered and no source audit or correction was possible. Milestone 4 remains open; refinement remains blocked behind live research verification.
- Validation results: `npm run lint` passed; `npm run typecheck` passed; `npm run test` passed with 19 files and 100 tests; the sandboxed `npm run build` failed only because Google Fonts were unreachable, then the network-enabled `npm run build` passed with `/api/research` present; `git diff --check` passed after documentation and generated-file cleanup.
- Exact next task: deterministically inspect the OpenAI SDK error shape produced at the 45-second boundary and establish whether the remaining failure is timeout classification, transport connectivity, or hosted-search connectivity. Do not make another paid request or implement refinement during that diagnostic task.

### 2026-07-16 — `/api/research` boundary diagnosis and schema repair

- Preserved the uncommitted Milestone 4 implementation and traced the full client → route → SDK request → structured parse → source validation → API response → rendering path before editing.
- Reproduced the original failure without API traffic by calling `zodTextFormat` on the research schema. It failed synchronously because `SourceEvidence.publisher` was optional, while Structured Outputs requires every property to be required; nullable is the supported representation for an unavailable value.
- Changed `publisher` to required-and-nullable and added a deterministic request-construction test. This removed the synchronous exception that the old broad catch had mislabeled as generic `api_failure`.
- Added bounded diagnostics for `configuration`, `upstream_api`, `parsing`, `schema_validation`, `source_processing`, `timeout`, and `rendering`. Records include only fixed stage/reason tokens plus optional HTTP status, sanitized upstream code, and OpenAI request ID; they exclude prompts, answers, raw errors, model output, keys, and URLs.
- Split request construction and hosted-tool response extraction into testable helpers. Deterministic coverage now checks required web search, included search sources, strict schema creation, captured search-call URL extraction, upstream rejection, timeout, malformed/schema output, missing citations, invalid URLs, route input, and safe client-boundary classification.
- Browser-verified the fixture success flow end to end with one student, three preserved branches, one selection, three branch-local research nodes, three HTTPS source links, no overflow, and a clean console. The live failure state preserved all three branches, the selection, the exact question, and retry control without rendering any research node; the browser console remained clean.
- Made exactly one diagnostic live GPT-5.6 research request after the first repair. OpenAI returned HTTP 400 with code `invalid_json_schema`; the server safely recorded `upstream_api/openai_request/request_rejected` plus the request ID and returned the existing generic 502 response. No model output, sources, or current claims were produced, and the request was not retried.
- Inspection of the locally generated schema identified the next unsupported keyword: Zod `.url()` emitted `format: uri`, while OpenAI's supported string formats do not include `uri`. Replaced it with a bounded string plus post-parse HTTPS/URL refinement, preserving runtime safety without emitting the unsupported format.
- After the second repair, the generated schema builds with required `publisher` and no `format: uri`; lint, typecheck, 19 test files/100 tests, the network-enabled production build, and `git diff --check` pass. Because the one paid attempt was already used, the corrected schema is not yet live-verified and Milestone 4 remains open.
- Ruled out client request construction, route input validation, missing configuration, authentication rejection, timeout, tool-choice syntax, client rendering, and source processing as the boundary reached by the live attempt. The request stopped at OpenAI schema acceptance before search, generation, parsing, or source validation.
- Exact next action: make one deliberate live request with the corrected schema; if successful, render it and audit each factual claim, resolving link, freshness label, caveat, and confidence before marking Milestone 4 complete. Do not begin refinement first.

### 2026-07-16 — Smallest Milestone 4 source-backed research loop

- Added strict `ResearchRequest`, `SourceEvidence`, `ResearchNode`, and research-generation schemas plus deterministic validation for unique node IDs, the selected parent branch, server-controlled check dates, and citations restricted to URLs actually returned by web search.
- Added stateless, `no-store` `POST /api/research` handling and a server-only GPT-5.6 Responses API service. Each student action makes at most one SDK request with zero automatic retries, a 45-second timeout, required hosted `web_search`, included search-source metadata, structured Zod output, and a five-node maximum.
- Added stable public-safe handling for invalid input, missing or invalid configuration, timeout, retrieval failure, upstream API failure, malformed structured output, and the valid no-useful-sources result. Raw SDK errors, prompts, secrets, and environment values are not returned or logged.
- Added a branch-labeled research composer with three suggested questions, free-text validation, loading, no-source, failure, malformed-output, retry, and success states. Submission preserves the confirmed profile, all three original branches, the selected branch, and the exact question.
- Added selected-branch-only graph expansion with concise result nodes and visible source title, HTTPS URL, publisher where available, date checked, relevance to the student, caveat, qualitative confidence, source support text, and an external source link. Unaffected branches are not rebuilt or mutated.
- Added deterministic success and controlled-failure fixtures for repeated browser verification without paid requests. Added focused schema, validator, reducer, route, service, and server-rendered component tests covering success, no useful evidence, retrieval failure, API failure, timeout, malformed output, retry, parent-branch integrity, URL provenance, and state-reference stability.
- Browser-verified the fixture-backed selected-path-to-research flow at approximately 1440×1000 and 390×844. Verified three original branches, one stable selection, three connected research nodes only beneath Product Design, source metadata/links, retry with retained selection/question, no horizontal overflow or off-screen controls, and no console warnings/errors.
- `npm run lint`, `npm run typecheck`, and `npm run test` passed; the suite contains 18 files and 93 tests. The first sandboxed build failed only because Google Fonts required network access; the approved network-enabled `npm run build` passed with `/api/research` included. `git diff --check` passed.
- Confirmed `.env.local` remains ignored and untracked. Repository and `.next/static` scans found no OpenAI token signature or server environment variable name in client assets.
- Performed exactly one local live request through `/api/research` using representative profile, branch, and question data. The route returned HTTP 502 with its safe `api_failure` payload in under a second; no live sources or research nodes were accepted or rendered, and the paid request was not retried. Current factual research therefore remains unverified live.
- No deployment, authentication, persistence, database, global search, research history, or refinement was added. The later boundary-diagnosis pass superseded the earlier refinement recommendation; live research must be verified first. Second-persona and native Enter/Space checks remain reliability debt.

### 2026-07-16 — Smallest graph-first Milestone 3 interface

- Replaced the temporary full editorial comparison with a dominant four-node graph using the existing validated profile and branches.
- Added one central student node, exactly three equal branch buttons, three understandable SVG edges, and an equivalent connected mobile hierarchy without a graph library.
- Added null initial selection, pointer selection, selected-node and edge emphasis, branch switching, clearing, and focus restoration while preserving profile and branch references.
- Moved rationale, labeled profile evidence, the main tradeoff, one unresolved question, related careers or majors, and confidence into one selected-only contextual panel.
- Added a fixture-only handoff that scrolls the completed map into view and makes no additional GPT-5.6 request.
- Added focused reducer and server-rendered markup tests; 14 test files and 68 tests pass.
- Browser-verified 1440×1000 and 390×844 layouts, pointer selection, switching, clearing, progressive disclosure, mobile relationship parity, no horizontal overflow or off-screen controls, and a clean console.
- Lint, strict type checking, tests, the network-enabled production build, and `git diff --check` pass; native Enter/Space activation remains browser-unverified because the in-app browser focused but did not dispatch those keys.

### 2026-07-16 — Milestone 3 exact-three path generation

- Recorded the current multi-step questionnaire as explicit UX debt before implementation. Added a deferred Milestone 6 intake transcript/composer refactor and the decision that the questionnaire is temporary, not the intended final Steppi interaction.
- Added `PathBranchSchema` exactly for the SPEC fields plus a strict `{ branches }` response schema fixed at three entries and exactly one `strongest-fit`, `adjacent`, and `underexplored` role.
- Added deterministic post-schema validation for unique branch IDs, unique/resolvable profile evidence references, duplicate normalized names, high lexical direction overlap, three branches collapsing onto the same career/major label, and unsupported time-sensitive claims that require later sourced research.
- Added a single-request server-only GPT-5.6 path service using `responses.parse`, Zod structured output, the existing GPT-5.6 model allow-list, zero SDK retries, a 45-second request timeout inside a 60-second route budget, and no logging of profile content, raw SDK errors, secrets, or environment values.
- Added stateless, `no-store` `POST /api/paths` handling with validated confirmed-profile input and stable public-safe errors for missing configuration, invalid model configuration, timeout, upstream failure, and malformed output.
- Added client-boundary validation and a reducer that preserves the exact confirmed-profile reference across loading, failure, retry, and success.
- Replaced the placeholder handoff with one explicit request from `Confirm and explore paths`, a clear loading state, retryable failure states, and a restrained editorial comparison of exactly three equal path hypotheses.
- Each branch preview renders its direction, why it appeared, resolved profile evidence, the distinction between student facts/constraints and Steppi inferences, the main tradeoff, an unresolved question, related general options, and qualitative confidence. It does not render a map or claim current program, cost, admissions, salary, or labor-market facts.
- Added development-only success, timeout, API-failure, and malformed-output fixtures for deterministic browser verification. Normal production flow never fabricates branches.
- Added schema, validator, state, client response, service, and route tests covering exact count/role enforcement, missing/duplicate/extra roles, malformed branches, invalid evidence, duplicate names, near-duplicates, collapsed directions, unsupported current claims, safe errors, timeout, retryability, confirmed-profile preservation, and successful preview transition.
- Browser-verified fixture success, loading, timeout/retry, API failure, malformed output, confirmed-profile preservation, all three role labels, evidence/tradeoff/question/confidence rendering, 1440×1000 desktop, 390×844 mobile, no overflow/off-screen controls, and a clean console.
- Completed exactly one live local GPT-5.6 path request. It returned three valid and meaningfully different directions in 28.7 seconds and rendered without browser warnings/errors or exposed environment/error labels.
- Deployed Preview `dpl_GnQXrRhbQZeArZg5mxnQ5ynFYFwN`; Vercel restored the prior cache, compiled in 10.5 seconds, and reported `Ready`.
- Completed exactly one authenticated live GPT-5.6 Preview path request. `POST /api/paths` returned HTTP 200 with exactly three validated roles and no extra profile-generation request.

### 2026-07-16 — Milestone 2 profile correction and confirmation

- Added the strict `ProfilePatchSchema` contract with supported operations for inference removal, statement replacement, added constraints, and added facts. Nested values reuse the validated `StudentProfile` field schemas, and unsupported keys or malformed statements are rejected.
- Added a pure immutable patch applicator that validates the original profile and patch, rejects missing or conflicting inference targets and duplicate IDs, preserves all unrelated facts, inferences, constraints, uncertainties, and tensions, and validates the resulting `StudentProfile` before it can render.
- Added a clearly labeled valid patch fixture and expanded the representative profile fixture to include a second inference so unrelated-inference preservation is deterministic.
- Added focused tests for valid and malformed patches, removal, replacement, added constraints, whitespace-only input, invalid targets, conflicting operations, duplicate IDs, original-object immutability, unrelated-data preservation, change detection, cancel/undo, and reset semantics.
- Replaced only the previous static profile result with a focused confirmation component. Facts are visibly read-only; a student can open one inference correction at a time, preview a replacement or removal, cancel without changing the profile, or discard the entire pending patch before confirmation.
- Added one collapsed-by-default missing-constraint form with whitespace validation, a 600-character schema-aligned limit, inline errors, and a secondary visual position beneath practical context.
- Clearly distinguishes `Original profile`, `Pending correction`, and `Confirmed profile`. The original validated object remains unchanged, and all correction work is local—no API or model request is made.
- Added the dominant `Confirm and explore paths` handoff after profile confirmation. It reveals an honest “Three path branches come next” placeholder and does not generate paths or render a map.
- Added a development-only `?fixture=profile` verification entry point so the complete correction state machine can be exercised locally without a paid GPT-5.6 request. Restart dismisses the fixture and returns to the first intake question.
- Browser-verified cancellation, whitespace replacement validation, replacement preview/undo, removal preview/undo, empty constraint validation, combined replacement plus added constraint, confirmation, handoff, and restart. Facts, the unrelated inference, existing constraint, uncertainty, and tension remained present in the confirmed result.
- Browser-verified 1440×1000 desktop and 390×844 mobile layouts with no horizontal overflow or off-screen buttons. The mobile open form measured within the viewport, and the browser console contained no warnings or errors.
- Made zero GPT-5.6 requests and zero `/api/profile` requests during this work block.

### 2026-07-16 — Adaptive intake and live Vercel profile verification

- Confirmed without displaying values that `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5.6` are present locally, `.env.local` is ignored, and both encrypted variables are configured for Vercel Preview and Production.
- Accepted the already completed local live verification as durable project context: a real GPT-5.6 response had succeeded, passed `StudentProfileSchema`, and rendered correctly before this work block. No additional local model request was made.
- Replaced the representative-answer smoke-test screen with an eight-question, one-at-a-time intake using phase-based progress, back navigation, in-memory answer preservation, visible previous context, client-side required/length validation, a review step, editable answers, and restart/reset behavior.
- Added one deterministic adaptive follow-up that responds to technology, creative-work, or general signals without spending a model request for each question.
- Kept free text available on every question and added optional quick responses only where they reduce effort.
- Added strict client validation of the public profile response before rendering, in addition to the existing server-side schema validation.
- Added intake-flow and API-response tests. The suite now contains 28 passing tests across six files, including deterministic timeout, API-failure, malformed-output, retryability, adaptation, input validation, and response-validation behavior.
- Browser-verified empty input, adaptive copy, back-state preservation, review/edit structure, loading copy, visible keyboard focus, restart affordance, desktop layout, 390×844 mobile layout, no horizontal overflow, and a clean console.
- The first Vercel live request exposed a real runtime-budget issue: the 30-second function limit expired while the SDK could attempt a 20-second request plus one automatic retry. The public UI failed safely and preserved all answers.
- Fixed the deployment timeout by disabling automatic SDK retries, setting one 45-second SDK request budget, and increasing the route budget to 60 seconds so the route can return a controlled result instead of being killed by Vercel.
- Deployed replacement Preview `dpl_G38ARBQfrbeRbsQShZosu44fbBJK`, remotely built in 17 seconds, and confirmed status `Ready`.
- The permitted re-verification succeeded in the authenticated Preview. The live response rendered 8 facts, 3 inferences, 5 constraints, 5 uncertainty questions, and 1 tension under visibly separate headings, with no browser warnings/errors, environment names, secret-like values, or framework overlay.
- Made exactly two live GPT-5.6 requests during this work block, both in Vercel Preview: the required initial deployed verification, then one necessary re-verification after fixing its runtime timeout. No load testing, prompt experimentation, or repeated local request was performed.

### 2026-07-16 — Secure structured-profile smoke test and preview

- Audited the repository against `SPEC.md`: the foundation shell was complete, but no OpenAI SDK, model call, runtime schema validation, server endpoint, or model-backed UI existed.
- Added the official `openai` SDK and Zod, strict `IntakeAnswer`, intake-request, and full `StudentProfile` schemas, representative demo answers, and a valid profile fixture.
- Added a server-only GPT-5.6 Responses API integration using `responses.parse` with a Zod text format, a 20-second timeout, one SDK retry, a 30-second route budget, and an allow-list check that rejects non-GPT-5.6 model configuration.
- Added `POST /api/profile`, which rejects invalid input and returns stable public-safe errors for missing configuration, invalid model configuration, timeout, upstream API failure, and malformed structured output. It does not log student answers, raw SDK errors, or environment values.
- Replaced the honest `/intake` placeholder with a deliberately narrow representative-data smoke test. It submits only on user action, does not persist data, displays validated profile sections, exposes a loading state, and offers retry only for retryable failures.
- Updated `.env.example` and `README.md` with placeholder-only local and Vercel setup. No real key was present in `.env.local`, the shell environment, repository, Vercel Preview settings, browser bundle, response body, or rendered page.
- Upgraded Next.js and `eslint-config-next` from 16.1.1 to 16.2.10 to remove high-severity framework advisories discovered during the audit.
- Added 17 focused schema, model-service, and route tests; the suite now contains 19 passing tests across four files.
- Deployed Vercel preview `dpl_DLLLGFuKiBiPkmQwGfBG7nnEoYHx`; remote build completed and status is `Ready`.
- Browser-verified the deployed `/intake` route in a fresh authenticated tab at desktop and 390×844 mobile sizes: no horizontal overflow, Next error overlay, console messages, or secret-like content. The expected missing-configuration state renders safely because Preview environment variables are absent.
- Kept the landing page design unchanged and did not add authentication, persistence, a database, map behavior, or unrelated infrastructure.

### 2026-07-16 — Vercel output-directory correction

- Diagnosed the failed preview build: Vercel was looking for a static `public` build output even though this repository is a Next.js App Router project that emits `.next`.
- Added `vercel.json` to pin the Vercel framework preset to Next.js and override the deployment output directory to `.next`.
- Kept the application build command and Next.js configuration unchanged.
- Verified lint, strict type checking, tests, and the production build; the build created `.next` successfully.

### 2026-07-16 — Foundation product shell

- Inspected the documentation-only initial commit (`b7a67b6`) and confirmed no application scaffold existed.
- Added Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, ESLint, Vitest, and the pinned npm lockfile.
- Added `lint`, `typecheck`, `test`, `build`, `dev`, and `start` scripts.
- Added a safe `.env.example` and ignore rules for local secrets, framework output, dependencies, and Vercel linkage.
- Established Steppi’s light editorial design system from `docs/DESIGN.md`: parchment canvas, Fraunces display type, Geist interface type, restrained blue interaction color, equal branch tints, spacing, radius, focus, and motion tokens.
- Added a source-owned, customized shadcn-style Button primitive and `components.json`; the optional shadcn CLI audit was not run because execution of newly downloaded CLI code was rejected by the safety reviewer.
- Built the responsive landing page, purposeful static three-branch product preview, one dominant CTA, and explicit exploration-not-prediction trust copy.
- Added `/intake` as an honest foundation handoff that clearly says the intake flow is not implemented yet.
- Added root loading, recoverable error, and not-found foundations.
- Added a minimal product-constant test covering the intake route and exactly three branch labels.
- Browser-verified the landing page at 1440×1000 and 390×844, CTA navigation, visible keyboard focus, no horizontal overflow, CTA visibility above the fold, the 404 state, and a clean browser console after fixing the Next.js smooth-scroll warning.
- Reviewed the resulting file list, untracked application scope, and secret scan; no unrelated source changes or exposed token patterns were found.

### Files added

- Project tooling: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `.gitignore`, `.env.example`
- Application: `src/app/**`, `src/components/landing/**`, `src/components/shell/**`, `src/components/ui/button.tsx`, `src/lib/**`
- Documentation: `README.md`, this status update

### Checks run

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run test` — passed, 12 files and 62 tests
- `npm run build` — passed on Next.js 16.2.10; `/`, `/_not-found`, and `/intake` are static while `/api/profile` and `/api/paths` are dynamic
- Local browser verification — passed for confirmed-profile-to-three-paths success and controlled failures at 1440×1000 and 390×844
- `git diff --check` — passed with no whitespace errors
- Secret checks — `.env.local` is ignored and untracked; no tracked OpenAI token signature, client-prefixed OpenAI variable, or client-exposed key pattern was found
- Direct local route checks — passed for invalid input (`400`) and missing configuration (`503`), both with `Cache-Control: no-store`
- Source and `.next/static` scans — no real OpenAI token signature, non-placeholder key, or server environment name in the browser bundle
- Vercel path Preview — deployment `dpl_GnQXrRhbQZeArZg5mxnQ5ynFYFwN` is `Ready`; the authenticated live path API smoke test returned HTTP 200
- `npm audit --omit=dev` — completed with two moderate findings caused by Next.js 16.2.10 pinning `postcss@8.4.31`; npm's suggested forced fix would incorrectly downgrade Next.js to 9.3.3 and was not applied

---

## Historical Known Issues at Archive Time

- The Vercel preview remains protected by Vercel Authentication; anonymous judge access is not yet available.
- The intake currently functions as a polished multi-step questionnaire rather than the intended continuous conversational interview. It still collects and validates the required student data, so this does not block Milestone 3, but it must be revisited before final feature freeze.
- The intake, returned profile, pending patch, and confirmed profile exist only in React state and are lost on refresh. Persistence remains intentionally out of scope.
- The intended 3–5 minute completion time has not been measured with representative students.
- Two moderate `npm audit` findings remain in Next.js's pinned transitive PostCSS dependency. The available forced remediation is an unsafe framework downgrade and is not appropriate.
- The landing page relies on `next/font/google`; a local production build needs network access the first time it fetches Fraunces and Geist.
- The error boundary exists and passes lint, type checking, and production build, but an intentional runtime fault was not added solely to exercise it in the browser.
- The root loading boundary is present, but the current static routes resolve too quickly to make its normal browser appearance reliably observable.
- Exact retrieval implementation is undecided and remains intentionally deferred.
- Duplicate detection is deliberately lexical and deterministic. It catches normalized-name equality, high direction overlap, and a shared underlying career/major across all branches, but it is not a semantic embedding model and may need calibration against more personas.

---

## Historical Decision Record

- Track: Education
- Audience: Grade 11 students
- No authentication for the MVP
- No comprehensive database
- Exactly three initial branches
- One central student node
- One researched branch is sufficient
- Two expansion levels are sufficient
- Corrections patch the profile
- Refinement updates only the relevant branch
- Current factual claims require sources
- Confidence is qualitative
- Desktop is presentation-first
- Mobile must remain usable
- One polished exploration loop takes priority over feature breadth
- Historical Milestone 0 scope was completed before the structured-profile work began; the current explicit request superseded the earlier sequencing assumption and intentionally implemented a narrow Milestone 2 slice before the full Milestone 1 golden path.
- Use a restrained editorial field-guide direction; the product preview is functional communication, not decorative illustration.
- Use a small source-owned shadcn-style primitive layer customized to Steppi tokens instead of adopting shadcn’s default product aesthetic.
- Keep `/intake` honest about in-memory intake, correction, and confirmation state until persistence is explicitly in scope.
- Do not initialize a database, authentication, or hypothetical scale infrastructure. A narrowly scoped server-only model client is now authorized for the structured-profile smoke test.
- Pin Vercel to the Next.js framework preset and `.next` output in repository configuration so a stale dashboard-level `public` override cannot break deployments.
- Use the official OpenAI JavaScript SDK's Responses API with structured output and Zod validation for profile generation.
- Default `OPENAI_MODEL` to `gpt-5.6`, but reject configured model names outside the `gpt-5.6` family so the required model cannot be silently substituted.
- Keep the API route stateless and `no-store`; send only public-safe error codes/messages and never return raw SDK errors.
- Use representative demo intake data to smoke-test the integration until the full intake UI is implemented.
- Treat a mocked valid SDK response as implementation verification, not evidence that a live GPT-5.6 request succeeded.
- Upgrade to Next.js 16.2.10 for the available high-severity security fixes; document the residual transitive PostCSS advisory instead of applying npm's breaking forced downgrade.
- Use deterministic branching for the MVP intake follow-up so adaptation is visible without paying for a model call on every question.
- Keep intake state in memory for now; back navigation and edit preserve answers within the active page, while refresh persistence remains deferred.
- Validate the server response again at the client boundary before it enters rendered state.
- Use one OpenAI attempt with a 45-second timeout inside a 60-second Vercel function budget. User-triggered retry remains available, but the SDK does not automatically repeat a paid request.
- Keep profile correction local and deterministic: preserve the original validated profile, preview one `ProfilePatch`, and only render the patched profile as confirmed after explicit student confirmation.
- Reuse the profile schema's 600-character statement limit for student-added constraints and inference replacements.
- Before path generation was implemented, its confirmation handoff remained an honest controlled placeholder rather than invented branches or a decorative fake map.
- The current questionnaire-style intake is accepted only as a temporary functional implementation to unblock the map. It is documented UX debt, not the intended final Steppi interaction.
- Generate the complete three-branch set in one GPT-5.6 request; never make one paid request per branch or enable automatic SDK retries.
- Enforce exact roles, count, evidence integrity, distinctness, and unsupported-current-claim rejection in deterministic server code after structured-output parsing.
- The temporary editorial comparison was replaced by a source-owned React and SVG graph; this four-node interaction does not require a graph library.
- Steppi is a focused personal path graph, not a dashboard with a decorative graph.
- Contextual panels support the graph but do not replace it as the primary navigation experience.
- The graph grows through branch-local exploration while preserving unaffected nodes and relationships.
- Keep visual density curated and understandable through progressive disclosure and restrained node counts.

---

## Unverified at Archive Time

- Live upstream timeout, API-failure, and malformed-output responses were not induced against OpenAI; all were verified through deterministic injected-client tests and route tests.
- Anonymous public access is not verified because Vercel Authentication protects this preview.
- Production-domain settings were not viewed or changed.
- Root error and loading UI were not deliberately forced in the browser; both are compile-verified foundations.
- Branch research, retrieval, refinement, and persistence remain unimplemented.
- Native Enter/Space branch activation is not browser-verified: the in-app browser focused the native branch buttons but did not dispatch either activation key. Native button semantics, selection state, and compiled focus-ring styles are covered by static and unit checks.
- The full deployed browser journey was not repeated because it would require an additional live profile request before the permitted path request. The new authenticated Preview path API itself was live-tested once with representative validated profile data.

---

## Archived Next Recommended Prompt

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/DESIGN.md, and docs/TASKS.md.

Treat docs/VISION.md as authoritative for the graph-first product direction.
Do not redesign the landing page or begin research, retrieval, refinement,
persistence, authentication, or database work. Close Milestone 3 verification:

1. Add one materially different, clearly labeled deterministic profile and
   three-branch fixture without changing schemas, prompts, routes, or services.
2. Verify the graph still renders one student, exactly three required roles,
   equal prominence, understandable relationships, selected-only details, and
   stable profile/branch data for that persona.
3. Use a real browser surface that reliably dispatches keyboard events to test
   Tab focus, visible focus, Enter selection, Space selection, switching, and
   clearing on desktop and mobile.
4. Recheck pointer selection, overflow, control bounds, and the console. Fix only
   defects revealed by these checks.
5. Run lint, typecheck, tests, production build, and `git diff --check`. Mark
   Milestone 3 complete only if every remaining acceptance criterion is verified.

Use fixtures only. Do not make a live GPT-5.6 request or deploy.
```
