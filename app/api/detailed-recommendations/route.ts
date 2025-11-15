import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

**CURRENT MARKET DATA (November 2025):**
- Federal Funds Rate: 3.75-4.00%
- S&P 500: ~6,700
- Core PCE Inflation: 2.9%
- Unemployment Rate: 4.3%
- VIX (Volatility Index): ~20

${formData.sectors.length > 0 ? `**CRITICAL - Sector Conviction Priority:**
User's conviction sectors are ${formData.sectors.join(", ")}. Prioritize these sectors with LARGER position sizes (favor "Large" sizes) and dedicate the majority of Equities recommendations to them. Include 1-2 small/mid-cap rising stars if risk profile allows.
` : ''}
**Analysis Framework:**
Consider macroeconomic conditions (GDP, inflation, employment), Fed policy impact on asset classes, technical sentiment (RSI, market breadth, VIX), and valuation metrics (P/E ratios, earnings growth, free cash flow). For high-risk profiles and younger investors, include small/mid-cap opportunities with 30%+ YoY growth and strong institutional buying.

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

