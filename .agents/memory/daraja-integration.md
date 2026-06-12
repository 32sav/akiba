---
name: Daraja API integration
description: M-Pesa Daraja API patterns, gotchas, and decisions for the Akiba chama platform
---

## Daraja base URL
- Sandbox: `https://sandbox.safaricom.co.ke` (NOT `https://api.sandbox.safaricom.co.ke` — the old code had this wrong)
- Production: `https://api.safaricom.co.ke`
- Controlled by `DARAJA_ENV=sandbox|production`

**Why:** Using the wrong sandbox URL causes every Daraja call to fail silently with 404 or connection errors.

## Token caching (no Redis)
Use a module-level object instead of Redis:
```typescript
const tokenCache = { token: "", expiresAt: 0 };
// Cache for 50 min; token is valid 60 min (10 min buffer for clock skew)
tokenCache.expiresAt = Date.now() + 50 * 60 * 1000;
```
**Why:** Single-process server on Replit — Redis is not available on the free tier.

## Callback-first (200 before processing)
STK push callback route MUST call `res.status(200).json(...)` before any async DB work.
```typescript
res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
// then process async in try/catch
```
**Why:** Safaricom retries aggressively if it doesn't get a 200 immediately.

## Idempotency without Redis
Use `tx.status !== "pending"` guard in the DB row. Since `checkoutRequestId` is a UNIQUE column, duplicate callbacks will find the same row and the `status !== 'pending'` check prevents double-processing.

## dueDate Zod codegen bug (loans.ts)
`drizzle-orm` `date` column with `mode: "string"` expects a string (YYYY-MM-DD), but Orval codegen generates `z.coerce.date()` which produces a JS `Date` object.
Fix: `parsed.data.dueDate instanceof Date ? parsed.data.dueDate.toISOString().split("T")[0] : String(parsed.data.dueDate)`
**Why:** drizzle `date({ mode: "string" })` ≠ JS Date; Orval doesn't know about this distinction.

## mpesa_transactions table
Stores pending STK push and B2C transactions. When STK push fires:
1. Create pending `contributions` row
2. Initiate Daraja STK push
3. Create `mpesa_transactions` row with `contributionId` linking back
4. Callback finds transaction by `checkoutRequestId`, updates both `mpesa_transactions` and `contributions`

## Env vars needed for Daraja
- `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`
- `DARAJA_SHORT_CODE`, `DARAJA_PASSKEY`
- `DARAJA_B2C_INITIATOR_NAME`, `DARAJA_B2C_SECURITY_CREDENTIAL` (RSA-encrypted)
- `DARAJA_ENV` (sandbox|production)
- `REPLIT_DEV_DOMAIN` is used to auto-build callback URLs in dev
