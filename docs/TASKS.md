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

**Project stage:** Foundation deployed; narrow structured-profile integration implemented and awaiting a real API key

**Current milestone:** Milestone 2 — Intake and Structured Profile (narrow smoke-test slice)

**Primary objective:** Configure `OPENAI_API_KEY` locally and for Vercel Preview, then verify one real GPT-5.6 response end to end without expanding the intake scope.

**Primary Codex thread:** Active — foundation shell work block started 2026-07-16

**Deployment:** Preview is `Ready` at [steppi-openai-build-week-l8ek52p2e-pgc9002-3129s-projects.vercel.app](https://steppi-openai-build-week-l8ek52p2e-pgc9002-3129s-projects.vercel.app). Vercel Authentication is enabled and no Preview environment variables are configured.

**Known implementation:** Next.js App Router shell, responsive landing page, representative intake smoke test, strict intake and `StudentProfile` schemas, server-only OpenAI Responses API call, structured-output parsing, public-safe route errors, profile rendering, loading/retry UI, and automated failure-path tests.

---

## Immediate Next Task

Add `OPENAI_API_KEY` to `.env.local` and add `OPENAI_API_KEY` plus `OPENAI_MODEL=gpt-5.6` to the Vercel project with **Preview** scope. Redeploy, run the representative intake request locally and in the authenticated preview, verify the returned profile and browser console, and record the exact live-test result. Do not paste or commit the key and do not change production-domain settings.

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
- [ ] Implement schema for `ProfilePatch`
- [ ] Implement schema for `PathBranch`
- [ ] Implement schema for `ResearchNode`
- [ ] Implement schema for `MapState`
- [x] Add valid demo fixtures for the intake/profile smoke test
- [x] Add invalid-fixture tests for implemented schemas
- [x] Keep fixtures clearly labeled as demo data

### User journey

- [x] Landing → intake
- [ ] Intake progress and back navigation
- [ ] Preserve previous answers
- [ ] At least one visibly adaptive follow-up
- [ ] Intake → profile confirmation
- [x] Visually separate facts and inferences in the profile smoke test
- [ ] Allow one inference correction
- [ ] Confirmation → map
- [ ] Render one central student node
- [ ] Render exactly three initial path branches
- [ ] Open branch details
- [ ] Show a static researched branch fixture
- [ ] Submit one refinement fixture
- [ ] Update only the selected branch in local state

### Required UI states

- [x] Loading for the profile-generation request
- [ ] Empty input
- [ ] Invalid local input
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

- [ ] Finalize the minimum intake question set
- [ ] Keep completion time near 3–5 minutes
- [ ] Implement one adaptive follow-up
- [ ] Preserve answers during back navigation
- [ ] Validate all inputs before submission
- [ ] Provide restart/reset behavior

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
- [ ] Allow an inference to be removed or replaced
- [ ] Allow a missing constraint to be added
- [ ] Apply a structured `ProfilePatch`
- [ ] Preserve unrelated profile data

### Tests and verification

- [x] Test valid profile output with an injected SDK fixture
- [x] Test malformed model output
- [x] Test API failure and timeout
- [x] Test empty intake rejection
- [ ] Browser-test the full profile flow
- [x] Run baseline validation suite

### Milestone 2 completion gate

- [ ] A real GPT-5.6 call produces a validated profile
- [ ] The student can correct Steppi before path generation
- [x] Verified error classes do not crash the flow

---

## Milestone 3 — Initial Path Generation and Map

**Goal:** Generate and display exactly three distinct path branches from the confirmed profile.

### Path generation

- [ ] Generate one `strongest-fit` branch
- [ ] Generate one `adjacent` branch
- [ ] Generate one `underexplored` branch
- [ ] Validate exactly three results
- [ ] Require evidence references to profile items
- [ ] Include drawbacks
- [ ] Include unresolved questions
- [ ] Use qualitative confidence
- [ ] Reject or retry duplicate or near-duplicate branches

### Map interface

- [ ] Render central student node
- [ ] Render exactly three branch nodes
- [ ] Show understandable relationships
- [ ] Support click/select
- [ ] Show a branch details panel
- [ ] Use progressive disclosure
- [ ] Avoid raw graph-editor controls
- [ ] Provide a non-drag-dependent mobile fallback
- [ ] Preserve confirmed profile state

### Verification

- [ ] Test demo persona output
- [ ] Test a materially different persona
- [ ] Test duplicate branch handling
- [ ] Test malformed branch output
- [ ] Browser-test desktop map
- [ ] Browser-test mobile fallback
- [ ] Check accessibility and console
- [ ] Run baseline validation suite

### Milestone 3 completion gate

- [ ] Branches are meaningfully different
- [ ] The user can understand why each path appeared
- [ ] The map remains visually understandable

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
- `npm run test` — passed, 4 files and 19 tests
- `npm run build` — passed on Next.js 16.2.10; `/`, `/_not-found`, and `/intake` are static and `/api/profile` is dynamic
- Local browser verification — passed at desktop and mobile sizes; the request reached the expected safe missing-key state with no console errors
- Direct local route checks — passed for invalid input (`400`) and missing configuration (`503`), both with `Cache-Control: no-store`
- Source and `.next/static` scans — no real OpenAI token signature, non-placeholder key, or server environment name in the browser bundle
- Vercel build — passed remotely in 27 seconds; deployment status `Ready`
- Deployed browser verification — shell and missing-configuration flow passed in an authenticated desktop/mobile browser with a clean console
- `npm audit --omit=dev` — completed with two moderate findings caused by Next.js 16.2.10 pinning `postcss@8.4.31`; npm's suggested forced fix would incorrectly downgrade Next.js to 9.3.3 and was not applied

---

## Known Issues

- No `OPENAI_API_KEY` is available locally or in Vercel Preview, so a real GPT-5.6 success and actual structured response have not been tested.
- The Vercel preview is protected by Vercel Authentication. A signed-in fresh browser tab works, while unauthenticated `curl` receives Vercel's `401 Protected deployment` before reaching the app.
- The current `/intake` page is a representative smoke test, not the final multi-step adaptive intake. It intentionally has no back navigation, correction flow, map handoff, or persistence.
- Two moderate `npm audit` findings remain in Next.js's pinned transitive PostCSS dependency. The available forced remediation is an unsafe framework downgrade and is not appropriate.
- The landing page relies on `next/font/google`; a local production build needs network access the first time it fetches Fraunces and Geist.
- The error boundary exists and passes lint, type checking, and production build, but an intentional runtime fault was not added solely to exercise it in the browser.
- The root loading boundary is present, but the current static routes resolve too quickly to make its normal browser appearance reliably observable.
- Exact graph library is undecided and remains intentionally deferred.
- Exact retrieval implementation is undecided and remains intentionally deferred.

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
- Keep `/intake` honest about using representative data until the full static intake flow is implemented.
- Do not initialize a database, authentication, or hypothetical scale infrastructure. A narrowly scoped server-only model client is now authorized for the structured-profile smoke test.
- Pin Vercel to the Next.js framework preset and `.next` output in repository configuration so a stale dashboard-level `public` override cannot break deployments.
- Use the official OpenAI JavaScript SDK's Responses API with structured output and Zod validation for profile generation.
- Default `OPENAI_MODEL` to `gpt-5.6`, but reject configured model names outside the `gpt-5.6` family so the required model cannot be silently substituted.
- Keep the API route stateless and `no-store`; send only public-safe error codes/messages and never return raw SDK errors.
- Use representative demo intake data to smoke-test the integration until the full intake UI is implemented.
- Treat a mocked valid SDK response as implementation verification, not evidence that a live GPT-5.6 request succeeded.
- Upgrade to Next.js 16.2.10 for the available high-severity security fixes; document the residual transitive PostCSS advisory instead of applying npm's breaking forced downgrade.

---

## Unverified

- A successful real GPT-5.6 request is unverified locally because no `OPENAI_API_KEY` exists in `.env.local` or the shell environment.
- A successful real GPT-5.6 request is unverified on Vercel because the project has no Preview environment variables. The deployed app's safe missing-configuration behavior is verified.
- Live upstream timeout, API-failure, and malformed-output responses were not induced against OpenAI; all were verified through deterministic injected-client tests and route tests.
- The successful profile-rendering browser state was not verified against a live model response; rendering is covered by TypeScript/build and the generation success path by tests.
- Anonymous public access is not verified because Vercel Authentication protects this preview.
- Production-domain settings were not viewed or changed.
- Root error and loading UI were not deliberately forced in the browser; both are compile-verified foundations.
- Full adaptive intake state, profile correction, map interaction, research, refinement, and persistence remain unimplemented.

---

## Next Recommended Prompt

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/DESIGN.md, and docs/TASKS.md.

Do not redesign the landing page or expand product scope. Configure the existing
structured-profile smoke test for one real GPT-5.6 verification:

1. Confirm the user has created `.env.local` from `.env.example` and placed a
   real `OPENAI_API_KEY` there without printing, reading, or committing it.
2. Run the local app and use `/intake` to perform one real request. Verify the
   returned profile renders, facts remain separate from inferences, the browser
   console is clean, and no secret appears in the response, bundle, page, logs,
   or tracked files.
3. Add `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5.6` to Vercel with Preview scope.
   Do not change production-domain settings.
4. Redeploy a preview, inspect build/runtime results, and perform the same real
   request through the authenticated preview.
5. Re-run lint, typecheck, tests, build, the token scans, and diff review.
6. Update README.md and docs/TASKS.md with the exact observed live result and
   any model-output or timeout limitation. Do not mark the Milestone 2 gate
   complete unless the real GPT-5.6 call succeeds and validates.

After that live integration gate passes, the next implementation task is the
minimum multi-step intake with progress, back navigation, preserved answers,
one adaptive follow-up, and client-side validation. Do not add authentication,
persistence, the map, or research in that work block.
```
