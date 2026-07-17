---
title: Steppi MVP Specification
project: Steppi
event: OpenAI Build Week
status: active
version: 0.1
last_updated: 2026-07-16
owner: Pope Cruz
---

# Steppi MVP Specification

## 1. Purpose

This document is the implementation contract for the OpenAI Build Week version of Steppi.

Steppi helps Grade 11 students explore realistic career and college directions through:

1. a short adaptive intake;
2. a transparent student-profile hypothesis;
3. three meaningfully different path branches;
4. an interactive exploration map;
5. one current, source-backed research expansion;
6. one refinement that updates only the relevant branch.

The Build Week goal is not to build a comprehensive career platform. It is to demonstrate one polished, trustworthy exploration loop.

---

## 2. Hackathon Positioning

**Track:** Education

**Primary user:** A Grade 11 student who is beginning to make college and career decisions but has limited exposure to possible paths.

**Core problem:** Existing career tools often produce generic lists, rely on abstract personality tests, or present uncertain recommendations too confidently.

**Core promise:**

> You do not need to figure out your entire life. You need a clearer view of your options and a useful next step.

**Meaningful GPT-5.6 role:**

GPT-5.6 must do more than generate generic advice. It should:

- reason across messy student context;
- separate facts, inferences, constraints, and uncertainty;
- accept and incorporate student corrections;
- generate three distinct path hypotheses;
- synthesize retrieved information into concise, source-backed nodes;
- update one branch after a new constraint without rebuilding the entire map.

---

## 3. Demo Golden Path

The primary demo follows this sequence:

1. The student opens Steppi and understands its value within 30 seconds.
2. The student completes a short intake.
3. Steppi generates a structured summary of what it understood.
4. The student may build the map immediately or optionally refine one consequential assumption.
5. Steppi generates exactly three initial path branches:
   - strongest current fit;
   - adjacent possibility;
   - underexplored possibility.
6. The student opens one path and asks a focused question.
7. Steppi performs one source-backed research expansion.
8. The student adds a constraint such as:
   - “I do not enjoy coding.”
   - “Prioritize affordable options near Manila.”
9. Steppi updates only the relevant branch and preserves the rest of the map.
10. The student can see why each option appeared, what remains uncertain, and which sources support current factual claims.

The demo persona is a Grade 11 student who:

- likes art, technology, and coordinating projects;
- is considering computer science;
- enjoys digital products;
- dislikes programming;
- prefers an urban environment;
- has financial and geographic constraints.

Expected initial directions may include:

- product design;
- product management;
- frontend development.

After the student clarifies that they dislike coding, Steppi should reduce or replace frontend development and introduce a more suitable adjacent direction such as UX research or service design.

---

## 4. Scope

## 4.1 Required MVP

The submitted MVP must include:

- [ ] A clear landing screen
- [ ] A short intake flow
- [ ] At least one visibly adaptive follow-up
- [ ] Server-side GPT-5.6 profile generation
- [ ] Structured output validation before rendering
- [ ] A concise profile-summary decision point
- [ ] Optional adaptive correction of at least one consequential assumption
- [ ] Exactly three initial path branches
- [ ] One central student node
- [ ] An interactive 2D exploration map
- [ ] Click-to-open path details
- [ ] One source-backed research expansion
- [ ] One comparison or refinement action
- [ ] Branch-local updating after refinement
- [ ] Loading, empty, retry, API-error, and malformed-output states
- [ ] A polished desktop experience
- [ ] A usable mobile fallback
- [ ] A deployed demo that judges can use without developer assistance

## 4.2 Explicit Non-goals

Do not build for the Build Week MVP:

- authentication;
- account management;
- complex persistence;
- counselor dashboards;
- comprehensive career databases;
- comprehensive university databases;
- admissions-probability predictions;
- scholarship management;
- application management;
- job-market forecasting;
- notifications;
- social features;
- gamification;
- psychometric assessment;
- unrestricted web scraping;
- support for every country;
- an infinite graph editor;
- unsupported numerical college rankings.

Use in-memory or browser-local state unless persistence becomes necessary for the demo.

---

## 5. Initial Technical Defaults

These are defaults, not permanent constraints. Codex should inspect the repository before changing them.

