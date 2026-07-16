# Steppi

Steppi helps Grade 11 students explore realistic career and college directions through a transparent, source-backed map. It supports exploration; it does not predict a student’s future or replace professional guidance.

This repository currently contains the Milestone 0 product shell. The intake, model-backed profile, exploration map, research, and persistence are not implemented yet.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

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

Environment variables are reserved for later server-side model work. Do not put secrets in variables prefixed with `NEXT_PUBLIC_`.

## Deployment

Preview URL: pending initial deployment.
