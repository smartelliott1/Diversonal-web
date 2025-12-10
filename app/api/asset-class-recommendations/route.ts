import { NextRequest, NextResponse } from "next/server";
import { callGrokStreaming } from "@/app/lib/grokClient";
import { 
  getComprehensiveMarketContext,
  getInsiderTradingSignals,
} from "@/app/lib/financialData";
import { getSectorFilesToLoad, formatSectorDataForClaude } from "@/app/lib/sectorMapper";
import { loadMultipleSectors } from "@/app/lib/fundamentalsStorage";

// Per-Asset-Class Recommendations API
// Generates recommendations for a single asset class at a time

const XAI_API_KEY = process.env.XAI_API_KEY;

interface AssetClassRecommendationsRequest {
  assetClass: string;
  allocation: number;
  breakdown?: string;
  formData: {
    age: string;
    risk: number;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  };
  stockCount?: number; // How many recommendations to generate (default based on asset class)
}

// Default stock counts by asset class
const DEFAULT_STOCK_COUNTS: Record<string, number> = {
  "Equities": 7,
  "Bonds": 6,
  "Cryptocurrencies": 6,
  "Commodities": 4,
  "Real Estate": 4,
  "Cash": 3,
};

export async function POST(request: NextRequest) {
  let body: AssetClassRecommendationsRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { assetClass, allocation, breakdown, formData, stockCount } = body;

  if (!assetClass || !formData) {
    return NextResponse.json(
      { error: "Missing required fields: assetClass and formData" },
      { status: 400 }
    );
  }

  // If no API key, return error
  if (!XAI_API_KEY) {
    console.warn("XAI_API_KEY not set");
    return NextResponse.json(
      { error: "API configuration missing. Please contact support." },
      { status: 503 }
    );
  }

  try {
    const recommendationCount = stockCount || DEFAULT_STOCK_COUNTS[assetClass] || 5;
    
    // Fetch market context (lightweight)
    let marketContext = "";
    try {
      marketContext = await getComprehensiveMarketContext();
    } catch (error) {
      console.error("Failed to fetch market context:", error);
    }

    // Fetch insider signals for equities
    let insiderSignals = "";
    if (assetClass === "Equities") {
      try {
        const insiderTrades = await getInsiderTradingSignals();
        const significantBuys = insiderTrades
          .filter(trade => 
            trade.acquistionOrDisposition === 'A' && 
            trade.securitiesTransacted > 10000 && 
            trade.price > 0
          )
          .slice(0, 8);
        
        if (significantBuys.length > 0) {
          insiderSignals = `\n**RECENT INSIDER BUYING SIGNALS:**\n`;
          insiderSignals += significantBuys.map(trade => {
            const value = (trade.securitiesTransacted * trade.price / 1000000).toFixed(2);
            return `- ${trade.symbol}: ${trade.reportingName} bought ${trade.securitiesTransacted.toLocaleString()} shares @ $${trade.price.toFixed(2)} (~$${value}M)`;
          }).join('\n');
        }
      } catch (error) {
        console.error("Failed to fetch insider signals:", error);
      }
    }

    // Load fundamentals for relevant sectors
    let fundamentalsData = "";
    try {
      const sectorFiles = getSectorFilesToLoad([{ name: assetClass, value: allocation }]);
      const sectorsData = loadMultipleSectors(sectorFiles);
      
      if (Object.keys(sectorsData).length > 0) {
        fundamentalsData = '\n' + formatSectorDataForClaude(sectorsData);
      }
    } catch (error) {
      console.error('Error loading fundamentals:', error);
    }

    // Build prompt for single asset class
    const prompt = buildAssetClassPrompt(assetClass, allocation, breakdown, formData, recommendationCount, marketContext, insiderSignals, fundamentalsData);

    console.log(`[Asset Class API] Generating ${recommendationCount} recommendations for ${assetClass}...`);

    // Call Grok with streaming
    const grokStream = await callGrokStreaming(prompt);
    
    // Process and return as streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = grokStream.getReader();
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const text = parsed.choices[0].delta.content;
                    controller.enqueue(encoder.encode(text));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Error generating asset class recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 }
    );
  }
}

