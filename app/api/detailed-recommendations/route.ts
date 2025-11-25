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
    risk: number;
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

**MANDATORY DATA USAGE CHECKLIST:**
For EVERY stock recommendation, you MUST verify and cite:
✓ Current price from live data (not training data)
✓ Beta value from fundamentals (ensure it matches risk profile ${formData.risk}/100)
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



**Response Format (JSON only, no markdown formatting):**
{
  "Equities": {
    "recommendations": [
      {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "rationale": "Current price: $268.12 (+0.25%). Beta: 1.15 (matches risk profile ${formData.risk}/100). P/E: 34.1x vs sector avg 38x (value opportunity). Revenue growth: 12% YoY. Strong FCF $7.5B/quarter. Sector: Technology (+2.3% week, leading). Catalyst: Major insider buy $2.1M last week. News: AI features driving 18% services growth. Earnings: Not until next month (low volatility window).",
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
- Each rationale MUST include: current price, beta value with risk profile fit, key valuation metric (P/E, P/S, etc.), growth metric (revenue/earnings growth), and 1-2 catalysts from the intelligence data
- **REQUIRED STRUCTURE:** Follow the example format exactly - lead with price, cite beta and risk match, add valuation context, mention growth, reference sector/catalyst
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

