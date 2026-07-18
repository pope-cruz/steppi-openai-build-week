# Steppi Agent Instructions

## Project purpose

Steppi helps high-school students discover career roles they may not know exist,
understand why those roles might or might not suit them, and explore interesting
options through an extended conversation.

The product must help students explore possibilities. It must not claim to predict the correct career, diagnose aptitude, guarantee outcomes, or replace professional guidance.

## Sources of truth

At normal session startup, read `docs/TASKS.md` for the current operational
handoff. Before making significant changes, also read:

1. `docs/VISION.md` — product purpose, principles, scope, and demo story.
    
2. `docs/SPEC.md` — current implementation requirements and acceptance criteria.
    
3. Existing code and tests — current technical behavior.

Read `docs/BUILD_LOG.md` only when historical context, debugging evidence, an
audit trail, deployment history, or submission documentation is needed. It is
not required for normal session startup and does not override `docs/TASKS.md`.
    

When these conflict:

1. The user's latest explicit instruction wins.
    
2. `docs/SPEC.md` governs implementation.
    
3. `docs/VISION.md` governs product direction.
    
4. `docs/TASKS.md` describes progress but does not override the specification.
    

Do not silently change product scope. Record active scope or architecture
decisions in `docs/TASKS.md` under `Important Active Decisions`; preserve detailed
historical rationale and verification evidence in `docs/BUILD_LOG.md`.

## Build priority

Prioritize one polished end-to-end exploration loop:

1. Student completes the intake.
    
2. GPT-5.6 creates a structured profile.
    
3. Student confirms or corrects the hypothesis.
    
4. Steppi generates a broad but manageable set of varied career roles.
    
5. Student uses the floating role space to choose one role.
    
6. Steppi concisely explains what the role is, why it may or may not fit, and
   what its day-to-day work is like.
    
7. Student asks a natural follow-up question in an extended role conversation.
    
8. Steppi uses current-source research only when the answer requires unstable
   external facts and helps the student identify a concrete next step.
    

A complete and reliable core flow is more valuable than additional unfinished features.

## Scope discipline

Do not add the following unless explicitly requested:

- Authentication
    
- User accounts
    
- Persistent databases
    
- Counselor dashboards
    
- Comprehensive university or career databases
    
- Admissions predictions
    
- Scholarships or application management
    
- Social features
    
- Gamification
    
- Notifications
    
- Complex graph-editing behavior
    
- Support for every country
    

Prefer representative demo data and narrow, working behavior over broad infrastructure.

## Technical expectations

- Use Next.js App Router and TypeScript.
    
- Keep TypeScript strict and avoid unnecessary `any`.
    
- Use Tailwind CSS and the existing component system.
    
- Keep OpenAI calls server-side.
    
- Never expose API keys or secrets to the client.
    
- Validate model outputs with explicit structured schemas before rendering.
    
- Prefer Zod for runtime validation when already available.
    
- Distinguish user-provided facts, model inferences, uncertainty, and sourced factual claims.
    
- Current external claims about colleges, programs, costs, admissions,
  availability, resources, professional requirements, or financial aid must
  include retrieved sources. Interpretive responses based on the confirmed
  student context, role explanation, prior role conversation, and already
  validated research do not require a new retrieval pass.
    
- Include source title, URL, date checked, relevance, caveats, and confidence where appropriate.
    
- Do not fabricate missing data. Show an honest unavailable or uncertain state instead.
    
- Avoid introducing new production dependencies when the existing stack can reasonably solve the problem.
    
- Do not rewrite unrelated files or perform broad refactors during a scoped feature task.
    

## Interface direction

Steppi should feel:

- Warm
    
- Youthful
    
- Calm
    
- Credible
    
- Exploratory
    

Prefer:

- Readable labels
    
- Restrained motion
    
- Progressive disclosure
    
- Clear relationships
    
- Concise explanations
    
- Obvious loading and error states
    

Avoid:

- Corporate dashboard styling
    
- Generic AI gradients
    
- Childish illustrations
    
- Dense reports
    
- Raw model reasoning
    
- Excessive cards
    
- Too many simultaneously visible role nodes
    

The floating role space should support discovery, switching, and orientation
without behaving like a technical graph editor. Do not require every follow-up
to mutate the visualization.

## Working process

For each task:

1. Inspect the relevant files before editing.
    
2. State a brief implementation approach.
    
3. Make the smallest coherent change that satisfies the task.
    
4. Add or update tests where appropriate.
    
5. Run the relevant checks.
    
6. Test user-visible behavior in a real browser.
    
7. Review the resulting diff for unrelated or risky changes.
    
8. Keep `docs/TASKS.md` current with the operational state, in-progress work,
   blockers, active decisions, unverified behavior, and next recommended task.
   Append detailed completed-work history, command results, deployment records,
   and verification evidence to `docs/BUILD_LOG.md` when relevant.
        

Do not mark a user-facing feature complete until its normal flow, loading state, failure state, and malformed-output behavior have been checked.

## Required checks

Before considering a milestone complete, run the available equivalents of:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If a command does not exist, report that clearly rather than pretending it passed.

For visual changes, verify:

- Desktop layout
    
- Mobile fallback
    
- Keyboard accessibility
    
- Loading behavior
    
- Empty state
    
- Error state
    
- Browser console errors
    

## Communication

Keep explanations concise and practical.

When reporting completed work, include:

- Files changed
    
- Behavior added or corrected
    
- Checks run and their results
    
- Remaining limitations
    
- Recommended next task
    

Do not claim that something works unless it was actually verified.