- Framework: Next.js with App Router
- Language: TypeScript with strict checking
- Styling: Tailwind CSS
- Runtime validation: Zod or an equivalent existing schema library
- Model calls: server-side only
- Model configuration: environment variable, not hard-coded
- Deployment target: Vercel unless the repository already uses another suitable target
- Authentication: none for the MVP
- Persistence: none initially; browser-local persistence is optional
- Testing:
  - unit tests for schemas and transformation logic;
  - integration tests for server routes where practical;
  - browser verification for the golden path.

Required environment-variable pattern:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
```

Never expose secrets to the client or commit real credentials.

---

## 6. Product Architecture

The MVP should be organized around four product stages.

### Graph-first interaction model

The graph is Steppi's primary interface, navigation model, and product mental model. It is not a decorative summary placed above, beside, or inside a conventional card-based report.

The graph must behave as a focused personal path graph:

- the student is the central node;
- exactly three equal initial directions form the first visible layer;
- selecting a node focuses or expands its local neighborhood inside the graph;
- careers, majors, questions, constraints, resources, programs, and researched findings can become connected nodes as exploration continues;
- only the currently relevant neighborhood should be prominent;
- contextual details may explain the selected node, but the detail panel is secondary to the graph and must not become the main navigation surface;
- new research extends the selected branch instead of replacing the graph with a full-page results report;
- corrections and refinements update only relevant nodes or relationships while preserving unaffected graph areas.

Use progressive disclosure and curated node counts so the graph remains understandable. Do not add an unrestricted graph editor, infinite-canvas controls, or unnecessary graph complexity. Do not add a graph library unless the existing stack cannot support this narrow interaction cleanly.

The Build Week graph remains deliberately small: one central student node, exactly three initial branch nodes, no more than two expansion levels, one researched branch, and one branch-local refinement.

### Stage A: Intake

The normal intake contains exactly three ordered anchor questions, one or two
adaptive follow-up questions, and one final consideration question.

The anchor goals are:

1. **Existing possibilities.** Ask what college programs, majors, careers, or
   fields the student has considered, what attracts them, and what causes
   hesitation.
2. **School experiences.** Ask which classes, projects, school activities, and
   concrete kinds of work the student enjoys or dislikes. Ground the question in
   observable activities such as researching, solving, writing, explaining,
   presenting, designing, building, organizing, or helping.
3. **Outside-school experiences.** Ask about clubs, hobbies, games, work, family
   responsibilities, communities, volunteering, and personal projects, including
   which parts the student actually enjoys or avoids.

All three anchors appear once and in that order. An earlier detailed answer may
satisfy several profile dimensions; later anchors should acknowledge and narrow
around that supplied context rather than ask for it again.

After the anchors, deterministic application code selects the purpose of one or
two follow-ups. A follow-up is allowed only to:

- fill a material evidence gap;
- resolve a contradiction;
- distinguish between plausible directions; or
- clarify a practical constraint that could change the recommendations.

GPT-5.6 may word the controller-selected purpose conversationally and reference
earlier answers, but it must not invent a different question goal or introduce
arbitrary personality-test topics. Do not ask generic questions such as “What are
your strengths?”, “Are you creative or analytical?”, “What is your ideal work
environment?”, “Where do you see yourself in ten years?”, or “Do you prefer
working alone or with others?”.

After the follow-ups, ask exactly once:

> Before I put together your profile, is there anything else Steppi should
> consider? This could be a concern, practical limitation, family expectation,
> personal goal, or something we did not ask about.

“Nothing,” “no,” and “I don't know” are valid answers and move immediately to
profile generation. Intake must not continue merely to populate every possible
schema field.

The intake is a persistent conversation, not a question card whose contents are
replaced, a formal questionnaire, or a step wizard. It must:

- keep every prior student and Steppi message visible during the session;
- ask one clear question per assistant turn;
- briefly acknowledge or connect to the previous response when useful, without
  repeating the full answer or using generic filler;
- let one answer satisfy several profile dimensions;
- never request information already supplied;
- accept uncertainty and incomplete answers;
- support multiline input, keyboard submission, loading, failure, and retry; and
- preserve the transcript across retry and profile generation.

The constrained hybrid architecture remains: interpretation runs server-side
with GPT-5.6 Structured Outputs and no automatic model retry, while deterministic
code owns question-purpose sequencing, schema and source-reference validation,
patch application, correction and supersession history, transcript checkpoints,
duplicate prevention, request locking, and completion handoff. The interpreter
must not recommend careers, majors, colleges, programs, or paths during intake.
Failure or malformed output preserves the transcript and offers a safe retry or
controller-approved fallback without changing the required sequence.

Revising an earlier answer removes later conversational turns before the next
question is recomputed. Profile-generation failures and retry preserve the full
transcript. Refresh may clear the in-memory conversation until persistence is
explicitly in scope.

The completed conversation is adapted into the existing validated `IntakeAnswer[]`
request shape and sent to the server-side `/api/profile` boundary. The required
sequence naturally supplies five or six genuine answers; compatibility copies
used by the former early-completion policy are deprecated and must not appear in
the new normal flow. No adapter may invent extracted facts or inferred answers.

Target completion time: approximately 3–5 minutes.

### Stage B: Profile Hypothesis

GPT-5.6 converts the intake into a detailed validated internal profile. It must
preserve:

- directions already considered, with their appeals and concerns;
- enjoyed and disliked school experiences;
- outside-school activities and responsibilities;
- concrete activities the student enjoys or avoids;
- practical constraints and priorities;
- unresolved uncertainty;
- direct student statements;
- model inferences; and
- source transcript-turn references.

Direct statements and model inferences remain separate. No inference may be
stored or displayed as though the student explicitly said it. The internal
profile must not be reduced to the student-facing summary.

After profile generation, the interface shows exactly three concise,
natural-language sentences:

1. the student's currently considered directions and interests;
2. the most relevant evidence from school, activities, responsibilities, and
   concrete experiences; and
3. important preferences, constraints, tensions, or uncertainty Steppi should
   respect.

The summary must sound like a human understanding rather than a list of schema
fields. Below it, display exactly:

> Is there anything we missed or misunderstood?

Provide two clear actions: **Looks right** and **Make a correction**. **Looks
right** sends the current validated `StudentProfile` through the existing
exact-three path-generation boundary. **Make a correction** accepts a focused
clarification without restarting intake.

The public profile must not show a repeated-fact grid, every extracted item,
evidence-strength labels, raw model reasoning, a long generic prompt, or language
that implies diagnosis.

Each genuine refinement answer makes at most one server-only GPT-5.6 Structured
Outputs request with no automatic model retry. The model may propose a strict
profile patch and then choose to complete, ask one consequential contextual
follow-up, or return the student to the summary-and-map choice. Deterministic
server code validates and applies the complete patch atomically before returning
an updated `StudentProfile`; raw or partially valid model patches never enter UI
state.

Correction begins from the current profile and latest clarification, avoids
requesting information already supplied or declined, and allows uncertainty.
Direct corrections should complete without unnecessary follow-up.

Refinement failure or malformed output preserves the last valid profile and the
student's submitted wording. The student may explicitly retry or proceed with that
last valid profile. Valid facts, constraints, uncertainty, tensions, and source
references not affected by a correction remain unchanged. Profile correction
patches the existing profile rather than regenerating it from scratch.

### Stage C: Initial Exploration Map

Generate exactly three distinct branches:

1. strongest current fit;
2. adjacent possibility;
3. underexplored possibility.

Each validated `PathBranch` must include:

- a focused title, one-sentence summary, core purpose, and common contexts;
- three or four concrete common activities with short explanations;
- a description of people interaction, technical depth, creativity, structure or
  ambiguity, pace, and typical forms of responsibility;
- honest benefits paired with realistic downsides;
- possible educational routes, beginner experiences, and student projects or
  activities for exploration;
- nearby careers, majors, or directions with an explanation of how each differs;
- one short “Why Steppi showed this” explanation; and
- one possible mismatch or unanswered question.

Each branch has one focused title and must not combine several different roles
into a vague umbrella. Path detail should be approximately 70 percent explanation
of the path, 20 percent connection to the student, and 10 percent uncertainty and
refinement. It must not repeat the whole student profile.

The initial visible graph contains only:

- one central student node;
- exactly three equal first-level path nodes, one for each required branch kind;
- visible, understandable relationships between the student and each branch;
- no more visible information than the student can reasonably understand.

Before selection, each branch node shows only:

- a concise branch name;
- its role or direction label;
- a one-sentence summary.

After selection, the graph gives that branch visual emphasis and the contextual
detail panel reveals:

- the plain-language snapshot;
- common activities;
- what the work tends to feel like;
- honest tradeoffs;
- ways to explore the direction;
- nearby paths and their differences;
- the concise personalization and possible mismatch; and
- actions to research, ask a question, compare, or return to all paths.

Branch details must not all render simultaneously. Profile evidence should appear
once at the student level or be referenced briefly for the selected branch; it
must not be reproduced as a supporting-profile grid, repeated student-fact cards,
generic skill pills, unexplained related-option tags, decorative confidence
labels, or a long AI-generated justification.

The initial hypothesis payload must not contain current factual claims about
salary, degree prevalence, job demand, program availability, admissions
requirements, costs, or locations unless those claims were retrieved from current
sources. Those claims belong to the source-backed research layer. Exploration
routes must not imply that one specific major is required unless current evidence
supports that requirement.

The previous requirements for dense supporting-profile grids, repeated student-
fact cards, unexplained confidence labels, generic skill pills, long generated
justifications, vague multi-role path titles, and unsupported salary or degree
claims are deprecated. New implementation work must not preserve them merely for
compatibility with the former path payload.

The initial interaction must support click selection and keyboard selection, have a visible selected state, and remain understandable without dragging. On mobile, provide a focused branch navigator or hierarchical node list that preserves the same relationships rather than requiring precise graph manipulation.

### Stage D: Research and Refinement

The student chooses one branch and asks one focused question.

Steppi performs focused research and adds source-backed child nodes under the selected branch, such as:

- relevant majors;
- academic pathways;
- beginner resources;
- example colleges or programs;
- costs or geographic considerations.

Expansion is branch-local: opening or expanding one branch adds its connected child nodes while the other branches remain stable. Research findings become validated, source-backed nodes rather than a replacement full-page report.

The student then supplies one new constraint. Steppi updates only the relevant graph area and preserves unaffected branches, nodes, and relationships.

---

## 7. Data Contracts

The exact implementation may change, but rendered model output must conform to explicit schemas.

## 7.1 Intake Answer

```ts
type IntakeTranscriptTurn = {
  id: string;
  role: "steppi" | "student";
  content: string;
  createdAt: string;
};

