Frontend Contract (how the web app talks to the API)

This is the agreement between apps/web and apps/api.

Environment

Frontend reads:

VITE_API_BASE_URL=https://easyfinder.fly.dev/api

So:

Health → ${BASE}/health

Listings → ${BASE}/listings

Client responsibilities

Frontend must:

treat backend as source of truth

display explainability

never “invent” ranking logic in UI

separate “promoted” from “best value” visuals

Core UI flows (v1)
Buyer flow

Pages

/ landing

/search (filters + listings)

/listing/:id (detail + rationale)

/watchlist (saved items)

API calls

GET /listings

GET /scoring-configs

GET /watchlist

Seller flow (v2)

/sell

/sell/new

/seller/dashboard

API calls

POST /seller/listings

GET /seller/listings

Auth flow (v2)

/login, /register

POST /auth/login

POST /auth/register

store JWT in memory/local storage (final decision later)

Response shaping rules (frontend)
Listing card needs:

title, price, hours, state, category, images[0]

totalScore

top 2 rationale items

flags (non-operable badge, low confidence badge)

Listing detail needs:

full score breakdown

full rationale

confidence indicator

Error handling contract

Frontend should interpret:

404 as “not found” (route or listing)

401 as “login required”

403 as “not authorized”

500 as “server error”
