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

The intake is a short, persistent conversation organized broad-to-specific around
three goals:

1. understand the college programs, majors, careers, or fields the student has
   already considered, including their attraction and hesitation;
2. understand the classes, projects, school activities, and concrete kinds of
   work the student enjoys or dislikes; and
3. understand outside-school experiences such as hobbies, games, work, family
   responsibilities, communities, volunteering, and personal projects, including
   which parts the student enjoys or avoids.

After these anchors, Steppi asks only one or two adaptive follow-ups when they
close a meaningful evidence gap, resolve a contradiction, distinguish plausible
directions, or clarify a practical constraint that could change the paths. It
then gives the student one final opportunity to add a concern, limitation, family
expectation, goal, or omitted context. Uncertainty and incomplete answers are
valid, and the interview should not continue merely to fill every profile field.

The transcript remains visible throughout. Each Steppi turn asks one clear
question, connects to prior context when useful, and avoids abstract personality-
test prompts or repeated requests for information the student already supplied.

### 2. Path hypothesis

Internally, GPT-5.6 forms a detailed, validated profile that keeps separate:

- facts provided by the student;
    
- reasonable inferences;
    
- unresolved uncertainty;
    
- constraints affecting recommendations; and
- transcript evidence supporting each direct statement or inference.
    

The student-facing confirmation is a natural-language summary of exactly three
sentences: current directions and interests; the most relevant evidence from
school and outside-school experience; and the preferences, constraints, tensions,
or uncertainty Steppi should respect. The student can accept it or make a
correction. A correction patches the validated internal profile instead of
regenerating it from scratch.

### 3. Exploration map

Steppi creates an interactive 2D map centered on the student, with three initial directions:

- strongest current fit;
    
- adjacent possibility;
    
- underexplored possibility.
    

Each direction primarily explains the path itself: its purpose and contexts,
common activities, what the work tends to feel like, honest tradeoffs, ways a
student can explore it, and nearby options with meaningful differences. A short
personalized explanation and one possible mismatch connect the path to the
student without repeating the full profile. Current claims about pay, demand,
degrees, programs, admissions, costs, or locations appear only after retrieval
from current sources.

### The graph is the product

Steppi's primary exploration interface is a living personal path graph, not a
dashboard or a report with a decorative diagram .

The student begins as the central node, connected to exactly three initial
directions. As the student explores, selected branches expand into connected
careers, majors, questions, constraints, resources, programs, and researched
findings.

New information should visibly extend the existing graph rather than replace it
with a separate results page. Corrections and refinements should visibly change
the relevant nodes or relationships while preserving unaffected parts of the
map.

The graph should resemble a focused local knowledge graph rather than an
unrestricted global graph. Only the currently relevant neighborhood should be
prominent. Progressive disclosure, restrained node counts, readable labels,
and branch-local expansion should prevent the map from becoming an
indecipherable network.

A contextual panel may explain the selected node, but the graph remains the
primary mental model and main navigation surface.

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

The visual reference is a calm, curated knowledge graph: connected nodes,
branch-local clusters, and visible relationships that gradually form a personal
map of possibilities. Avoid reducing the graph to three static cards or using
graph visuals merely as decoration.

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
