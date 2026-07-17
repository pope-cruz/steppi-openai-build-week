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
4. The student confirms most of it but corrects one assumption.
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
- [ ] A hypothesis-confirmation screen
- [ ] Student correction of at least one assumption
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

Collect a small but useful set of student context:

- grade level;
- interests;
- preferred subjects;
- preferred activities;
- prior experiences;
- careers or majors already considered;
- strengths;
- dislikes;
- financial constraints;
- geographic constraints;
- family constraints where relevant;
- current certainty level.

The intake is a persistent conversational transcript, not a restyled multi-step
questionnaire. It begins with one broad free-text prompt, adds one Steppi message
at a time, keeps previous prompts and answers visible, and uses a stable composer.
Optional quick replies may reduce effort, but free text remains the primary input.

For the MVP, intake uses a constrained hybrid decision layer. The application
maintains a validated structured conversation state containing supplied facts,
tentative interpreted interests, experiences, preferences, dislikes, constraints,
considered careers or majors, uncertainty, corrected or superseded information,
unresolved dimensions, and an explicit enough-context decision.

After each student turn, a server-only GPT-5.6 Structured Outputs request may:

- interpret that latest answer in transcript context;
- propose explicit or tentative structured updates with exact source-turn IDs;
- identify active state items that a correction supersedes;
- decide whether one concise, context-specific follow-up is useful; or
- decide that enough useful context exists to form the initial profile.

The turn interpreter must not generate career, major, college, program, or path
recommendations. Strict schema and reference validation run before its result can
affect the interface. Deterministic application code—not the model—owns item
identity checks, correction replacement, supersession history, transcript and
checkpoint updates, request locking, and completion handoff. Model failure or
malformed output preserves the student's words and exposes one safe fallback
question. There are no automatic SDK retries.

Follow-up selection is based on usefulness and ambiguity, not a fixed dimension
order or message count. Rich context may finish in fewer than four student turns;
several shallow answers may still require another question. “Not sure,” mixed
feelings, and incomplete answers are valid context and must not block progression.

Revising an earlier answer removes later conversational turns before the next
question is recomputed. Profile-generation failures and retry preserve the full
transcript. Refresh may clear the in-memory conversation until persistence is
explicitly in scope.

The completed conversation is adapted into the existing validated `IntakeAnswer[]`
request shape and sent to the unchanged `/api/profile` boundary. Until that
existing contract's four-record minimum is revised as a separate decision, an
early-completing transcript is padded only with compatibility copies of exact
student wording; the adapter may not invent extracted facts or inferred answers.
The subsequent server-side GPT-5.6 profile generation, profile, path, graph, and
research contracts remain unchanged.

Target completion time: approximately 3–5 minutes.

### Stage B: Profile Hypothesis

GPT-5.6 converts the intake into a validated student profile containing:

- user-provided facts;
- model inferences;
- constraints;
- uncertainty;
- contradictions or tensions;
- follow-up questions still worth exploring.

The interface must clearly distinguish facts from inferences.

The student must be able to:

- confirm the profile;
- edit or reject an inference;
- add a missing constraint.

Corrections should patch the profile rather than silently discard all prior understanding.

### Stage C: Initial Exploration Map

Generate exactly three distinct branches:

1. strongest current fit;
2. adjacent possibility;
3. underexplored possibility.

Each validated `PathBranch` must include:

- title;
- kind: `strongest-fit`, `adjacent`, or `underexplored`;
- concise summary;
- why it appeared;
- supporting profile evidence;
- possible drawbacks;
- unresolved questions;
- related majors or careers;
- confidence expressed qualitatively, not as false precision.

The initial visible graph contains only:

- one central student node;
- exactly three equal first-level path nodes, one for each required branch kind;
- visible, understandable relationships between the student and each branch;
- no more visible information than the student can reasonably understand.

Before selection, each branch node shows only:

- a concise branch name;
- its role or direction label;
- a one-sentence summary;
- qualitative confidence only where it is useful to interpretation.

After selection, the graph gives that branch visual emphasis and the contextual detail panel reveals:

