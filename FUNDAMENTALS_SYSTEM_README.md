# Nightly Stock Fundamentals System

## Overview

This system pre-fetches fundamental data for 60 curated stocks every night and stores them in sector-based JSON files. When users request "Deep Dive Stock Picks", Claude receives real financial metrics (P/E ratios, revenue growth, margins, etc.) to make data-driven recommendations.

## Architecture

```
User Request → Queue Check → Load Sector Data → Send to Claude → Stream Response
                    ↓
            (if queued: show position)
```

**Nightly Cron Job (3 AM Central):**
- Fetches fundamentals for 60 stocks (6 API calls each = 360 total)
- Takes ~1.44 minutes (250 calls/minute with safety buffer)
- Stores data organized by 10 sectors
- Overwrites previous data (always keeps latest)

**Request Queue:**
- Handles 3-4 concurrent users (Claude API limit)
- Shows friendly queue messages for additional users
- Auto-releases slots after completion

## Files Created

### Core Libraries
- `app/lib/curatedStocks.json` - 60 stocks with sector assignments
- `app/lib/fundamentalsConfig.ts` - Configuration (rate limits, endpoints, mappings)
- `app/lib/fundamentalsRateLimit.ts` - Token bucket rate limiter (250/min)
- `app/lib/fetchStockFundamentals.ts` - Fetches 6 FMP endpoints per stock
- `app/lib/fundamentalsStorage.ts` - Saves/loads sector-based JSON files
- `app/lib/sectorMapper.ts` - Extracts sectors from portfolio, formats for Claude
- `app/lib/requestQueue.ts` - Manages concurrent user requests

### API Routes
- `app/api/cron/fetch-fundamentals/route.ts` - Main cron job (runs nightly)
- `app/api/queue-status/route.ts` - Queue status polling endpoint
- `app/api/detailed-recommendations/route.ts` - Updated with queue + fundamentals

### Configuration
- `vercel.json` - Cron schedule configuration
- `.env.local.example` - Environment variables template

## Setup Instructions

### 1. Environment Variables

Create `.env.local` with:

```bash
# Financial Modeling Prep API Key
FMP_API_KEY=your_fmp_api_key_here

# Anthropic API Key (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OpenAI API Key (portfolio generation)
OPENAI_API_KEY=your_openai_api_key_here

# Cron Secret (generate with: openssl rand -base64 32)
CRON_SECRET=your_secure_random_string_here
```

### 2. Enable Fluid Compute (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Functions" tab
3. Enable "Fluid Compute" (allows 300s timeout on Hobby plan)
4. Required for cron job to complete

### 3. Deploy to Vercel

```bash
# Deploy
vercel --prod

# Vercel will automatically configure the cron job from vercel.json
```

### 4. Configure Cron Authentication

1. Copy your `CRON_SECRET` from `.env.local`
2. In Vercel Dashboard → Project → Settings → Environment Variables
3. Add `CRON_SECRET` with your secret value

### 5. Test the Cron Job Manually

```bash
# Get your CRON_SECRET
echo $CRON_SECRET

# Test the endpoint
curl -X GET "https://your-app.vercel.app/api/cron/fetch-fundamentals" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "stocksProcessed": 60,
  "successCount": 58,
  "errorCount": 2,
  "duration": "1.4s",
  "timestamp": "2025-11-20T08:00:00Z"
}
```

### 6. Verify Data Storage

Check that files were created:
```
public/data/fundamentals/latest/
  ├── technology.json
  ├── healthcare.json
  ├── finance.json
  ├── quantum-computing.json
  ├── energy.json
  ├── blockchain.json
  ├── cryptocurrency.json
  ├── precious-metals.json
  ├── real-estate.json
  ├── aerospace.json
  └── index.json
```

## How It Works

### Nightly Fetch Process

1. **Cron triggers** at 3 AM Central (8 AM UTC)
2. **Loads** 60 stocks from `curatedStocks.json`
3. **Fetches** 5 endpoints per stock:
   - `/stable/profile` - Company info
   - `/stable/ratios` - Financial ratios
   - `/stable/key-metrics` - Valuation metrics
   - `/stable/income-statement` - Earnings data
   - `/stable/analyst-estimates` - Price targets
4. **Rate limits** to 250 calls/minute (with retries)
5. **Groups** by sector and saves to JSON files
6. **Overwrites** previous data

### User Request Flow

1. **User clicks** "Deep Dive Stock Picks"
2. **Queue check**: 
   - If < 3 concurrent users → Process immediately
   - If ≥ 3 users → Add to queue, show position
3. **Extract sectors** from portfolio allocation
4. **Load** relevant sector files (e.g., `technology.json`, `healthcare.json`)
5. **Format** fundamentals data for Claude's prompt
6. **Stream** Claude's response back to user
7. **Release** queue slot when done

### Sector Mapping

Portfolio breakdown → Sector files:
- "Tech stocks: 15%" → `technology.json`
- "Healthcare: 20%" → `healthcare.json`
- "Finance: 10%" → `finance.json`
- etc.

Claude receives only relevant sector data (not all 60 stocks).

## API Costs

### FMP API (Starter Tier: $14/month)
- **Nightly job**: 360 calls
- **Per week**: 2,520 calls
- **Per month**: ~10,800 calls
- **Well under** Starter tier limits

### Claude API (Tier 1)
- **Per request**: ~5-7K input tokens
- **Max concurrent**: 3-4 users
- **Rate limit**: 30K tokens/min input
- **Queue handles** overflow gracefully

## Monitoring

### Check Cron Job Logs
```bash
# Vercel CLI
vercel logs --follow
```

### Check Queue Status
```bash
curl https://your-app.vercel.app/api/queue-status
```

### Verify Latest Data
Open: `https://your-app.vercel.app/data/fundamentals/latest/index.json`

## Troubleshooting

### Cron Job Fails
- **Check**: `FMP_API_KEY` is set in Vercel environment
- **Check**: `CRON_SECRET` matches between `.env.local` and Vercel
- **Check**: Fluid Compute is enabled (300s timeout needed)

### Queue Not Working
- **Check**: Claude API key is valid
- **Check**: Rate limits not exceeded
- **Monitor**: `/api/queue-status` endpoint

### No Fundamentals Data
- **Check**: Cron job has run at least once
- **Check**: Files exist in `/public/data/fundamentals/latest/`
- **Run**: Manual test of cron endpoint

### Sectors Not Loading
- **Check**: Portfolio has sector breakdown (e.g., "Tech: 15%")
- **Check**: Sector names match `fundamentalsConfig.ts` mapping
- **Fallback**: System loads top 3 sectors by default

## Updating Stocks List

Edit `app/lib/curatedStocks.json`:

```json
[
  {"ticker": "AAPL", "sector": "Technology"},
  {"ticker": "GOOGL", "sector": "Technology"},
  ...
]
```

Deploy changes:
```bash
vercel --prod
```

Next cron run will fetch new stocks.

## Scaling

### To 150 stocks (future):
- **Math**: 150 × 6 = 900 calls = 3.6 minutes
- **Still fits** Hobby + Fluid Compute (300s)
- **Costs**: ~3,900 calls/week (still under limits)
- **Claude**: May need to upgrade tier for more tokens

### To 300+ stocks:
- **Requires**: Vercel Pro plan (longer timeouts)
- **Or**: Split into multiple cron jobs
- **Claude**: Definitely need higher tier

## Support

For issues or questions:
1. Check logs: `vercel logs`
2. Verify environment variables
3. Test cron endpoint manually
4. Check queue status

---

**System Status**: ✅ Ready to deploy
**Last Updated**: 2025-11-19

