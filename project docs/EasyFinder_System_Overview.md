🧩 EasyFinder — System Overview 

1. Purpose of This Document 

This document explains how EasyFinder is built, how its parts interact, and what currently exists vs. what is planned. 

It is written for:  

Developers onboarding to the project 

Future contributors 

The project owner (you) as a long-term reference 

Audits, refactors, and architectural decisions 

This is not marketing. This is the technical truth. 

 

2. High-Level Architecture 

EasyFinder is a monorepo-based, full-stack application composed of: 

A backend API (Node.js + Fastify) 

A frontend web application (Vite + React) 

Shared packages for types and utilities 

External infrastructure (Fly.io, Vercel, MongoDB) 

High-Level Flow 

User (Browser) 
   ↓ 
Frontend (Vercel) 
   ↓ 
Backend API (Fly.io) 
   ↓ 
Database / Services (MongoDB, future integrations) 
 

 

3. Repository Structure 

easyfinder/ 

├── apps/

│    ├── api/                   # Backend API (Fastify)

│    │    ├── src/

│    │    │    ├── routes/      # API route definitions 

│    │    │    ├── plugins/     # Fastify plugins (JWT, auth, etc.) 

│    │    │    ├── services/    # Business logic 

│    │    │    ├── scoring/     # Scoring engine logic 

│    │    │    ├── types.d.ts   # Global Fastify / JWT typings 

│    │    │    └── index.ts     # API entry point 

│    │    ├── tests/            # API & scoring tests 

│    │    ├── tsconfig.json 

│    │    ├── tsconfig.test.json 

│    │    └── package.json 

│    │ 

│    └── web/                   # Frontend (Vite + React) 

│        ├── src/ 

│        │    ├── components/ 

│        │    ├── pages/ 

│        │    ├── services/     # API calls 

│        │    └── main.tsx 

│        ├── vite.config.ts 

│        └── package.json 

│

├── packages/ 

│   └── shared/                 # Shared types & utilities 

│       ├── src/ 

│       └── package.json 

│ 

├── .github/ 

│    └── workflows/             # CI (lint, typecheck, build) 

│ 

├── Dockerfile                  # Backend container 

├── fly.toml                    # Fly.io deployment config 

├── pnpm-workspace.yaml 

└── README.md 

 

 

4. Backend API (apps/api) 

Stack 

Node.js 

Fastify 

TypeScript 

JWT Authentication 

MongoDB 

Responsibilities 

Serve all API endpoints 

Apply scoring logic 

Handle authentication & authorization 

Manage listings, watchlists, configs 

Entry Point 

apps/api/src/index.ts 
 

This: 

Initializes Fastify 

Registers plugins 

Registers routes 

Starts HTTP server on port 8080 

 

5. API Routes (Current State) 

Health & System 

GET /api/health 

Confirms API is running 

Confirms MongoDB connectivity 

Listings 

GET /api/listings 

Returns scored equipment listings 

Includes score breakdown and rationale 

Watchlist 

GET /api/watchlist 

Returns user watchlist (currently empty / stub) 

Scoring Configuration 

GET /api/scoring-configs 

Returns active scoring weights and thresholds 

Routes Not Yet Implemented 

The following return 404 by design (placeholders): 

/api/auth 

/api/admin 

/api/seller 

These are intentionally reserved for future phases. 

 

6. Scoring Engine 

The scoring engine is central to EasyFinder. 

Characteristics 

Deterministic 

Config-driven 

Explainable 

Testable 

Inputs 

Price 

Hours 

State / location 

Operability 

Category 

Output 

totalScore 

Component breakdown 

Human-readable rationale 

The scoring engine lives in: 

apps/api/src/scoring/ 
 

 

7. Authentication & Authorization (Current State) 

JWT support is wired 

Role types exist (demo, buyer, seller, admin) 

Request typing is globally extended via types.d.ts 

Important: 
Auth routes exist conceptually but are not yet exposed. 
This is intentional until product direction is locked. 

 

8. Frontend (apps/web) 

Stack 

Vite 

React 

TypeScript 

Responsibilities 

Render listings 

Display scoring explanations 

Communicate with backend API 

Deployment 

Hosted on Vercel 

Root directory: apps/web 

Uses environment variable: 

VITE_API_BASE_URL=https://easyfinder.fly.dev 
 

 

9. Infrastructure 

Backend 

Fly.io 

Docker-based deployment 

Internal port: 8080 

Public HTTPS via Fly proxy 

Frontend 

Vercel 

Static build output (dist) 

Connected directly to backend API 

Database 

MongoDB 

Connected via MONGO_URL secret on Fly.io 

 

10. CI / Quality Gates 

CI runs on: 

Pull requests 

Main branch updates 

Current Checks 

Linting 

Type checking 

Build verification 

CI is intentionally strict to keep the codebase clean. 

 

11. What Exists vs What’s Planned 

Exists Today 

Working API 

Live deployment 

Scoring engine 

Listings endpoint 

Frontend integration 

CI pipeline 

Planned (Post Vision Lock) 

Auth flows 

Seller onboarding 

Admin tools 

Transactions & commissions 

Enhanced scoring intelligence 

 

12. Guiding Architectural Principles 

Monorepo for cohesion 

Strong typing everywhere 

Explainable logic over black boxes 

Infrastructure kept simple 

No premature optimization 

 

13. Current System Status 

✅ Backend deployed and stable 
✅ Frontend deployed and connected 
✅ Core scoring functionality operational 
⚠️ Auth and seller flows intentionally deferred 

The system is healthy, clean, and ready for expansion. 

 

14. Next Logical Documents 

Recommended next files: 

README.md (developer + user overview) 

API_REFERENCE.md 

SCORING_MODEL.md 

DEPLOYMENT.md 

 

 
