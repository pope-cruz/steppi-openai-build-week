# Steppi Agent Instructions

## Project purpose

Steppi helps high-school students explore realistic career and college paths through an adaptive interview and an interactive, source-backed map.

The product must help students explore possibilities. It must not claim to predict the correct career, diagnose aptitude, guarantee outcomes, or replace professional guidance.

## Sources of truth

Before making significant changes, read:

1. `docs/VISION.md` — product purpose, principles, scope, and demo story.
    
2. `docs/SPEC.md` — current implementation requirements and acceptance criteria.
    
3. `docs/TASKS.md` — current progress, active milestone, blockers, and next tasks.
    
4. Existing code and tests — current technical behavior.
    

When these conflict:

1. The user's latest explicit instruction wins.
    
2. `docs/SPEC.md` governs implementation.
    
3. `docs/VISION.md` governs product direction.
    
4. `docs/TASKS.md` describes progress but does not override the specification.
    

Do not silently change product scope. Record meaningful scope or architecture decisions in `docs/TASKS.md` under `Decision log`.

## Build priority

Prioritize one polished end-to-end exploration loop:

1. Student completes the intake.
    
2. GPT-5.6 creates a structured profile.
    
3. Student confirms or corrects the hypothesis.
    
4. Steppi generates three meaningfully different path branches.
    
5. Student explores one branch.
    
6. Steppi performs one source-backed research expansion.
    
7. Student performs one comparison or refinement.
    
8. The relevant branch updates without rebuilding the entire map.
    

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
    
- Current claims about colleges, programs, costs, admissions, or careers must include retrieved sources.
    
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
    
- Too many simultaneously visible graph nodes
    

The map should feel like a space for exploration rather than a technical graph editor.

## Working process

For each task:

1. Inspect the relevant files before editing.
    
2. State a brief implementation approach.
    
3. Make the smallest coherent change that satisfies the task.
    
4. Add or update tests where appropriate.
    
5. Run the relevant checks.
    
6. Test user-visible behavior in a real browser.
    
7. Review the resulting diff for unrelated or risky changes.
    
8. Update `docs/TASKS.md` with:
    
    - What was completed
        
    - What remains
        
    - Any decision made
        
    - Any known limitation
        
    - The exact next recommended task
        

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