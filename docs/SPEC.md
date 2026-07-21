---
title: Steppi Build Week Specification
project: Steppi
event: OpenAI Build Week
status: active
version: 0.2
last_updated: 2026-07-18
owner: Pope Cruz
---

# Steppi Build Week Specification

## 1. Purpose

This document is the implementation contract for the OpenAI Build Week version
of Steppi.

Steppi helps high-school and college students discover career roles they may not
know exist, understand why those roles might or might not suit them, and explore
an interesting role through an extended conversation.

The Build Week product demonstrates one polished breadth-before-depth journey:

1. understand enough student context to suggest possibilities;
2. present a broad but manageable set of varied roles;
3. make every role understandable at a glance;
4. let the student choose what deserves deeper attention;
5. sustain one useful role-specific conversation;
6. retrieve current information only when the student's question requires it;
7. end with a concrete next step.

Steppi is an exploration companion. It is not a career predictor, aptitude test,
comprehensive database, long-form report generator, or technical graph editor.

## 2. Hackathon Positioning

**Track:** Education

**Primary users:** High-school students beginning to think about fields of study
and careers, and college students connecting their courses, experiences, and
changing interests to possible work.

**Core problem:** Students may recognize the subjects, activities, projects, and
responsibilities they enjoy while knowing only a small number of familiar career
titles. Existing tools often respond with abstract tests, broad categories,
ranked recommendations, or reports that do not help the student imagine the work.

**Education-track value:** Steppi builds career literacy across two transitions:
discovering possible directions before college and connecting college learning
to possible work. It does not prescribe a degree or act as an admissions, job
search, or placement service.

**Core promise:**

> You do not need to choose your career today. You need to see more
> possibilities, understand what they are actually like, and know which ones are
> worth exploring further.

**Meaningful GPT-5.6 role:** GPT-5.6 reasons across messy student context,
generates a varied and non-duplicative role set, explains both possible fit and
possible mismatch, maintains a role-specific conversation, recognizes when a
question needs current external evidence, and synthesizes retrieved information
into a concise answer.

## 3. Build Week Golden Path

1. The student opens Steppi and understands its purpose within 30 seconds.
2. The student completes a short conversation about possibilities, experiences,
   enjoyable and disliked activities, strengths they have noticed, uncertainty,
   and practical considerations.
3. Steppi creates a validated two-sentence understanding that the student can
   accept, inspect in detail, or directly rewrite before continuing.
4. Steppi generates twelve to fifteen meaningfully different career-role
   options, targeting thirteen.
5. The roles appear as unranked floating nodes in an open visual possibility
   space. The full visible set contains twelve to fifteen roles.
6. The student opens any role and can understand it in under one minute through:
   - what the role is;
   - why it may fit the student;
   - why it may not fit the student; and
   - what the day-to-day is like.
7. The student asks a natural follow-up question rather than choosing a mandatory
   refinement action.
8. Steppi begins an extended conversation grounded in the confirmed student
   context, selected role, earlier messages about that role, and any validated
   research already available.
9. If the question requires unstable external facts, Steppi retrieves current
   sources and returns an answer with appropriate caveats and provenance.
10. The student leaves knowing whether the role deserves more attention and one
    concrete experiment, resource, project, course, or conversation to try next.

The default golden path does not require graph mutation, branch replacement,
comparison, or post-research refinement.

## 4. Scope

### 4.1 Required Build Week MVP

- [ ] Clear landing page
- [ ] Short conversational intake
- [ ] At least one visibly adaptive follow-up
- [ ] Server-side GPT-5.6 student-context generation
- [ ] Structured-output validation before rendering
- [ ] Exactly two generated confirmation sentences, direct student editing, and
      secondary detailed-profile disclosure
- [ ] Twelve to fifteen varied career-role options, targeting thirteen
- [ ] Deterministic validation against near-duplicate role sets
- [ ] Open, unranked floating role-node interface
- [ ] Selection, switching, and return to the full possibility space
- [ ] Concise explanation for every role
- [ ] Visible possible fit and possible mismatch grounded in student context
- [ ] Day-to-day explanation that helps the student imagine the work
- [ ] Natural follow-up question input
- [ ] One extended role conversation
- [ ] Conversation context scoped to the selected role
- [ ] Conditional current-source research
- [ ] Concise answer, caveats, relevance, and progressively disclosed provenance
- [ ] One concrete low-risk next step
- [ ] Loading, empty-input, invalid-input, API-failure, timeout,
      malformed-output, retry, and safe fallback states
- [ ] Polished desktop experience
- [ ] Usable mobile fallback
- [ ] Deployed demo usable without developer assistance

