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

**Project stage:** Pre-implementation / repository initialization

**Current milestone:** Milestone 0 — Foundation

**Primary objective:** Establish a clean repository, verified local development setup, durable project documentation, and the first visible product shell.

**Primary Codex thread:** Not started

**Deployment:** Not started

**Known implementation:** None assumed. Codex must inspect the repository before treating any item as complete.

---

## Immediate Next Task

Initialize the repository and complete Milestone 0.

Codex should:

1. Read `AGENTS.md`, `docs/VISION.md`, `docs/SPEC.md`, and this file.
2. Inspect the repository and recent commits.
3. Report whether the repository is empty, partially scaffolded, or already functional.
4. Confirm the proposed stack or explain why the existing stack should be preserved.
5. Scaffold or repair the application as needed.
6. Establish the baseline quality scripts.
7. Create a minimal Steppi landing shell.
8. Verify the project locally in a real browser.
9. Update this file with the actual project state and exact next task.

---

## Milestone 0 — Foundation

### Repository and tooling

- [ ] Inspect current repository state
- [ ] Confirm or preserve the application stack
- [ ] Scaffold Next.js App Router + TypeScript if the repository is empty
- [ ] Enable strict TypeScript
- [ ] Configure Tailwind CSS
- [ ] Add or verify lint script
- [ ] Add or verify typecheck script
- [ ] Add or verify test script
- [ ] Add or verify production build script
- [ ] Add `.env.example`
- [ ] Ensure `.env*` secrets are ignored appropriately
- [ ] Add a minimal test setup
- [ ] Confirm the development server starts
- [ ] Confirm the production build succeeds

### Durable context

- [ ] Add `AGENTS.md`
- [ ] Add `docs/VISION.md`
- [ ] Add `docs/SPEC.md`
- [ ] Add `docs/TASKS.md`
- [ ] Confirm the source-of-truth hierarchy is consistent
- [ ] Ensure no duplicate or conflicting project-document versions remain in the repository

### Product shell

- [ ] Add page metadata
- [ ] Create a minimal Steppi landing screen
- [ ] Communicate the target user and core promise
- [ ] Add a clear start action
- [ ] Add a short trust statement: exploration, not prediction
- [ ] Establish initial spacing, typography, and responsive layout
- [ ] Verify desktop layout
- [ ] Verify mobile fallback
- [ ] Verify keyboard focus
- [ ] Check browser console

### Deployment

- [ ] Create an initial deployment
- [ ] Verify the deployed URL in a clean browser
- [ ] Record the deployment URL in `README.md`
- [ ] Confirm no secrets are exposed

### Milestone 0 completion gate

Milestone 0 is complete only when:

- [ ] Local development works
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Tests pass
- [ ] Production build passes
- [ ] Landing shell works in a browser
- [ ] Initial deployment works
- [ ] This file reflects the real repository state

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

Nothing is marked complete until Codex inspects and verifies the repository.

---

## Known Issues

- Repository state has not yet been inspected.
- Application stack has not yet been verified.
- No local or deployed build has been verified.
- No primary Codex build thread has been started.
- Exact graph library is undecided.
- Exact retrieval implementation is undecided.
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

---

## Unverified

Everything is currently unverified.

The first Codex session must replace this section with specific verified and unverified behavior.

---

## Next Recommended Prompt

```text
Read AGENTS.md, docs/VISION.md, docs/SPEC.md, and docs/TASKS.md.

Inspect the current repository state and relevant recent commits.

Before editing, summarize:

1. What Steppi is
2. The target user
3. The Build Week MVP
4. Whether the repository is empty, partially scaffolded, or already functional
5. What is already implemented and verified
6. Known issues or blockers
7. Your proposed Milestone 0 implementation approach

Then complete Milestone 0 — Foundation.

Preserve any suitable existing stack. If the repository is empty, scaffold
a Next.js App Router application with strict TypeScript and Tailwind CSS.

Establish the baseline lint, typecheck, test, and build commands. Add a safe
`.env.example`. Build a minimal responsive Steppi landing shell that clearly
communicates the target user, core promise, and that Steppi supports exploration
rather than prediction.

Verify the result in a real browser on desktop and a mobile viewport, check the
browser console, run all applicable checks, review the diff for unrelated
changes, and update docs/TASKS.md with:

- what was completed;
- files changed;
- checks run and exact results;
- known limitations;
- unverified behavior;
- decisions made;
- the exact next recommended task.

Do not claim anything passed unless it was actually verified.
```
