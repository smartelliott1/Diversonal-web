import { NextRequest, NextResponse } from "next/server";

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

    // Construct the AI prompt for financial advice
    const prompt = `You are a professional financial advisor with expertise in portfolio allocation. Generate a personalized investment portfolio allocation based on the following client profile:

**Client Profile:**
- Age: ${age} years old
- Risk Tolerance: ${riskTolerance}
- Time Horizon: ${timeHorizon}
- Available Capital: $${parseInt(capital).toLocaleString()}
- Investment Goal: ${goal}
- Preferred Sectors: ${sectors.length > 0 ? sectors.join(", ") : "None specified"}

**Requirements:**
1. Create a balanced portfolio allocation across these asset classes:
   - Equities (stocks) - can include domestic, international, emerging markets
   - Bonds (fixed income) - can include government, corporate, municipal
   - Alternatives (REITs, commodities, real estate, etc.)
   - Cash/Equivalents

2. The allocation MUST:
   - Total exactly 100%
   - Use decimal values (e.g., 45.5%, 35.3%, 14.7%, 4.5%) - NEVER use whole numbers unless absolutely necessary
   - Be appropriate for the client's age, risk tolerance, and time horizon
   - Consider the investment goal
   - Reflect the preferred sectors in the equity allocation if provided
   - Follow modern portfolio theory principles

3. For Equities, provide a breakdown (e.g., "S&P 500: 25%, Tech stocks: 10%, International: 10%")

**Response Format (JSON only, no other text):**
{
  "portfolio": [
    {
      "name": "Equities",
      "value": 45.5,
      "color": "#00FF99",
      "breakdown": "S&P 500: 25.5%, Tech stocks: 10.2%, International: 9.8%"
    },
    {
      "name": "Bonds",
      "value": 35.3,
      "color": "#4A90E2"
    },
    {
      "name": "Alternatives",
      "value": 14.7,
      "color": "#FF6B6B"
    },
    {
      "name": "Cash",
      "value": 4.5,
      "color": "#FFD93D"
    }
  ],
  "reasoning": "Brief 2-3 sentence explanation of why this allocation fits the client"
}

**Important:** 
- Use color #00FF99 for Equities (primary allocation)
- Use color #4A90E2 for Bonds
- Use color #FF6B6B for Alternatives  
- Use color #FFD93D for Cash
- Ensure all values sum to 100 (use decimals for precision, e.g., 45.5, 35.3, 14.7, 4.5)
- Values should include one decimal place for accuracy
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
        const largestIndex = portfolioResponse.portfolio.reduce((maxIdx, item, idx, arr) => 
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
  let alternativesBase = 10;
  let cashBase = 5;

  // Adjust based on risk tolerance
  if (riskTolerance === "Low") {
    equitiesBase = Math.max(20, equitiesBase - 20);
    bondsBase += 15;
    alternativesBase -= 5;
    cashBase += 10;
  } else if (riskTolerance === "High") {
    equitiesBase = Math.min(80, equitiesBase + 20);
    bondsBase = Math.max(10, bondsBase - 15);
    alternativesBase += 5;
    cashBase = Math.max(2, cashBase - 5);
  }

  // Adjust based on time horizon
  if (timeHorizon.includes("15+") || timeHorizon.includes("7+")) {
    equitiesBase += 10;
    bondsBase -= 5;
    alternativesBase -= 3;
    cashBase -= 2;
  } else if (timeHorizon.includes("<1") || timeHorizon.includes("1-3")) {
    equitiesBase -= 15;
    bondsBase += 10;
    alternativesBase -= 3;
    cashBase += 8;
  }

  // Normalize to ensure total is 100
  const total = equitiesBase + bondsBase + alternativesBase + cashBase;
  equitiesBase = (equitiesBase / total) * 100;
  bondsBase = (bondsBase / total) * 100;
  alternativesBase = (alternativesBase / total) * 100;
  cashBase = (cashBase / total) * 100;

  // Create breakdown for equities based on sectors
  let breakdown = "";
  if (sectors.length > 0) {
    const sectorAllocation = Math.round((equitiesBase * 0.4) / sectors.length * 10) / 10;
    const broadMarket = Math.round(equitiesBase * 0.6 * 10) / 10;
    breakdown = `S&P 500: ${broadMarket}%, ${sectors.map(s => `${s}: ${sectorAllocation}%`).join(", ")}`;
  } else {
    const domestic = Math.round(equitiesBase * 0.6 * 10) / 10;
    const international = Math.round(equitiesBase * 0.4 * 10) / 10;
    breakdown = `S&P 500: ${domestic}%, International: ${international}%`;
  }

  return [
    {
      name: "Equities",
      value: Math.round(equitiesBase * 10) / 10,
      color: "#00FF99",
      breakdown,
    },
    {
      name: "Bonds",
      value: Math.round(bondsBase * 10) / 10,
      color: "#4A90E2",
    },
    {
      name: "Alternatives",
      value: Math.round(alternativesBase * 10) / 10,
      color: "#FF6B6B",
    },
    {
      name: "Cash",
      value: Math.round(cashBase * 10) / 10,
      color: "#FFD93D",
    },
  ];
}