- why the branch appeared;
- supporting student facts and constraints;
- Steppi's supporting inferences, clearly distinguished from student-provided facts;
- the main tradeoff;
- an unresolved question;
- related careers or majors.

Branch details must not all render simultaneously. Profile evidence should appear once at the student level or be referenced contextually for the selected branch; it must not be reproduced as a long repeated report beneath every branch.

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
type IntakeAnswer = {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: string;
};
```

## 7.2 Student Profile

```ts
type StudentProfile = {
  facts: Array<{
    id: string;
    statement: string;
    sourceAnswerIds: string[];
  }>;
  inferences: Array<{
    id: string;
    statement: string;
    rationale: string;
    confidence: "low" | "medium" | "high";
    editable: true;
  }>;
  constraints: Array<{
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
  }>;
  uncertainties: Array<{
    id: string;
    question: string;
    whyItMatters: string;
  }>;
  tensions: Array<{
    id: string;
    description: string;
    relatedFactIds: string[];
  }>;
};
```

## 7.3 Profile Patch

```ts
type ProfilePatch = {
  removeInferenceIds?: string[];
  replaceStatements?: Array<{
    targetId: string;
    newStatement: string;
  }>;
  addConstraints?: StudentProfile["constraints"];
  addFacts?: StudentProfile["facts"];
};
```

## 7.4 Initial Path Branch

```ts
type PathBranch = {
  id: string;
  kind: "strongest-fit" | "adjacent" | "underexplored";
  title: string;
  summary: string;
  whyItAppeared: string[];
  supportingProfileIds: string[];
  drawbacks: string[];
  unresolvedQuestions: string[];
  relatedOptions: Array<{
    id: string;
    label: string;
    type: "career" | "major" | "resource" | "question";
  }>;
  confidence: "low" | "medium" | "high";
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
- distinguish facts and inferences;
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
- branches must reference profile evidence;
- drawbacks and uncertainty must be included;
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

- visible progress;
- back navigation;
- preserved prior answers;
- clear validation;
- concise questions;
- at least one adaptive follow-up;
- keyboard-usable controls.

## 9.3 Confirmation

Must visually separate:

- what the student said;
- what Steppi inferred;
- known constraints;
- open questions.

The student must be able to correct an inference before generating paths.

## 9.4 Map

Must include:

- one central student node;
- exactly three equal first-level branch nodes;
- visible and understandable relationships from the student to each branch;
- concise default branch content: name, role or direction label, one-sentence summary, and qualitative confidence only where useful;
- click and keyboard selection without depending on dragging;
- obvious selected-node emphasis that is not communicated by color alone;
- a contextual detail panel for only the selected node;
- selected details covering rationale, supporting facts and constraints, clearly labeled Steppi inferences, the main tradeoff, one unresolved question, and related careers or majors;
- progressive disclosure and branch-local focus or expansion;
- restrained motion;
- a usable mobile fallback, such as a focused branch navigator or hierarchical node list, that preserves the graph relationships without precise dragging.

Do not render every branch's full evidence and rationale at the same time. Deduplicate shared profile evidence at the student level or reference it contextually from the selected branch.

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

- intake answers remain visible in a persistent transcript;
- deterministic follow-ups skip information already supplied and visibly respond
  to prior context;
- revision invalidates affected later turns before sequencing continues;
- GPT-5.6 creates a valid `StudentProfile`;
- malformed output produces a retry state;
- the student can correct an inference.

## Milestone 3 — Initial Map

Complete when:

- the confirmed profile produces exactly three validated branches;
- the branches are meaningfully distinct;
- the graph is the primary interaction surface;
- one central student node connects visibly to exactly three equal first-level branch nodes;
- each branch is concise before selection;
- click and keyboard selection visibly emphasize one branch;
- only the selected branch's contextual details are revealed;
- shared profile evidence is not repeated as three full reports;
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
- Exactly three initial path branches
- One central student node
- The graph is the primary product interface and mental model
- Contextual details support the selected graph node rather than replacing graph navigation
- One researched branch is sufficient
- Two expansion levels are sufficient
- Expansion and refinement are branch-local and preserve unaffected graph areas
- Profile corrections should patch the profile
- Refinement should update only the relevant branch
- Qualitative confidence only
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
