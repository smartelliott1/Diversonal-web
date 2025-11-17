import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getComprehensiveMarketContext } from "@/app/lib/financialData";

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

  try {
    if (!portfolio || !formData) {
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

    // Fetch live market data for comprehensive context
    let marketContext = "";
    try {
      marketContext = await getComprehensiveMarketContext();
      console.log("Successfully fetched live market data from FMP API for detailed recommendations");
    } catch (error) {
      console.warn("Failed to fetch market data, using fallback");
      marketContext = `**CURRENT MARKET DATA (Fallback):**
- Federal Funds Rate: 4.25-4.50%
- S&P 500: ~6,000
- Core PCE Inflation: 2.9%
- Unemployment Rate: 4.1%
- VIX (Volatility Index): ~15`;
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

${formData.sectors.length > 0 ? `**CRITICAL - Sector Conviction Priority:**
User's conviction sectors are ${formData.sectors.join(", ")}. Prioritize these sectors with LARGER position sizes (favor "Large" sizes) and dedicate the majority of Equities recommendations to them. Include 1-2 small/mid-cap rising stars if risk profile allows.
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
Use the actual current market conditions from the LIVE MARKET DATA above:
- Use current S&P 500, VIX, and volatility levels to assess market risk
- Consider actual sector performance (leading/lagging sectors) when making recommendations
- Factor in current Fed funds rate and yield curve for bond recommendations
- Use RSI and technical indicators to identify overbought/oversold conditions
- Adjust for current market cycle stage (bull/bear/correction/consolidation)
- Consider macroeconomic conditions (GDP, inflation, employment) shown in the data
- For high-risk profiles and younger investors, include small/mid-cap opportunities with 30%+ YoY growth and strong institutional buying

**Market Cap Approach:**
- Low Risk: Large-cap (>$50B) for stability
- Moderate Risk: 80% large-cap, 20% mid-cap
- High Risk: 60% large-cap, 20% mid-cap, 20% small-cap growth

**Response Format (JSON only, no markdown formatting):**
{
  "Equities": {
    "recommendations": [
      {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "rationale": "Leading services ecosystem with 2B+ devices. Strong FCF ($100B+ annually). Trading at forward P/E 28x. AI integration catalyst. RSI neutral (50-60).",
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
  "marketContext": "Synthesize the market data above into 3-5 sentences describing current economic conditions and market sentiment"
}

**Guidelines:**
- Provide 3-5 recommendations per asset class (more for Equities)
- Each rationale: 2-4 sentences with specific data points
- Position sizes: Large (25-35%), Medium (15-25%), Small (5-15%)
- Risk levels: Based on volatility, beta, drawdown history
- Breakdown percentages must sum to 100 per asset class
- Use varied hex colors for visualization
- marketContext: Synthesize current market data into 3-5 sentences
- Match investment style to age/horizon (growth for young, income for older)
- Cite growth metrics for small/mid-caps (revenue %, institutional buying, momentum)`;

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
        } catch (error) {
          console.error("Streaming error:", error);
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
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to generate recommendations: ${error?.message || 'Unknown error'}`
      : "Failed to generate recommendations. Please try again.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

