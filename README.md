# Steppi

Steppi helps high-school students discover career roles they may not know exist,
understand why those roles might or might not suit them, and explore interesting
options through conversation. It supports exploration; it does not predict a
student’s future or replace professional guidance.

The `/intake` flow now covers the core demo loop: a conversational intake,
validated GPT-5.6 student profile, editable student-context confirmation, 6–8
unranked role possibilities, a concise selected-role brief, and a compact
role-specific conversation. Interpretive follow-ups use the confirmed context
directly; questions that require unstable external facts use server-side web
search and only render validated source-backed claims. All active state remains
in memory and clears on refresh.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local` before testing a real profile request:

```text
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6
```

`OPENAI_API_KEY` is read only by the server route. Never rename it with a `NEXT_PUBLIC_` prefix, commit `.env.local`, paste it into client code, or expose it in API responses.

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

Open [http://localhost:3000/intake](http://localhost:3000/intake), complete the
short intake, confirm or edit Steppi’s summary, select **Good to go!**, choose a
role, and ask a follow-up beneath its role brief. Requests are stateless; refresh
clears the intake, profile, role set, and role conversations.

Development-only fixtures can exercise the role conversation without a paid
request:

```text
/intake?fixture=conversation-success
/intake?fixture=conversation-researched
/intake?fixture=conversation-unavailable
/intake?fixture=conversation-api-failure
/intake?fixture=conversation-malformed
```

The server routes return calm public error states for missing configuration,
invalid input, timeout, upstream failure, retrieval failure, and malformed model
output. Raw SDK errors and environment values are not returned to the browser.

A previous real local GPT-5.6 profile response was validated and rendered.
Role-conversation behavior is currently verified with deterministic fixtures and
mocked model/retrieval boundaries; no new live or paid request is required for
the demo checks.

## Deployment

Preview URL: [steppi-openai-build-week-2ibzu4h54-pgc9002-3129s-projects.vercel.app](https://steppi-openai-build-week-2ibzu4h54-pgc9002-3129s-projects.vercel.app)

The preview deployment is protected by Vercel Authentication. Both server-only OpenAI variables are configured for Preview, and the complete deployed intake-to-profile request has been browser-verified with a real GPT-5.6 response. The response passed the `StudentProfile` schema and rendered facts, inferences, constraints, uncertainty, and tensions separately.

On Vercel, add both variables under **Project Settings → Environment Variables** and scope them to **Preview** for preview testing:

- `OPENAI_API_KEY` — secret API key
- `OPENAI_MODEL` — `gpt-5.6`

Redeploy after changing environment variables; existing deployments do not receive new values automatically. Do not add either variable to a `NEXT_PUBLIC_` name.
