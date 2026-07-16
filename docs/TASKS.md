---
title: Steppi Build Status
project: Steppi
event: OpenAI Build Week
status: active
version: 0.1
last_updated: 2026-07-16
---

# Steppi Build Status

## Current State

**Project stage:** Milestone 3 graph-first interface implemented; native Enter/Space activation still needs browser re-verification

**Current milestone:** Milestone 3 — Initial Path Generation and Map

**Primary objective:** Close the remaining Milestone 3 keyboard-verification and second-persona gaps before source-backed expansion.

**Primary Codex thread:** Active — smallest graph-first Milestone 3 slice completed 2026-07-16

**Deployment:** Latest Preview is `Ready` at [steppi-openai-build-week-gsfxhz2da-pgc9002-3129s-projects.vercel.app](https://steppi-openai-build-week-gsfxhz2da-pgc9002-3129s-projects.vercel.app). Vercel Authentication is enabled, both required Preview variables are present, and one real deployed GPT-5.6 path response passed the complete validator.

**Known implementation:** Next.js App Router shell, responsive landing page, eight-question in-memory intake, validated GPT-5.6 profile generation, reversible local profile correction, strict exact-three `PathBranch` generation, safe path API states, and a responsive graph-first map with one student node, three equal branch nodes, selected-only details, and a non-drag mobile hierarchy.

---

## Immediate Next Task

Complete Milestone 3 verification with a materially different deterministic persona and a browser surface that reliably dispatches native Enter and Space activation. Change the interface only if those checks reveal a defect; do not begin research or refinement yet.

---

## Milestone 0 — Foundation

### Repository and tooling

- [x] Inspect current repository state
- [x] Confirm or preserve the application stack
- [x] Scaffold Next.js App Router + TypeScript if the repository is empty
- [x] Enable strict TypeScript
- [x] Configure Tailwind CSS
- [x] Add or verify lint script
- [x] Add or verify typecheck script
- [x] Add or verify test script
- [x] Add or verify production build script
- [x] Add `.env.example`
- [x] Ensure `.env*` secrets are ignored appropriately
- [x] Add a minimal test setup
- [x] Confirm the development server starts
- [x] Confirm the production build succeeds

### Durable context

- [x] Add `AGENTS.md`
- [x] Add `docs/VISION.md`
- [x] Add `docs/SPEC.md`
- [x] Add `docs/TASKS.md`
- [x] Confirm the source-of-truth hierarchy is consistent
- [x] Ensure no duplicate or conflicting project-document versions remain in the repository

### Product shell

- [x] Add page metadata
- [x] Create a minimal Steppi landing screen
- [x] Communicate the target user and core promise
- [x] Add a clear start action
- [x] Add a short trust statement: exploration, not prediction
- [x] Establish initial spacing, typography, and responsive layout
- [x] Verify desktop layout
- [x] Verify mobile fallback
- [x] Verify keyboard focus
- [x] Check browser console

### Deployment

- [x] Create an initial deployment
- [x] Verify the deployed URL in a fresh browser tab
- [x] Record the deployment URL in `README.md`
- [x] Confirm no secrets are exposed in source, static browser bundles, public responses, or browser-rendered content

### Milestone 0 completion gate

Milestone 0 is complete only when:

- [x] Local development works
- [x] Lint passes
- [x] Type checking passes
- [x] Tests pass
- [x] Production build passes
- [x] Landing shell works in a browser
- [x] Initial deployment works
- [x] This file reflects the real repository state

---

## Milestone 1 — Static Golden-path Skeleton

**Goal:** Build the complete user journey with validated representative fixtures before connecting all model-backed behavior.

### Typed domain models

- [x] Implement schemas for `IntakeAnswer`
- [x] Implement schema for `StudentProfile`
- [x] Implement schema for `ProfilePatch`
- [x] Implement schema for `PathBranch`
- [ ] Implement schema for `ResearchNode`
- [ ] Implement schema for `MapState`
- [x] Add valid demo fixtures for the intake/profile smoke test
- [x] Add invalid-fixture tests for implemented schemas
- [x] Keep fixtures clearly labeled as demo data

### User journey

- [x] Landing → intake
- [x] Intake progress and back navigation
- [x] Preserve previous answers in local state
- [x] At least one visibly adaptive follow-up
- [x] Intake → profile confirmation
- [x] Visually separate facts and inferences in the profile smoke test
- [x] Allow one inference correction
- [ ] Confirmation → map
- [ ] Render one central student node
- [x] Render exactly three initial path branches in temporary editorial output
- [ ] Open branch details
- [ ] Show a static researched branch fixture
- [ ] Submit one refinement fixture
- [ ] Update only the selected branch in local state

### Required UI states

- [x] Loading for the profile-generation request
- [x] Empty input
- [x] Invalid local input
- [x] Generic API error placeholder
- [x] Malformed-output placeholder
- [x] Retry action for retryable failures

### Verification

- [ ] Complete the static golden path in a browser
- [ ] Verify desktop layout
- [ ] Verify mobile fallback
- [ ] Verify keyboard navigation
- [ ] Check browser console
- [ ] Run baseline validation suite

### Milestone 1 completion gate

- [ ] A judge-like user can complete the whole demo flow using fixtures
- [ ] No model or retrieval integration is required to understand the product
- [x] The product structure is ready for server-side model calls

---

## Milestone 2 — Intake and Structured Profile

**Goal:** Replace the profile fixture with a real GPT-5.6-backed, schema-validated profile-generation flow.

### Intake behavior

- [x] Finalize the minimum intake question set
- [ ] Keep completion time near 3–5 minutes
- [x] Implement one adaptive follow-up
- [x] Preserve answers during back navigation
- [x] Validate all inputs before submission
- [x] Provide restart/reset behavior

### Server-side model integration

- [x] Add server-only OpenAI client configuration
- [x] Read model name from `OPENAI_MODEL`
- [x] Implement `StudentProfile` generation from validated intake
- [x] Validate structured output before returning it
- [x] Add timeout and API-error handling
- [x] Add malformed-output handling
- [x] Add retry behavior
- [x] Avoid logging sensitive student content unnecessarily

### Confirmation and correction

- [x] Display facts separately from inferences in the smoke-test result
- [x] Display constraints in the smoke-test result
- [x] Display uncertainty in the smoke-test result
- [x] Allow an inference to be removed or replaced
- [x] Allow a missing constraint to be added
- [x] Apply a structured `ProfilePatch`
- [x] Preserve unrelated profile data

### Tests and verification

- [x] Test valid profile output with an injected SDK fixture
- [x] Test malformed model output
- [x] Test API failure and timeout
- [x] Test empty intake rejection
- [x] Browser-test the full intake-to-profile flow locally and in Vercel Preview
- [x] Run baseline validation suite

### Milestone 2 completion gate

- [x] A real GPT-5.6 call produces a validated profile locally and in Vercel Preview
- [x] The student can correct Steppi before path generation
- [x] Verified error classes do not crash the flow

---

## Milestone 3 — Initial Path Generation and Map

**Goal:** Generate exactly three distinct path branches from the confirmed profile and make their graph the primary interaction surface.

### Path generation

- [x] Generate one `strongest-fit` branch
- [x] Generate one `adjacent` branch
- [x] Generate one `underexplored` branch
- [x] Validate exactly three results
- [x] Require evidence references to profile items
- [x] Include drawbacks
- [x] Include unresolved questions
- [x] Use qualitative confidence
- [x] Reject or retry duplicate or near-duplicate branches

### Map interface

- [x] Make the graph the primary interaction surface
- [x] Render one central student node
- [x] Render exactly three equal first-level branch nodes
- [x] Show understandable edges between the student and each branch
- [x] Keep default branch-node content concise
- [x] Support click and native-button keyboard selection semantics
- [x] Visibly emphasize the selected branch
- [x] Show one contextual detail panel for the selected branch
- [x] Support branch-local focus behavior
- [x] Use progressive disclosure
- [x] Do not simultaneously render every branch's full evidence and rationale
- [x] Avoid raw graph-editor controls
- [x] Provide a non-drag-dependent mobile fallback
- [x] Preserve confirmed profile state

### Verification

- [x] Test demo persona output
- [ ] Test a materially different persona
- [x] Test duplicate branch handling
- [x] Test malformed branch output
- [x] Browser-test desktop map
- [x] Browser-test mobile fallback
- [x] Check pointer accessibility, focus restoration, overflow, and console
- [ ] Re-verify native Enter/Space activation in a browser tool that dispatches those keys reliably
- [x] Run baseline validation suite

### Milestone 3 completion gate

- [x] Branches are meaningfully different
- [x] The user can understand why each path appeared
- [x] The map remains visually understandable

---

## Milestone 4 — Source-backed Research Expansion

**Goal:** Research one selected branch using current sources and add a small set of source-backed nodes.

### Research workflow

- [ ] Select one branch
- [ ] Accept one focused question
- [ ] Retrieve current sources using an approved method
- [ ] Pass retrieved information to GPT-5.6 for synthesis
- [ ] Validate `ResearchNode` output
- [ ] Require source title and URL
- [ ] Require date checked
- [ ] Require relevance to the student
- [ ] Require caveats
- [ ] Require qualitative confidence
- [ ] Add nodes under only the selected branch

### Trust requirements

- [ ] No current factual claim without a supporting source
- [ ] Source links open correctly
- [ ] Display freshness
- [ ] Avoid unsupported rankings
- [ ] Handle conflicting or insufficient sources honestly
- [ ] Limit results to a small, useful set

### Failure states

- [ ] No source found
- [ ] Source unavailable
- [ ] Retrieval failure
- [ ] Model failure
- [ ] Malformed research output
- [ ] Retry behavior

### Verification

- [ ] Test the demo question
- [ ] Verify displayed claims against sources
- [ ] Test one insufficient-evidence case
- [ ] Browser-test source interactions
- [ ] Run baseline validation suite

### Milestone 4 completion gate

- [ ] At least one branch contains useful current research
- [ ] Every current factual node is traceable to a source
- [ ] Failure states remain understandable

---

## Milestone 5 — Branch-local Refinement

**Goal:** Apply one new student constraint and update only the relevant branch.

### Refinement behavior

- [ ] Accept a free-text or structured constraint
- [ ] Convert it into a validated constraint
- [ ] Identify the affected branch
- [ ] Generate a branch-local patch
- [ ] Preserve unaffected branches
- [ ] Preserve unrelated research nodes
- [ ] Show what changed
- [ ] Explain why it changed
- [ ] Allow retry or undo where practical

### Demo refinements

- [ ] “I do not enjoy coding.”
- [ ] “Prioritize affordable options near Manila.”

At least one must work reliably in the final demo.

### Verification

- [ ] Confirm unaffected branch object identity or equivalent state preservation
- [ ] Test malformed patch
- [ ] Test irrelevant constraint
- [ ] Test API failure
- [ ] Browser-test visible change
- [ ] Run baseline validation suite

### Milestone 5 completion gate

- [ ] The selected branch changes appropriately
- [ ] The rest of the map stays stable
- [ ] The student can understand the update

---

## Milestone 6 — Reliability, Design, and Submission

**Goal:** Freeze features and make the project safe, coherent, testable, and easy to judge.

### Deferred intake UX refactor

- [ ] Refactor the intake into one continuous scrolling conversational transcript.
- [ ] Keep previous Steppi prompts and student responses visible.
- [ ] Replace the segmented progress bar and Back/Continue questionnaire controls with a stable composer and transcript-based editing.
- [ ] Make adaptive follow-ups visibly reference prior student answers.
- [ ] Re-evaluate whether profile confirmation should remain a mandatory full-screen step or become an optional “Review what Steppi understood” panel.

### Reliability

- [ ] Run the full golden path from a clean browser
- [ ] Test refresh behavior
- [ ] Test slow network behavior
- [ ] Test model timeout
- [ ] Test malformed model output at each stage
- [ ] Test retry behavior
- [ ] Check console and server logs
- [ ] Confirm no secrets are exposed
- [ ] Confirm safe demo data

### Design

- [ ] Value is clear within 30 seconds
- [ ] Warm, youthful, calm, credible visual direction
- [ ] No generic AI-gradient dependency
- [ ] No dense dashboard feel
- [ ] Readable labels
- [ ] Restrained motion
- [ ] Clear progressive disclosure
- [ ] Mobile fallback is usable
- [ ] Keyboard navigation is usable
- [ ] Reduced motion is respected where practical

### Deployment

- [ ] Final production deployment
- [ ] Test deployment in incognito
- [ ] Test all source links
- [ ] Test on at least one desktop browser
- [ ] Test at least one mobile viewport
- [ ] Add a judge-friendly sample/demo path

### README

- [ ] Product overview
- [ ] Target user and problem
- [ ] Setup instructions
- [ ] Environment variables
- [ ] Sample/demo data
- [ ] Testing instructions
- [ ] GPT-5.6 integration
- [ ] Codex collaboration
- [ ] Key human decisions
- [ ] Build Week scope
- [ ] Known limitations
- [ ] Deployment URL

### Submission assets

- [ ] Devpost description
- [ ] Public YouTube demo under 3 minutes
- [ ] English audio or English translation
- [ ] Demo covers what was built
- [ ] Demo covers how GPT-5.6 is used
- [ ] Demo covers how Codex was used
- [ ] Repository permissions verified
- [ ] `/feedback` run in the primary build thread
- [ ] Session ID saved outside the chat
- [ ] Submission tested in an incognito browser

### Milestone 6 completion gate

- [ ] All required submission fields are ready
- [ ] The deployed golden path works without assistance
- [ ] The final demo matches the actual project behavior
- [ ] Remaining limitations are documented honestly

---

## Completed

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

## Known Issues

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

## Decisions

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

## Unverified

- Live upstream timeout, API-failure, and malformed-output responses were not induced against OpenAI; all were verified through deterministic injected-client tests and route tests.
- Anonymous public access is not verified because Vercel Authentication protects this preview.
- Production-domain settings were not viewed or changed.
- Root error and loading UI were not deliberately forced in the browser; both are compile-verified foundations.
- Branch research, retrieval, refinement, and persistence remain unimplemented.
- Native Enter/Space branch activation is not browser-verified: the in-app browser focused the native branch buttons but did not dispatch either activation key. Native button semantics, selection state, and compiled focus-ring styles are covered by static and unit checks.
- The full deployed browser journey was not repeated because it would require an additional live profile request before the permitted path request. The new authenticated Preview path API itself was live-tested once with representative validated profile data.

---

## Next Recommended Prompt

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
