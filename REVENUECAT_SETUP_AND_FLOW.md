# RevenueCat Setup and End-to-End Flow

This document describes the full RevenueCat integration in this backend, including:

- How to configure it
- How webhook events are processed
- How credits are enforced during image generation
- Current flaws and concrete improvement recommendations

Scope covered:

- Webhook ingestion and security
- Database updates and idempotency
- Runtime credit checks and deductions
- Frontend/backend contract for subscription identity

---

## 1. Current Architecture Snapshot

### Modules and entry points

- RevenueCat module is registered in app imports:
  - src/app.module.ts
- Webhook endpoint:
  - POST /webhooks/revenuecat
  - Implemented in src/revenuecat/revenuecat.controller.ts
- Webhook auth guard:
  - src/revenuecat/revenuecat.guard.ts
- Event processing logic:
  - src/revenuecat/revenuecat.service.ts

### Database models used

Defined in prisma/schema.prisma:

- User
  - subscribed: boolean flag for active paid access
  - freeTrialsLeft: remaining free trial credits
- Subscription
  - totalCredits, usedCredits
  - startDate, endDate
  - transactionIdentifier (unique, nullable)
- ProcessedWebhook
  - id (webhook event id)
  - type
  - createdAt

### Where credits are enforced

Credit checks are used by Flux generation features in:

- src/flux-image-generation/flux-image-generation.controller.ts
- src/flux-image-generation/flux-image-generation.service.ts

Main credit methods:

- checkForCredits(userId)
- deductCredits(userId)

---

## 2. Required Environment and Infrastructure Setup

## 2.1 Required environment variables

RevenueCat-specific variable currently used by backend:

- REVENUECAT_WEBHOOK_SECRET

Other related runtime variables used by generation and auth flow:

- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- BFL_API_KEY
- AWS_REGION
- AWS_S3_BUCKET
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_PRESIGNED_GET_EXPIRES_IN

Note:

- The backend currently does not use RevenueCat REST API keys server-side.
- RevenueCat integration is webhook-driven in current implementation.

## 2.2 Docker setup

The backend container loads .env and exposes port 3001:

- docker-compose.yml

Webhook URL should therefore typically be one of:

- Production: https://your-domain.com/webhooks/revenuecat
- Local tunnel: https://your-ngrok-or-cloudflared-url/webhooks/revenuecat

## 2.3 Prisma migrations

Subscription and webhook idempotency schema is created by migrations:

- prisma/migrations/20260325144928_init/migration.sql
- prisma/migrations/20260330081517_subsciprtions/migration.sql

Apply migrations before testing webhooks.

---

## 3. RevenueCat Dashboard Configuration (Recommended)

## 3.1 Webhook configuration

In RevenueCat dashboard:

1. Go to project webhooks.
2. Add webhook URL:
   - https://<your-domain>/webhooks/revenuecat
3. Configure authorization header as:
   - Authorization: Bearer <same value as REVENUECAT_WEBHOOK_SECRET>

The guard in backend performs a direct equality check against that exact bearer value.

## 3.2 Product mapping alignment

Current code maps RevenueCat product ids to credit packs:

- plan_499_usd_50_uses -> 50 credits
- plan_999_usd_120_uses -> 120 credits

This mapping is hardcoded in:

- src/revenuecat/revenuecat.service.ts

Important:

- Product identifiers in RevenueCat must match these strings exactly.
- Unknown product ids are recorded as processed webhook events but do not grant credits.

## 3.3 App user identity contract (critical)

Webhook logic expects:

- event.app_user_id (or appUserId)

This value must match backend User.id exactly. If frontend RevenueCat SDK uses a different identifier, credits and subscription updates will not map to the user correctly.

Recommended frontend contract:

1. User logs in to backend.
2. Frontend fetches /auth/me and gets id.
3. Frontend configures RevenueCat SDK app user id to that backend user id.

---

## 4. Implemented Webhook Processing Flow

## 4.1 Endpoint and guard

- Route: POST /webhooks/revenuecat
- Guard: RevenueCatGuard
  - Reads Authorization header
  - Expects exact match: Bearer ${REVENUECAT_WEBHOOK_SECRET}

If guard fails, webhook request is rejected.

