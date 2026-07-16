# Steppi Design

## Purpose

This document defines the visual and interaction rules for the Steppi Build Week MVP. It translates `docs/VISION.md` and `docs/SPEC.md` into a consistent product experience Codex can implement and verify.

The intended feeling is:

> A thoughtful field guide for exploring possible futures.

Steppi should feel warm, youthful, calm, credible, and exploratory. It should not feel like a corporate dashboard, a personality-test result page, or a generic chatbot attached to a graph.

---

## 1. Experience Principles

### Exploration, not prediction

Steppi presents possibilities, evidence, tradeoffs, and open questions. It never announces one correct future.

Use:

- “Worth exploring”
- “This appeared because…”
- “One possible direction”
- “Based on what you shared”
- “Steppi is less certain about…”

Avoid:

- “Your perfect career”
- “Best career for you”
- “You are 87% suited for…”
- “This is the correct path”

### Student control must remain visible

The student should always be able to:

- see what Steppi understood;
- distinguish facts from inferences;
- correct an assumption;
- understand why the map changed;
- preserve unaffected parts of the map;
- remove or deprioritize an option.

A correction should feel like steering the exploration, not restarting it.

### Progressive disclosure

Show only the information needed for the current decision.

A node should not contain every drawback, source, major, caveat, and action. Selecting it should reveal deeper detail in a panel or sheet.

### Calm credibility

Use restrained color, clear hierarchy, readable labels, subtle borders, short explanations, source freshness, and caveats.

Avoid exaggerated AI language, glowing gradients, raw agent traces, excessive badges, and dense generated prose.

### One polished loop

Prioritize this Build Week flow:

1. Student completes the adaptive intake.
2. Steppi summarizes its understanding.
3. Student confirms or corrects it.
4. Steppi creates three distinct paths.
5. Student opens one path.
6. Steppi performs one source-backed expansion.
7. Student adds one constraint.
8. Steppi updates the relevant branch and explains why.

---

## 2. Visual Direction

Steppi adapts an editorial, literary visual language into a student-facing exploration product.

The foundation is:

- warm parchment canvas;
- clean paper-like surfaces;
- editorial serif for major reflective moments;
- neutral sans-serif for interface text;
- hairline green-gray borders;
- restrained shadows;
- one primary blue interaction color;
- three equally prominent branch tints;
- atmospheric illustration used sparingly.

Design phrase:

> Editorial warmth with structured clarity.

---

## 3. Color System

Color should support hierarchy and orientation without suggesting that one path is objectively better.

### Core tokens

| Token | Value | Usage |
|---|---:|---|
| `--color-canvas` | `#FEFFFC` | Main page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, nodes |
| `--color-surface-muted` | `#F7F8F4` | Inputs and quiet states |
| `--color-ink` | `#1E211F` | Primary text |
| `--color-graphite` | `#343735` | Headings and strong secondary text |
| `--color-muted` | `#6E746F` | Helper text and metadata |
| `--color-faint` | `#A7AEA8` | Disabled UI |
| `--color-border` | `#DCE2DC` | Default border |
| `--color-border-strong` | `#BFC9C1` | Important borders |
| `--color-primary` | `#287FA6` | Primary actions and focus |
| `--color-primary-hover` | `#1E6D91` | Hover and active states |
| `--color-primary-soft` | `#EAF4F8` | Selected or informational background |
| `--color-error` | `#A0443E` | Actual errors only |
| `--color-success` | `#467A55` | Successful completion |

### Branch colors

| Branch | Surface | Edge |
|---|---:|---:|
| Strongest current fit | `#EAF4F8` | `#6D9FB2` |
| Adjacent possibility | `#FBF0E7` | `#C58C65` |
| Underexplored possibility | `#EEF4EA` | `#7FA070` |

Every branch must also have a visible text label. Do not use color alone.

The strongest-fit branch must not be larger, darker, centered, or styled like a correct answer.

### Evidence labels

Use text-first labels:

