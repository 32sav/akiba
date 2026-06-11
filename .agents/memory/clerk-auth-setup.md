---
name: Clerk Auth Setup
description: How Clerk auth is wired into Akiba (api-server + akiba vite app)
---

## Setup done
- `setupClerkWhitelabelAuth()` provisioned; secrets: CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY
- Server: `clerkProxyMiddleware` + `clerkMiddleware` added to `app.ts` before routes
- Client: `@clerk/react` + `@clerk/themes` installed in `@workspace/akiba`

## Tailwind v4 Clerk integration rules
**Rule:** Must add `@layer theme, base, clerk, components, utilities;` BEFORE `@import "tailwindcss"` in index.css, and import `@clerk/themes/shadcn.css` after tailwindcss.
**Rule:** Must set `tailwindcss({ optimize: false })` in vite.config.ts — without this, nested @layer imports break in prod builds.

**Why:** Tailwind v4 reorders `@layer` imports via lightningcss optimization, causing Clerk UI to render correctly in dev but broken in prod.

## Routing pattern
- `/` → HomeRedirect: signed-in → `/dashboard`, signed-out → Landing page
- `/sign-in/*?` and `/sign-up/*?` → Clerk Sign-In/Up pages (full path wildcard required)
- `/dashboard`, `/chamas`, `/chamas/:rest*` → DashboardGate (requires sign-in)
- Sign-in/up pages have a `position: absolute` dark green overlay on top of a background photo

## Sidebar
- Uses `useClerk` for signOut and `useUser` for user display name/avatar
- Shows real user photo from Clerk if available; initials fallback otherwise