function buildAssetClassPrompt(
  assetClass: string,
  allocation: number,
  breakdown: string | undefined,
  formData: any,
  stockCount: number,
  marketContext: string,
  insiderSignals: string,
  fundamentalsData: string
): string {
  // Asset-class specific guidelines
  const assetGuidelines: Record<string, string> = {
    "Equities": `
**EQUITIES SELECTION GUIDELINES:**
- Use actual beta values from fundamentals to match risk profile ${formData.risk}/100
- For risk 0-30: beta 0.4-0.9 (defensive)
- For risk 31-50: beta 0.8-1.2 (market-like)
- For risk 51-70: beta 1.0-1.5 (moderate growth)
- For risk 71-90: beta 1.3-2.0 (high growth)
- For risk 91-100: beta >1.5, prefer >2.0 (maximum aggression)
${formData.sectors.length > 0 ? `- PRIORITIZE user's conviction sectors: ${formData.sectors.join(", ")}` : ''}
${insiderSignals}`,

    "Bonds": `
**BONDS SELECTION GUIDELINES:**
Use bond ETF tickers ONLY:
- BND, AGG: Broad market exposure
- TLT: Long-duration treasuries (rate sensitive)
- IEF: Intermediate treasuries
- SHY: Short-term, low rate sensitivity
- LQD: Investment grade corporates
- HYG: High yield/junk bonds (higher risk)
- TIP: Inflation-protected treasuries
Match duration to time horizon: ${formData.horizon}`,

    "Commodities": `
**COMMODITIES SELECTION GUIDELINES:**
Use commodity ETF tickers ONLY (NOT commodity names):
- GLD, IAU, SGOL: Gold exposure
- SLV: Silver exposure
- PPLT: Platinum
- PALL: Palladium
- DBA: Agriculture
- USO: Oil
DO NOT use "GOLD", "SILVER", "OIL" as tickers.`,

    "Cryptocurrencies": `
**CRYPTOCURRENCIES GUIDELINES:**
Use ONLY these crypto symbols:
- BTC (Bitcoin)
- ETH (Ethereum)
- SOL (Solana)
- XMR (Monero)
- LINK (Chainlink)
- ADA (Cardano)
Do NOT recommend crypto stocks (MSTR, MARA, RIOT) - those belong in Equities.`,

    "Real Estate": `
**REAL ESTATE SELECTION GUIDELINES:**
Focus on REITs with these tickers:
- VNQ: Vanguard Real Estate ETF
- SCHH: Schwab US REIT ETF
- O: Realty Income (monthly dividend)
- AMT: American Tower (cell towers)
- PLD: Prologis (industrial/logistics)
- SPG: Simon Property Group (retail)
- WELL: Welltower (healthcare)`,

    "Cash": `
**CASH/MONEY MARKET GUIDELINES:**
Recommend money market funds:
- VMMXX: Vanguard Prime Money Market
- SPAXX: Fidelity Government Money Market
- SWVXX: Schwab Value Advantage Money Market
- VMFXX: Vanguard Federal Money Market
Explain current yield expectations based on Fed funds rate.`,
  };

  return `You are an expert financial analyst. Generate ${stockCount} investment recommendations for the ${assetClass} asset class.

**User Profile:**
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}

**Allocation for ${assetClass}:** ${allocation}%${breakdown ? ` (${breakdown})` : ''}

${marketContext}
${assetGuidelines[assetClass] || ''}
${fundamentalsData}

**Response Format (JSON only, no markdown):**
{
  "recommendations": [
    {
      "ticker": "SYMBOL",
      "name": "Full Company Name",
      "personalizedFit": "2-3 sentences explaining why this fits the user's specific situation, referencing their age, risk tolerance, time horizon, and goals. Make it personal and conversational.",
      "positionSize": "Large|Medium|Small",
      "riskLevel": "Low|Moderate|High",
      "rationale": "Brief technical/fundamental reason for recommendation"
    }
  ],
  "breakdown": [
    { "name": "SYMBOL", "value": 25, "color": "#A78BFA" }
  ]
}

**Guidelines:**
- Generate exactly ${stockCount} recommendations
- Position sizes: Large (25-35%), Medium (15-25%), Small (5-15%)
- **CRITICAL: Breakdown percentages MUST sum to EXACTLY 100. Double-check your math before responding.**
- Use varied hex colors for visualization
- DO NOT include stock prices - they will be fetched separately
- personalizedFit should directly reference user's profile (age ${formData.age}, ${formData.horizon} horizon, ${formData.risk}/100 risk)`;
}

