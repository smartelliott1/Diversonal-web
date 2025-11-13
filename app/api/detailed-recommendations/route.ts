import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Using GPT-4o for comprehensive market analysis and stock recommendations
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
  [assetClass: string]: AssetClassRecommendations;
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
    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not set");
      return NextResponse.json(
        { error: "API configuration missing. Please contact support." },
        { status: 503 }
      );
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
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

**Your Task:**
For each asset class in the portfolio, provide specific investment recommendations (stocks, ETFs, bonds, REITs, crypto, etc.) with rankings based on comprehensive market analysis.

**Analysis Framework - Consider ALL of the following:**

1. **Current Market Demand & Supply Dynamics:**
   - Analyze supply chain trends, inventory levels, production capacity
   - Evaluate consumer demand patterns and spending behavior
   - Assess institutional investor positioning and retail sentiment

2. **Macroeconomic Conditions:**
   - GDP growth trajectory and leading economic indicators
   - Employment trends, wage growth, and labor market tightness
   - Inflation data (CPI, PCE, PPI) and trajectory
   - Global economic conditions and trade dynamics

3. **Federal Reserve Policy & Interest Rates:**
   - Current Fed Funds rate and recent policy decisions
   - Forward guidance and dot plot projections
   - Quantitative tightening (QT) or easing (QE) status
   - Impact on different asset classes (growth vs value, bonds, real estate)

4. **Market Cycles & Positioning:**
   - Current phase of economic cycle (early/mid/late expansion, recession)
   - Market cycle stage (bull/bear market characteristics)
   - Sector rotation patterns based on cycle phase
   - Historical performance patterns in similar environments

5. **Technical Analysis & Sentiment:**
   - Overbought/oversold conditions (RSI, moving averages)
   - Support/resistance levels and trend analysis
   - Market breadth and momentum indicators
   - Fear & Greed Index, put/call ratios, VIX levels

6. **Valuation & Fundamentals:**
   - P/E ratios relative to historical averages
   - Earnings growth expectations and quality
   - Free cash flow generation and balance sheet strength
   - Dividend yields and sustainability

7. **Sector-Specific Factors:**
   - Regulatory environment and policy changes
   - Technological disruption and innovation trends
   - Competitive dynamics and market share shifts
   - Seasonal patterns and catalysts

**Response Format (JSON only, no markdown formatting):**
{
  "Equities": {
    "recommendations": [
      {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "rationale": "Leading position in services ecosystem with 2B+ active devices. Strong free cash flow ($100B+ annually) supports shareholder returns. Trading at forward P/E of 28x, in line with 5-year average. AI integration (Apple Intelligence) provides growth catalyst. Fed rate cuts would benefit growth stocks. Currently neutral on RSI (50-60 range) after recent pullback.",
        "positionSize": "Large",
        "riskLevel": "Moderate"
      },
      {
        "ticker": "MSFT",
        "name": "Microsoft Corporation",
        "rationale": "Dominant Azure cloud market position with 25% market share. AI monetization through OpenAI partnership showing strong early traction. Enterprise software moat provides recession resilience. Forward P/E of 32x justified by 15% revenue growth expectations. Strong institutional ownership and low beta (0.9) suit moderate risk profile.",
        "positionSize": "Large",
        "riskLevel": "Moderate"
      }
    ],
    "breakdown": [
      { "name": "AAPL", "value": 22, "color": "#A78BFA" },
      { "name": "MSFT", "value": 20, "color": "#60A5FA" },
      { "name": "NVDA", "value": 18, "color": "#34D399" },
      { "name": "GOOGL", "value": 15, "color": "#FBBF24" },
      { "name": "VOO", "value": 25, "color": "#F87171" }
    ]
  },
  "Bonds": {
    "recommendations": [...],
    "breakdown": [...]
  },
  "Commodities": {
    "recommendations": [...],
    "breakdown": [...]
  },
  "Real Estate": {
    "recommendations": [...],
    "breakdown": [...]
  },
  "Cryptocurrencies": {
    "recommendations": [...],
    "breakdown": [...]
  },
  "Cash": {
    "recommendations": [
      {
        "ticker": "HYSA",
        "name": "High-Yield Savings Account",
        "rationale": "Current rates at 4-5% provide inflation-beating returns with full liquidity and FDIC insurance.",
        "positionSize": "Large",
        "riskLevel": "Low"
      }
    ],
    "breakdown": [
      { "name": "HYSA", "value": 60, "color": "#FFD93D" },
      { "name": "Money Market", "value": 40, "color": "#FFB84D" }
    ]
  },
  "marketContext": "As of November 2025, the Fed maintains rates at 4.50% after two 25bp cuts. Inflation has moderated to 2.4% (CPI YoY), approaching the Fed's 2% target. Labor market shows resilience with unemployment at 4.1%. The S&P 500 trades at 21x forward P/E, above historical average of 18x, suggesting selective positioning is prudent. Market cycle indicators suggest late-stage expansion, favoring quality over momentum. Tech sector has outperformed YTD (+28%) on AI enthusiasm, while traditional cyclicals lag. VIX at 14 indicates complacency. Recommended approach: blend growth and quality, increase international exposure, maintain bond duration near neutral."
}

**Important Guidelines:**
- Provide 3-5 specific recommendations per asset class (more for Equities, fewer for Cash)
- Each rationale should be 2-4 sentences and cite specific data points
- Position sizes should reflect conviction: Large (25-35% of category), Medium (15-25%), Small (5-15%)
- Risk levels based on volatility, beta, drawdown history
- Breakdown percentages must sum to 100 for each asset class
- Use varied colors for breakdown visualization (hex codes)
- marketContext should be 3-5 sentences summarizing current environment
- Be specific with current data (don't use placeholder data)
- Consider the user's sector preferences when selecting stocks
- For younger users with longer horizons, favor growth; for older users, favor income/stability
- Match risk levels to user's stated risk tolerance`;

    console.log("Calling GPT-4o for detailed recommendations...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional financial analyst providing investment recommendations. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    console.log("GPT-4o response received");

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("Empty response from GPT-4o");
    }

    let recommendations: DetailedRecommendationsResponse;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing GPT-4o response:", parseError);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate response structure
    if (!recommendations.marketContext) {
      recommendations.marketContext = "Market analysis completed successfully.";
    }

    return NextResponse.json(recommendations);

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

