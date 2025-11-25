# Quick Start: Grok Integration

## ⚠️ REQUIRED: Add Your API Key

Before testing, you MUST add your xAI API key:

### Local Development

1. Create `.env.local` in the project root:

```bash
XAI_API_KEY=your_xai_api_key_here
FMP_API_KEY=your_existing_fmp_key
```

2. Restart your dev server:

```bash
npm run dev
```

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add: `XAI_API_KEY` = `your_xai_api_key_here`
4. Redeploy your app

## Getting Your xAI API Key

1. Visit https://console.x.ai/
2. Sign up or log in
3. Generate a new API key
4. Copy the key (you won't see it again!)

## Testing the Integration

Once your API key is set:

1. **Navigate to your portfolio** - Generate a portfolio first
2. **Click "Discover Stock Picks"** tab
3. **Click "Deep Dive Stock Picks with AI Reasoning"**

You should see:

### Stage 1 (2-3 seconds):
- ⚡ **Market Snapshot** appears with:
  - S&P 500 price
  - Fear & Greed Index (circular gauge)
  - Market context summary

### Stage 2 (10-15 seconds):
- 📊 **Stock recommendations** stream in
- Watch the JSON stream in the terminal
- Recommendations appear as they generate

### Stage 3 (3-5 seconds):
- 💬 **X Pulse sections** appear below each stock
- Shows 2-3 trending X posts per ticker
- Color-coded sentiment indicators

## Troubleshooting

### "API configuration missing"
- XAI_API_KEY not set
- Check `.env.local` or Vercel environment variables

### "Failed to generate recommendations"
- Check XAI_API_KEY is valid
- Verify you have API access at https://console.x.ai/
- Check browser console for detailed error

### Stage 1 loads but Stage 2 fails
- Check your Grok API quota
- Verify API key has necessary permissions
- Try again (queue system may be full)

### X posts don't appear
- This is optional - Stage 3 fails silently
- Check if Grok has X data access
- Recommendations still work without X posts

## What You'll See

### Before (Claude):
- Single API call
- Market context from FMP only
- No social sentiment
- No Fear & Greed visualization

### After (Grok):
- Three progressive stages
- Real-time Fear & Greed Index
- X sentiment analysis per stock
- Enhanced market intelligence
- Faster perceived performance (progressive loading)

## Model Information

- **Model**: `grok-2-1212`
- **Endpoint**: `https://api.x.ai/v1/chat/completions`
- **Format**: OpenAI-compatible
- **Streaming**: Yes (SSE format)

## Cost Considerations

Monitor your xAI usage at https://console.x.ai/:
- **Stage 1**: ~100-200 tokens (Fear & Greed + context)
- **Stage 2**: ~3000-4000 tokens (full recommendations)
- **Stage 3**: ~500-1000 tokens per request (X posts)

Total per user request: ~4000-5500 tokens

Compare with your pricing tier to estimate costs.

## Support

For issues:
1. Check this guide first
2. Review `/GROK_INTEGRATION_COMPLETE.md` for technical details
3. Check browser console and terminal logs
4. Verify API key at https://console.x.ai/

## Success Indicators

✅ Market Snapshot displays with live data
✅ Fear & Greed gauge shows current index
✅ Stock recommendations stream smoothly
✅ X Pulse sections show relevant posts
✅ Sentiment indicators are color-coded
✅ No console errors

Enjoy your Grok-powered portfolio advisor! 🚀

