# 🧮 SCORING_MODEL.md — EasyFinder Ranking & Recommendation System (v1)

## 0) Why this scoring model exists

EasyFinder is not a listings site — it’s a **decision engine**.

The scoring model is the product:
- It decides what buyers see first
- It defines “best value” in a transparent way
- It produces **rankings + explanations**, not a black box
- It becomes the moat over time via data, outcomes, and trust

This document defines:
- What we score
- How we score it
- How we explain it
- How we evolve it safely

---

## 1) Design goals

### Buyer goals (primary)
1. **Best value** (price vs usage/condition)
2. **Low risk** (operable preferred, documented, credible source)
3. **Fast decision** (top options appear immediately)
4. **Explainable** (buyer can understand the ranking)

### Seller goals (secondary)
- Sellers can rank higher by improving real signals:
  - better price
  - better documentation
  - better condition
  - transparency

### Platform goals
- Deterministic, auditable scoring
- Resistant to gaming
- Monetization must not corrupt ranking integrity

---

## 2) Locked policy decisions (IMPORTANT)

### ✅ Operability Rule (LOCKED)
**Non-operable listings are allowed, but scored very low.**
- They remain visible (important for rebuild/repair buyers)
- They can’t be “Best Option”
- They carry a strong risk penalty and a clear label

### ✅ Preferred States (LOCKED)
**Preferred states receive a mild boost (soft bias).**
- Location helps reduce friction, but does not dominate
- A great deal outside a preferred state can still outrank a mediocre local deal

---

## 3) Listing data requirements (v1)

Minimum viable fields:
- `price` (number)
- `hours` (number)
- `state` (string)
- `is_operable` (boolean)
- `category` (string)
- `source` (string)
- `createdAt` / lastSeen (date)

Optional but valuable:
- year, make, model
- service history
- inspection report
- verified seller/partner
- photos count
- seller type (dealer, auction, private)
- shipping availability

---

## 4) Scoring outputs

Every listing returned to the client should include:

- `totalScore` (0–100)
- `scores` breakdown:
  - `priceScore`
  - `hoursScore`
  - `locationScore`
  - `riskScore`
  - `operabilityScore` (new in v1.1 if desired, see below)
- `confidenceScore` (0–100)
- `rationale[]` (array of human explanations)
- `flags[]` (e.g., `NON_OPERABLE`, `MISSING_HOURS`, `STALE_LISTING`)

---

## 5) Score components (v1)

### 5.1 Price Score (0–100)
Lower price is better, normalized.

**Preferred method (v1+): category benchmarks**
- Track rolling price distribution per category:
  - `p50` (median), `p90` (high), optionally `p10`
- Map listing price into a score:
  - <= p50 → high score
  - p50–p90 → mid score
  - > p90 → low score

**Fallback (v1): configured cap**
If benchmarks not available:
- `priceScore = max(0, 100 - (price / maxPrice) * 100)`
- If price missing → neutral score (e.g., 50) but confidence penalty applies

### 5.2 Hours Score (0–100)
Lower hours generally better. Normalization mirrors price.

**Preferred method (v1+): category benchmarks**
- per-category `hours_p50`, `hours_p90`

**Fallback (v1): configured cap**
- `hoursScore = max(0, 100 - (hours / maxHours) * 100)`
- If hours missing → neutral score (e.g., 50) but confidence penalty applies

### 5.3 Location Score (soft bias) (0–100)
We apply only a mild preference boost.

**v1 mapping**
- preferred state → **65**
- non-preferred → **50**

This ensures location helps but never dominates value.

### 5.4 Risk Score (0–100)
Risk reflects “how likely this is to become a problem.”

Inputs that increase risk score:
- Verified seller/partner
- Service history
- Inspection report
- Good media/photos
- Fresh listing (recently seen)

Inputs that reduce risk score:
- Missing critical fields (price/hours)
- Stale listing
- Unknown seller/source
- Non-operable status (major penalty)

v1 default baseline:
- Start at 70 then apply modifiers.

---

## 6) Operability handling (LOCKED rule implementation)

Operability is **not a hard filter**.

### 6.1 Recommended v1 operability penalty
If `is_operable === false`:
- Apply a strong penalty to total score
- Apply a strong penalty to risk score
- Add flags and rationale

