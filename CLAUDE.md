# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Generate Prisma client + build (prisma generate && next build)
npm run start        # Start production server
npm run lint         # Run ESLint
```

There are no test commands configured.

To run database migrations: `npx prisma migrate dev` (uses `DATABASE_URL_UNPOOLED` for direct connections).

## Architecture Overview

**Diversonal** is an AI-powered portfolio optimization platform built with Next.js 15 App Router. Users input their investment profile and the app generates AI-driven asset allocations, stock recommendations, and market analysis.

### Core User Flows

1. **Portfolio Creation** (`/develop`) — User inputs age, risk tolerance, time horizon, capital, goals, and sector preferences → AI generates allocation across 6 asset classes (Equities, Bonds, Commodities, Real Estate, Crypto, Cash) with per-ticker stock recommendations
2. **Market Intelligence** (`/markets`) — Real-time market data dashboard with economic indicators, sentiment, and sector performance
3. **Agent Opti Chat** — Conversational AI interface for portfolio queries and market analysis
4. **Portfolio Management** (`/my-portfolios`) — Save, load, and restore full portfolio state including chat history and stock data

### AI Layer

- **Primary**: xAI Grok via OpenAI-compatible endpoint (`app/lib/grokClient.ts`)
- **Fallback**: OpenAI GPT-4 (`OPENAI_API_KEY`)
- **Legacy**: Anthropic Claude (`ANTHROPIC_API_KEY`)
- AI calls happen server-side in API routes; portfolio generation uses structured JSON prompts with market context injected

### Data Layer

- **Database**: PostgreSQL via Neon serverless (`@neondatabase/serverless`)
- **ORM**: Prisma 6 — used for migrations/schema; many routes use raw Neon SQL directly via `app/lib/db.ts`
- **Market Data**: Financial Modeling Prep (FMP) API — real-time quotes, fundamentals, economic indicators
- **Caching**: In-memory TTL cache + per-session cache (`app/lib/sessionCache.ts`) to avoid redundant FMP API calls

### Auth

NextAuth.js v5 configured in `auth.ts` (root). Dual providers: Google OAuth and email/password credentials (bcryptjs hashing). JWT sessions with 30-day expiry. Protect server routes with `const session = await auth()`.

### Key Files

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth config (providers, callbacks, JWT) |
| `prisma/schema.prisma` | DB schema: User, Portfolio, Chat, ChatMessage |
| `app/lib/db.ts` | Neon SQL client (lazy-initialized) |
| `app/lib/grokClient.ts` | Grok API wrapper (OpenAI-compatible) |
| `app/lib/financialData.ts` | FMP API integration and market data utilities |
| `app/lib/fetchStockFundamentals.ts` | Per-ticker fundamentals fetching |
| `app/lib/sessionCache.ts` | Request-level caching |
| `app/api/portfolio/route.ts` | Main AI portfolio generation endpoint |
| `app/api/agent-opti/` | Conversational AI chat endpoints |
| `app/api/chats/` | Chat CRUD endpoints |

### Environment Variables Required

```
DATABASE_URL              # Neon pooled connection
DATABASE_URL_UNPOOLED     # Neon direct connection (Prisma migrations)
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
XAI_API_KEY               # xAI Grok (primary AI)
OPENAI_API_KEY            # OpenAI fallback
ANTHROPIC_API_KEY         # Anthropic fallback
FMP_API_KEY               # Financial Modeling Prep
ALPACA_API_KEY            # Alpaca Markets (optional)
```

### Styling

Tailwind CSS v4 with PostCSS. No component library — custom UI throughout. Charts use `lightweight-charts` (interactive candlestick/line) and `recharts` (static allocation charts).

### Portfolio State Persistence

The `Portfolio` model stores complete UI state as JSON fields: `portfolioData`, `stockData`, `marketContext`, `allocationChatHistory`, `stockModalCache`, and `activeTab`. This enables full session restore when loading a saved portfolio. The `isManuallySaved` flag distinguishes explicit saves from auto-saved history entries.
