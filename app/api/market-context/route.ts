import { NextRequest, NextResponse } from "next/server";
import { callGrokMarketContext } from "@/app/lib/grokClient";
import { getMarketData } from "@/app/lib/financialData";

// Stage 1: Market Context API
// Fetches live S&P 500 data and asks Grok for Fear & Greed Index + market summary

export async function POST(request: NextRequest) {
  try {
    console.log("[Market Context] Fetching market data and calling Grok...");
    
    // Fetch live S&P 500 data from FMP
    const marketData = await getMarketData();
    
    // Call Grok to get Fear & Greed Index and market context
    const grokResponse = await callGrokMarketContext();
    
    console.log("[Market Context] Grok response:", grokResponse);
    
    // Combine FMP data with Grok's analysis
    const response = {
      sp500: {
        price: marketData.sp500,
        change: marketData.sp500Change,
        changePercent: marketData.sp500Change,
      },
      fearGreed: {
        value: grokResponse.fearGreedIndex,
        label: grokResponse.fearGreedLabel,
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