### 4.2 Explicit Non-goals

Do not build for Build Week:

- career prediction or aptitude scoring;
- psychometric testing;
- ranked “best career” recommendations;
- an infinite knowledge graph;
- arbitrary graph mutation;
- a general-purpose graph editor;
- comprehensive career or college databases;
- personalized degree recommendations;
- admissions-probability predictions;
- scholarship or application management;
- counselor dashboards;
- internship search or job placement;
- social features, gamification, or notifications;
- automatic multi-year career plans;
- mandatory research for every interaction;
- fixed follow-up actions that ignore the student's actual question;
- authentication or long-term persistence unless the core experience already
  works and they become necessary for the demo.

Use in-memory or browser-local state unless a later explicit decision changes the
scope.

## 5. Technical Defaults

These remain defaults rather than product doctrine:

- Next.js App Router
- TypeScript with strict checking
- Tailwind CSS and the existing component system
- Zod or the existing equivalent for runtime validation
- server-side model calls only
- environment-configured GPT-5.6 model
- low reasoning effort and low text verbosity for the bounded path-generation
  request
- no automatic SDK retry; path generation alone may make up to three explicit
  sequential provider attempts per student action under the policy below
- Vercel deployment unless the repository adopts another target
- unit tests for schemas, validation, and state transitions
- route tests where practical
- real-browser verification for user-visible flows