- `Based on your answer`
- `Steppi inference`
- `Current research`
- `Still uncertain`

Keep these quiet and neutral rather than turning them into loud status badges.

---

## 4. Typography

### Families

**Display:** Fraunces  
Fallback: `ui-serif, Georgia, serif`

**Interface:** Geist  
Fallback: `Inter, ui-sans-serif, system-ui, sans-serif`

Do not require proprietary fonts.

### Usage

Use Fraunces for landing headlines, screen titles, selected-path titles, and important reflective prompts.

Use Geist for map labels, buttons, inputs, metadata, evidence labels, sources, and generated summaries.

Do not use serif text inside small map nodes.

### Scale

| Role | Size | Line height | Weight | Font |
|---|---:|---:|---:|---|
| Display | `52px` | `1.05` | `400` | Fraunces |
| Page title | `40px` | `1.1` | `400` | Fraunces |
| Section title | `28px` | `1.2` | `400` | Fraunces |
| Panel title | `20px` | `1.3` | `600` | Geist |
| Body | `16px` | `1.55` | `400` | Geist |
| Body small | `14px` | `1.45` | `400` | Geist |
| Label | `13px` | `1.3` | `500` | Geist |
| Caption | `12px` | `1.35` | `500` | Geist |

Reduce the display size to about `40px` on narrow screens.

---

## 5. Spacing, Shape, and Elevation

Use a 4px spacing grid:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
```

Recommended defaults:

- Page padding: `24px` desktop, `16px` mobile
- Card padding: `20px`
- Panel padding: `24px`
- Section spacing: `64px`
- Standard element gap: `12px`
- Content-group gap: `24px`
- Maximum content width: `1200px`
- Maximum reading width: `720px`

### Radius

| Element | Radius |
|---|---:|
| Compact control | `8px` |
| Button or input | `10px` |
| Card or node | `14px` |
| Detail panel | `18px` |
| Large atmospheric surface | `24px` |
| Pill or chip | `9999px` |

### Borders

Default:

```css
1px solid #DCE2DC
```

Selected:

```css
1px solid #287FA6
```

### Shadows

Use shadows only for overlapping or floating surfaces.

```css
--shadow-card:
  0 1px 2px rgba(30, 33, 31, 0.05),
  0 8px 24px rgba(30, 33, 31, 0.05);

--shadow-panel:
  0 12px 36px rgba(30, 33, 31, 0.10);
