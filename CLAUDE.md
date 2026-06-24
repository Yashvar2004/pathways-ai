# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pathways AI is a web-based learning platform where users research tech stacks/job profiles, access curated resources and AI-generated courses, take assessments, and earn certifications. Free tier with subscription upgrade via Stripe.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **UI:** shadcn/ui (Base UI primitives, NOT Radix)
- **Database:** Neon (serverless Postgres) + Drizzle ORM
- **Auth:** Auth.js v5 (next-auth@beta) with Resend email magic links
- **Payments:** Stripe subscriptions
- **Forms:** react-hook-form + zod

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build (type-checks + compiles)
npx drizzle-kit push    # Push schema changes to Neon DB
npx drizzle-kit studio  # Open Drizzle Studio (DB GUI)
npx tsx scripts/seed.ts # Seed demo data (topics, resources, courses, assessments)
```

## Architecture

### Route Structure

- `src/app/(marketing)/` — Public pages: landing (`/`), pricing (`/pricing`)
- `src/app/(auth)/` — Auth pages: login (`/login`), signup (`/signup`)
- `src/app/dashboard/` — Protected app pages (`/dashboard/*`)
- `src/app/api/` — API routes: auth handler, Stripe webhooks, assessment data
- `middleware.ts` — Auth.js middleware; protects `/dashboard/*` routes

### Key Patterns

- **Server Actions** (`src/features/*/actions.ts`): All mutations use `"use server"` functions. Quota checks and DB writes happen server-side.
- **Database queries** (`src/features/*/queries.ts`): Read operations using Drizzle's query API with relations.
- **shadcn/ui (Base UI):** Components use `render` prop for polymorphism, NOT `asChild`. E.g., `<Button render={<Link href="/">Home</Link>} />` or use the `LinkButton` helper at `src/components/ui/link-button.tsx`.
- **Route groups** `(marketing)` and `(auth)` share the root layout but have separate sub-layouts. Dashboard is an actual path segment, not a route group.
- **Session access:** Server components use `const session = await auth()`. Client components use `useSession()` from next-auth/react (requires `SessionProvider`).

### Database

- Schema: `src/lib/db/schema.ts` — Tables + Drizzle relations
- Client: `src/lib/db/index.ts` — Neon HTTP driver
- Free tier limits: `FREE_SEARCH_LIMIT = 10`, `FREE_CERTIFICATION_LIMIT = 1` in `src/lib/constants.ts`
- Usage tracked in `userUsage` table, atomic UPSERT increments
- Subscribed users bypass all limits

### Free Tier Logic

- Checked in `src/features/billing/queries.ts` via `checkSearchQuota()` and `checkCertificationQuota()`
- Searches: counted per month, reset on period expiry
- Certifications: lifetime counter, first one always free
- Enforcement points: inside search server action and certification claim action

### Stripe

- Client: `src/lib/stripe.ts`
- Webhooks: `src/app/api/stripe/webhooks/route.ts` — handles checkout.session.completed, invoice.paid, customer.subscription.updated/deleted
- Idempotency via `stripeEvents` table

## AI Integration

- **Primary provider:** Groq (Llama 3.3 70B, ~800 tok/s, free tier)
- **Fallback provider:** Google Gemini (gemini-2.0-flash, free tier)
- **Provider service:** `src/lib/ai/providers.ts` — unified `generateText()` and `generateStream()` with automatic fallback
- **Prompt templates:** `src/lib/ai/prompts.ts` — research, course content, quiz generation prompts
- **Research API:** `POST /api/research` — streams AI-generated research via SSE, caches results in `research_cache` table
- **Course generation API:** `POST /api/courses/generate` — generates 5 courses with modules, assessments, certifications
- **Streaming UI:** `src/components/search/research-stream.tsx` — client component for progressive markdown rendering

## Environment Variables

See `.env.local` for all required variables: DATABASE_URL, AUTH_SECRET, AUTH_RESEND_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_PRO_PRICE_ID, NEXT_PUBLIC_APP_URL, GROQ_API_KEY, GOOGLE_AI_API_KEY