type IntakeAnswer = {
  questionId: string;
  assistantTurnId: string;
  studentTurnId: string;
  question: string;
  answer: string | string[];
  answeredAt: string;
};
```

The transcript retains both roles in order. Profile `sourceTurnIds` reference
validated student-turn IDs rather than only a question category.

## 7.2 Student Profile

```ts
type StudentProfile = {
  consideredDirections: Array<{
    id: string;
    label: string;
    appeals: string[];
    concerns: string[];
    sourceTurnIds: string[];
  }>;
  schoolExperiences: Array<{
    id: string;
    context: string;
    concreteActivity: string;
    response: "enjoys" | "dislikes" | "mixed" | "uncertain";
    sourceTurnIds: string[];
  }>;
  outsideSchoolExperiences: Array<{
    id: string;
    context: string;
    responsibilityOrActivity: string;
    enjoyedParts: string[];
    avoidedParts: string[];
    sourceTurnIds: string[];
  }>;
  activityPreferences: Array<{
    id: string;
    activity: string;
    response: "enjoys" | "avoids" | "mixed" | "uncertain";
    sourceTurnIds: string[];
  }>;
  constraintsAndPriorities: Array<{
    id: string;
    type:
      | "financial"
      | "geographic"
      | "academic"
      | "family"
      | "accessibility"
      | "preference"
      | "other";
    statement: string;
    priority: "low" | "medium" | "high";
    sourceTurnIds: string[];
  }>;
  directStatements: Array<{
    id: string;
    statement: string;
    sourceTurnIds: string[];
  }>;
  inferences: Array<{
    id: string;
    statement: string;
    rationale: string;
    confidence: "low" | "medium" | "high";
    supportingDirectStatementIds: string[];
    sourceTurnIds: string[];
  }>;
  uncertainties: Array<{
    id: string;
    question: string;
    whyItMatters: string;
    sourceTurnIds: string[];
  }>;
  tensions: Array<{
    id: string;
    description: string;
    relatedProfileItemIds: string[];
  }>;
};
```

Every `sourceTurnId` must resolve to a preserved transcript turn. Direct
statements are never inferred, and an inference cannot be copied into a direct-
statement or experience field without a supporting student turn.

## 7.3 Profile Patch

```ts
type ProfilePatch = {
  removeProfileItemIds?: string[];
  replaceDirectStatements?: Array<{
    targetId: string;
    newStatement: string;
    sourceTurnIds: string[];
  }>;
  upsertConsideredDirections?: StudentProfile["consideredDirections"];
  upsertSchoolExperiences?: StudentProfile["schoolExperiences"];
  upsertOutsideSchoolExperiences?: StudentProfile["outsideSchoolExperiences"];
  upsertActivityPreferences?: StudentProfile["activityPreferences"];
  upsertConstraintsAndPriorities?: StudentProfile["constraintsAndPriorities"];
  upsertDirectStatements?: StudentProfile["directStatements"];
  upsertInferences?: StudentProfile["inferences"];
  upsertUncertainties?: StudentProfile["uncertainties"];
  upsertTensions?: StudentProfile["tensions"];
};
```

The server validates patch targets, references, and the complete resulting
profile, then applies the patch atomically. Information outside the correction's
scope remains unchanged.

## 7.4 Initial Path Branch

```ts
type PathBranch = {
  id: string;
  kind: "strongest-fit" | "adjacent" | "underexplored";
  title: string;
  summary: string;
  snapshot: {
    corePurpose: string;
    commonContexts: string[];
  };
  commonActivities: Array<{
    activity: string;
    explanation: string;
  }>;
  workCharacteristics: {
    peopleInteraction: string;
    technicalDepth: string;
    creativity: string;
    structureOrAmbiguity: string;
    pace: string;
    responsibilities: string[];
  };
  tradeoffs: Array<{
    benefit: string;
    downside: string;
  }>;
  explorationRoutes: {
    educationRoutes: Array<{
      route: string;
      explanation: string;
    }>;
    beginnerExperiences: string[];
    studentProjectsOrActivities: string[];
  };
  nearbyPaths: Array<{
    title: string;
    type: "career" | "major" | "direction";
    difference: string;
  }>;
  personalization: {
    whyShown: string;
    possibleMismatchOrQuestion: string;
    supportingProfileItemIds: string[];
  };
};
```

## 7.5 Source-backed Research Node

```ts
type ResearchNode = {
  id: string;
  parentBranchId: string;
  type: "career" | "major" | "college" | "program" | "resource" | "cost";
  title: string;
  titleSourceUrls: string[];
  claims: Array<{
    id: string;
    kind: "fact" | "cost" | "eligibility" | "conditional-aid" | "limitation";
    statement: string;
    sourceUrls: string[];
  }>;
  relevanceToStudent: string;
  confidence: "low" | "medium" | "high";
  sources: Array<{
    title: string;
    publisher?: string;
    url: string;
    dateChecked: string;
  }>;
};
```

Every rendered current factual sentence must be an atomic `claims` entry with
one or more explicit `sourceUrls`. Titles must likewise declare their supporting
URLs. Every declared URL must match both the node's source directory and
provider-retrieved evidence; a model-authored URL or a detached source record is
not sufficient. `relevanceToStudent` is a clearly labeled Steppi connection to
the confirmed profile, not a sourced current fact.

## 7.6 Map State

```ts
type MapState = {
  studentProfile: StudentProfile;
  branches: PathBranch[];
  researchNodes: ResearchNode[];
  selectedNodeId?: string;
  revision: number;
};
```

All external or model-generated data must be validated before it enters rendered state.

---

## 8. Model Interaction Requirements

## 8.1 General Rules

Every model interaction must:

- run server-side;
- use the configured GPT-5.6 model;
- request structured output;
- validate the result;
- fail safely when validation fails;
- avoid exposing hidden reasoning or raw agent traces;
- avoid treating an inference as a user-provided fact;
- avoid current factual claims without retrieved support.

## 8.2 Profile Generation

Input:

- validated intake answers.

Output:

- `StudentProfile`.

Required behavior:

- preserve the student's own wording where practical;
- populate the detailed experience, activity, direction, constraint, and priority
  fields needed for later reasoning;
- keep direct statements and model inferences structurally separate;
- attach valid transcript-turn references to both direct evidence and the evidence
  used for inferences;
- surface uncertainty honestly;
- identify at most a few meaningful tensions;
- avoid diagnosing aptitude or personality.

## 8.3 Initial Path Generation

Input:

- confirmed `StudentProfile`.

Output:

- exactly three `PathBranch` objects with one of each required kind.

Required behavior:

- branches must be meaningfully different;
- each branch must use one focused title;
- each branch must explain its snapshot, concrete activities, work
  characteristics, paired tradeoffs, exploration routes, and differentiated
  nearby paths;
- personalization must be concise, reference validated profile evidence, and
  include one possible mismatch or unanswered question;
- no path may use generic skill pills, unexplained tags, or long justification
  paragraphs as a substitute for explanation;
- current salary, demand, degree, program, admissions, cost, and location claims
  must be omitted until retrieved through the research layer;
- no branch may be framed as objectively correct;
- avoid generic occupation-list behavior.

## 8.4 Research Expansion

Input:

- confirmed profile;
- selected branch;
- focused user question;
- retrieved current sources.

Output:

- a small set of validated `ResearchNode` objects.

Required behavior:

- every rendered current factual node includes at least one source;
- every rendered current factual claim and node title identifies the exact source
  URLs intended to support it;
- rendered source URLs must be provider-retrieved, attached to the node, and
  visibly addressable from the claim;
- a source record alone must not be treated as support for the whole node;
- omit a claim whose citation is missing, unmatched, or unsupported;
- omit a node when its title or remaining content cannot meet the full rendered
  research-node contract;
- retain and render otherwise valid nodes when at least one useful validated
  result remains;
- if no valid research nodes remain, add nothing and show the existing safe retry
  state;
- include date checked and caveats;
- for affordability questions, show directly sourced cost, eligibility, and
  conditional-aid limitations together or return an honest unavailable state;
- prefer a few high-quality nodes over broad, shallow coverage.

Partial acceptance does not weaken the validation contract for content that is
actually rendered. Every retained node must still pass the complete strict
`ResearchNode` schema and provider-source checks after unsupported content is
removed.

## 8.5 Refinement

Input:

- current map state;
- new student constraint;
- selected branch.

Output:

- a branch-local patch.

Required behavior:

- preserve unrelated branches and nodes;
- show what changed and why;
- avoid regenerating the entire map unless the profile fundamentally changes.

---

## 9. User Interface Requirements

## 9.1 Landing

Must communicate within 30 seconds:

- who Steppi is for;
- what it helps the student do;
- that it supports exploration rather than prediction;
- how to begin.

Include a clear primary action.

## 9.2 Intake

Must include:

- the three ordered anchor questions, one or two controller-selected follow-ups,
  and the final consideration question exactly once;
- a persistent visible transcript containing every prior student and Steppi turn;
- revision of prior answers with predictable later-turn invalidation;
- clear validation;
- one concise, contextual question per Steppi turn;
- no repeated requests for supplied context or abstract personality-test prompts;
- acceptance of uncertainty and incomplete answers;
- a stable multiline composer with keyboard submission and clear loading behavior;
- failure and retry behavior that preserves the transcript; and
- keyboard-usable controls.

## 9.3 Profile Confirmation and Correction

Must include:

- exactly three natural-language summary sentences in the required order;
- the prompt **Is there anything we missed or misunderstood?**;
- a clear **Looks right** action;
- a clear **Make a correction** action;
- no mandatory field-by-field review or confirmation step;
- no repeated-fact grid, extracted-item inventory, internal schema labels,
  confidence labels, source IDs, category names, or raw model reasoning;
- a focused correction flow that patches only relevant internal profile data;
- an updated summary after refinement completes;
- retry and proceed-with-last-valid-profile choices after failure; and
- keyboard-usable controls, clear focus, and restrained loading.

## 9.4 Map

Must include:

- one central student node;
- exactly three equal first-level branch nodes;
- visible and understandable relationships from the student to each branch;
- concise default branch content: focused name, role or direction label, and
  one-sentence summary;
- click and keyboard selection without depending on dragging;
- obvious selected-node emphasis that is not communicated by color alone;
- a contextual detail panel for only the selected node;
- selected details covering the snapshot, common activities, work
  characteristics, paired tradeoffs, exploration routes, differentiated nearby
  paths, concise personalization, and one possible mismatch or unanswered
  question;
- actions to research the path, ask a question, compare, and return to all paths;
- progressive disclosure and branch-local focus or expansion;
- restrained motion;
- a usable mobile fallback, such as a focused branch navigator or hierarchical node list, that preserves the graph relationships without precise dragging.

Do not render every branch's full detail at the same time. Deduplicate shared
profile evidence at the student level and keep the selected branch approximately
70 percent path explanation, 20 percent student connection, and 10 percent
uncertainty and refinement.

The graph must remain the primary interaction surface. The contextual panel supports it but must not turn the experience into a report or dashboard with a decorative graph. Avoid presenting a raw technical graph-editor interface.

## 9.5 Research Details

Must show:

- concise result;
- why it matters to this student;
- source links;
- date checked;
- caveats;
- qualitative confidence.

## 9.6 Refinement

Must let the student add one constraint and then make the branch update visible.

The interface should indicate:

- what changed;
- why it changed;
- what remained unchanged.

---

## 10. Required States

Each model-backed stage must support:

- idle;
- loading;
- success;
- empty input;
- invalid local input;
- API failure;
- timeout or unavailable service;
- malformed model output;
- retry;
- safe fallback messaging.

The app must never render unvalidated model data.

Error messages should be calm and actionable. They must not blame the student.

---

## 11. Trust, Safety, and Privacy

Steppi must not:

- diagnose aptitude;
- claim to predict the student's future;
- guarantee career, admissions, or financial outcomes;
- rank colleges with unsupported precision;
- shame the student for grades, finances, or constraints;
- imply that it replaces a counselor;
- fabricate current information;
- display private chain-of-thought or hidden reasoning.

Steppi should:

- explain that paths are hypotheses for exploration;
- distinguish facts from inferences;
- show uncertainty and caveats;
- show sources for current claims;
- collect only the information needed for the demo;
- avoid storing sensitive student data unless explicitly required;
- provide a visible reset or restart action.

---

## 12. Accessibility and Responsive Behavior

Minimum requirements:

- keyboard access for all core interactions;
- visible focus states;
- semantic headings and labels;
- sufficient text contrast;
- no meaning communicated only by color;
- reduced-motion support where practical;
- readable map alternative on small screens;
- no required hover-only interaction.

Desktop is the presentation priority, but the full golden path must remain usable on mobile.

---

## 13. Verification Requirements

A feature is complete only when:

- the normal flow works;
- relevant failure states work;
- model output is schema-validated;
- lint passes;
- type checking passes;
- tests pass where configured;
- production build passes;
- user-visible behavior is tested in a real browser;
- browser console errors are checked;
- unrelated changes are excluded;
- limitations and unverified behavior are documented in `docs/TASKS.md`.

Expected command equivalents:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If a script does not exist, Codex should either add an appropriate script or report the gap honestly.

---

## 14. Milestone Acceptance Criteria

The following product-contract criteria apply to the next implementation pass
without changing the already working graph or research architecture.

### Intake acceptance

- The three anchor questions appear once and in the required order: existing
  possibilities, school experiences, then outside-school experiences.
- One or two follow-ups are selected from actual missing, contradictory,
  differentiating, or recommendation-changing constraint data.
- The final consideration question appears exactly once after the follow-ups.
- A detailed answer can satisfy several dimensions without causing duplicate
  questions.
- Information already supplied is not requested again.
- “Not sure,” “I don't know,” mixed, and incomplete answers do not block
  completion.
- The entire transcript remains visible and stable through loading, failure,
  retry, and profile generation.

### Profile acceptance

- The public summary contains exactly three sentences in the specified order.
- Direct student facts and model inferences remain separate in the validated
  internal profile and retain transcript-turn references.
- **Looks right** proceeds to exact-three path generation.
- A correction patches only the relevant profile information and preserves valid,
  unrelated profile data.
- The prompt reads **Is there anything we missed or misunderstood?**

### Initial-results acceptance

- All three initial directions are meaningfully different and retain their
  strongest-fit, adjacent, and underexplored roles.
- Each direction has one focused title.
- Path details explain common activities, work characteristics, honest tradeoffs,
  exploration routes, and nearby paths with their differences.
- Personalization is concise and does not repeat the full profile.
- Unsupported current factual claims do not appear before source-backed research.
- Existing graph interaction, selected-branch research, and branch-local updates
  remain unchanged unless a later implementation task explicitly changes them.

## Milestone 0 — Foundation

Complete when:

- repository is scaffolded;
- project runs locally;
- baseline scripts exist;
- `AGENTS.md`, `VISION.md`, `SPEC.md`, and `TASKS.md` are present;
- `.env.example` exists;
- secrets are ignored;
- a landing shell renders;
- the project can be deployed.

## Milestone 1 — Static Golden-path Skeleton

Complete when:

- the user can move from landing to intake to confirmation to a static three-branch map;
- representative typed fixtures exist;
- responsive structure is established;
- the flow is browser-tested.

## Milestone 2 — Intake and Profile

Complete when:

- the three ordered anchors, one or two deterministic-purpose follow-ups, and one
  final consideration question follow the intake acceptance contract;
- intake answers remain visible in a persistent transcript through profile
  generation and retry;
- revision invalidates affected later turns before sequencing continues;
- GPT-5.6 creates a valid `StudentProfile`;
- malformed output produces a retry state;
- the student sees exactly three summary sentences and can accept or patch a
  correction without regenerating the whole profile.

## Milestone 3 — Initial Map

Complete when:

- the confirmed profile produces exactly three validated branches;
- the branches are meaningfully distinct;
- the graph is the primary interaction surface;
- one central student node connects visibly to exactly three equal first-level branch nodes;
- each branch is concise before selection;
- click and keyboard selection visibly emphasize one branch;
- only the selected branch's path-first contextual details are revealed;
- common activities, work characteristics, paired tradeoffs, exploration routes,
  and nearby-path differences are present;
- personalization remains concise and shared profile evidence is not repeated as
  three full reports;
- unsupported current facts are absent before research;
- the interaction supports progressive disclosure and a clear path to branch-local expansion;
- the map is understandable on desktop and has a usable non-drag mobile fallback.

## Milestone 4 — Research Expansion

Complete when:

- a student can research one selected branch;
- valid, source-backed research nodes render beneath that branch;
- claims or nodes with missing, unmatched, or unsupported citations are omitted;
- one invalid citation does not discard otherwise valid research results;
- every claim and node that is rendered still passes the full source-validation
  boundary;
- the student node, three initial branches, their relationships, the current
  selection, and the submitted question remain preserved during research and
  failure states;
- when no valid research nodes remain, nothing is added and the existing safe
  retry state appears;
- at least one representative live request renders useful source-backed results
  and is verified in the browser;
- individual live-request failures are handled safely without corrupting the
  graph.

Milestone 4 does not require every live request, retrieved source, generated
claim, or generated node to succeed.

## Milestone 5 — Refinement

Complete when:

- one new constraint can be submitted;
- only the relevant branch changes;
- unaffected map state is preserved;
- the interface explains the change.

## Milestone 6 — Reliability and Submission

Complete when:

- the golden path works from a clean browser;
- the deployed URL works;
- no secret is exposed;
- README setup and testing instructions are complete;
- GPT-5.6 and Codex collaboration are documented;
- demo data is safe;
- `/feedback` session ID is saved;
- the demo video can be recorded from the final build.

---

## 15. Decisions Already Made

- Track: Education
- Initial audience: Grade 11 students
- MVP country emphasis: Philippines where location examples are needed
- No authentication for the Build Week MVP
- No comprehensive database
- Intake uses exactly three ordered anchors, one or two deterministic-purpose
  follow-ups, and one final consideration question
- GPT-5.6 may conversationally word intake questions but does not choose arbitrary
  question topics
- The public profile is exactly three sentences with **Looks right** and **Make a
  correction** actions
- The detailed internal profile remains distinct from the public summary and keeps
  direct statements separate from inferences with transcript-turn references
- Exactly three initial path branches
- One central student node
- The graph is the primary product interface and mental model
- Contextual details primarily explain the selected path rather than repeating the
  student profile or replacing graph navigation
- One researched branch is sufficient
- Two expansion levels are sufficient
- Expansion and refinement are branch-local and preserve unaffected graph areas
- Profile corrections should patch the profile
- Refinement should update only the relevant branch
- Confidence language appears only where its evidence or uncertainty is explained;
  initial paths do not use decorative confidence labels
- Current claims require sources
- One polished exploration loop is more valuable than broad feature coverage

---

## 16. Decisions Intentionally Deferred

Codex may identify these as choices, but should not block the first milestone unless necessary:

- exact graph-rendering library;
- exact retrieval implementation;
- whether temporary state uses URL state, React state, or browser storage;
- exact component library;
- analytics;
- optional persistence.

Choose the simplest approach that supports the golden path and can be verified before the deadline.

---

## 17. Definition of Done

The Build Week MVP is done when a judge can open the deployed app and, without help:

1. understand Steppi;
2. complete the intake;
3. confirm or correct the profile;
4. receive three credible paths;
5. explore one path;
6. view source-backed research;
7. add a constraint;
8. see only the relevant branch update;
9. understand the reasoning, uncertainty, and sources;
10. complete the flow without crashes or developer intervention.
