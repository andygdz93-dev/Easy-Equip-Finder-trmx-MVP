# 📡 API_REFERENCE.md — EasyFinder API

This document describes the current production API surface for EasyFinder, including:
- base URL + environment usage
- endpoints
- request/response schemas
- examples
- status codes
- notes on routes that are intentionally not implemented yet

---

## 1) Base URL

### Production
- **Host:** `https://easyfinder.fly.dev`
- **API prefix:** `/api`

### Example
- Health check: `GET https://easyfinder.fly.dev/api/health`

---

## 2) Authentication

**Current state:** API endpoints are publicly reachable for development/testing unless otherwise specified.

Planned:
- JWT auth for buyer/seller/admin flows
- role-based authorization

> Note: Some routes (e.g., `/api/admin`, `/api/seller`, `/api/auth`) are currently **not implemented** and will return `404` until enabled.

---

## 3) Common Response Conventions

### Success envelope (typical)
Responses may return plain JSON objects or arrays. Where applicable, responses include:
- `totalScore`
- `scores` breakdown
- `confidenceScore`
- `rationale[]`
- `flags[]`

### Error envelope (recommended standard)
Some routes may use a consistent error format:
```json
{
  "ok": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message"
  }
}

4) Endpoints
✅ 4.1 Health
GET /api/health

Confirms API is running and env configuration is present.

Response (200)
{
  "ok": true,
  "mongoConfigured": true
}

Status Codes

200 OK — API is up

500 Internal Server Error — unexpected runtime error

✅ 4.2 Listings
GET /api/listings

Returns equipment listings ranked by the scoring engine.

Query Params (optional; v1 defaults)

Current implementation may support a subset. If not provided, server uses defaults.

Recommended contract (v1+):

q (string) — keyword search (e.g., "caterpillar excavator")

category (string) — equipment category

state (string) — preferred state filter

maxPrice (number)

maxHours (number)

operableOnly (boolean)

Response (200) — Example
[
  {
    "id": "listing_123",
    "title": "2018 CAT 320 Excavator",
    "category": "excavator",
    "price": 125000,
    "hours": 4200,
    "state": "CA",
    "is_operable": true,
    "source": "partner_dealer",
    "url": "https://example.com/listing/123",
    "images": ["https://example.com/img1.jpg"],

    "totalScore": 84,
    "scores": {
      "priceScore": 88,
      "hoursScore": 74,
      "locationScore": 65,
      "riskScore": 60
    },
    "confidenceScore": 82,
    "flags": [],
    "rationale": [
      "Price is below category benchmark (strong value).",
      "Hours are moderate for this category.",
      "Mild location preference applied (CA)."
    ]
  }
]

Notes

Non-operable listings may be included but scored very low and flagged.

Missing data lowers confidence score.

Some fields may vary depending on the source quality.

Status Codes

200 OK — listings returned (may be empty array)

400 Bad Request — invalid filters/params (if enforced)

500 Internal Server Error — server error

✅ 4.3 Watchlist
GET /api/watchlist

Returns a watchlist for the current user.

Current state: often returns empty or demo list unless user auth is enabled.

Response (200) — Example
{
  "items": []
}


Alternate shape (also acceptable depending on implementation):

[]

Status Codes

200 OK

401 Unauthorized — when auth is enabled

500 Internal Server Error

✅ 4.4 Scoring Configuration
GET /api/scoring-configs

Returns the active scoring configuration used by the engine.

Response (200) — Example
{
  "weights": {
    "hours": 0.35,
    "price": 0.35,
    "state": 0.30
  },
  "preferredStates": ["CA", "AZ", "TX", "IA"],
  "maxHours": 8000,
  "maxPrice": 250000,
  "operabilityPenalty": -60
}

Notes

Preferred state boost is mild (soft bias).

Operability penalty is strong (non-operable allowed but ranked low).

Status Codes

200 OK

500 Internal Server Error

5) Reserved / Not Yet Implemented Routes

These routes are reserved and may currently return 404.

GET /api/auth (Not Implemented)

Planned:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

GET /api/admin (Not Implemented)

Planned:

ingestion tools

dealer feed management

scoring tuning

moderation

GET /api/seller (Not Implemented)

Planned:

seller listing submission

listing status tracking

lead management

6) Environment Variables (Production)

Backend uses secrets set in Fly:

Required:

MONGO_URL

DB_NAME

JWT_SECRET

CORS_ORIGINS

Frontend uses:

VITE_API_BASE_URL=https://easyfinder.fly.dev

7) Quick Test Commands
Health
curl -i https://easyfinder.fly.dev/api/health

Listings
curl -i https://easyfinder.fly.dev/api/listings

Scoring Config
curl -i https://easyfinder.fly.dev/api/scoring-configs

Watchlist
curl -i https://easyfinder.fly.dev/api/watchlist

8) Future API Improvements (Recommended)

Add OpenAPI/Swagger (Fastify plugin)

Standardize responses with a consistent envelope (ok, data, error)

Add pagination for listings:

page, pageSize, total

Add filtering:

make, model, year, distance, sellerType, conditionGrade

Add scoring explanation endpoint:

GET /api/listings/:id/explain

Add /api/health/db ping check (real Mongo ping)