## 4.2 Event shape handling

Service reads:

- payload.event if present
- otherwise payload itself

Then requires:

- event.id
- event.type

If invalid, logs warning and returns { ok: true }.

## 4.3 Idempotency

Before processing:

- Looks up ProcessedWebhook by event.id
- If found, returns { ok: true }

After processing:

- Creates ProcessedWebhook record to prevent duplicate handling

## 4.4 Event type behavior

INITIAL_PURCHASE and RENEWAL:

1. Resolve product id (product_id or productId)
2. Resolve credits from mapping
3. Resolve user id (app_user_id or appUserId)
4. Parse start/end dates from payload
5. Transaction:
   - insert ProcessedWebhook
   - set User.subscribed = true
   - create Subscription row with totalCredits and usedCredits=0

EXPIRATION:

1. Resolve user id
2. Transaction:
   - insert ProcessedWebhook
   - set User.subscribed = false
   - close active subscriptions by setting endDate=now and usedCredits=totalCredits

Other event types:

- Only ProcessedWebhook is inserted
- No subscription/user change is made

---

## 5. Credit Consumption Flow in the App

Credits are not consumed in RevenueCat webhook logic. They are consumed during generation endpoints in Flux service.

## 5.1 Decision order

For a user action requiring one generation credit:

1. If User.freeTrialsLeft > 0
   - Use free trial credit first
2. Else if User.subscribed is true
   - Find active subscriptions (startDate <= now <= endDate)
   - Use the newest subscription with remaining credits
3. Else
   - Reject request with insufficient credits

## 5.2 Where checks happen

Generation endpoints call checkForCredits in controller, and some service methods also call checkForCredits again.

Paths:

- POST /flux-image-generation/flux-image-generation
  - Controller checkForCredits
  - Service generateImageForDesign also calls checkForCredits
- POST /flux-image-generation/apply-style
  - Controller checkForCredits
  - Service transferStyleBetweenS3Keys also calls checkForCredits
- POST /flux-image-generation/generate-from-s3
  - Controller checkForCredits
  - Service generateFromS3Key does not check again (comment says controller should check)

## 5.3 When deduct happens

Credit is deducted after successful generation and upload.

- deductCredits is called in success path.

This protects users from being charged for failed generation jobs, but introduces concurrency considerations (see flaws section).

---

## 6. End-to-End Sequence (Current Behavior)

## 6.1 Purchase-to-credit sequence

1. User purchases in mobile app via RevenueCat.
2. RevenueCat sends webhook to POST /webhooks/revenuecat.
3. Guard validates Authorization header.
4. Service checks idempotency via ProcessedWebhook.id.
5. On INITIAL_PURCHASE or RENEWAL:
   - set user subscribed=true
   - insert subscription with product-based credits
6. User initiates generation endpoint.
7. App checks free trial first, then subscription credits.
8. Generation succeeds.
9. deductCredits decrements free trial or increments usedCredits on active subscription.

## 6.2 Expiration-to-block sequence

1. RevenueCat sends EXPIRATION webhook.
2. Service sets subscribed=false.
3. Service force-closes active subscriptions and marks remaining credits as consumed.
4. Next generation attempts fail (unless free trials still remain).

---

## 7. Operational Verification Checklist

Use this after deployment.

## 7.1 Health checks

- App starts with no missing env variables.
- Swagger available at /api/docs.
- Database has Subscription and ProcessedWebhook tables.

## 7.2 Webhook auth verification

Send one request with wrong Authorization header:

- Expected: rejected by guard

Send one request with correct header and valid event payload:

- Expected: { ok: true } and DB update

## 7.3 Idempotency verification

Resend exact same event.id:

- Expected: no duplicate Subscription
- Expected: { ok: true }

## 7.4 Credit enforcement verification

For a test user:

1. Set freeTrialsLeft to 0
2. Add active subscription with remaining credits
3. Trigger generation
4. Confirm usedCredits increments by 1 on success

---

## 8. Current Flaws and Risks

The following are present in current implementation.

## 8.1 Security and webhook trust

1. Guard only performs a static bearer token equality check.
   - No signature verification or timestamp-based replay protection.
   - Risk: secret leakage allows spoofed events.

