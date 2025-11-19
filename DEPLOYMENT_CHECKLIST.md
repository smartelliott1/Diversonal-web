# Deployment Checklist - Fundamentals System

## ✅ What Was Built

### Backend (Complete)
- [x] 60-stock curated list with sector assignments
- [x] Rate limiter (250 calls/min with token bucket)
- [x] FMP fundamentals fetcher (6 endpoints per stock)
- [x] Sector-based storage system (JSON files)
- [x] Sector mapper (portfolio → relevant data)
- [x] Request queue (handles 3-4 concurrent users)
- [x] Cron job route (`/api/cron/fetch-fundamentals`)
- [x] Queue status route (`/api/queue-status`)
- [x] Updated recommendations API with queue + fundamentals

### Frontend (Complete)
- [x] Queue UI (shows position & wait time)
- [x] Handles streaming responses
- [x] Shows friendly messages when queued

### Configuration (Complete)
- [x] `vercel.json` with cron schedule (3 AM Central)
- [x] Configuration files with all settings
- [x] Environment variable structure

## 🚀 Deployment Steps

### 1. Set Environment Variables

Create `.env.local` in project root:

```bash
# Copy from .env.local.example
FMP_API_KEY=your_fmp_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Generate secure secret:
# On Mac/Linux: openssl rand -base64 32
# On Windows: use online generator
CRON_SECRET=your_secure_random_string_here
```

### 2. Test Locally (Optional)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000

# Test the system (cron won't run locally, but you can test the endpoint)
```

### 3. Deploy to Vercel

```bash
# Login to Vercel
npx vercel login

# Deploy
npx vercel --prod
```

### 4. Configure Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables (copy from `.env.local`):
   - `FMP_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `CRON_SECRET`
5. Make sure to set them for "Production" environment

### 5. Enable Fluid Compute

**CRITICAL** - Required for cron job to work:

1. Vercel Dashboard → Your Project
2. Settings → Functions
3. Toggle ON: "Fluid Compute"
4. This allows 300s timeout (needed for 1.44-minute job)

Without this, cron will timeout at 60s!

### 6. Verify Cron Job Configuration

1. Vercel Dashboard → Your Project
2. Settings → Cron Jobs
3. Should show:
   - Path: `/api/cron/fetch-fundamentals`
   - Schedule: `0 8 * * *` (8 AM UTC = 3 AM Central)
   - Status: Active

### 7. Test the Cron Job

Run manually to populate initial data:

```bash
# Get your deployed URL
YOUR_URL="https://your-app-name.vercel.app"

# Get your CRON_SECRET
YOUR_SECRET="your_cron_secret_here"

# Test the endpoint
curl -X GET "$YOUR_URL/api/cron/fetch-fundamentals" \
  -H "Authorization: Bearer $YOUR_SECRET"
```

Expected response (takes ~1-2 minutes):
```json
{
  "success": true,
  "stocksProcessed": 60,
  "successCount": 58,
  "errorCount": 2,
  "duration": "1.4s",
  "timestamp": "2025-11-20T..."
}
```

### 8. Verify Data Files

After cron runs, check these files exist:

```
https://your-app.vercel.app/data/fundamentals/latest/index.json
https://your-app.vercel.app/data/fundamentals/latest/technology.json
https://your-app.vercel.app/data/fundamentals/latest/healthcare.json
...etc
```

### 9. Test End-to-End

1. Go to your app: `https://your-app.vercel.app`
2. Generate a portfolio
3. Click "Deep Dive Stock Picks"
4. Should see real fundamentals data in recommendations

### 10. Monitor Logs

```bash
# Watch logs live
npx vercel logs --follow

# Or check in Vercel Dashboard → Project → Logs
```

## ⏰ Cron Schedule

- **Runs**: Every night at 3 AM Central (8 AM UTC)
- **Schedule**: `0 8 * * *`
- **Duration**: ~1.44 minutes
- **Day-of-week**: All days (7 days/week)

First run after deployment won't happen until the next scheduled time. **Run manually** (step 7) to populate data immediately.

## 📊 System Status Checks

### Is Cron Running?
```bash
# Check Vercel logs
npx vercel logs --grep "Cron"
```

### Is Queue Working?
```bash
curl https://your-app.vercel.app/api/queue-status
# Should return: {"processing":0,"queued":0,"capacity":3,"availableSlots":3}
```

### Is Fundamentals Data Fresh?
```bash
curl https://your-app.vercel.app/data/fundamentals/latest/index.json
# Check "lastUpdated" timestamp
```

## 🔧 Common Issues

### Issue: Cron job timeout
**Solution**: Enable Fluid Compute (Step 5)

### Issue: 401 Unauthorized on cron
**Solution**: Check `CRON_SECRET` matches in Vercel env vars

### Issue: No fundamentals data
**Solution**: Run cron manually (Step 7) to populate initial data

### Issue: Queue not working
**Solution**: Check Claude API key in Vercel env vars

### Issue: Sectors not loading
**Solution**: Ensure portfolio has sector breakdown like "Tech: 15%"

## 📝 Post-Deployment

### Monitor First Week
- Check cron runs successfully each night
- Monitor FMP API usage (should be ~360 calls/night)
- Check Claude API usage (should be 3-4 concurrent max)

### Optional: Set Up Alerts
- Vercel → Project → Settings → Integrations
- Add Slack/Discord/Email notifications for errors

## 🎉 Success Criteria

- [ ] Environment variables configured in Vercel
- [ ] Fluid Compute enabled
- [ ] Cron job shows as active in Vercel dashboard
- [ ] Manual cron test completes successfully
- [ ] Data files accessible at `/data/fundamentals/latest/`
- [ ] "Deep Dive Stock Picks" shows real fundamentals
- [ ] Queue system works (test with multiple users)
- [ ] No linter errors
- [ ] Logs show clean execution

## 📞 Need Help?

1. Check `FUNDAMENTALS_SYSTEM_README.md` for detailed docs
2. Review Vercel logs: `npx vercel logs`
3. Test individual endpoints manually
4. Verify all environment variables are set

---

**Ready to deploy!** Follow steps 1-9 above, then monitor the system. The cron will run automatically every night at 3 AM Central.

