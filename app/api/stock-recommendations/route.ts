import { NextRequest, NextResponse } from "next/server";
import { callGrokStreaming } from "@/app/lib/grokClient";
import { 
  getComprehensiveMarketContext,
  getEconomicCalendar,
  getInsiderTradingSignals,
  getGeneralMarketNews,
  getEarningsCalendar
} from "@/app/lib/financialData";
import { requestQueue } from "@/app/lib/requestQueue";
import { getSectorFilesToLoad, formatSectorDataForClaude } from "@/app/lib/sectorMapper";
import { loadMultipleSectors } from "@/app/lib/fundamentalsStorage";

// Stage 2: Stock Recommendations API
// Using Grok for comprehensive market analysis and stock recommendations
// Grok has access to real-time X data and market information

const XAI_API_KEY = process.env.XAI_API_KEY;

interface DetailedRecommendationsRequest {
  portfolio: Array<{ name: string; value: number; color: string; breakdown?: string }>;
  formData: {
    age: string;
    risk: number;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  };
  marketContext?: {
    sp500: { price: number; change: number };
    fearGreed: { value: number; label: string };
    contextSummary: string;
  };
}

export async function POST(request: NextRequest) {
  let body: DetailedRecommendationsRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { portfolio, formData, marketContext } = body;

  // Check queue status and add to queue if needed
  const queueResponse = await requestQueue.addToQueue();
  
  if (queueResponse.status === 'queued') {
    console.log(`[Stock Recommendations] Request queued - ${queueResponse.message}`);
    return NextResponse.json({
      queued: true,
      position: queueResponse.position,
      estimatedWait: queueResponse.estimatedWait,
      message: queueResponse.message,
    });
  }

  console.log('[Stock Recommendations] Processing request immediately');

  try {
    if (!portfolio || !formData) {
      requestQueue.releaseSlot();
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If no API key, return error (no fallback for this feature)
    if (!XAI_API_KEY) {
      console.warn("XAI_API_KEY not set");
      return NextResponse.json(
        { error: "API configuration missing. Please contact support." },
        { status: 503 }
      );
    }

    // Construct portfolio summary
    const portfolioSummary = portfolio
      .map((item) => `${item.name}: ${item.value}%${item.breakdown ? ` (${item.breakdown})` : ""}`)
      .join("\n");

    // Fetch live market data and intelligence for comprehensive context
    let comprehensiveMarketContext = "";
    let economicCalendar = "";
    let insiderSignals = "";
    let marketNews = "";
    let earningsCalendar = "";
    
    try {
      const [
        baseMarketContext,
        economicEvents,
        insiderTrades,
        news,
        earnings
      ] = await Promise.all([
        getComprehensiveMarketContext(),
        getEconomicCalendar(),
        getInsiderTradingSignals(),
        getGeneralMarketNews(10), // Limit to 10 top stories
        getEarningsCalendar()
      ]);
      
      comprehensiveMarketContext = baseMarketContext;
      
      // Format economic calendar
      if (economicEvents.length > 0) {
        economicCalendar = `\n**UPCOMING ECONOMIC EVENTS (Next 7 Days):**\n`;
        economicCalendar += economicEvents.slice(0, 5).map(event => 
          `- ${new Date(event.date).toLocaleDateString()}: ${event.event} (${event.country}) - ${event.impact} Impact${event.estimate ? ` | Est: ${event.estimate}` : ''}`
        ).join('\n');
      }
      
      // Format insider trading signals (focus on significant buys)
      if (insiderTrades.length > 0) {
        const significantBuys = insiderTrades
          .filter(trade => 
            trade.acquistionOrDisposition === 'A' && // Acquisition (buy)
            trade.securitiesTransacted > 10000 && // Significant amount
            trade.price > 0
          )
          .slice(0, 10);
        
        if (significantBuys.length > 0) {
          insiderSignals = `\n**RECENT INSIDER BUYING SIGNALS (Bullish):**\n`;
          insiderSignals += significantBuys.map(trade => {
            const value = (trade.securitiesTransacted * trade.price / 1000000).toFixed(2);
            return `- ${trade.symbol}: ${trade.reportingName} bought ${trade.securitiesTransacted.toLocaleString()} shares @ $${trade.price.toFixed(2)} (~$${value}M) on ${new Date(trade.transactionDate).toLocaleDateString()}`;
          }).join('\n');
        }
      }
      
      // Format market news (top headlines only)
      if (news.length > 0) {
        marketNews = `\n**RECENT MARKET NEWS (Last 24 Hours):**\n`;
        marketNews += news.slice(0, 5).map(article => 
          `- ${article.title} (${article.site})`
        ).join('\n');
      }
      
      // Format upcoming earnings (next week)
      if (earnings.length > 0) {
        const nextWeekEarnings = earnings.filter(e => {
          const earningsDate = new Date(e.date);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return earningsDate <= weekFromNow;
        }).slice(0, 15);
        
        if (nextWeekEarnings.length > 0) {
          earningsCalendar = `\n**UPCOMING EARNINGS (Next 7 Days - Potential Volatility):**\n`;
          earningsCalendar += nextWeekEarnings.map(e => 
            `- ${e.symbol}: ${new Date(e.date).toLocaleDateString()} ${e.time}${e.epsEstimated ? ` | EPS Est: $${e.epsEstimated}` : ''}`
          ).join('\n');
        }
      }
      
      console.log("Successfully fetched comprehensive market intelligence from FMP API");
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      requestQueue.releaseSlot();
      return NextResponse.json(
        { error: "Market data temporarily unavailable. Please try again in a few moments." },
        { status: 503 }
      );
    }

    // Load fundamentals data for relevant sectors
    let fundamentalsData = "";
    try {
      console.log('[Stock Recommendations] Loading fundamentals data for portfolio sectors...');
      const sectorFiles = getSectorFilesToLoad(portfolio);
      const sectorsData = loadMultipleSectors(sectorFiles);
      
      if (Object.keys(sectorsData).length > 0) {
        fundamentalsData = '\n' + formatSectorDataForClaude(sectorsData);
        console.log(`[Stock Recommendations] Loaded fundamentals for ${Object.keys(sectorsData).length} sectors`);
      } else {
        console.warn('[Stock Recommendations] No fundamentals data available');
      }
    } catch (error) {
      console.error('[Stock Recommendations] Error loading fundamentals:', error);
      // Continue without fundamentals data - Grok will work with market data only
    }

    // Include market context from Stage 1 if provided
    let stage1Context = "";
    if (marketContext) {
      stage1Context = `\n**MARKET CONTEXT FROM STAGE 1:**
- S&P 500: $${marketContext.sp500.price.toFixed(2)} (${marketContext.sp500.change > 0 ? '+' : ''}${marketContext.sp500.change.toFixed(2)}%)
- Fear & Greed Index: ${marketContext.fearGreed.value} (${marketContext.fearGreed.label})
- Summary: ${marketContext.contextSummary}\n`;
    }

    // Build detailed prompt for Grok
    const prompt = `You are an expert financial analyst with deep knowledge of global markets, macroeconomics, Federal Reserve policy, technical analysis, and sector rotation strategies. You have access to real-time X (Twitter) data and current market information. Provide detailed investment recommendations for each asset class in the user's portfolio.

**User Profile:**
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}

**Risk Tolerance Scale Interpretation:**
The client's risk score is ${formData.risk}/100. Interpret as follows:

- **0-20 (Ultra Conservative)**: Prioritize capital preservation. Stocks: beta <0.7, mature companies, dividend aristocrats. Minimal crypto/commodities.
- **21-40 (Conservative)**: Focus on stability with modest growth. Stocks: beta 0.7-1.0, established companies, defensive sectors.
- **41-60 (Balanced)**: Mix of growth and stability. Stocks: beta 0.9-1.3, mix of value and growth, diversified sectors.
- **61-80 (Growth-Oriented)**: Favor growth over stability. Stocks: beta 1.2-1.8, growth companies, leading sectors, small-cap opportunities.
- **81-100 (Maximum Aggression)**: Maximize growth potential. Stocks: beta >1.5, high-growth companies, emerging sectors, small/mid-caps, leveraged positions. DO NOT hold back - client wants MAXIMUM risk and return potential.

**CRITICAL FOR HIGH RISK (80-100)**: At this level, the client explicitly wants aggressive growth:
- Prioritize high-beta stocks (>1.5) and small/mid-cap growth opportunities
- Include momentum plays and emerging sector leaders
- Larger crypto allocation (15-25% if applicable)
- Minimize or eliminate bonds/cash
- Position sizes should favor "Large" for highest-conviction growth picks

**Portfolio Allocation:**
${portfolioSummary}
${stage1Context}
${comprehensiveMarketContext}
${economicCalendar}
${insiderSignals}
${marketNews}
${earningsCalendar}
${fundamentalsData}

${formData.sectors.length > 0 ? `**CRITICAL - Sector Conviction Priority:**
User's conviction sectors are ${formData.sectors.join(", ")}. Prioritize these sectors with LARGER position sizes (favor "Large" sizes) and dedicate the majority of Equities recommendations to them. Include 2-3 small/mid-cap rising stars if risk profile allows.
` : ''}
**⚠️ CRITICAL - DATA SOURCE REQUIREMENTS:**
The LIVE MARKET DATA section above contains REAL-TIME market indicators and sector performance. You MUST:
- Use market indices (S&P 500, VIX, etc.) and sector performance from the LIVE MARKET DATA section
- Use commodity/crypto prices from the LIVE MARKET DATA section (e.g., "Gold: $4,125.50")
- COMPLETELY IGNORE all market data from your training cutoff - it is outdated and incorrect
- For INDIVIDUAL STOCKS: Do NOT reference specific prices in rationales - prices will be displayed separately in the UI
- If recommending based on overbought/oversold conditions, use the actual RSI values shown in the live data
- Base sector recommendations on the actual leading/lagging sectors shown in the live performance data

**MANDATORY DATA USAGE CHECKLIST:**
For EVERY stock recommendation, you MUST verify and cite:
✓ Beta value from fundamentals (ensure it matches risk profile ${formData.risk}/100)
✓ Valuation metrics (P/E, P/S, etc.) from fundamentals
✓ Revenue/earnings growth from fundamentals
✓ Sector performance from live market data
✓ At least ONE catalyst: insider buying, news mention, earnings proximity, or technical signal

If a data point is missing from the provided data, acknowledge it briefly (e.g., "Beta: N/A") but don't make assumptions or use training data.

**Analysis Framework:**
Use the actual current market conditions and intelligence from ALL sections above:
- Use current S&P 500, VIX, and volatility levels to assess market risk
- Consider actual sector performance (leading/lagging sectors) when making recommendations
- Factor in current Fed funds rate and yield curve for bond recommendations
- Use RSI and technical indicators to identify overbought/oversold conditions
- Adjust for current market cycle stage (bull/bear/correction/consolidation)
- Consider macroeconomic conditions (GDP, inflation, employment) shown in the data
- **LEVERAGE INSIDER SIGNALS:** Stocks with significant insider buying (>$1M purchases) indicate strong management confidence - favor these in your recommendations
- **CONSIDER UPCOMING CATALYSTS:** Reference the economic calendar and earnings schedule
- **INCORPORATE MARKET NEWS:** Use recent news headlines to identify trending themes, sectors getting attention, and potential risks
- **LEVERAGE X DATA:** Use your access to X (Twitter) to identify trending stocks, sentiment shifts, and emerging narratives
- For high-risk profiles and younger investors, include smaller market cap opportunities with 30%+ YoY growth and strong institutional buying
- **USE REVENUE GROWTH DATA:** The fundamentals include YoY revenue growth percentages - favor stocks with strong growth (>15% for growth stocks, >5% for value stocks)
- **CITE SPECIFIC SIGNALS:** When recommending a stock, note ONLY significant/relevant factors/data, mention if insiders are buying, if there's positive news momentum, if it's in a leading sector, and cite revenue growth for growth-oriented picks

**Stock Selection by Beta (STRICT FILTERING):**
The fundamentals data above includes ACTUAL BETA VALUES for each stock. Based on risk score ${formData.risk}/100, you MUST filter stocks as follows:

- **0-30**: ONLY stocks with beta 0.4-0.9 (defensive, low volatility)
- **31-50**: ONLY stocks with beta 0.8-1.2 (market-like, moderate volatility)
- **51-70**: Favor stocks with beta 1.0-1.5 (moderate growth, moderate amplification)
- **71-90**: Favor stocks with beta 1.3-2.0 (high growth, strong amplification)
- **91-100**: MAXIMIZE beta - Prioritize stocks with beta >2.5, favor >3.0 if available (maximum aggression, extreme amplification)

Use the ACTUAL beta values from fundamentals data to assess this. This is non-negotiable. If beta data is missing for a stock, acknowledge it but prefer stocks with known beta values that match the risk profile.

**COMMODITIES ASSET CLASS - MANDATORY TICKER FORMAT:**
For the Commodities section, you MUST use commodity ETF tickers, NOT commodity names:
- Use GLD (SPDR Gold Shares) for gold exposure
- Use SLV (iShares Silver Trust) for silver exposure  
- Use IAU (iShares Gold Trust) as alternative gold exposure
- Use SGOL (Aberdeen Physical Gold Shares) as another gold option
- Use PPLT (Aberdeen Physical Platinum Shares) for platinum
- Use PALL (Aberdeen Physical Palladium Shares) for palladium
- Use DBA (Invesco DB Agriculture Fund) for agriculture
- Use USO (United States Oil Fund) for oil
DO NOT use "GOLD", "SILVER", "OIL" as tickers - these will not display correct prices.

**CRYPTOCURRENCIES ASSET CLASS - MANDATORY TICKER FORMAT:**
For the Cryptocurrencies section, use these exact ticker symbols:
- BTC for Bitcoin
- ETH for Ethereum
- SOL for Solana
- XMR for Monero
- LINK for Chainlink
- ADA for Cardano
These are the ONLY cryptocurrencies you may recommend. Do not recommend crypto-related stocks (like MSTR, MARA, RIOT) in this section - those belong in Equities.

**CASH ASSET CLASS - MONEY MARKET FUND RECOMMENDATIONS:**
For the Cash section, recommend money market funds based on current Fed funds rate (shown in market data above):
- VMMXX (Vanguard Prime Money Market Fund) - Vanguard's flagship money market
- SPAXX (Fidelity Government Money Market Fund) - Fidelity's default sweep
- SWVXX (Schwab Value Advantage Money Market Fund) - Schwab's premium option
- VMFXX (Vanguard Federal Money Market Fund) - Government-backed safety
- SPRXX (Fidelity Money Market Fund) - Higher yield option
Explain current yield expectations based on Fed funds rate. Money market funds typically yield close to the Fed funds rate minus a small spread.

**Response Format (JSON only, no markdown formatting):**
{
  "Equities": {
    "recommendations": [
      {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "personalizedFit": "Given your ${formData.age} age and ${formData.horizon} time horizon, Apple aligns well with your ${formData.risk}/100 risk tolerance. With your $${formData.capital} portfolio focused on ${formData.goal}, this established tech leader provides the right balance of growth potential and stability. Its beta of 1.15 matches your risk profile while offering exposure to the AI revolution you're seeking in ${formData.sectors.includes('Technology') || formData.sectors.includes('AI') ? 'your preferred tech sector' : 'high-growth sectors'}.",
        "positionSize": "Large",
        "riskLevel": "Moderate"
      }
    ],
    "breakdown": [
      { "name": "AAPL", "value": 22, "color": "#A78BFA" },
      { "name": "MSFT", "value": 20, "color": "#60A5FA" }
    ]
  },
  "Bonds": { "recommendations": [...], "breakdown": [...] },
  "Commodities": { "recommendations": [...], "breakdown": [...] },
  "Real Estate": { "recommendations": [...], "breakdown": [...] },
  "Cryptocurrencies": { "recommendations": [...], "breakdown": [...] },
  "Cash": { "recommendations": [...], "breakdown": [...] },
  "marketContext": "Synthesize ALL the market data, news, insider signals, and upcoming events above into 3-5 sentences describing current conditions, sentiment, and key catalysts/risks to watch"
}

**Guidelines:**
- Provide 3-5 recommendations per asset class (5-7 for Equities)
- Each personalizedFit MUST explain in 2-3 conversational sentences why THIS SPECIFIC STOCK fits the user's unique situation:
  * Reference their age (${formData.age}) and time horizon (${formData.horizon})
  * Explain how the stock's risk profile (beta, volatility) matches their ${formData.risk}/100 risk tolerance
  * Connect to their investment capital ($${formData.capital}) and goal (${formData.goal})
  * Mention alignment with their sector preferences if applicable (${formData.sectors.join(', ')})
  * Make it personal and conversational - directly address why this fits THEIR situation
- **DO NOT include technical jargon, just explain the fit in plain language**
- **DO NOT include stock prices** - they will be fetched and displayed separately in real-time
- Position sizes: Large (25-35%), Medium (15-25%), Small (5-15%)
- Risk levels: Based on volatility, beta, drawdown history, and upcoming catalysts
- Breakdown percentages must sum to 100 per asset class
- Use varied hex colors for visualization
- marketContext: Synthesize ALL intelligence (market data, news, insiders, economic/earnings calendars) into 3-5 sentences
- Match investment style to age/horizon (growth for young, income for older)
- Use the fundamentals data and market intelligence to ensure recommendations truly fit the user's profile`;

    console.log("Calling Grok for detailed recommendations with streaming...");

    // Call Grok with streaming
    const grokStream = await callGrokStreaming(prompt);
    
    // Process Grok's SSE stream and convert to text stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = grokStream.getReader();
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              requestQueue.releaseSlot();
              break;
            }
            
            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process SSE format (data: {...}\n\n)
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); // Remove 'data: ' prefix
                
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const text = parsed.choices[0].delta.content;
                    controller.enqueue(encoder.encode(text));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          requestQueue.releaseSlot();
          controller.error(error);
        }
      },
    });

    console.log("Streaming response started");

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Error generating stock recommendations:", error);
    
    // Release queue slot on error
    requestQueue.releaseSlot();
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to generate recommendations: ${error?.message || 'Unknown error'}`
      : "Failed to generate recommendations. Please try again.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

