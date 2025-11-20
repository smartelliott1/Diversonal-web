import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

// Using Claude Sonnet 4 for comprehensive market analysis and stock recommendations
// Claude excels at following detailed instructions and structured analysis
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface DetailedRecommendationsRequest {
  portfolio: Array<{ name: string; value: number; color: string; breakdown?: string }>;
  formData: {
    age: string;
    risk: string;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  };
}

interface StockRecommendation {
  ticker: string;
  name: string;
  rationale: string;
  positionSize: "Large" | "Medium" | "Small";
  riskLevel: "Low" | "Moderate" | "High";
}

interface AssetClassRecommendations {
  recommendations: StockRecommendation[];
  breakdown: Array<{ name: string; value: number; color: string }>;
}

interface DetailedRecommendationsResponse {
  [assetClass: string]: AssetClassRecommendations | string;
  marketContext: string;
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

  const { portfolio, formData } = body;

  // Check queue status and add to queue if needed
  const queueResponse = await requestQueue.addToQueue();
  
  if (queueResponse.status === 'queued') {
    console.log(`[Recommendations] Request queued - ${queueResponse.message}`);
    return NextResponse.json({
      queued: true,
      position: queueResponse.position,
      estimatedWait: queueResponse.estimatedWait,
      message: queueResponse.message,
    });
  }

  console.log('[Recommendations] Processing request immediately');

  try {
    if (!portfolio || !formData) {
      requestQueue.releaseSlot();
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If no API key, return error (no fallback for this feature)
    if (!ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set");
      return NextResponse.json(
        { error: "API configuration missing. Please contact support." },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Construct portfolio summary
    const portfolioSummary = portfolio
      .map((item) => `${item.name}: ${item.value}%${item.breakdown ? ` (${item.breakdown})` : ""}`)
      .join("\n");

    // Fetch live market data and intelligence for comprehensive context
    let marketContext = "";
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
      
      marketContext = baseMarketContext;
      
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
      console.log("=== MARKET CONTEXT BEING SENT TO CLAUDE ===");
      console.log(marketContext);
      console.log(economicCalendar);
      console.log(insiderSignals);
      console.log(marketNews);
      console.log(earningsCalendar);
      console.log("=== END MARKET CONTEXT ===");
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
      console.log('[Recommendations] Loading fundamentals data for portfolio sectors...');
      const sectorFiles = getSectorFilesToLoad(portfolio);
      const sectorsData = loadMultipleSectors(sectorFiles);
      
      if (Object.keys(sectorsData).length > 0) {
        fundamentalsData = '\n' + formatSectorDataForClaude(sectorsData);
        console.log(`[Recommendations] Loaded fundamentals for ${Object.keys(sectorsData).length} sectors`);
      } else {
        console.warn('[Recommendations] No fundamentals data available');
      }
    } catch (error) {
      console.error('[Recommendations] Error loading fundamentals:', error);
      // Continue without fundamentals data - Claude will work with market data only
    }

    // Build detailed prompt
    const prompt = `You are an expert financial analyst with deep knowledge of global markets, macroeconomics, Federal Reserve policy, technical analysis, and sector rotation strategies. Provide detailed investment recommendations for each asset class in the user's portfolio.

**User Profile:**
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}

**Portfolio Allocation:**
${portfolioSummary}

${marketContext}
${economicCalendar}
${insiderSignals}
${marketNews}
${earningsCalendar}
${fundamentalsData}

${formData.sectors.length > 0 ? `**CRITICAL - Sector Conviction Priority:**
User's conviction sectors are ${formData.sectors.join(", ")}. Prioritize these sectors with LARGER position sizes (favor "Large" sizes) and dedicate the majority of Equities recommendations to them. Include 2-3 small/mid-cap rising stars if risk profile allows.
` : ''}
**⚠️ CRITICAL - DATA SOURCE REQUIREMENTS:**
The LIVE MARKET DATA section above contains REAL-TIME prices and indicators as of today. You MUST:
- Use ONLY the prices, indicators, and data shown in the LIVE MARKET DATA section above
- COMPLETELY IGNORE all prices and market data from your training cutoff - they are outdated and incorrect
- When recommending ANY asset (stocks, commodities, bonds, crypto, etc.), reference the EXACT current price from the live data
- Example: If live data shows "Gold: $4,125.50 (+2.3%)", you must use $4,125.50 in your analysis, NOT any training data price
- If recommending based on overbought/oversold conditions, use the actual RSI values shown in the live data
- Base sector recommendations on the actual leading/lagging sectors shown in the live performance data

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
- For high-risk profiles and younger investors, include smaller market cap opportunities with 30%+ YoY growth and strong institutional buying
- **CITE SPECIFIC SIGNALS:** When recommending a stock, note ONLY significant/relevant factors/data, mention if insiders are buying, if there's positive news momentum, or if it's in a leading sector

**Beta-Based Stock Selection (CRITICAL):**
Based on risk tolerance, prioritize stocks with appropriate beta levels:

- **Low Risk**: Focus on defensive stocks with beta <0.8 (e.g., ORCL 0.77, XOM 0.38, LLY 0.39, CME 0.30). These provide stability and lower volatility.

- **Moderate Risk**: Favor balanced stocks with beta 0.8-1.5 (e.g., GOOGL 1.08, MSFT 1.1, JPM 1.1). These track the market with moderate amplification.

- **High Risk**: Prioritize high-beta stocks with beta >1.5 (e.g., TSLA 1.87, SHOP 2.8, SOFI 1.94, MARA 5.4). These amplify market movements for aggressive growth.

Include beta values in your rationales and ensure stock selections align with the user's risk profile. Beta is available in the fundamentals data for each stock.

**Response Format (JSON only, no markdown formatting):**
{
  "Equities": {
    "recommendations": [
      {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "rationale": "Trading at $268.12 (+0.25% today). P/E 34.1x, below tech sector avg. Strong FCF $7.5/share. In leading Technology sector (+2.3% this week). Insiders bought $2.1M worth last week (bullish signal). Recent news: AI features driving services revenue. No earnings this week (low volatility risk).",
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
- Each rationale: 2-4 sentences with specific data points from the intelligence provided
- **REQUIRED CITATIONS IF RELEVANT:** For each stock, mention 1-2 of: current price, P/E ratio, sector performance, insider activity, recent news, or upcoming earnings
- Position sizes: Large (25-35%), Medium (15-25%), Small (5-15%)
- Risk levels: Based on volatility, beta, drawdown history, and upcoming catalysts
- Breakdown percentages must sum to 100 per asset class
- Use varied hex colors for visualization
- marketContext: Synthesize ALL intelligence (market data, news, insiders, economic/earnings calendars) into 3-5 sentences
- Match investment style to age/horizon (growth for young, income for older)
- Cite growth metrics for small/mid-caps (revenue %, institutional buying, momentum)
- **SIGNAL INTEGRATION:** Stocks with insider buying + positive news + strong sector = highest conviction recommendations`;

    console.log("Calling Claude Sonnet 4 for detailed recommendations with streaming...");

    // Create a streaming response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
          // Release queue slot after successful completion
          requestQueue.releaseSlot();
        } catch (error) {
          console.error("Streaming error:", error);
          // Release queue slot on error
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
    console.error("Error generating detailed recommendations:", error);
    
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