Required environment-variable pattern:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
```

Never expose secrets to the client or commit real credentials.

## 6. Product Stages

### Stage A: Conversational Intake

The intake gathers concrete context rather than diagnosing personality. It should
cover:

- programs, majors, careers, or fields already considered;
- attraction and hesitation around those possibilities;
- classes, projects, and school activities the student enjoys or dislikes;
- hobbies, work, family responsibilities, communities, volunteering, and
  personal projects outside school;
- concrete activities the student enjoys or avoids;
- strengths the student has noticed through experience;
- uncertainty;
- practical constraints or considerations; and
- anything important Steppi may have missed.

The current implementation uses three ordered anchors, one or two bounded
adaptive follow-ups, and one final priority question about what would make a
career role worth a closer look right now. That controller may remain while it
supports a short, natural conversation and avoids requesting information the
student already supplied.

The transcript must remain visible. Each Steppi turn asks one focused question,
accepts incomplete or uncertain answers, and avoids abstract personality-test
prompts. Revising an earlier answer must predictably invalidate affected later
turns.

The existing constrained hybrid boundary remains valid: GPT-5.6 may interpret a
student turn and propose bounded conversational language, while deterministic
application code owns validation, request locking, transcript revision,
duplicate prevention, failure progression, and the completion handoff.

### Stage B: Student-context Confirmation

GPT-5.6 converts the conversation into a validated internal student context that
keeps direct student statements, model inferences, constraints, uncertainty, and
supporting transcript references distinct.

The public confirmation is exactly two concise, direct-address sentences when
first generated. It should communicate:

- interests and possibilities already in view;
- the most relevant experiences and concrete activities;
- dislikes, strengths, constraints, tensions, or uncertainty Steppi should
  respect.

The confirmation is not a field-by-field report. It must not expose raw schema
labels, IDs, private reasoning, or an exhaustive inventory. The existing full
structured profile remains available through a collapsed, secondary disclosure.

The student can accept the generated wording or directly rewrite it on the same
screen without restarting intake or making another model request. A saved edit
becomes `confirmedSummary`; student wording is not required to remain exactly two
sentences. The original validated structured profile remains unchanged.

Role generation receives the complete structured profile followed by the latest
student-approved `confirmedSummary`. The approved summary resolves genuine
contradictions and priorities and may add context. Omitted details are not treated
as rejected merely because the short summary does not repeat them; the complete
profile continues to provide breadth.

### Stage C: Career Possibility Space

Steppi generates twelve to fifteen initial career roles. The normal target is
thirteen; twelve, fourteen, or fifteen are valid when they produce a more honest,
meaningfully varied set.

The role set must:

- be broad but manageable;
- avoid near-duplicate titles and substantially overlapping roles;
- include a mix of direct, adjacent, interdisciplinary, and less obvious options;
- connect to validated student context;
- avoid objective ranking or “best fit” presentation;
- avoid unsupported current external facts; and
- remain understandable as a discovery space rather than a report.

Each student-triggered path-generation action may make at most three sequential
GPT-5.6 calls, stopping as soon as one complete role set passes structured and
deterministic role validation. The application owns this ceiling; SDK retries
remain disabled. Retryable failures are transient connection/timeout responses,
HTTP 408/409/429/5xx, incomplete or missing parsed output, schema failures, and
deterministic role-validation failures. Invalid input, missing or unsupported
configuration, authentication/permission errors, and content-filter rejection
stop immediately. Validation retries may add only fixed category-level corrective
guidance, and every attempt receives the exact allow-list of profile evidence IDs.
No partial role set is returned or assigned.

The visual possibility space is the primary discovery and navigation surface.
It is not a technical graph and does not need edges, branches, expansion levels,
or mutation semantics. Roles appear as readable floating nodes with restrained
motion. The student can select a role, identify the active role, switch roles,
and return to the full space.

Mobile may use a stable spatial fallback, grouped node list, or other accessible
representation that preserves discovery and switching without precise dragging.

### Stage D: Lightweight Role Understanding

Every role must have a concise explanation that a student can understand in less
than one minute.

It contains:

1. **What the role is** — one jargon-free sentence.
2. **Why it may fit you** — approximately two sentences tied to specific
   validated student interests, experiences, preferences, or strengths.
3. **Why it may not fit you** — approximately two sentences covering realistic
   tensions, disliked activities, uncertainty, or working conditions without
   presenting a verdict.
4. **What the day-to-day is like** — two or three sentences about common work,
   responsibilities, collaboration, environment, and rhythm.

The role view should help the student imagine the work. It should not initially
expand into college lists, labor statistics, extensive research, or a dense
career report.

### Stage E: Extended Role Conversation

After selecting a role, the student can ask their own follow-up question. The
Build Week MVP must support at least one extended conversation grounded in:

- the confirmed student context;
- the selected role explanation;
- earlier messages about that role; and
- validated retrieved information already attached to that conversation.

Steppi may clarify the work, compare nearby roles, discuss fit and tradeoffs,
suggest low-risk experiments, explain common pathways, or surface majors and
programs when relevant. The conversation should deepen progressively rather than
produce a comprehensive report immediately.

The conversation is a compact continuation directly beneath the selected-role
brief. It should reuse the calm, one-question-at-a-time visual language of the
intake without becoming a second full-screen surface. Default interpretive
answers target two to four sentences and roughly 50–90 words. Answers that need
current-source research target three to five sentences and roughly 70–120 words;
source details sit outside that prose in collapsed progressive disclosure. These
are prompt-level targets, while validated schemas retain a more generous hard
ceiling for safe failure handling.

Switching roles must not leave the student disoriented. The possibility space
remains available. Long-term cross-session persistence is out of scope, but state
within the active experience should remain coherent.

### Stage F: Conditional Current-source Research

Research is a capability inside the extended role conversation, not a mandatory
stage after every role selection.

Retrieval is required when an answer contains unstable external facts, including:

- current colleges and degree programs;
- tuition and mandatory costs;
- admissions requirements;
- scholarships and financial aid;
- current courses or learning resources;
- professional or licensing requirements;
- location-specific opportunities; and
- other career or industry facts that may have changed.

Interpretive responses based on the confirmed student context, role explanation,
prior conversation, and already validated research do not require a new retrieval
pass merely to satisfy an architecture pattern.

When retrieval is used, the default presentation order is:

1. direct answer;
2. relevance to the student's question;
3. important caveats or uncertainty;
4. source summary and date checked;
5. detailed claim-to-source provenance through progressive disclosure.

Current factual claims must never render without trustworthy retrieved support.
If adequate evidence is unavailable, Steppi must say so and avoid fabricating an
answer.

## 7. Behavioral Data Boundaries

The role conversation uses explicit runtime-validated request, response,
message, answer-block, and source contracts. Invalid or partial model output
must not enter rendered conversation state.

The following behavioral boundaries are required.

### 7.1 Intake and Student Context

- Transcript turns have stable identities and ordering.
- Direct student statements retain valid transcript references.
- Model inferences remain structurally distinct from direct statements.
- Constraints and uncertainty are not silently converted into preferences or
  facts.
- Corrections validate their targets and apply atomically.
- Invalid or partial model output never enters UI state.

### 7.2 Role Possibility Set

- The returned collection meets the accepted Build Week count range.
- Role IDs and titles are unique.
- Roles are validated for meaningful differentiation rather than title-only
  novelty.
- Each role contains all four lightweight explanation sections.
- Fit and mismatch explanations reference valid student-context evidence.
- The set contains no ranking score or objectively best role.
- Unsupported unstable facts are rejected or omitted.

### 7.3 Role Conversation

- Every message belongs to an identified selected role and active student context.
- Requests preserve message ordering and reject stale role/context combinations.
- Model output is validated before rendering.
- A role switch cannot attach one role's answer to another role.
- Failure preserves the last valid conversation and exact submitted question.
- Explicit retry does not create duplicate rendered messages.

### 7.4 Retrieved Answer

- Every rendered unstable factual claim identifies supporting retrieved sources.
- Model-authored or detached URLs are not accepted as retrieval evidence.
- Invalid claims may be omitted while valid siblings remain.
- No valid evidence produces an honest unavailable state.
- Sources include title, URL, publisher where available, and date checked.
- Caveats and limitations remain visible in the answer.
- Detailed provenance can be progressively disclosed without weakening
  validation.

## 8. Model Interaction Requirements

Every model interaction must:

- run server-side;
- use the configured GPT-5.6 family;
- request structured output where the boundary renders or persists structured
  state;
- validate the complete output before it enters UI state;
- use explicit public-safe failure states;
- avoid exposing hidden reasoning or raw agent traces;
- keep direct statements distinct from inferences;
- avoid predictions, diagnoses, and objective rankings;
- avoid unsupported current facts; and
- avoid automatic paid retries unless explicitly authorized.

GPT-5.6 should be used for reasoning and language quality, not for deterministic
request locking, identity checks, stale-response prevention, source allow-lists,
or schema enforcement.

## 9. User Interface Requirements

### 9.1 Landing

Within 30 seconds, communicate:

- who Steppi serves;
- that it expands career exposure;
- that it supports exploration rather than prediction; and
- how to begin.

### 9.2 Intake and Confirmation

- Persistent visible transcript
- One focused question per Steppi turn
- Stable multiline composer
- Empty-input validation
- Keyboard submission
- Clear loading and retry behavior
- Predictable answer revision
- Exactly two concise generated confirmation sentences
- Direct, same-screen student refinement with no model request on save
- Collapsed detailed-profile disclosure
- No mandatory schema-field review

### 9.3 Possibility Space

- Twelve to fifteen readable role nodes in the normal flow
- No visual ordering that implies an objective rank
- Clear current selection
- Pointer and keyboard access
- Role switching and return to the complete space
- Restrained motion and reduced-motion support where practical
- No required dragging
- Usable mobile fallback

### 9.4 Selected Role

The selected role view must prominently show:

- what the role is;
- why it may fit the student;
- why it may not fit the student;
- what the day-to-day is like; and
- a clear invitation to ask a natural question.

Do not make source directories, profile evidence grids, generic skill pills,
confidence decoration, or long generated justifications the primary content.

### 9.5 Extended Conversation

- Natural free-text questions
- Visible selected-role context
- Prior messages for that role remain understandable
- Clear loading, cancellation where supported, failure, and retry
- A concrete next step when the conversation reaches a useful stopping point
- Ability to return to the possibility space without losing orientation

### 9.6 Researched Answer

Show the answer first. Then show relevance, caveats, source summary, and date
checked. Detailed claim-to-source mappings and source directories may remain
available through progressive disclosure.

The interface must never imply that retrieval itself proves a claim when the
linked source does not support the displayed wording.

## 10. Required States

Every model-backed or research-backed stage must account for:

- idle;
- loading;
- success;
- empty input;
- invalid local input;
- API failure;
- timeout or unavailable service;
- malformed model output;
- explicit retry; and
- calm safe fallback messaging.

The app must never render unvalidated model data. Failures must preserve the last
valid student context, role set, selection, conversation, question, and research
state that remain relevant to the active stage.

## 11. Trust, Safety, and Privacy

Steppi must not:

- diagnose aptitude or personality;
- predict the student's future;
- rank one role as objectively correct;
- guarantee career, admissions, or financial outcomes;
- shame grades, finances, uncertainty, or constraints;
- imply that it replaces professional guidance;
- fabricate current information;
- display private chain-of-thought or hidden reasoning; or
- store sensitive student data without an explicit need and decision.

Steppi should:

- describe roles as possibilities for exploration;
- distinguish student facts, model interpretation, uncertainty, and sourced
  external claims;
- explain both possible fit and possible mismatch proportionately;
- show source freshness and caveats when research is used;
- collect only what the active experience needs; and
- provide a visible restart or reset action.

## 12. Accessibility and Responsive Behavior

Minimum requirements:

- keyboard access for every core interaction;
- visible focus states;
- semantic headings and labels;
- sufficient contrast;
- no meaning communicated only by color;
- reduced-motion support where practical;
- no required hover-only interaction;
- readable mobile possibility-space alternative; and
- full golden-path usability on mobile.

Desktop is presentation-first, but mobile must remain usable.

## 13. Verification Requirements

A feature is complete only when:

- its normal flow works;
- loading, empty, failure, timeout, malformed-output, and retry behavior have
  been checked where relevant;
- model output is schema-validated;
- current factual claims are source-validated when retrieval is used;
- lint passes;
- strict type checking passes;
- tests pass;
- the production build passes;
- user-visible behavior is checked in a real browser;
- desktop and mobile behavior are checked for visual changes;
- keyboard behavior and console errors are checked; and
- limitations and unverified behavior are documented accurately.

Required command equivalents:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 14. Milestone Acceptance

### Milestone 0 — Foundation

Complete when the repository, scripts, landing shell, safe environment pattern,
and deployment foundation exist.

### Milestone 1 — Conversational Intake

Complete when the short conversation, transcript, adaptive behavior, revision,
profile generation, validation, and relevant failure states work.

### Milestone 2 — Student-context Confirmation

Complete when the student sees a concise human understanding, can accept it or
directly rewrite it, can optionally inspect the preserved structured context,
and role generation receives both the complete profile and latest approved
summary without invalid output replacing valid context.

### Milestone 3 — Role Possibility Space

Complete when a confirmed context produces twelve to fifteen validated,
meaningfully varied roles in an unranked floating space with accessible selection,
switching, and mobile fallback.

### Milestone 4 — Lightweight Role Understanding

Complete when every role clearly explains what it is, why it may fit, why it may
not fit, and what its day-to-day is like in a view understandable within one
minute.

### Milestone 5 — Extended Role Conversation

Complete when the student can ask natural questions about one selected role, the
conversation maintains the student and role context, and it can produce a
concrete low-risk next step without forcing research or visualization mutation.

### Milestone 6 — Conditional Research

Complete when a question that requires current external facts produces a concise,
source-backed answer with caveats and progressive provenance, while interpretive
questions work without mandatory retrieval.

### Milestone 7 — Reliability and Submission

Complete when the clean deployed golden path works without developer assistance,
no secret is exposed, documentation matches behavior, and submission artifacts
are ready.

## 15. Decisions Made

- Track: Education
- Initial audience: high-school and college students exploring how their
  interests, studies, and experiences connect to career roles
- Breadth before depth
- Twelve to fifteen initial career roles, targeting thirteen, for the normal
  Build Week flow
- Path generation alone may make up to three application-owned GPT-5.6 attempts
  per action; all other model calls retain their existing attempt policies
- Two generated confirmation sentences with direct student editing
- Student-approved confirmation wording resolves contradictions and priorities
  during role generation while the full profile preserves breadth
- Twelve, fourteen, or fifteen visible roles are acceptable around the normal
  thirteen-role target when the complete set remains varied
- Roles are possibilities, not rankings or predictions
- The floating role space supports discovery and navigation
- The visualization is not a living graph or graph editor
- Each role must be quickly understandable before deeper exploration
- Deep exploration happens through an extended role conversation
- The role conversation is a compact continuation below the selected-role brief
- Conversation history is kept separately for each role during the active visit
- Students ask natural follow-up questions
- Interpretive answers target 50–90 words; researched answers target 70–120
  words, excluding progressive source details
- Research is conditional on unstable external factual claims
- Interpretive guidance does not require retrieval by default
- Current factual claims require trustworthy retrieved support
- Detailed provenance is progressively disclosed
- One polished exploration loop is more valuable than broad infrastructure
- No authentication, persistent database, or comprehensive dataset for the MVP

## 16. Decisions Deferred

- exact floating-node layout algorithm;
- live quality and latency calibration for the twelve-to-fifteen-role contract;
- whether any role conversation is persisted across refresh;
- general role-to-role comparison interaction;
- save and remove behavior;
- broader location and constraint workflows;
- exact retrieval provider and orchestration beyond the validated current
  boundary; and
- analytics.

Choose the smallest approach that supports the golden path and can be verified
before the deadline.

## 17. Definition of Done

The Build Week MVP is done when a student can, without developer help:

1. understand Steppi's purpose;
2. complete the short intake;
3. confirm or correct what Steppi understood;
4. discover twelve to fifteen varied and personally relevant roles;
5. understand any selected role quickly;
6. see both plausible fit and realistic mismatch;
7. imagine the role's day-to-day work;
8. ask a natural follow-up question;
9. continue one useful role-specific conversation;
10. receive current sourced information when the question requires it;
11. return to or switch within the role space without becoming lost;
12. identify one role worth exploring further and one concrete next step; and
13. complete the journey without crashes, unsupported claims, or developer
    intervention.
