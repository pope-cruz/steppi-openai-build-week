# Steppi

## Build Week context

Steppi is being built for the Education track of OpenAI Build Week.

For the hackathon MVP, it must demonstrate a credible use of GPT-5.6 and Codex to help high-school students explore career and college pathways through transparent reasoning, student correction, and source-backed research.

Hackathon constraints should shape the MVP scope and demo, but should not override Steppi’s longer-term product principles.

## Product

Steppi helps high-school students explore realistic career and college paths through an adaptive interview and an interactive, source-backed map.

## Core promise

You do not need to figure out your entire life.  
You need a clearer view of your options and a useful next step.

## Target user

Steppi initially focuses on Grade 11 students beginning to make college and career decisions without enough exposure to understand which paths may suit them.

They may know their interests, preferred subjects, constraints, and a few familiar careers, but lack visibility into less obvious possibilities.

## Problem

Most career tools:

- rely on abstract personality questions;
    
- produce generic occupation lists;
    
- present uncertain recommendations too confidently;
    
- provide advice without current, practical research.
    

Guidance counselors are also often responsible for many students and may not have the time, resources, or professional exposure to cover every emerging or nontraditional path.

Students in communities with fewer networks and enrichment opportunities may never encounter suitable options simply because those paths are not visible around them.

Steppi does not attempt to predict a student’s future or replace a counselor. It gives students and counselors a grounded starting point for exploration.

## Product thesis

Steppi should:

1. understand the student’s interests, experiences, and constraints;
    
2. form a transparent hypothesis about possible directions;
    
3. let the student correct wrong assumptions;
    
4. turn those directions into an interactive map;
    
5. research selected branches using current sources;
    
6. help the student compare and refine their options.
    

## Core user flow

### 1. Conversational intake

The student shares:

- grade level;
    
- interests;
    
- preferred subjects and activities;
    
- previous experiences;
    
- careers or majors already under consideration;
    
- strengths and dislikes;
    
- financial, geographic, or family constraints;
    
- current level of certainty.
    

The intake should take only a few minutes and adapt to the student’s answers.

### 2. Path hypothesis

GPT-5.6 summarizes:

- facts provided by the student;
    
- reasonable inferences;
    
- unresolved uncertainty;
    
- constraints affecting recommendations.
    

The student confirms or corrects this understanding before research begins.

### 3. Exploration map

Steppi creates an interactive 2D map centered on the student, with three initial directions:

- strongest current fit;
    
- adjacent possibility;
    
- underexplored possibility.
    

Each direction shows why it appeared, supporting evidence, possible drawbacks, unresolved questions, and connected careers or majors.

### 4. Explore any node

The student can click a career, major, college, resource, constraint, or question and ask Steppi to:

- explain it;
    
- expand related options;
    
- compare it with another node;
    
- research it using current sources;
    
- prioritize cost, location, accessibility, or fit;
    
- save or remove it.
    

Example questions:

- “How much coding does this require?”
    
- “Which majors lead here?”
    
- “Show me affordable options near Manila.”
    
- “How is this different from UX research?”
    
- “Which colleges offer this program?”
    

### 5. Research and expansion

When a branch is selected, Steppi performs focused research into relevant:

- careers;
    
- majors and academic pathways;
    
- courses and beginner resources;
    
- colleges and programs;
    
- costs and geographic fit.
    

New findings are added as source-backed nodes instead of replacing the entire map.

Factual nodes should include their source, date checked, relevance, caveats, and confidence.

### 6. Refinement

The student can update the map with statements such as:

- “That is too expensive.”
    
- “I want to stay in the Philippines.”
    
- “I do not enjoy coding.”
    
- “Show me more creative paths.”
    
- “Prioritize financial aid.”
    

Steppi reruns only the relevant research and preserves the rest of the map.

## GPT-5.6’s role

GPT-5.6 should:

- reason across messy student context;
    
- identify tensions and contradictions;
    
- distinguish facts, inferences, and uncertainty;
    
- incorporate corrections;
    
- generate the initial map;
    
- determine which research is needed;
    
- connect careers, majors, resources, colleges, and constraints;
    
- synthesize web research into concise nodes;
    
- compare options using the student’s priorities;
    
- update selected branches without rebuilding everything.
    

GPT-5.6 must not invent current facts about programs, admissions, costs, careers, or resources. Current claims must be grounded in retrieved sources.

All model output must be validated against structured schemas before being rendered.

## MVP

The MVP includes:

1. A clear landing screen.
    
2. A short conversational intake.
    
3. A structured student profile generated server-side with GPT-5.6.
    
4. A hypothesis confirmation step.
    
5. Three initial path branches.
    
6. An interactive 2D map.
    
7. Click-to-ask and branch expansion.
    
8. One source-backed research expansion.
    
9. One comparison or refinement action.
    
10. Loading, retry, error, empty, and malformed-input states.
    
11. A polished desktop experience and usable mobile fallback.
    
12. A deployed demo requiring no developer assistance.
    

For Build Week, the map only needs one central student node, three initial branches, two expansion levels, and one researched branch.

Persistence and authentication are optional until the main flow works reliably.

## Out of scope

Do not build:

- comprehensive career or university databases;
    
- admissions probability predictions;
    
- scholarship or application management;
    
- job-market forecasting;
    
- counselor dashboards;
    
- social or gamification features;
    
- complex authentication;
    
- notifications;
    
- unrestricted web scraping;
    
- support for every country;
    
- an infinite graph editor;
    
- a psychometric assessment.
    

## Design direction

Steppi should feel warm, youthful, calm, credible, and exploratory.

The map should feel like a space for discovery rather than a technical graph.

Use readable labels, restrained motion, progressive disclosure, clear relationships, and short contextual summaries.

Avoid corporate dashboards, excessive cards, generic AI gradients, childish visuals, raw agent chatter, dense reports, and too many visible nodes.

## Safety and trust

Steppi must not:

- diagnose aptitude;
    
- present one path as objectively correct;
    
- guarantee career or admissions outcomes;
    
- treat inferences as facts;
    
- shame students for their grades or constraints;
    
- fabricate current information;
    
- rank colleges with unsupported precision;
    
- imply that it replaces professional guidance.
    

It should clearly communicate uncertainty, sources, freshness, caveats, and the reasoning behind major recommendations.

## Success criteria

Steppi succeeds when:

- its value is understandable within 30 seconds;
    
- the interview feels responsive;
    
- the hypothesis reflects the student’s answers;
    
- correcting an assumption visibly changes the map;
    
- the initial paths are meaningfully different;
    
- clicking a node produces useful exploration;
    
- at least one branch uses current, source-backed research;
    
- the map remains understandable after expansion;
    
- the student can see why each option was recommended;
    
- the full flow works without developer intervention.
    

## Demo story

The demo follows a Grade 11 student who likes art, technology, and coordinating projects. They are considering computer science, enjoy digital products, dislike programming, prefer an urban environment, and face financial and geographic constraints.

Steppi initially suggests:

- product design;
    
- product management;
    
- frontend development.
    

The student clarifies that they do not enjoy coding.

Steppi lowers frontend development and introduces UX research or service design.

The student opens product design and asks:

> What can I study in college without committing to heavy programming?

Steppi researches relevant majors, resources, and example programs.

The student then asks:

> Prioritize affordable options near Manila.

Steppi updates only that branch with a smaller, more realistic set of source-backed options.

## Build principle

One polished exploration loop is more valuable than many incomplete features.

The agent pipeline should improve freshness, relevance, and traceability while remaining mostly invisible to the student.

No feature is complete until it has been tested in a real browser, its structured output has been validated, and its failure states have been verified.