# Steppi Product Vision

## Product

Steppi helps high-school students discover career roles they may not know exist,
understand why those roles might or might not suit them, and explore interesting
options through an extended conversation.

## Core promise

You do not need to choose your career today.

You need to see more possibilities, understand what they are actually like, and
know which ones are worth exploring further.

## Target user

Steppi initially serves high-school students who are beginning to think about
college and careers but have limited exposure to the range of roles available.

They may know what subjects, activities, or projects they enjoy without knowing
how those interests translate into real careers.

They may also know a few familiar professions while remaining unaware of adjacent,
emerging, interdisciplinary, or less visible roles.

## The problem

Most career tools either:

- ask abstract personality questions;
- recommend a small number of broad career categories;
- produce long reports students do not read;
- treat career fit as a prediction;
- assume students already understand what different roles involve.

Students often need something simpler.

They need to see a broad but manageable set of possibilities, quickly understand
each one, and explore only the options that catch their attention.

## Product thesis

Steppi should help the student move through three levels of exploration:

1. **Discover** several plausible roles.
2. **Understand** each role at a glance.
3. **Explore** one role deeply through conversation.

The initial experience should intentionally remain light.

Steppi should not overwhelm the student with detailed research, college lists,
labor statistics, or complicated planning before the student has identified a
role they actually want to understand.

## Core user flow

### 1. Short conversational intake

The student talks about:

- programs, majors, or careers they have considered;
- classes and school activities they enjoy;
- projects, hobbies, responsibilities, and experiences outside school;
- activities they dislike;
- strengths they have noticed;
- constraints or considerations that may affect their choices;
- anything important Steppi may have missed.

The conversation should feel natural and take only a few minutes.

Its purpose is not to diagnose the student. It gives Steppi enough context to
suggest a varied set of roles worth exploring.

Before opening the role space, Steppi reflects that context back in exactly two
warm, direct sentences. The student can accept the reflection, inspect the full
structured context in a secondary disclosure, or rewrite the summary in their
own words. The approved wording becomes their latest clarification without
discarding useful structured context that the short summary does not repeat.

### 2. Career possibility space

Steppi generates twelve to fifteen initial career-role options, targeting
thirteen in the normal flow.

The roles appear as floating nodes in an open visual space rather than as a
ranked list.

The full space contains twelve to fifteen visible roles, depending on the
student's context and the validated model output.

The roles should be meaningfully different from one another. They may include:

- a relatively direct option;
- adjacent roles;
- interdisciplinary roles;
- less obvious possibilities;
- roles connected to the student's interests but unfamiliar to them.

The interface must not imply that the first role is objectively the best or that
Steppi has predicted the student's future.

The role space is for discovery, not ranking.

### 3. Lightweight role exploration

Selecting a role opens a concise explanation.

Each role contains:

#### What the role is

One clear sentence explaining the role without jargon.

#### Why it may fit you

Approximately two sentences connecting the role to specific interests,
experiences, preferences, or strengths the student shared.

#### Why it may not fit you

Approximately two sentences describing realistic tensions, dislikes,
uncertainties, or working conditions that may conflict with the student's
preferences.

This should not discourage the student or present the mismatch as a verdict. It
should help them notice what they would need to explore.

#### What the day-to-day is like

Two or three sentences describing the common work, responsibilities,
collaboration, environment, and rhythm of the role.

The explanation should help the student imagine the work rather than merely
define the job title.

The initial role view should remain short enough to understand in under one
minute.

### 4. Follow-up questions

After opening a role, the student can ask natural follow-up questions such as:

- How much coding does this involve?
- Is this mostly independent or collaborative work?
- What would I study in college?
- How creative is the work?
- Is this similar to product management?
- What is stressful about this role?
- How can I test whether I would enjoy it?
- Are there affordable programs near me?
- What other roles are similar?

The student should not have to choose from a rigid sequence of refinement
actions.

They should be able to ask what they genuinely want to know.

### 5. Extended role conversation

Each selected role can open an extended conversation grounded in:

- the confirmed student context;
- the role explanation;
- previous messages about that role;
- any relevant retrieved information.

The conversation should help the student progressively understand the role
rather than immediately produce a comprehensive report.

In the interface, it is a compact continuation beneath the selected-role brief,
using the same calm conversational language as onboarding at a smaller scale.
Typical interpretive answers should stay near 50–90 words; source-backed answers
may use 70–120 words before collapsed source details.

Steppi may:

- clarify what the work involves;
- compare the role with nearby roles;
- explain common pathways into the role;
- suggest low-risk ways to try it;
- surface relevant majors or programs;
- discuss tradeoffs;
- answer questions about fit;
- research current external information when needed.

The extended chat is where deep exploration occurs.

