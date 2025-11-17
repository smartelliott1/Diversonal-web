import { NextRequest, NextResponse } from "next/server";
import { getComprehensiveMarketContext } from "@/app/lib/financialData";

// Using OpenAI's GPT-4 for financial advice
// This is one of the most advanced models available for complex reasoning tasks
// Alternative: You can also use Claude (Anthropic) or Gemini Pro (Google)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface PortfolioRequest {
  age: string;
  riskTolerance: string;
  timeHorizon: string;
  capital: string;
  goal: string;
  sectors: string[];
}

interface PortfolioAllocation {
  name: string;
  value: number;
  color: string;
  breakdown?: string; // e.g., "S&P 500: 25%, Tech stocks 10%, Global stocks 10%"
}

export async function POST(request: NextRequest) {
  try {
    const body: PortfolioRequest = await request.json();
    const { age, riskTolerance, timeHorizon, capital, goal, sectors } = body;

    // Validate required fields
    if (!age || !riskTolerance || !timeHorizon || !capital || !goal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If no API key, use a sophisticated fallback algorithm
    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not set, using fallback algorithm");
      console.log("Environment check - NODE_ENV:", process.env.NODE_ENV);
      console.log("API Key exists:", !!OPENAI_API_KEY);
      return NextResponse.json({
        portfolio: generateFallbackPortfolio(age, riskTolerance, timeHorizon, capital, goal, sectors),
        reasoning: "Generated using Diversonal's proprietary algorithm",
      });
    }

    console.log("OPENAI_API_KEY found, attempting to call OpenAI API");

    // Fetch live market data for context
    let marketContext = "";
    try {
      marketContext = await getComprehensiveMarketContext();
      console.log("Successfully fetched live market data from FMP API");
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return NextResponse.json(
        { error: "Market data temporarily unavailable. Please try again in a few moments." },
        { status: 503 }
      );
    }

    // Construct the AI prompt for financial advice
    const prompt = `You are a professional financial advisor with expertise in portfolio allocation. Generate a personalized investment portfolio allocation based on the following client profile:

**Client Profile:**
- Age: ${age} years old
- Risk Tolerance: ${riskTolerance}
- Time Horizon: ${timeHorizon}
- Available Capital: $${parseInt(capital).toLocaleString()}
- Investment Goal: ${goal}
- Preferred Sectors: ${sectors.length > 0 ? sectors.join(", ") : "None specified"}

${marketContext}

**⚠️ CRITICAL - DATA SOURCE REQUIREMENTS:**
The LIVE MARKET DATA section above contains REAL-TIME prices and indicators as of today. You MUST:
- Use ONLY the prices, indicators, and data shown in the LIVE MARKET DATA section above
- COMPLETELY IGNORE all prices and market data from your training cutoff - they are outdated and incorrect
- When analyzing market conditions or asset classes, reference the EXACT current data from the live market data
- Example: If live data shows "Gold: $4,125.50 (+2.3%)", use $4,125.50 in your reasoning, NOT any training data price
- Base allocation decisions on the actual current market cycle, RSI, VIX, and sector performance shown in the live data
- Use the actual Fed funds rate and treasury yields shown for bond allocation decisions

**Requirements:**
1. Create a balanced portfolio allocation across these asset classes:
   - Equities (stocks) - can include domestic, international, emerging markets
   - Bonds (fixed income) - can include government, corporate, municipal
   - Commodities (gold, silver, oil, etc.)
   - Real Estate (REITs, etc.)
   - Cryptocurrencies (Bitcoin, Ethereum, etc.)
   - Cash/Equivalents

2. The allocation MUST:
   - Total exactly 100%
   - Use decimal values (e.g., 45.5%, 35.3%, 14.7%, 4.5%) - NEVER use whole numbers unless absolutely necessary (make it as specific as physically possible to the client's inputs)
   - Be appropriate for the client's age, risk tolerance, and time horizon
   - Consider the investment goal
   - Reflect the preferred sectors in the equity allocation if provided
   - Consider CURRENT MARKET CONDITIONS shown above (sector performance, market cycle, volatility, Fed policy)
   - If markets are in correction/bear market, increase bonds/cash allocations slightly
   - If specific sectors are leading, weight those more heavily in preferred sectors
   - Adjust crypto allocation based on risk appetite and current volatility (VIX)
   - Follow modern portfolio theory principles
   - Only include asset classes that are relevant to the client's inputs (Typically, all but one or two asset classes)

3. For Equities (and every other asset class), provide a breakdown (e.g., "S&P 500: 25%, Tech stocks: 10%, International: 10%")

**Response Format (JSON only, no other text):**
{
  "portfolio": [
    {
      "name": "Equities",
      "value": 38.2,
      "color": "#00FF99",
      "breakdown": "S&P 500: 22.1%, Tech stocks: 8.5%, International: 7.6%"
    },
    {
      "name": "Bonds",
      "value": 28.5,
      "color": "#4A90E2",
      "breakdown": "Government: 16.5%, Corporate: 12.0%"
    },
    {
      "name": "Commodities",
      "value": 11.3,
      "color": "#FFB84D",
      "breakdown": "Gold: 6.3%, Silver: 3.0%, Energy: 2.0%"
    },
    {
      "name": "Real Estate",
      "value": 13.7,
      "color": "#9B59B6",
      "breakdown": "REITs: 10.2%, Real Estate Funds: 3.5%"
    },
    {
      "name": "Cryptocurrencies",
      "value": 4.8,
      "color": "#00D4FF",
      "breakdown": "Bitcoin: 3.0%, Ethereum: 1.8%"
    },
    {
      "name": "Cash",
      "value": 3.5,
      "color": "#FFD93D"
    }
  ],
  "reasoning": "Brief 2-3 sentence explanation of why this allocation fits the client"
}

**Important:** 
- Use color #00FF99 for Equities (primary allocation)
- Use color #4A90E2 for Bonds
- Use color #FFB84D for Commodities (gold/orange - represents precious metals and resources)
- Use color #9B59B6 for Real Estate (purple - for property/REITs)
- Use color #00D4FF for Cryptocurrencies (cyan - represents digital assets)
- Use color #FFD93D for Cash
- Ensure all values sum to 100 (use decimals for precision)
- Values should include one decimal place for accuracy
- Not all asset classes need to be included - only include those relevant to the client's profile
- Return ONLY valid JSON, no markdown or code blocks`;

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using GPT-4 Omni - the latest and most capable model
        messages: [
          {
            role: "system",
            content: "You are a professional financial advisor. Always respond with valid JSON only, no additional text or markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7, // Balanced creativity and consistency
        response_format: { type: "json_object" }, // Force JSON response
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      console.error("OpenAI API error - Status:", response.status);
      console.error("OpenAI API error - Response:", errorData);
      
      // Check if it's a quota/billing error
      const errorMessage = errorData?.error?.message || errorText;
      if (errorMessage.includes("quota") || errorMessage.includes("billing") || errorMessage.includes("exceeded")) {
        console.warn("OpenAI quota/billing error - using fallback algorithm");
        return NextResponse.json({
          portfolio: generateFallbackPortfolio(age, riskTolerance, timeHorizon, capital, goal, sectors),
          reasoning: "Generated using Diversonal's proprietary algorithm (OpenAI quota/billing issue - please check your OpenAI account)",
        });
      }
      
      // Fallback to algorithm if API fails for other reasons
      return NextResponse.json({
        portfolio: generateFallbackPortfolio(age, riskTolerance, timeHorizon, capital, goal, sectors),
        reasoning: `Generated using Diversonal's proprietary algorithm (OpenAI error: ${errorMessage.substring(0, 100)})`,
      });
    }

    console.log("OpenAI API call successful, parsing response...");

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let portfolioResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      portfolioResponse = JSON.parse(cleanedContent);
      
      // Ensure all values are numbers with decimals (convert integers to decimals)
      portfolioResponse.portfolio = portfolioResponse.portfolio.map((item: PortfolioAllocation) => {
        // If value is a whole number, add a small random decimal to make it unique
        // Otherwise preserve the decimal
        let value = item.value;
        if (Number.isInteger(value)) {
          // Convert whole numbers to decimals by adding 0.1-0.9
          value = value + (Math.random() * 0.9 - 0.45); // -0.45 to +0.45 range
          value = Math.round(value * 10) / 10; // Round to 1 decimal
        }
        return {
          ...item,
          value: Math.round(value * 10) / 10, // Ensure 1 decimal place
        };
      });
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback to algorithm
      return NextResponse.json({
        portfolio: generateFallbackPortfolio(age, riskTolerance, timeHorizon, capital, goal, sectors),
        reasoning: "Generated using Diversonal's proprietary algorithm",
      });
    }

    // Validate the portfolio sums to 100
    const total = portfolioResponse.portfolio.reduce((sum: number, item: PortfolioAllocation) => sum + item.value, 0);
    if (Math.abs(total - 100) > 0.1) {
      console.log("Portfolio total not 100, normalizing...", total);
      // Normalize to 100% while preserving decimals
      const factor = 100 / total;
      portfolioResponse.portfolio = portfolioResponse.portfolio.map((item: PortfolioAllocation) => {
        const normalizedValue = item.value * factor;
        return {
          ...item,
          value: Math.round(normalizedValue * 10) / 10, // Always round to 1 decimal place
        };
      });
      
      // Recalculate total after normalization and adjust the last item to ensure exactly 100
      const newTotal = portfolioResponse.portfolio.reduce((sum: number, item: PortfolioAllocation) => sum + item.value, 0);
      const diff = 100 - newTotal;
      if (Math.abs(diff) > 0.01) {
        // Adjust the largest allocation to make it exactly 100
        const largestIndex = portfolioResponse.portfolio.reduce((maxIdx: number, item: PortfolioAllocation, idx: number, arr: PortfolioAllocation[]) => 
          item.value > arr[maxIdx].value ? idx : maxIdx, 0
        );
        portfolioResponse.portfolio[largestIndex].value = Math.round((portfolioResponse.portfolio[largestIndex].value + diff) * 10) / 10;
      }
    }
    
    // Final pass: ensure all values have exactly one decimal place (even if .0)
    portfolioResponse.portfolio = portfolioResponse.portfolio.map((item: PortfolioAllocation) => ({
      ...item,
      value: Math.round(item.value * 10) / 10, // Round to 1 decimal place
    }));

    console.log("Successfully generated portfolio using OpenAI:", portfolioResponse);
    return NextResponse.json(portfolioResponse);
  } catch (error) {
    console.error("Error generating portfolio:", error);
    return NextResponse.json(
      { error: "Failed to generate portfolio. Please try again." },
      { status: 500 }
    );
  }
}

