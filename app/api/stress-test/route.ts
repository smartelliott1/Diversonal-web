import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getComprehensiveMarketContext } from "@/app/lib/financialData";

// Using Claude 3.5 Sonnet for financial stress testing analysis
// Claude excels at analytical reasoning and understanding complex financial scenarios
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface StressTestRequest {
  scenario: string;
  portfolio: Array<{ name: string; value: number; color: string; breakdown?: string }>;
  initialCapital: number;
  timeHorizon: string;
  customTimeHorizon?: number; // Custom time horizon in months (6, 12, 18, 24)
}

interface StressTestResult {
  analysis: string;
  impact: {
    equities: number;
    bonds: number;
    commodities?: number;
    "real estate"?: number;
    cryptocurrencies?: number;
    cash: number;
  };
  portfolioValue: number[];
  months: string[];
  finalValue: number;
  percentageChange: number;
  riskLevel: string;
}

export async function POST(request: NextRequest) {
  let body: StressTestRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { scenario, portfolio, initialCapital, timeHorizon, customTimeHorizon } = body;
  
  // Use custom time horizon if provided, otherwise default to 18 months
  const monthsToSimulate = customTimeHorizon || 18;
  const dataPoints = monthsToSimulate + 1; // Include month 0

  try {

    if (!scenario || !portfolio || !initialCapital) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract asset classes that are actually in the portfolio (non-zero allocation)
    const portfolioAssetClasses = portfolio
      .filter((item) => item.value > 0)
      .map((item) => item.name);

    // If no API key, use fallback algorithm
    if (!ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set, using fallback algorithm");
      console.log("Environment check - NODE_ENV:", process.env.NODE_ENV);
      return NextResponse.json({
        ...generateFallbackStressTest(scenario, portfolio, initialCapital, portfolioAssetClasses, monthsToSimulate),
        reasoning: "Generated using Diversonal's proprietary stress testing algorithm",
      });
    }

    console.log("ANTHROPIC_API_KEY found, attempting to call Claude API");
    console.log("API Key length:", ANTHROPIC_API_KEY?.length || 0);

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Construct portfolio summary
    const portfolioSummary = portfolio
      .map((item) => `${item.name}: ${item.value}%${item.breakdown ? ` (${item.breakdown})` : ""}`)
      .join(", ");

    // Fetch live market data to establish current baseline
    let marketContext = "";
    try {
      marketContext = await getComprehensiveMarketContext();
      console.log("Successfully fetched live market data from FMP API for stress testing baseline");
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return NextResponse.json(
        { error: "Market data temporarily unavailable. Please try again in a few moments." },
        { status: 503 }
      );
    }

    const prompt = `You are a professional financial risk analyst specializing in portfolio stress testing. Analyze the following stress test scenario and provide a detailed assessment.

**Portfolio Allocation:**
${portfolioSummary}
Total Capital: $${initialCapital.toLocaleString()}
Time Horizon: ${timeHorizon}

${marketContext}

**⚠️ CRITICAL - DATA SOURCE REQUIREMENTS:**
The LIVE MARKET DATA section above contains REAL-TIME prices and indicators as of today. You MUST:
- Use ONLY the prices, indicators, and data shown in the LIVE MARKET DATA section as your baseline
- COMPLETELY IGNORE all prices and market data from your training cutoff - they are outdated and incorrect
- The stress test must model changes FROM the current live baseline, NOT from training data prices
- Example: If live data shows "Gold: $4,125.50", model gold's stress response from $4,125.50, NOT any training data price
- Use the actual current VIX, RSI, and market cycle stage as the starting point for stress modeling

**IMPORTANT:** The market data above represents the CURRENT BASELINE conditions. Your stress test should model how the portfolio would perform FROM THIS BASELINE if the scenario below were to occur.

**Stress Test Scenario:**
${scenario}

**Your Task:**
1. Start from the CURRENT MARKET BASELINE shown in the live data above
2. Analyze how this scenario would impact each asset class in the portfolio FROM the current conditions
3. Consider historical correlations, market behavior, and economic relationships
4. Factor in current market cycle stage and volatility (VIX) as starting point
5. Calculate monthly portfolio values over a ${monthsToSimulate}-month period showing realistic progression
6. Determine the overall impact and risk level

**Asset Class Impact Analysis:**
IMPORTANT: Only analyze the following asset classes that are present in this portfolio: ${portfolioAssetClasses.join(", ")}

${portfolioAssetClasses.includes("Equities") ? "- Equities: How would stocks react? Consider market sentiment, sector-specific impacts, and historical precedents" : ""}
${portfolioAssetClasses.includes("Bonds") ? "- Bonds: Would bonds act as a hedge or also decline? Consider interest rate changes, credit risk, and flight-to-safety dynamics" : ""}
${portfolioAssetClasses.includes("Commodities") ? "- Commodities: How would gold, silver, oil, and other commodities perform? Often act as inflation hedges" : ""}
${portfolioAssetClasses.includes("Real Estate") ? "- Real Estate: How would REITs and real estate funds react? Consider interest rate sensitivity and market conditions" : ""}
${portfolioAssetClasses.includes("Cryptocurrencies") ? "- Cryptocurrencies: How would digital assets like Bitcoin and Ethereum perform? Typically highly volatile" : ""}
${portfolioAssetClasses.includes("Cash") ? "- Cash: Typically remains stable, but consider inflation impacts" : ""}

**Response Format (JSON only, no other text):**
CRITICAL: The "impact" object must ONLY contain the asset classes present in this portfolio: ${portfolioAssetClasses.join(", ")}. Do NOT include any other asset classes.

Example format:
{
  "analysis": "2-3 sentence explanation of the scenario's impact on the portfolio",
  "impact": {
    ${portfolioAssetClasses.map(ac => `"${ac.toLowerCase()}": -10.5`).join(",\n    ")}
  },
  "portfolioValue": [100000, 95200, 91800, 89500, 88200, 87500, 86800, 86200, 85800, 85500, 85200, 85000, 84800, 84600, 84500, 84400, 84300, 84200, 84000],
  "months": ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12", "Month 13", "Month 14", "Month 15", "Month 16", "Month 17", "Month 18"],
  "finalValue": 84000,
  "percentageChange": -16.0,
  "riskLevel": "High"
}

**Important Guidelines:**
- Impact percentages should be realistic based on historical data and market behavior
- Portfolio values should show a realistic trajectory (not linear, but market-like fluctuations)
- Risk levels: "Low", "Moderate", "High", or "Severe"
- Ensure portfolioValue array has ${dataPoints} values (Month 0 through Month ${monthsToSimulate})
- First value should be the initial capital
- Values should reflect realistic market recovery patterns when applicable
- Consider that different scenarios have different recovery trajectories`;

    let response;
    try {
      // Try Claude models - Anthropic API model identifier format
      // Based on Anthropic API docs, correct formats are:
      // - claude-sonnet-4-20250514 (Sonnet 4.x)
      // - claude-opus-4-20250514 (Opus 4.x)
      // - claude-3-5-haiku-20241022 (Haiku 3.5)
      // Try in order of preference (best for financial analysis first)
      const modelsToTry = [
        "claude-sonnet-4-20250514", // Claude Sonnet 4.x (latest, best for analysis)
        "claude-opus-4-20250514", // Claude Opus 4.x (alternative, very capable)
        "claude-3-5-haiku-20241022", // Claude Haiku 3.5 (faster, less capable)
        "claude-3-5-sonnet-20241022", // Sonnet 3.5 (fallback)
        "claude-3-opus-20240229", // Opus 3 (fallback)
      ];
      
      let lastError: any = null;
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting to call Claude with model: ${modelName}`);
          response = await anthropic.messages.create({
            model: modelName,
            max_tokens: 2000,
            temperature: 0.3,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });
          console.log(`Claude API call successful with model: ${modelName}`);
          break; // Success, exit the loop
        } catch (modelError: any) {
          lastError = modelError;
          const errorMsg = modelError?.message || JSON.stringify(modelError);
          console.warn(`Model ${modelName} failed:`, errorMsg);
          // Log full error details for debugging
          if (modelError?.error) {
            console.warn(`Error details for ${modelName}:`, JSON.stringify(modelError.error, null, 2));
          }
          // Continue to next model
        }
      }
      
      // If all models failed, throw the last error
      if (!response) {
        throw lastError || new Error("All Claude models failed");
      }
      
    } catch (apiError: any) {
      console.error("All Claude models failed. Final error:", apiError);
      console.error("Error details:", {
        message: apiError?.message,
        status: apiError?.status,
        statusCode: apiError?.statusCode,
        type: apiError?.type,
        error: apiError?.error,
      });
      
      // Fallback to algorithm
      return NextResponse.json({
        ...generateFallbackStressTest(scenario, portfolio, initialCapital, portfolioAssetClasses, monthsToSimulate),
        reasoning: "Generated using Diversonal's proprietary stress testing algorithm (Claude API unavailable - please verify API key and model access in Anthropic console)",
      });
    }

    const content = response.content[0];
    
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let stressTestResult;
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
      
      stressTestResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      // Fallback to algorithm
      return NextResponse.json({
        ...generateFallbackStressTest(scenario, portfolio, initialCapital, portfolioAssetClasses, monthsToSimulate),
        reasoning: "Generated using Diversonal's proprietary stress testing algorithm",
      });
    }

    // Validate and normalize the data
    if (!stressTestResult.portfolioValue || stressTestResult.portfolioValue.length !== dataPoints) {
      // Generate missing months if needed
      const values = stressTestResult.portfolioValue || [];
      while (values.length < dataPoints) {
        values.push(values[values.length - 1] || initialCapital);
      }
      stressTestResult.portfolioValue = values.slice(0, dataPoints);
    }

    if (!stressTestResult.months || stressTestResult.months.length !== dataPoints) {
      stressTestResult.months = Array.from({ length: dataPoints }, (_, i) => `Month ${i}`);
    }

    // Ensure first value is initial capital
    stressTestResult.portfolioValue[0] = initialCapital;

    // Calculate final value and percentage change if not provided
    const lastIndex = dataPoints - 1;
    if (!stressTestResult.finalValue) {
      stressTestResult.finalValue = stressTestResult.portfolioValue[lastIndex];
    }
    if (!stressTestResult.percentageChange) {
      stressTestResult.percentageChange = 
        ((stressTestResult.finalValue - initialCapital) / initialCapital) * 100;
    }

    // Filter impact object to only include asset classes in the portfolio
    if (stressTestResult.impact) {
      const filteredImpact: any = {};
      portfolioAssetClasses.forEach(assetClass => {
        const key = assetClass.toLowerCase();
        if (stressTestResult.impact[key] !== undefined) {
          filteredImpact[key] = stressTestResult.impact[key];
        }
      });
      stressTestResult.impact = filteredImpact;
    }

    return NextResponse.json(stressTestResult);
  } catch (error: any) {
    console.error("Error generating stress test:", error);
    
    // Always try to use fallback algorithm if we have the body
    console.log("Falling back to algorithm due to error:", error?.message);
    try {
      // Extract asset classes if not already done
      const portfolioAssetClasses = portfolio
        .filter((item) => item.value > 0)
        .map((item) => item.name);
      
      return NextResponse.json({
        ...generateFallbackStressTest(scenario, portfolio, initialCapital, portfolioAssetClasses, monthsToSimulate),
        reasoning: "Generated using Diversonal's proprietary stress testing algorithm (AI service temporarily unavailable)",
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      // Return detailed error in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Failed to generate stress test: ${error?.message || 'Unknown error'}`
        : "Failed to generate stress test. Please try again.";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
}

// Fallback algorithm for stress testing
function generateFallbackStressTest(
  scenario: string,
  portfolio: Array<{ name: string; value: number }>,
  initialCapital: number,
  portfolioAssetClasses: string[],
  monthsToSimulate: number = 18
): StressTestResult {
  const scenarioLower = scenario.toLowerCase();
  
  // Determine base impact based on scenario keywords
  let equitiesImpact = 0;
  let bondsImpact = 0;
  let commoditiesImpact = 0;
  let realEstateImpact = 0;
  let cryptoImpact = 0;
  let riskLevel = "Moderate";
  let isPositive = false;

  // Check for positive scenarios first
  if (
    scenarioLower.includes("goes up") || 
    scenarioLower.includes("increases") ||
    scenarioLower.includes("rises") ||
    scenarioLower.includes("gains") ||
    scenarioLower.includes("grow") ||
    scenarioLower.includes("bull market") ||
    scenarioLower.includes("rally") ||
    scenarioLower.includes("surge")
  ) {
    isPositive = true;
    const match = scenario.match(/(\d+)%/);
    const percent = match ? parseInt(match[1]) : 10;
    equitiesImpact = percent * 1.2;
    bondsImpact = percent * 0.4;
    commoditiesImpact = percent * 0.7;
    realEstateImpact = percent * 0.9;
    cryptoImpact = percent * 2.0; // Crypto amplifies movements
    riskLevel = "Low";
  } 
  // Check for negative scenarios
  else if (scenarioLower.includes("market crash") || scenarioLower.includes("recession") || scenarioLower.includes("crisis")) {
    equitiesImpact = -25;
    bondsImpact = -5;
    commoditiesImpact = 8; // Commodities often hedge in crisis
    realEstateImpact = -18;
    cryptoImpact = -35; // Crypto highly volatile in crisis
    riskLevel = "High";
  } else if (scenarioLower.includes("drop") || scenarioLower.includes("decline") || scenarioLower.includes("falls") || scenarioLower.includes("drops")) {
    const match = scenario.match(/(\d+)%/);
    const percent = match ? parseInt(match[1]) : 10;
    equitiesImpact = -percent * 1.2;
    bondsImpact = -percent * 0.3;
    commoditiesImpact = percent * 0.4; // Commodities may benefit
    realEstateImpact = -percent * 0.8;
    cryptoImpact = -percent * 1.8; // Crypto drops harder
    riskLevel = percent > 15 ? "High" : "Moderate";
  } else if (scenarioLower.includes("inflation") || scenarioLower.includes("rising rates")) {
    equitiesImpact = -8;
    bondsImpact = -12; // Bonds suffer with rising rates
    commoditiesImpact = 12; // Commodities hedge inflation
    realEstateImpact = -10; // Real estate suffers with high rates
    cryptoImpact = -15; // Crypto typically negative in high rate environment
    riskLevel = "Moderate";
  } else {
    // Default to negative (conservative approach)
    equitiesImpact = -10;
    bondsImpact = -3;
    commoditiesImpact = 2;
    realEstateImpact = -7;
    cryptoImpact = -18;
    riskLevel = "Moderate";
  }

  // Calculate portfolio impact
  const equities = portfolio.find(p => p.name === "Equities")?.value || 0;
  const bonds = portfolio.find(p => p.name === "Bonds")?.value || 0;
  const commodities = portfolio.find(p => p.name === "Commodities")?.value || 0;
  const realEstate = portfolio.find(p => p.name === "Real Estate")?.value || 0;
  const crypto = portfolio.find(p => p.name === "Cryptocurrencies")?.value || 0;
  const cash = portfolio.find(p => p.name === "Cash")?.value || 0;

  const totalImpact = 
    (equities / 100) * equitiesImpact +
    (bonds / 100) * bondsImpact +
    (commodities / 100) * commoditiesImpact +
    (realEstate / 100) * realEstateImpact +
    (crypto / 100) * cryptoImpact +
    (cash / 100) * 0;

  const finalValue = initialCapital * (1 + totalImpact / 100);
  const percentageChange = totalImpact;

  // Generate monthly values with realistic trajectory
  const portfolioValue: number[] = [initialCapital];
  const months = ["Month 0"];
  
  if (isPositive) {
    // Positive trajectory: gradual growth with some volatility
    for (let i = 1; i <= monthsToSimulate; i++) {
      const progress = i / monthsToSimulate;
      // Non-linear growth with some volatility
      const growthFactor = 1 + (progress * Math.abs(totalImpact) / 100);
      // Add some volatility (small random fluctuations)
      const volatility = 1 + (Math.random() - 0.5) * 0.02; // ±1% volatility
      const value = initialCapital * growthFactor * volatility;
      portfolioValue.push(Math.max(value, initialCapital)); // Never go below initial
      months.push(`Month ${i}`);
    }
  } else {
    // Negative trajectory: decline with potential recovery
    for (let i = 1; i <= monthsToSimulate; i++) {
      const progress = i / monthsToSimulate;
      // Non-linear decline with some recovery potential
      const declineFactor = 1 - (progress * Math.abs(totalImpact) / 100);
      const recoveryFactor = progress > 0.6 ? 1 + (progress - 0.6) * 0.1 : 1;
      const value = initialCapital * declineFactor * recoveryFactor;
      portfolioValue.push(Math.max(value, initialCapital * 0.5)); // Cap at 50% loss
      months.push(`Month ${i}`);
    }
  }

  portfolioValue[monthsToSimulate] = finalValue;

  const changeDirection = isPositive ? "increase" : "decline";

  // Build impact object with only asset classes present in portfolio
  const impact: any = {};
  portfolioAssetClasses.forEach(assetClass => {
    const lowerName = assetClass.toLowerCase();
    if (assetClass === "Equities") impact.equities = equitiesImpact;
    else if (assetClass === "Bonds") impact.bonds = bondsImpact;
    else if (assetClass === "Commodities") impact.commodities = commoditiesImpact;
    else if (assetClass === "Real Estate") impact["real estate"] = realEstateImpact;
    else if (assetClass === "Cryptocurrencies") impact.cryptocurrencies = cryptoImpact;
    else if (assetClass === "Cash") impact.cash = 0;
  });

  return {
    analysis: `Based on the scenario "${scenario}", this portfolio would experience a ${Math.abs(percentageChange).toFixed(1)}% ${changeDirection}. The stress test shows how different asset classes would be impacted, with ${isPositive ? "equities and cryptocurrencies leading gains" : "cryptocurrencies and equities most affected"}, commodities ${isPositive || scenarioLower.includes("inflation") ? "providing positive returns" : "showing mixed results"}, and cash remaining stable.`,
    impact,
    portfolioValue,
    months,
    finalValue,
    percentageChange,
    riskLevel: isPositive ? "Low" : riskLevel,
  };
}

