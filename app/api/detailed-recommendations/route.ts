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

Use these exact numbers when generating the marketContext field and when considering current market conditions for your recommendations.

**Your Task:**
For each asset class in the portfolio, provide specific investment recommendations (stocks, ETFs, bonds, REITs, crypto, etc.) with rankings based on comprehensive market analysis.

**CRITICAL - Sector Conviction Prioritization:**
${formData.sectors.length > 0 ? `
The user has expressed strong conviction in these sectors: ${formData.sectors.join(", ")}

YOU MUST:
- Prioritize stocks and assets from these conviction sectors in your recommendations
- Allocate LARGER position sizes to conviction sector picks (favor "Large" position sizes)
- Dedicate the majority of Equities recommendations to these sectors
- Explicitly note when a recommendation aligns with user's sector convictions
- If a conviction sector doesn't fit naturally in an asset class, explain why
- Weight conviction sectors more heavily than other opportunities

Example: If user selected "Technology" and "Healthcare", your Equities section should be dominated by tech and healthcare stocks with Large position sizes.
` : 'No specific sector convictions specified - provide diversified recommendations across sectors.'}

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

8. **Market Cap Diversification & Small/Mid-Cap Opportunities:**
   - **Risk Tolerance Based:** For HIGH risk tolerance, actively seek small-cap and mid-cap growth opportunities
   - **Age Consideration:** Younger investors (under 40) can handle more small/mid-cap exposure for growth potential
   - **Sector Conviction Alignment:** When user has sector convictions, look for trending mid-cap companies in those sectors
   - **Growth Stage Companies:** Identify emerging leaders with strong fundamentals before they become large-caps
   
   **Criteria for "Trending" Small/Mid-Cap Stocks:**
   - Recent revenue/earnings growth acceleration (30%+ YoY growth)
   - Increasing institutional ownership and buying interest
   - Technical momentum indicators showing upward trends (above 50-day and 200-day MAs)
   - Strong sector tailwinds positioning them as beneficiaries of macro trends
   - Positive analyst sentiment and earnings revisions
   - Market cap: Small-cap ($300M-$2B), Mid-cap ($2B-$10B)
   
   **Balance Approach:**
   - Conservative/Low Risk: Stick to bigger companies (>$50B market cap) for stability
   - Moderate Risk: Mix of 80% large-cap (>$10B), 20% mid-cap (>$2B)
   - High Risk: Aggressive mix with 60% large-cap, 20% mid-cap, 20% small-cap growth names
   - Conviction sectors should include at least 1-2 small/mid-cap "rising stars" if risk profile allows

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
  "marketContext": "As of November 2025, [synthesize the market data provided above into 3-5 sentences describing current economic conditions and market sentiment]"
}

**Important Guidelines:**

- Provide 3-5 specific recommendations per asset class (more for Equities, fewer for Cash)
- Each rationale should be 2-4 sentences and cite specific data points
- Position sizes should reflect conviction: Large (25-35% of category), Medium (15-25%), Small (5-15%)
${formData.sectors.length > 0 ? `- PRIORITIZE: User's sector convictions (${formData.sectors.join(", ")}) should receive LARGE position sizes` : ''}
- Risk levels based on volatility, beta, drawdown history
- Breakdown percentages must sum to 100 for each asset class
- Use varied colors for breakdown visualization (hex codes)
- **marketContext: Synthesize the CURRENT MARKET DATA provided above into a comprehensive 3-5 sentence summary**
${formData.sectors.length > 0 ? `- MOST IMPORTANT: Heavily weight recommendations toward user's sector convictions (${formData.sectors.join(", ")})` : ''}
${formData.sectors.length > 0 ? `- When recommending stocks in user's conviction sectors (${formData.sectors.join(", ")}), naturally weave the sector alignment into the rationale - NO special formatting, NO all caps, NO asterisks - just mention it organically` : ''}
- For younger users with longer horizons, favor growth; for older users, favor income/stability
${formData.risk === 'High' ? `- High risk tolerance: Consider including 1 small or mid-cap growth stock with strong fundamentals for upside potential` : ''}
${parseInt(formData.age) < 40 ? `- Younger investor (age ${formData.age}): Small/mid-cap exposure can enhance long-term growth` : ''}
${formData.risk === 'High' && formData.sectors.length > 0 ? `- If suitable, consider emerging companies in ${formData.sectors.join(" or ")} sectors with strong growth metrics` : ''}
- Include market cap diversity: Balance large-cap stability with growth opportunities
- For small/mid-caps when included: cite specific growth metrics (revenue growth %, institutional buying, technical momentum)`;

    console.log("Calling Claude Sonnet 4 for detailed recommendations...");

    const response = await anthropic.messages.create({
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

    console.log("Claude response received");

    const content = response.content[0];
    
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let recommendations: DetailedRecommendationsResponse;
    try {
      // Extract JSON from response
      const text = content.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const cleanedContent = jsonMatch[0]
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      recommendations = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
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

