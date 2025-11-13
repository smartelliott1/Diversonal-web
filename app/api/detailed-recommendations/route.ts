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
   - **Sector Conviction Alignment:** When user has sector convictions, look for trending small/mid-cap companies in those sectors
   - **Growth Stage Companies:** Identify emerging leaders with strong fundamentals before they become large-caps
   
   **Criteria for "Trending" Small/Mid-Cap Stocks:**
   - Recent revenue/earnings growth acceleration (20%+ YoY growth)
   - Increasing institutional ownership and buying interest
   - Technical momentum indicators showing upward trends (above 50-day and 200-day MAs)
   - Strong sector tailwinds positioning them as beneficiaries of macro trends
   - Positive analyst sentiment and earnings revisions
   - Market cap: Small-cap ($300M-$2B), Mid-cap ($2B-$10B)
   
   **Balance Approach:**
   - Conservative/Low Risk: Stick to large-caps (>$10B) for stability
   - Moderate Risk: Mix of 70% large-cap, 30% mid-cap
   - High Risk: Aggressive mix with 50% large-cap, 30% mid-cap, 20% small-cap growth names
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
  "marketContext": "As of November 2025, the Fed maintains rates at 4.50% after two 25bp cuts. Inflation has moderated to 2.4% (CPI YoY), approaching the Fed's 2% target. Labor market shows resilience with unemployment at 4.1%. The S&P 500 trades at 21x forward P/E, above historical average of 18x, suggesting selective positioning is prudent. Market cycle indicators suggest late-stage expansion, favoring quality over momentum. Tech sector has outperformed YTD (+28%) on AI enthusiasm, while traditional cyclicals lag. VIX at 14 indicates complacency. Recommended approach: blend growth and quality, increase international exposure, maintain bond duration near neutral."
}

**Important Guidelines:**

${formData.risk === 'High' || parseInt(formData.age) < 40 ? `
🚨 **MANDATORY REQUIREMENT:**
${formData.risk === 'High' ? `- This user has HIGH risk tolerance - you MUST recommend at least 2 SMALL-CAP stocks (market cap $300M-$2B)` : ''}
${parseInt(formData.age) < 40 ? `- This user is young (age ${formData.age}) - you MUST include small/mid-cap growth stocks for long-term wealth building` : ''}
${formData.risk === 'High' && formData.sectors.length > 0 ? `- Look specifically for small-cap companies in ${formData.sectors.join(" and ")} sectors` : ''}
- Small-caps should have: 20%+ revenue growth, rising institutional ownership, strong technical momentum
- DO NOT recommend only mega-cap stocks (AAPL, MSFT, GOOGL, etc.) - diversify into smaller companies
` : ''}

- Provide 3-5 specific recommendations per asset class (more for Equities, fewer for Cash)
- Each rationale should be 2-4 sentences and cite specific data points
- Position sizes should reflect conviction: Large (25-35% of category), Medium (15-25%), Small (5-15%)
${formData.sectors.length > 0 ? `- PRIORITIZE: User's sector convictions (${formData.sectors.join(", ")}) should receive LARGE position sizes` : ''}
- Risk levels based on volatility, beta, drawdown history
- Breakdown percentages must sum to 100 for each asset class
- Use varied colors for breakdown visualization (hex codes)
- marketContext should be 3-5 sentences summarizing current environment
- Be specific with current data (don't use placeholder data)
${formData.sectors.length > 0 ? `- MOST IMPORTANT: Heavily weight recommendations toward user's sector convictions (${formData.sectors.join(", ")})` : ''}
- For younger users with longer horizons, favor growth; for older users, favor income/stability
- Include market cap diversity: Balance large-cap stability with small/mid-cap growth potential based on risk profile
- For small/mid-caps: cite specific growth metrics (revenue growth %, institutional buying, technical momentum)
${formData.sectors.length > 0 ? `- Explicitly mention when a stock aligns with the user's ${formData.sectors.join(" / ")} sector conviction(s)` : ''}`;

    console.log("Calling GPT-4o for detailed recommendations...");

    // Build system message with explicit instructions
    const systemMessage = `You are a professional financial analyst providing investment recommendations. Always respond with valid JSON only, no markdown formatting.

${formData.risk === 'High' || parseInt(formData.age) < 40 ? `
CRITICAL INSTRUCTION: This user profile requires small-cap and mid-cap stock recommendations.
- User risk tolerance: ${formData.risk}
- User age: ${formData.age}
${formData.risk === 'High' ? '- HIGH RISK TOLERANCE detected: You MUST include at least 2 small-cap stocks (market cap $300M-$2B) with high growth potential' : ''}
${parseInt(formData.age) < 40 ? `- YOUNG INVESTOR detected: You MUST include small/mid-cap growth stocks for long-term wealth building` : ''}
${formData.sectors.length > 0 && formData.risk === 'High' ? `- Look for trending small-cap companies in: ${formData.sectors.join(", ")}` : ''}

DO NOT only recommend large-cap stocks. Include meaningful small-cap and mid-cap exposure.
` : ''}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessage
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