The floating role space remains available so the student can switch between
roles without losing orientation.

## Role of GPT-5.6

GPT-5.6 should:

- synthesize messy student context;
- identify interests, experiences, dislikes, tensions, and uncertainty;
- generate a varied set of plausible roles;
- avoid producing several near-duplicate roles;
- connect each role to evidence from the student's answers;
- explain realistic reasons a role may not fit;
- describe the work in accessible language;
- maintain context during the extended role conversation;
- distinguish interpretation from current factual claims;
- determine when current research is necessary;
- synthesize retrieved evidence into concise, relevant answers.

GPT-5.6 must not present its suggestions as predictions, diagnoses, or objective
rankings.

## Role of research

Research is available inside the extended role conversation.

It is not required for every initial role explanation.

Steppi should use current sources when answering questions involving facts that
may change, including:

- colleges and degree programs;
- tuition and mandatory costs;
- admissions requirements;
- scholarships and financial aid;
- current courses and learning resources;
- professional requirements;
- location-specific opportunities;
- current career or industry information.

Interpretive questions about the student's interests, preferences, and existing
role descriptions do not automatically require research.

Current factual claims must be grounded in retrieved sources before they are
shown.

## Visual direction

The career-role space should feel:

- open;
- exploratory;
- calm;
- youthful without feeling childish;
- visually interesting without becoming difficult to navigate.

Roles should appear as floating nodes with readable labels and restrained motion.

The space should encourage curiosity rather than communicate hierarchy.

The student should be able to:

- select a role;
- move between roles;
- return to the complete possibility space;
- identify which role is currently active;
- continue an existing conversation about a role.

The visualization is a discovery and navigation surface. It is not a technical
graph editor.

## Build Week MVP

The Build Week version includes:

1. A clear landing page.
2. A short conversational intake.
3. A validated two-sentence student-context reflection that the student can
   directly refine.
4. Twelve to fifteen generated career-role options, targeting thirteen.
5. A floating role-node interface.
6. A concise explanation for every role containing:
   - what it is;
   - why it may fit;
   - why it may not fit;
   - what the day-to-day is like.
7. Selection and switching between roles.
8. Natural follow-up questions.
9. One extended role conversation.
10. Current-source research when the selected question requires it.
11. Loading, empty, failure, retry, timeout, and malformed-output handling.
12. A polished desktop experience and usable mobile fallback.
13. A deployed demo that requires no developer assistance.

## Explicitly out of scope

Do not build:

- career prediction or aptitude scoring;
- psychometric testing;
- ranked “best career” recommendations;
- an infinite knowledge graph;
- arbitrary graph mutation;
- a general-purpose graph editor;
- comprehensive career databases;
- comprehensive college databases;
- admissions probability predictions;
- scholarship management;
- application tracking;
- counselor dashboards;
- authentication unless necessary for the demo;
- long-term persistence unless the core experience already works;
- automatic career plans covering several years;
- mandatory research for every interaction;
- fixed follow-up actions that ignore the student's actual question.

## Success criteria

Steppi succeeds when:

- the student understands its purpose within 30 seconds;
- the intake feels responsive without becoming exhausting;
- the generated roles are varied and personally relevant;
- the student discovers at least one role they had not seriously considered;
- every role can be understood quickly;
- the fit explanation refers to actual student context;
- the mismatch explanation feels honest rather than discouraging;
- the day-to-day description helps the student imagine the work;
- the student can ask their own follow-up question;
- the extended conversation remembers both the student and the selected role;
- current factual claims are grounded when research is needed;
- the student can switch roles without becoming lost;
- the experience helps the student identify what they want to explore next.

## Demo story

The demo follows a high-school student who enjoys visual projects, technology,
organizing group work, and presenting ideas but is uncertain about programming.

After a short conversation, Steppi presents several floating career-role options,
such as:

- product designer;
- UX researcher;
- product manager;
- service designer;
- frontend developer;
- design technologist;
- digital marketing strategist.

The student opens product designer.

Steppi briefly explains:

- what a product designer does;
- why the role may fit the student;
- why parts of it may not fit;
- what the work commonly looks like day to day.

The student then asks:

> How can I tell whether I would actually enjoy this?

Steppi begins an extended conversation and suggests a small, low-risk
product-design exercise.

The student later asks:

> What could I study in college for this without committing to heavy programming?

Steppi retrieves current, relevant information and answers with appropriate
sources and caveats.

The demo ends with the student still having several possibilities, but
understanding one role well enough to take a concrete next step.

## Closing principle

Steppi should provide breadth before depth.

Show the student enough possibilities to become curious, enough context to choose
what deserves attention, and enough conversational depth to make the next step
feel possible.
