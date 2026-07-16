# Steppi

Steppi helps Grade 11 students explore realistic career and college directions through a transparent, source-backed map. It supports exploration; it does not predict a student’s future or replace professional guidance.

This repository contains the product shell and a narrow end-to-end intake and profile-generation flow. The `/intake` route asks one question at a time, preserves answers during back navigation, includes a deterministic adaptive follow-up, validates answers before submission, sends them to GPT-5.6 through a server-only route, and renders only a validated profile. Profile correction, the exploration map, research, and persistence are not implemented yet.

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

Open [http://localhost:3000/intake](http://localhost:3000/intake), complete the short intake, review the answers, and select **Build my profile**. The request is stateless and does not persist the answers or returned profile. Use **Start over** to clear the current in-memory intake.

The route returns calm public error states for missing configuration, invalid input, timeout, upstream failure, and malformed model output. Raw SDK errors and environment values are not returned or logged.

A real local GPT-5.6 response was successfully validated and rendered before the current intake work block. Deterministic tests cover missing configuration, timeout, upstream failure, malformed output, response validation, and retryability without spending API credit.

## Deployment

Preview URL: [steppi-openai-build-week-2ibzu4h54-pgc9002-3129s-projects.vercel.app](https://steppi-openai-build-week-2ibzu4h54-pgc9002-3129s-projects.vercel.app)

The preview deployment is protected by Vercel Authentication. Both server-only OpenAI variables are configured for Preview, and the complete deployed intake-to-profile request has been browser-verified with a real GPT-5.6 response. The response passed the `StudentProfile` schema and rendered facts, inferences, constraints, uncertainty, and tensions separately.

On Vercel, add both variables under **Project Settings → Environment Variables** and scope them to **Preview** for preview testing:

- `OPENAI_API_KEY` — secret API key
- `OPENAI_MODEL` — `gpt-5.6`

Redeploy after changing environment variables; existing deployments do not receive new values automatically. Do not add either variable to a `NEXT_PUBLIC_` name.