// Sophisticated fallback algorithm when AI is unavailable
function generateFallbackPortfolio(
  age: string,
  riskTolerance: string,
  timeHorizon: string,
  capital: string,
  goal: string,
  sectors: string[]
): PortfolioAllocation[] {
  const ageNum = parseInt(age) || 35;
  const capitalNum = parseInt(capital) || 10000;
  
  // Base allocation starts with age-based rule: (100 - age) for equities
  let equitiesBase = Math.max(20, 100 - ageNum);
  let bondsBase = Math.min(60, ageNum - 10);
  let commoditiesBase = 8;
  let realEstateBase = 10;
  let cryptoBase = 0; // Start with 0, only allocate for high risk tolerance
  let cashBase = 5;

  // Adjust based on risk tolerance
  if (riskTolerance === "Low") {
    equitiesBase = Math.max(20, equitiesBase - 20);
    bondsBase += 15;
    commoditiesBase += 3; // Commodities as inflation hedge
    realEstateBase -= 5;
    cryptoBase = 0; // No crypto for low risk
    cashBase += 12;
  } else if (riskTolerance === "High") {
    equitiesBase = Math.min(75, equitiesBase + 15);
    bondsBase = Math.max(10, bondsBase - 15);
    commoditiesBase += 2;
    realEstateBase += 5;
    cryptoBase = ageNum < 40 ? 8 : 5; // Crypto for high risk, more if younger
    cashBase = Math.max(2, cashBase - 5);
  } else {
    // Moderate risk
    commoditiesBase += 1;
    realEstateBase += 2;
    cryptoBase = ageNum < 35 ? 4 : 2; // Small crypto allocation for moderate risk if young
  }

  // Adjust based on time horizon
  if (timeHorizon.includes("15+") || timeHorizon.includes("7+")) {
    equitiesBase += 8;
    bondsBase -= 5;
    commoditiesBase -= 2;
    realEstateBase += 3;
    cryptoBase = riskTolerance === "High" ? cryptoBase + 2 : cryptoBase;
    cashBase -= 2;
  } else if (timeHorizon.includes("<1") || timeHorizon.includes("1-3")) {
    equitiesBase -= 15;
    bondsBase += 10;
    commoditiesBase -= 2;
    realEstateBase -= 5;
    cryptoBase = Math.max(0, cryptoBase - 3); // Reduce crypto for short horizon
    cashBase += 10;
  }

  // Ensure crypto is 0 for low risk or very old age
  if (riskTolerance === "Low" || ageNum > 60) {
    cryptoBase = 0;
  }

  // Normalize to ensure total is 100
  const total = equitiesBase + bondsBase + commoditiesBase + realEstateBase + cryptoBase + cashBase;
  equitiesBase = (equitiesBase / total) * 100;
  bondsBase = (bondsBase / total) * 100;
  commoditiesBase = (commoditiesBase / total) * 100;
  realEstateBase = (realEstateBase / total) * 100;
  cryptoBase = (cryptoBase / total) * 100;
  cashBase = (cashBase / total) * 100;

  // Create breakdown for equities based on sectors
  let equitiesBreakdown = "";
  if (sectors.length > 0) {
    const sectorAllocation = Math.round((equitiesBase * 0.4) / sectors.length * 10) / 10;
    const broadMarket = Math.round(equitiesBase * 0.6 * 10) / 10;
    equitiesBreakdown = `S&P 500: ${broadMarket}%, ${sectors.map(s => `${s}: ${sectorAllocation}%`).join(", ")}`;
  } else {
    const domestic = Math.round(equitiesBase * 0.6 * 10) / 10;
    const international = Math.round(equitiesBase * 0.4 * 10) / 10;
    equitiesBreakdown = `S&P 500: ${domestic}%, International: ${international}%`;
  }

  const portfolio: PortfolioAllocation[] = [
    {
      name: "Equities",
      value: Math.round(equitiesBase * 10) / 10,
      color: "#00FF99",
      breakdown: equitiesBreakdown,
    },
    {
      name: "Bonds",
      value: Math.round(bondsBase * 10) / 10,
      color: "#4A90E2",
      breakdown: "Government: " + Math.round(bondsBase * 0.6 * 10) / 10 + "%, Corporate: " + Math.round(bondsBase * 0.4 * 10) / 10 + "%",
    },
  ];

  // Only include asset classes with meaningful allocation
  if (commoditiesBase > 0.5) {
    portfolio.push({
      name: "Commodities",
      value: Math.round(commoditiesBase * 10) / 10,
      color: "#FFB84D",
      breakdown: "Gold: " + Math.round(commoditiesBase * 0.6 * 10) / 10 + "%, Silver: " + Math.round(commoditiesBase * 0.3 * 10) / 10 + "%, Energy: " + Math.round(commoditiesBase * 0.1 * 10) / 10 + "%",
    });
  }

  if (realEstateBase > 0.5) {
    portfolio.push({
      name: "Real Estate",
      value: Math.round(realEstateBase * 10) / 10,
      color: "#9B59B6",
      breakdown: "REITs: " + Math.round(realEstateBase * 0.7 * 10) / 10 + "%, Real Estate Funds: " + Math.round(realEstateBase * 0.3 * 10) / 10 + "%",
    });
  }

  if (cryptoBase > 0.5) {
    portfolio.push({
      name: "Cryptocurrencies",
      value: Math.round(cryptoBase * 10) / 10,
      color: "#00D4FF",
      breakdown: "Bitcoin: " + Math.round(cryptoBase * 0.6 * 10) / 10 + "%, Ethereum: " + Math.round(cryptoBase * 0.4 * 10) / 10 + "%",
    });
  }

  portfolio.push({
    name: "Cash",
    value: Math.round(cashBase * 10) / 10,
    color: "#FFD93D",
  });

  // Final normalization to ensure exactly 100%
  const finalTotal = portfolio.reduce((sum, item) => sum + item.value, 0);
  if (Math.abs(finalTotal - 100) > 0.1) {
    const diff = 100 - finalTotal;
    portfolio[0].value = Math.round((portfolio[0].value + diff) * 10) / 10;
  }

  return portfolio;
}