```

Buttons should not use decorative shadows.

---

## 6. Global Layout

Use a compact product header containing:

- Steppi wordmark;
- current step or lightweight progress;
- optional “Start over” action.

Do not add a full marketing navigation system to the core flow.

The main product should fill the viewport without feeling cramped. Keep the primary action in a predictable location and avoid permanent sidebars in the MVP.

---

## 7. Screen Designs

### Landing

**Goal:** explain Steppi within 30 seconds and begin the intake.

Desktop layout:

- compact header;
- two-column hero;
- left: promise, explanation, primary CTA;
- right: simplified preview of the three-branch map.

On mobile, show the copy first and map preview second.

Rules:

- Keep the primary action visible without scrolling.
- Use one dominant CTA.
- Do not use a full-screen illustration that hides the product.
- Do not show fabricated results or university rankings.
- The preview should resemble the real product but remain noninteractive.

### Conversational Intake

**Goal:** collect useful context without feeling like a long form or generic chatbot.

Layout:

- centered column around `680px`;
- one primary question in focus;
- previous context shown quietly;
- composer placed consistently;
- lightweight progress;
- optional quick-response chips;
- back action that preserves answers.

Rules:

- Ask one primary question at a time.
- Always allow free text.
- Use chips only when they reduce effort.
- Explain why cost, location, or family constraints matter.
- Do not display a false exact question count for an adaptive interview.
- Avoid alternating left/right chat bubbles.
- Keep generated text concise.
- Never show raw model reasoning.

Progress language may include:

- “Getting to know what matters to you”
- “A few details left”
- “Ready to summarize”

### Hypothesis Confirmation

**Goal:** let the student verify Steppi’s understanding before paths are generated.

Show four groups:

1. **What you told Steppi**
2. **What Steppi inferred**
3. **Constraints that matter**
4. **Still uncertain**

Rules:

- Facts and inferences must have different labels.
- Each inference can be edited or rejected.
- Corrections are reversible.
- Do not use one large generated paragraph.
- Place one obvious “Create my map” action after confirmation.

### Exploration Map

**Goal:** make three paths understandable at a glance and support deeper exploration.

Desktop:

- compact product header;
- primary map canvas;
- detail panel after node selection;
- persistent refinement input;
- minimal zoom and reset controls;
- no visible developer graph controls.

For the MVP:

- one central student node;
- exactly three initial branches;
- no more than two visible expansion levels;
- one researched branch;
- labels readable without zooming;
- secondary detail hidden until selection.

### Mobile fallback

Do not squeeze the desktop graph into a phone viewport.

Use:

- equal branch cards or a swipeable branch list;
- expandable hierarchy;
- bottom sheet for node details;
- same evidence, sources, caveats, and actions as desktop;
- optional simplified “View connections” mode.

---

## 8. Map Visual Grammar

### Node types

#### Student node

Show:

- first name or “You”;
- two or three key interests;
- one important constraint;
- small “Edit profile” action.

Do not place the full intake summary inside the node.

#### Path node

Show:

- path name;
- branch-type label;
- one-sentence reason;
- evidence indicator;
- selected state.

#### Major node

Show:

- major name;
- relationship to the path;
- programming intensity only when supported by evidence.

#### Program node

Show:

- institution and program;
- location;
- source indicator;
- one relevant constraint, such as affordability or proximity.

#### Resource node

Show:

- activity or resource;
- approximate commitment;
- how it helps test the path.

#### Constraint node

Examples:

- Stay near Manila
- Minimize heavy programming
- Prioritize affordability

Constraint nodes influence branches but should not dominate the map.

#### Question node

Examples:

- Do you enjoy interviewing people?
- How important is salary stability?
- Would you consider studying outside Manila?

Question nodes invite exploration rather than appearing as errors.

### Branch labels

Every initial path must be labeled:

- Strongest current fit
- Adjacent possibility
- Underexplored possibility

These are exploration categories, not rankings.

### Edges

| Edge | Meaning |
|---|---|
| Solid line | Direct relationship supported by profile or research |
| Dashed line | Possible or uncertain relationship |
| Highlighted line | Current selection |
| Brief animated trace | Newly added or recently changed connection |

Edges should remain subtle until related nodes are selected. Do not permanently label every line.

### Node information hierarchy

A path node contains only:

1. Name
2. Branch type
3. Short reason
4. Evidence state
5. Selection affordance

The detail panel contains longer explanations, drawbacks, questions, related majors, research, sources, and actions.

---

## 9. Selection and Detail Panel

Selecting a node should:

- highlight the node;
- emphasize its direct connections;
- reduce unrelated visual noise slightly;
- open a detail panel;
- preserve the map position.

Panel order:

1. Node title and type
2. Why it appeared
3. Supporting evidence
4. Possible drawbacks
5. Unresolved questions
6. Related nodes
7. Sources
8. Contextual actions

Possible actions:

- Explore this
- Compare
- Ask a question
- Prioritize a constraint
- Save
- Remove from map

Show only the most relevant two or three actions at once.

---

## 10. Correction and Refinement

When the student adds new information:

- unaffected nodes remain stationary where practical;
- updated nodes receive a temporary outline;
- deprioritized nodes fade before moving or disappearing;
- new nodes appear near the affected branch;
- Steppi explains why the change occurred;
- the whole graph does not visibly regenerate.

Example:

> Updated because you said you do not enjoy coding. Frontend development was deprioritized, and UX research was added as a lower-code alternative.

The refinement composer may accept statements such as:

- “That is too expensive.”
- “I want to stay in the Philippines.”
- “I do not enjoy coding.”
- “Show me more creative paths.”
- “Prioritize financial aid.”

Before first use, show a few example refinements. Preserve the student’s original wording.

---

## 11. Research and Trust

Current factual claims must look different from profile-based recommendations.

### Research indicator

A researched node may show:

```text
3 sources · checked Jul 2026
```

### Source disclosure

Reveal:

- source name;
- claim supported;
- date checked;
- relevance;
- caveat;
- external link.

### Confidence language

Do not use unsupported numeric confidence.

Use:

- Strong supporting evidence
- Some supporting evidence
- Worth exploring
- Limited information
- Conflicting information
- Still uncertain

Caveats should be readable but calm:

- “Program costs may change.”
- “Requirements vary by institution.”
- “This path may still include technical coursework.”
- “This is based on currently available public information.”

---

## 12. Core Components

### Primary button

- filled primary blue;
- white text;
- `10px` radius;
- minimum height `44px`;
- no decorative shadow;
- clear hover, focus, loading, and disabled states.

Use one primary action per region.

### Secondary button

- transparent or white surface;
- strong hairline border;
- graphite text;
- `10px` radius;
- minimum height `44px`.

### Input and composer

- muted paper surface;
- full border;
- minimum height `48px`;
- visible focus ring;
- clear placeholder;
- linked error message;
- free text remains available when chips are shown.

### Choice chip

- pill shape;
- quiet border;
- selected state uses primary-soft background;
- never replaces custom text input.

### Content card

- white surface;
- hairline border;
- `14px` radius;
- minimal shadow;
- `20px` padding.

### Loading state

Explain the user-visible task without exposing implementation chatter.

Use:

- “Building three different directions…”
- “Researching programs near Manila…”
- “Updating this branch using your new constraint…”

Avoid token counts, chain-of-thought, agent names, and tool logs.

### Error state

State:

1. What failed
2. What was preserved
3. What the student can do next

Example:

> Steppi could not finish researching this branch. Your map and answers are safe. Try again or continue exploring another path.

---

## 13. States and Motion

Every interactive component should define:

- default;
- hover;
- keyboard focus;
- active;
- selected;
- disabled;
- loading;
- error;
- newly added;
- updated;
- deprioritized.

Recommended focus style:

```css
outline: 3px solid rgba(40, 127, 166, 0.28);
outline-offset: 2px;
```

Motion should explain change, not decorate the interface.

Use motion for:

- opening the detail panel;
- highlighting connections;
- adding or updating nodes;
- showing a refinement;
- transitioning between intake and confirmation.

Rules:

- standard duration: `160–240ms`;
- map transition: up to `400ms`;
- no constant floating or pulsing;
- no springy motion;
- do not animate the full graph without a user-triggered reason;
- respect `prefers-reduced-motion`.

With reduced motion, use opacity and border changes instead of spatial movement.

---

## 14. Accessibility

Steppi must:

- meet WCAG AA contrast for essential text;
- support keyboard navigation;
- use visible focus states;
- avoid communicating branch type or confidence through color alone;
- expose meaningful labels for nodes and controls;
- provide a structured list alternative to the graph;
- support browser zoom to 200%;
- respect reduced motion;
- use semantic headings;
- link errors and instructions to form fields;
- maintain logical focus when panels open or close;
- avoid essential text over complex illustration;
- use touch targets of at least `44px`.

The map must remain understandable without relying only on spatial position.

---

## 15. Illustration

Illustration may add warmth on the landing screen and empty states.

Preferred style:

- painterly or editorial;
- atmospheric but restrained;
- soft texture;
- paths, environments, or quiet human scenes;
- one consistent visual motif.

Avoid:

- generic AI blobs;
- abstract 3D graphics;
- stock photos of smiling students;
- school clip-art;
- childish mascots;
- imagery that implies a guaranteed glamorous future.

Illustration must never compete with the map or obscure essential text.

---

## 16. Product Copy Voice

Steppi should sound calm, direct, encouraging, transparent, curious, and nonjudgmental.

Use:

- “Here is what I understood.”
- “You can correct anything that feels wrong.”
- “This path appeared because…”
- “This may fit, but there are still open questions.”
- “Would you like to explore this further?”

Avoid:

- “Amazing!”
- “You are destined to…”
- “AI-powered career optimization”
- “Unlock your potential”
- “Perfect match”
- patronizing school language.

Never shame students for uncertainty, grades, cost constraints, family obligations, limited exposure, or changing their mind.

---

## 17. Do and Do Not

### Do

- Keep the parchment canvas and editorial warmth.
- Separate facts, inferences, research, and uncertainty.
- Show exactly three initial branches.
- Keep branch prominence equal.
- Preserve unaffected nodes after refinement.
- Explain meaningful changes.
- Keep sources and caveats accessible.
- Use one clear primary action per screen.
- Prefer short summaries over dense generated text.
- Verify every user-visible state in a real browser.

### Do not

- Build a corporate dashboard.
- Use purple AI gradients.
- Present a psychometric score.
- Claim a perfect career match.
- Display raw model reasoning.
- Show dozens of nodes.
- Permanently label every edge.
- Rely on color alone.
- Rebuild the full map after every correction.
- Make mobile users manipulate a tiny desktop graph.
- Hide current factual claims without sources.
- Use unsupported rankings or admissions predictions.

---

## 18. Current Build Week Decisions

These are fixed unless explicitly changed:

- Light theme only.
- Desktop experience is primary, with a usable mobile fallback.
- No authentication before the golden path works.
- Landing page has one primary CTA.
- Intake shows one primary question at a time.
- Facts and inferences are visually separated.
- Initial map contains exactly three branches.
- Branches have equal visual prominence.
- Map has one student node and no more than two visible expansion levels.
- One branch needs source-backed research for the demo.
- Refinement updates the relevant branch rather than rebuilding the map.
- Numeric career-fit percentages are not used.
- Current claims show sources and freshness.
- Mobile uses a structured branch explorer.
- Motion is restrained and explanatory.
- The UI never exposes raw agent chatter or hidden reasoning.

---

## 19. Open Questions

Record unresolved decisions here rather than allowing repeated improvisation.

- Final Steppi wordmark treatment
- Final landing illustration motif
- Map library and accessible fallback
- Whether the detail panel remains open after refinement
- Whether saving paths is visible in the MVP
- Whether sources open inline, in the panel, or in a modal
- Final branch edge colors after contrast testing

Move a question into **Current Build Week Decisions** once resolved.

---

## 20. Design Verification Checklist

### Landing

- Value is understandable within 30 seconds.
- CTA is visible without scrolling.
- Preview resembles the real product.
- No fabricated claims appear.

### Intake

- One question clearly has focus.
- Previous answers remain available.
- Back preserves state.
- Free text is always possible.
- Loading and errors are understandable.

### Confirmation

- Facts and inferences are visibly different.
- Inferences can be corrected or rejected.
- Uncertainty is shown honestly.
- The next action is obvious.

### Map

- Exactly three branches are visible.
- Labels remain readable.
- Branch type is not communicated only by color.
- Selection clearly reveals relationships.
- The detail panel preserves map context.
- The map remains understandable after expansion.

### Refinement

- Unaffected nodes remain stable.
- Changed nodes are identified.
- The reason for the update is explained.
- Failed updates are recoverable.

### Research

- Current claims have sources.
- Freshness is visible.
- Caveats are accessible.
- Unsupported numeric confidence is absent.

### Accessibility and responsiveness

- Keyboard navigation works.
- Focus states are visible.
- Reduced motion works.
- Mobile uses the structured fallback.
- Touch targets meet minimum size.
- Browser console has no relevant errors.

---

## Closing Principle

> Steppi should make uncertainty feel navigable.

The design succeeds when a student can understand what Steppi believes, correct it, explore three genuinely different directions, inspect evidence, and see a useful next step without feeling judged or told what their future must be.
