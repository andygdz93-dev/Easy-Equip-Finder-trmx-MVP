# EasyFinder

A full-stack AI-powered decision engine for buying and selling heavy equipment. EasyFinder combines a 6-factor scoring model with an **AI broker chat** that qualifies buyer needs and recommends the best-matched inventory in plain English.

---

## What it does

- **AI Broker Chat** — Claude-powered broker that qualifies buyer needs (project type, budget, timeline, jobsite conditions) and recommends specific scored listings with rationale. Accessible at `/demo/broker`.
- Scores every listing 0–100 across six weighted factors: price vs market, hours, age, condition, distance, and brand tier
- Ranks listings so the best value appears first, not the newest post
- Explains every score in plain English — no black box
- Flags risk signals: non-operable units, missing data, stale listings, unknown sources
- Lets buyers adjust scoring weights to match their priorities
- Supports seller dashboards, admin CSV ingest, and Stripe subscriptions

---

## Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Backend     | Fastify + TypeScript    |
| Frontend    | React + Vite + Tailwind |
| Shared lib  | TypeScript (pnpm workspace) |
| Database    | PostgreSQL (optional — falls back to demo data) |
| Auth        | JWT (role-based: demo / buyer / seller / admin) |
| Payments    | Stripe (optional — disabled if keys not set) |
| Deploy      | Docker / Fly.io ready   |

---

## Project structure

```
easyfinder/
├── apps/
│   ├── api/          # Fastify REST API (port 8080)
│   └── web/          # React + Vite frontend (port 5173)
├── packages/
│   └── shared/       # Scoring engine, types, demo data
├── project docs/     # Scoring model spec, API reference, product vision
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install

```bash
pnpm install
```

### Configure

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` — the only required field is `JWT_SECRET`. Everything else is optional and falls back gracefully.

### Run (demo mode — no database needed)

```bash
# Set DEMO_MODE=true in apps/api/.env, then:
pnpm --filter api dev
pnpm --filter web dev
```

API: http://localhost:8080  
Frontend: http://localhost:5173

### Run (with PostgreSQL)

Set your DB credentials in `.env`. The API will connect automatically and serve real listings. If the connection fails it falls back to demo data without crashing.

---

## AI Broker Chat

The broker chat (`/demo/broker`) uses the Anthropic Claude API to power a conversational heavy equipment advisor. It:

- Qualifies buyer needs with industry-standard questions (project type, jobsite, budget, timeline, buy vs rent vs lease)
- References live scored inventory and recommends specific listings with rationale
- Adopts a veteran broker persona — direct, no brand loyalty, focused on TCO and resale value
- Renders recommended listings inline with score breakdowns and links to full detail pages

**Setup:** Set your Anthropic API key. The frontend calls the Anthropic API directly for simplicity in the demo — for production, proxy through your API to protect the key.

```bash
# In apps/web/.env (create if not present)
VITE_ANTHROPIC_API_KEY=your-key-here
```

Or pass the key via the `apps/api` server as a proxy endpoint — recommended for production.

---



| Method | Path                            | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | /api/health                     | Liveness probe                     |
| GET    | /api/status                     | Full system readiness check        |
| GET    | /api/listings                   | Scored and ranked listings         |
| GET    | /api/listings/:id               | Single listing with full breakdown |
| POST   | /api/auth/register              | Register a new user                |
| POST   | /api/auth/login                 | Login, returns JWT                 |
| GET    | /api/auth/me                    | Current user                       |
| GET    | /api/scoring-configs            | Get active scoring config          |
| POST   | /api/scoring-configs            | Update weights (buyer/admin only)  |
| GET    | /api/watchlist                  | Get saved listings                 |
| POST   | /api/watchlist                  | Add to watchlist                   |
| DELETE | /api/watchlist/:id              | Remove from watchlist              |
| POST   | /api/payments/create-checkout-session | Start Stripe checkout       |
| GET    | /api/payments/subscription-status   | Check subscription status    |
| POST   | /api/admin/ingest/csv           | Bulk ingest listings via CSV       |
| GET    | /api/admin/sources              | Source health status               |
| POST   | /api/broker/chat                | AI broker — proxies to Claude API  |

Full spec: `project docs/API_REFERENCE.md`

---

## Scoring model

The scoring engine lives in `packages/shared/src/scoring.ts`. Full specification in `project docs/SCORING_MODEL.md`.

**Default weights:**

| Factor    | Weight | What it measures                        |
|-----------|--------|-----------------------------------------|
| Price     | 30%    | Asking price vs estimated market value  |
| Hours     | 25%    | Hours of use (lower = better)           |
| Age       | 15%    | Model year (newer = better)             |
| Condition | 15%    | Reported condition score                |
| Distance  | 10%    | Proximity to buyer                      |
| Brand     | 5%     | Brand tier (CAT/Deere/Komatsu = Tier 1) |

Weights are configurable per buyer via the API. Non-operable equipment receives a −60 point penalty and cannot receive a Best Option badge.

---

## Seed credentials (demo mode)

| Role   | Email                    | Password        |
|--------|--------------------------|-----------------|
| Demo   | demo@easyfinder.ai       | DemoPass123!    |
| Buyer  | buyer@easyfinder.ai      | BuyerPass123!   |
| Seller | seller@easyfinder.ai     | SellerPass123!  |
| Admin  | admin@easyfinder.ai      | AdminPass123!   |

---

## Deploy to Fly.io

```bash
fly launch   # first time
fly deploy   # subsequent deploys
```

`fly.toml` is pre-configured. Set secrets with:

```bash
fly secrets set JWT_SECRET=your-secret
fly secrets set DB_HOST=your-db-host
# etc.
```

---

## License

MIT
