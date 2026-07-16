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

**Project stage:** Foundation shell implemented locally; preview deployment pending

**Current milestone:** Milestone 0 — Foundation

**Primary objective:** Authorize Vercel, deploy the verified product shell, and complete the Milestone 0 deployment gate.

**Primary Codex thread:** Active — foundation shell work block started 2026-07-16

**Deployment:** Blocked on Vercel device authorization. Local production build passes.

**Known implementation:** Next.js App Router shell, responsive landing page, future-intake handoff route, shared Steppi tokens, customized shadcn-style Button primitive, loading/error/not-found foundations, and baseline quality scripts.

---

## Immediate Next Task

Complete Vercel authorization, create a preview deployment, inspect its build result, and browser-test the public preview at desktop and mobile viewport sizes. Then record the preview URL in `README.md` and here. Do not change production-domain settings.

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

- [ ] Create an initial deployment
- [ ] Verify the deployed URL in a clean browser
- [ ] Record the deployment URL in `README.md`
- [ ] Confirm no secrets are exposed

### Milestone 0 completion gate

Milestone 0 is complete only when:

- [x] Local development works
- [x] Lint passes
- [x] Type checking passes
- [x] Tests pass
- [x] Production build passes
- [x] Landing shell works in a browser
- [ ] Initial deployment works
- [x] This file reflects the real repository state

---

## Milestone 1 — Static Golden-path Skeleton

**Goal:** Build the complete user journey with validated representative fixtures before connecting all model-backed behavior.

### Typed domain models

- [ ] Implement schemas for `IntakeAnswer`
- [ ] Implement schema for `StudentProfile`
- [ ] Implement schema for `ProfilePatch`
- [ ] Implement schema for `PathBranch`
- [ ] Implement schema for `ResearchNode`
- [ ] Implement schema for `MapState`
- [ ] Add valid demo fixtures
- [ ] Add invalid-fixture tests
- [ ] Keep fixtures clearly labeled as demo data

### User journey

- [ ] Landing → intake
- [ ] Intake progress and back navigation
- [ ] Preserve previous answers
- [ ] At least one visibly adaptive follow-up
- [ ] Intake → profile confirmation
- [ ] Visually separate facts and inferences
- [ ] Allow one inference correction
- [ ] Confirmation → map
- [ ] Render one central student node
- [ ] Render exactly three initial path branches
- [ ] Open branch details
- [ ] Show a static researched branch fixture
- [ ] Submit one refinement fixture
- [ ] Update only the selected branch in local state

### Required UI states

- [ ] Loading
- [ ] Empty input
- [ ] Invalid local input
- [ ] Generic API error placeholder
- [ ] Malformed-output placeholder
- [ ] Retry action

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
- [ ] The product structure is ready for server-side model calls

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

- [ ] Add server-only OpenAI client configuration
- [ ] Read model name from `OPENAI_MODEL`
- [ ] Generate `StudentProfile` from validated intake
- [ ] Validate structured output before returning it
- [ ] Add timeout and API-error handling
- [ ] Add malformed-output handling
- [ ] Add retry behavior
- [ ] Avoid logging sensitive student content unnecessarily

### Confirmation and correction

- [ ] Display facts separately from inferences
- [ ] Display constraints
- [ ] Display uncertainty
- [ ] Allow an inference to be removed or replaced
- [ ] Allow a missing constraint to be added
- [ ] Apply a structured `ProfilePatch`
- [ ] Preserve unrelated profile data

### Tests and verification

- [ ] Test valid profile output
- [ ] Test malformed model output
- [ ] Test API failure
- [ ] Test empty intake rejection
- [ ] Browser-test the full profile flow
- [ ] Run baseline validation suite

### Milestone 2 completion gate

- [ ] A real GPT-5.6 call produces a validated profile
- [ ] The student can correct Steppi before path generation
- [ ] Errors do not crash the flow

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
- `npm run test` — passed, 1 file and 2 tests
- `npm run build` — passed; `/`, `/_not-found`, and `/intake` prerendered as static routes
- Local browser verification — passed at desktop and mobile sizes with no final console warnings or errors

---

## Known Issues

- Preview deployment is blocked until the Vercel device authorization flow is approved; no preview URL or remote build log has been verified yet.
- The landing page relies on `next/font/google`; a local production build needs network access the first time it fetches Fraunces and Geist.
- The intake route is a transparent placeholder, not an intake implementation.
- The error boundary exists and passes lint, type checking, and production build, but an intentional runtime fault was not added solely to exercise it in the browser.
- The root loading boundary is present, but the current static routes resolve too quickly to make its normal browser appearance reliably observable.
- Exact graph library is undecided and remains intentionally deferred.
- Exact retrieval implementation is undecided and remains intentionally deferred.
- Exact current GPT-5.6 model identifier must be configured during implementation.

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
- Treat this work block as Milestone 0 foundation scope because the requested deliverables conflict with `SPEC.md`/`TASKS.md` Milestone 1, which is the full static golden path.
- Use a restrained editorial field-guide direction; the product preview is functional communication, not decorative illustration.
- Use a small source-owned shadcn-style primitive layer customized to Steppi tokens instead of adopting shadcn’s default product aesthetic.
- Keep `/intake` honest and noninteractive until the static intake flow is implemented.
- Do not initialize a database, authentication, model client, or hypothetical scale infrastructure.

---

## Unverified

- Vercel preview deployment, remote build logs, and public-page browser behavior are not verified because Vercel authentication is pending.
- Production-domain settings were not viewed or changed.
- Root error and loading UI were not deliberately forced in the browser; both are compile-verified foundations.
- No GPT-5.6 behavior, intake state, profile schemas, map interaction, research, refinement, or persistence exists in this milestone.

---

## Next Recommended Prompt

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, docs/DESIGN.md, and docs/TASKS.md.

Resume the existing Vercel device authorization flow if it is still active, or
start a new `npx vercel@50.28.0 login` device flow. After authentication:

1. Re-run `npm run build` and do not continue unless it passes.
2. Create a Vercel preview deployment only; do not change production domains.
3. Inspect the deployment result and remote build details.
4. Browser-test the public preview at desktop and mobile viewport sizes.
5. Check the deployed page for console errors, horizontal overflow, CTA
   navigation to `/intake`, and the not-found foundation.
6. Record the verified preview URL in README.md and docs/TASKS.md.
7. Update the deployment checklist, known limitations, and unverified section.

If the preview is verified, mark Milestone 0 complete and make the exact next
recommended implementation task Milestone 1: add the typed Zod domain schemas,
representative demo fixtures, and the static landing-to-intake flow without any
GPT-5.6 calls yet. Preserve the established design direction and existing
component primitives. Run lint, typecheck, test, and build again after edits.
```
