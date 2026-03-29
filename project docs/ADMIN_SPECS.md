Admin Specs (what Admin is, what it controls)
Admin mission

Admin exists to:

keep inventory clean and current

manage ingestion sources and feeds

tune scoring config safely

moderate sellers/listings

observe platform health

Admin roles

admin role required (JWT)

Admin endpoints return:

401 if missing token

403 if wrong role

Admin capabilities (phased)
Phase A — Operational admin (first)

Endpoints

GET /api/admin/overview

counts: listings, sources, sellers, errors

GET /api/admin/ingestion/sources

list sources and their sync status

POST /api/admin/ingestion/sources

add source (manual for now)

POST /api/admin/ingestion/sources/:id/sync

trigger sync (manual)

PUT /api/admin/scoring-configs

update scoring weights, preferred states, caps, penalty values

GET /api/admin/scoring-configs/history

audit trail

Non-negotiable admin policies

Cannot create “pay-to-rank”

Must label promotions separately from score

Must preserve explainability

Phase B — Moderation admin (next)

GET /api/admin/listings?status=pending|flagged

PUT /api/admin/listings/:id/status

PUT /api/admin/listings/:id/flags

Listing statuses

pending_review

active

paused

removed

Phase C — Monetization admin (later)

commission tracking

lead attribution

seller plans / boosts (explicitly labeled)
