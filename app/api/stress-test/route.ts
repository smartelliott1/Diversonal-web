import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Using Claude 3.5 Sonnet for financial stress testing analysis
// Claude excels at analytical reasoning and understanding complex financial scenarios
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface StressTestRequest {
  scenario: string;
  portfolio: Array<{ name: string; value: number; color: string; breakdown?: string }>;
  initialCapital: number;
  timeHorizon: string;
}

interface StressTestResult {
  analysis: string;
  impact: {
    equities: number;
    bonds: number;
    alternatives: number;
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

  const { scenario, portfolio, initialCapital, timeHorizon } = body;

  try {

    if (!scenario || !portfolio || !initialCapital) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If no API key, use fallback algorithm
    if (!ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set, using fallback algorithm");
      console.log("Environment check - NODE_ENV:", process.env.NODE_ENV);
      return NextResponse.json({
        ...generateFallbackStressTest(scenario, portfolio, initialCapital),
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

    const prompt = `You are a professional financial risk analyst specializing in portfolio stress testing. Analyze the following stress test scenario and provide a detailed assessment.

**Portfolio Allocation:**
${portfolioSummary}
Total Capital: $${initialCapital.toLocaleString()}
Time Horizon: ${timeHorizon}

**Stress Test Scenario:**
${scenario}

**Your Task:**
1. Analyze how this scenario would impact each asset class in the portfolio
2. Consider historical correlations, market behavior, and economic relationships
3. Calculate monthly portfolio values over a 12-month period
4. Determine the overall impact and risk level

**Asset Class Impact Analysis:**
- Equities: How would stocks react? Consider market sentiment, sector-specific impacts, and historical precedents
- Bonds: Would bonds act as a hedge or also decline? Consider interest rate changes, credit risk, and flight-to-safety dynamics
- Alternatives (REITs, commodities, etc.): How would these assets perform?
- Cash: Typically remains stable, but consider inflation impacts

**Response Format (JSON only, no other text):**
{
  "analysis": "2-3 sentence explanation of the scenario's impact on the portfolio",
  "impact": {
    "equities": -15.5,
    "bonds": -3.2,
    "alternatives": -8.1,
    "cash": 0
  },
  "portfolioValue": [100000, 95200, 91800, 89500, 88200, 87500, 86800, 86200, 85800, 85500, 85200, 85000],
  "months": ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"],
  "finalValue": 85000,
  "percentageChange": -15.0,
  "riskLevel": "High"
}

**Important Guidelines:**
- Impact percentages should be realistic based on historical data and market behavior
- Portfolio values should show a realistic trajectory (not linear, but market-like fluctuations)
- Risk levels: "Low", "Moderate", "High", or "Severe"
- Ensure portfolioValue array has 13 values (Month 0 through Month 12)
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
          console.warn(`Model ${modelName} failed:`, modelError?.message || modelError);
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
        ...generateFallbackStressTest(scenario, portfolio, initialCapital),
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
        ...generateFallbackStressTest(scenario, portfolio, initialCapital),
        reasoning: "Generated using Diversonal's proprietary stress testing algorithm",
      });
    }

    // Validate and normalize the data
    if (!stressTestResult.portfolioValue || stressTestResult.portfolioValue.length !== 13) {
      // Generate missing months if needed
      const values = stressTestResult.portfolioValue || [];
      while (values.length < 13) {
        values.push(values[values.length - 1] || initialCapital);
      }
      stressTestResult.portfolioValue = values.slice(0, 13);
    }

    if (!stressTestResult.months || stressTestResult.months.length !== 13) {
      stressTestResult.months = Array.from({ length: 13 }, (_, i) => `Month ${i}`);
    }

    // Ensure first value is initial capital
    stressTestResult.portfolioValue[0] = initialCapital;

    // Calculate final value and percentage change if not provided
    if (!stressTestResult.finalValue) {
      stressTestResult.finalValue = stressTestResult.portfolioValue[12];
    }
    if (!stressTestResult.percentageChange) {
      stressTestResult.percentageChange = 
        ((stressTestResult.finalValue - initialCapital) / initialCapital) * 100;
    }

    return NextResponse.json(stressTestResult);
  } catch (error: any) {
    console.error("Error generating stress test:", error);
    
    // Always try to use fallback algorithm if we have the body
    console.log("Falling back to algorithm due to error:", error?.message);
    try {
      return NextResponse.json({
        ...generateFallbackStressTest(scenario, portfolio, initialCapital),
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
  initialCapital: number
): StressTestResult {
  const scenarioLower = scenario.toLowerCase();
  
  // Determine base impact based on scenario keywords
  let equitiesImpact = 0;
  let bondsImpact = 0;
  let alternativesImpact = 0;
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
    alternativesImpact = percent * 0.8;
    riskLevel = "Low";
  } 
  // Check for negative scenarios
  else if (scenarioLower.includes("market crash") || scenarioLower.includes("recession") || scenarioLower.includes("crisis")) {
    equitiesImpact = -25;
    bondsImpact = -5;
    alternativesImpact = -15;
    riskLevel = "High";
  } else if (scenarioLower.includes("drop") || scenarioLower.includes("decline") || scenarioLower.includes("falls") || scenarioLower.includes("drops")) {
    const match = scenario.match(/(\d+)%/);
    const percent = match ? parseInt(match[1]) : 10;
    equitiesImpact = -percent * 1.2;
    bondsImpact = -percent * 0.3;
    alternativesImpact = -percent * 0.6;
    riskLevel = percent > 15 ? "High" : "Moderate";
  } else if (scenarioLower.includes("inflation") || scenarioLower.includes("rising rates")) {
    equitiesImpact = -8;
    bondsImpact = -12;
    alternativesImpact = -5;
    riskLevel = "Moderate";
  } else {
    // Default to negative (conservative approach)
    equitiesImpact = -10;
    bondsImpact = -3;
    alternativesImpact = -7;
    riskLevel = "Moderate";
  }

  // Calculate portfolio impact
  const equities = portfolio.find(p => p.name === "Equities")?.value || 0;
  const bonds = portfolio.find(p => p.name === "Bonds")?.value || 0;
  const alternatives = portfolio.find(p => p.name === "Alternatives")?.value || 0;
  const cash = portfolio.find(p => p.name === "Cash")?.value || 0;

  const totalImpact = 
    (equities / 100) * equitiesImpact +
    (bonds / 100) * bondsImpact +
    (alternatives / 100) * alternativesImpact +
    (cash / 100) * 0;

  const finalValue = initialCapital * (1 + totalImpact / 100);
  const percentageChange = totalImpact;

  // Generate monthly values with realistic trajectory
  const portfolioValue: number[] = [initialCapital];
  const months = ["Month 0"];
  
  if (isPositive) {
    // Positive trajectory: gradual growth with some volatility
    for (let i = 1; i <= 12; i++) {
      const progress = i / 12;
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
    for (let i = 1; i <= 12; i++) {
      const progress = i / 12;
      // Non-linear decline with some recovery potential
      const declineFactor = 1 - (progress * Math.abs(totalImpact) / 100);
      const recoveryFactor = progress > 0.6 ? 1 + (progress - 0.6) * 0.1 : 1;
      const value = initialCapital * declineFactor * recoveryFactor;
      portfolioValue.push(Math.max(value, initialCapital * 0.5)); // Cap at 50% loss
      months.push(`Month ${i}`);
    }
  }

  portfolioValue[12] = finalValue;

  const changeDirection = isPositive ? "increase" : "decline";
  const changeText = isPositive ? "growth" : "decline";

  return {
    analysis: `Based on the scenario "${scenario}", this portfolio would experience a ${Math.abs(percentageChange).toFixed(1)}% ${changeDirection}. The stress test shows how different asset classes would be impacted, with equities typically most affected, bonds providing ${isPositive ? "additional gains" : "some stability"}, and cash remaining relatively stable.`,
    impact: {
      equities: equitiesImpact,
      bonds: bondsImpact,
      alternatives: alternativesImpact,
      cash: 0,
    },
    portfolioValue,
    months,
    finalValue,
    percentageChange,
    riskLevel: isPositive ? "Low" : riskLevel,
  };
}

