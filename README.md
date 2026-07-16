# Steppi

Steppi helps Grade 11 students explore realistic career and college directions through a transparent, source-backed map. It supports exploration; it does not predict a student’s future or replace professional guidance.

This repository contains the product shell and a narrow end-to-end profile-generation smoke test. The `/intake` route submits representative demo answers to a server-only GPT-5.6 request, validates the returned profile, and renders only validated data. The full adaptive intake, profile correction, exploration map, research, and persistence are not implemented yet.

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

Open [http://localhost:3000/intake](http://localhost:3000/intake), review the representative answers, and select **Build the sample profile**. The request is stateless and does not persist the demo answers or returned profile.

The route returns calm public error states for missing configuration, invalid input, timeout, upstream failure, and malformed model output. Raw SDK errors and environment values are not returned or logged.

## Deployment

Preview URL: [steppi-openai-build-week-l8ek52p2e-pgc9002-3129s-projects.vercel.app](https://steppi-openai-build-week-l8ek52p2e-pgc9002-3129s-projects.vercel.app)

The preview deployment is currently protected by Vercel Authentication and has no OpenAI environment variables configured. The deployed shell and safe missing-configuration behavior have been browser-verified, but a live GPT-5.6 success has not been verified.

On Vercel, add both variables under **Project Settings → Environment Variables** and scope them to **Preview** for preview testing:

- `OPENAI_API_KEY` — secret API key
- `OPENAI_MODEL` — `gpt-5.6`

Redeploy after changing environment variables; existing deployments do not receive new values automatically.
