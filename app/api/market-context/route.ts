import { NextRequest, NextResponse } from "next/server";
import { callGrokMarketContext } from "@/app/lib/grokClient";
import { getMarketData, calculateDiversonalFearGreedIndex } from "@/app/lib/financialData";

// Stage 1: Market Context API
// Fetches live S&P 500 data, calculates Diversonal Fear & Greed Index, and asks Grok for market summary

export async function POST(request: NextRequest) {
  try {
    console.log("[Market Context] Fetching market data and calculating Fear & Greed Index...");
    
    // Fetch live S&P 500 data from FMP and calculate Fear & Greed Index
    const [marketData, fearGreedData, grokResponse] = await Promise.all([
      getMarketData(),
      calculateDiversonalFearGreedIndex(),
      callGrokMarketContext(),
    ]);
    
    console.log("[Market Context] Fear & Greed:", fearGreedData);
    console.log("[Market Context] Grok response:", grokResponse);
    
    // Combine FMP data with calculated Fear & Greed and Grok's context
    const response = {
      sp500: {
        price: marketData.sp500,
        change: marketData.sp500Change,
        changePercent: marketData.sp500Change,
      },
      fearGreed: {
        value: fearGreedData.index,
        label: fearGreedData.label,
      },
      contextSummary: grokResponse.marketContext,
    };
    
    console.log("[Market Context] Returning response:", response);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("[Market Context] Error:", error);
    
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to generate market context: ${error?.message || 'Unknown error'}`
      : "Market data temporarily unavailable. Please try again.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