Example policy:
- `operabilityPenalty = -60` (applied after weighted sum)
- `riskScore -= 40` (floored at 0)
- Flag: `NON_OPERABLE`
- Add rationale: “Non-operable listing: high repair risk.”

### 6.2 “Best Option” eligibility (hard rule)
A listing with `NON_OPERABLE` flag:
- **cannot** receive the “Best Option” badge
- may still appear in results with clear labeling

---

## 7) Confidence Score (0–100)

Confidence answers:
> “How reliable is this listing’s data and ranking?”

Start at 100, subtract penalties:

Recommended v1 penalties:
- Missing `price`: -30
- Missing `hours`: -25
- Missing `state`: -10
- Unknown source/seller: -10
- Stale listing (not updated recently): -10
- Inconsistent fields: -15

Confidence categories:
- 80–100: High
- 50–79: Medium
- <50: Low

Confidence never changes the raw score directly; it’s shown alongside results.

---

## 8) Total score formula (v1)

### 8.1 Weighted sum

baseTotal =
w_price * priceScore

w_hours * hoursScore

w_location * locationScore

w_risk * riskScore

Recommended default weights:
- `w_price = 0.35`
- `w_hours = 0.35`
- `w_location = 0.20`  (soft bias still works because range is narrow)
- `w_risk = 0.10`

### 8.2 Apply operability penalty (LOCKED)
totalScore = clamp(baseTotal + operabilityPenalty, 0, 100)


Where:
- `operabilityPenalty = 0` if operable
- `operabilityPenalty = -60` if non-operable

---

## 9) Explainability (non-negotiable)

Every scored listing returns a `rationale[]`.

Examples:
- “Price is below category benchmark (strong value).”
- “Hours are lower than average for this category.”
- “Preferred state mild boost applied.”
- “Non-operable listing: high repair risk (score reduced).”
- “Confidence reduced: missing hours.”

Rationale should match the scores—no generic fluff.

---

## 10) Anti-gaming rules

To protect trust and the moat:

- No paid ranking
- Partner promotion must be labeled and must not affect score
- Penalize suspicious or incomplete listings:
  - unrealistic price
  - repeated duplicates
  - missing critical fields
  - stale listings

---

## 11) Future upgrades (v2 and v3)

### v2 (personalization + better normalization)
- Buyer preferences:
  - budget caps
  - distance/shipping
  - urgency
  - category-specific preferences
- Category benchmarks powered by real market data
- Distance score (zip-to-zip)
- Seller verification scoring

### v3 (learning loop moat)
- Outcome signals:
  - click-through
  - contact events
  - conversions (commissionable deals)
- Build “fair market price” estimators per make/model/year
- Rankings that improve based on real buyer behavior, without losing explainability

---

## 12) “Best Option” labeling rules

A listing may be tagged as “Best Option” only if:
- `totalScore` is in the top tier for the query
- `confidenceScore` is above threshold (recommended >= 60)
- It is **operable** (must not have `NON_OPERABLE`)
- No critical red flags

This preserves trust.

---

# Appendix A — Example scoring output (shape)

```json
{
  "id": "listing_123",
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
Non-operable example:

{
  "id": "listing_999",
  "totalScore": 22,
  "scores": {
    "priceScore": 91,
    "hoursScore": 55,
    "locationScore": 50,
    "riskScore": 20
  },
  "confidenceScore": 70,
  "flags": ["NON_OPERABLE"],
  "rationale": [
    "Great price for category.",
    "Non-operable listing: high repair risk (score reduced).",
    "Not eligible for Best Option."
  ]
}



Appendix B — Config knobs (v1)

These settings should be adjustable in /api/scoring-configs:

weights:

price, hours, location, risk

preferredStates (mild boost list)

maxPrice / category caps (fallback)

maxHours / category caps (fallback)

operabilityPenalty (default -60)

confidence penalties

stale listing threshold (e.g., lastSeen > N days)



Appendix C — Listings acquisition note (inventory moat)

Scoring is powerful only with inventory. EasyFinder should build inventory via:

Seller submission (owned supply)

Dealer CSV/Sheet imports (fast, cheap)

Partner feeds and APIs (scalable, reliable)

Long-term: DMS integrations + market benchmarks + outcome learning

The moat is not just listings—it's intelligence + trust + outcomes.