2. If REVENUECAT_WEBHOOK_SECRET is missing at runtime, expected token becomes Bearer undefined.
   - Risk: insecure misconfiguration state.

## 8.2 Data consistency and event handling

1. Unknown product ids are treated as processed but credits are not granted.
   - Event cannot be replayed later after mapping fix because idempotency row already exists.

2. Missing app_user_id also leads to processed event without user update.
   - Event is effectively dropped from business impact perspective.

3. Duplicate transactionIdentifier across different event ids can fail Subscription create.
   - Unique constraint may throw and webhook may keep retrying.

4. EXPIRATION sets subscribed=false at user level even if multiple active entitlements could exist.
   - In multi-subscription scenarios this can disable access incorrectly.

5. Only INITIAL_PURCHASE, RENEWAL, and EXPIRATION have business logic.
   - Other meaningful events are acknowledged but ignored.

## 8.3 Credit race conditions

1. checkForCredits and deductCredits are separate operations.
   - Concurrent generation requests can pass checks simultaneously and overspend credits.

2. Some routes check credits twice (controller and service), others once.
   - Inconsistent behavior and extra DB load.

## 8.4 Maintainability gaps

1. Product-to-credit mapping is hardcoded in service.
   - Requires deployment for every pricing/catalog change.

2. No DTO schema validation for webhook payload shape.
   - Harder to reason about malformed events.

3. No dedicated tests for RevenueCat module.
   - No regression safety for event logic.

## 8.5 Observability gaps

1. No structured event audit model beyond id/type.
   - Difficult postmortem on malformed or unmapped events.

2. No metrics around webhook success/failure by event type.

---

## 9. Improvement Plan (Prioritized)

## 9.1 P0 - Immediate hardening

1. Fail fast on startup if REVENUECAT_WEBHOOK_SECRET is missing.
2. Add stronger webhook verification strategy (at minimum strict header parsing and clear rejection logging).
3. Do not mark event processed when required business fields are missing (for example user id or known product mapping).
4. Add safe handling for duplicate transactionIdentifier (upsert or dedupe before create).

## 9.2 P1 - Correctness and consistency

1. Introduce a single atomic credit consumption method:
   - check and deduct in one transaction
   - avoid race conditions
2. Remove duplicate checkForCredits calls in controller/service and centralize policy.
3. Replace user-level subscribed boolean as source of truth with derived active entitlement lookup, or keep subscribed but compute/update carefully with aggregate logic.
4. Expand event handling for additional lifecycle events needed by business.

## 9.3 P2 - Operability and product agility

1. Move product-credit mapping to configuration table or env-backed mapping.
2. Store minimal normalized event payload metadata for audit/debug.
3. Add RevenueCat integration tests:
   - idempotency
   - unknown product
   - missing user id
   - expiration behavior
   - concurrent credit usage
4. Add admin/internal endpoint for subscription snapshot (active credits, next expiry).

---

## 10. Suggested Future Target Design

A robust target architecture should include:

1. Deterministic event processor
   - validate payload
   - persist raw event metadata
   - apply state transitions with clear invariants
2. Atomic credit ledger semantics
   - one transaction per generation charge
   - no check-then-act race windows
3. Reconciliation path
   - scheduled job to verify backend subscription state against RevenueCat source-of-truth
4. Configuration-driven product catalog
   - no code deploy needed for plan-credit updates

---

## 11. Quick Reference

Webhook endpoint:

- POST /webhooks/revenuecat

Guard secret header:

- Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>

Core files:

- src/revenuecat/revenuecat.controller.ts
- src/revenuecat/revenuecat.guard.ts
- src/revenuecat/revenuecat.service.ts
- src/flux-image-generation/flux-image-generation.service.ts
- prisma/schema.prisma

---

## 12. Summary

The current integration is functional for a straightforward single-entitlement flow:

- It receives RevenueCat webhooks
- It applies idempotent processing by event id
- It toggles user subscription state and allocates credit packs
- It enforces credits in Flux generation endpoints

The main production risks are:

- webhook trust hardening
- non-atomic credit consumption under concurrency
- event drop scenarios for unmapped products/missing user id
- limited event coverage and observability

Addressing P0 and P1 items will significantly increase billing correctness and reliability.
