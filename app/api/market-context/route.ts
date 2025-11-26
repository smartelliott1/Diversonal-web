import { NextRequest, NextResponse } from "next/server";
import { callGrokMarketContext } from "@/app/lib/grokClient";
import { getMarketData, calculateDiversonalFearGreedIndex, getCryptoData, getCommodityData } from "@/app/lib/financialData";

// Stage 1: Market Context API
// Fetches live market data (indices + crypto), calculates Diversonal Fear & Greed Index, and asks Grok for market summary

async function fetchFMP(endpoint: string): Promise<any> {
  const FMP_API_KEY = process.env.FMP_API_KEY;
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY not configured");
  }
  
  const url = `https://financialmodelingprep.com${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${FMP_API_KEY}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }
  
  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Market Context] Fetching market data and calculating Fear & Greed Index...");
    
    // Fetch all data in parallel
    const [
      russellData,
      nvdaData,
      tslaData,
      aaplData,
      googlData,
      amznData,
      marketData,
      cryptoData,
      commodityData,
      fearGreedData,
      grokResponse
    ] = await Promise.all([
      fetchFMP("/stable/quote?symbol=^RUT"),
      fetchFMP("/stable/quote?symbol=NVDA"),
      fetchFMP("/stable/quote?symbol=TSLA"),
      fetchFMP("/stable/quote?symbol=AAPL"),
      fetchFMP("/stable/quote?symbol=GOOGL"),
      fetchFMP("/stable/quote?symbol=AMZN"),
      getMarketData(),
      getCryptoData(),
      getCommodityData(),
      calculateDiversonalFearGreedIndex(),
      callGrokMarketContext(),
    ]);
    
    const russell = russellData[0];
    const nvda = nvdaData[0];
    const tsla = tslaData[0];
    const aapl = aaplData[0];
    const googl = googlData[0];
    const amzn = amznData[0];
    
    console.log("[Market Context] Fear & Greed:", fearGreedData);
    console.log("[Market Context] Grok response:", grokResponse);
    
    // Combine all data
    const response = {
      sp500: {
        price: marketData.sp500,
        change: marketData.sp500Change,
        changePercent: marketData.sp500Change,
      },
      nasdaq: {
        price: marketData.nasdaq,
        change: marketData.nasdaqChange,
        changePercent: marketData.nasdaqChange,
      },
      dow: {
        price: marketData.dow,
        change: marketData.dowChange,
        changePercent: marketData.dowChange,
      },
      russell2000: {
        price: russell.price,
        change: russell.changePercentage,
        changePercent: russell.changePercentage,
      },
      vix: {
        price: marketData.vix,
        change: marketData.vixChange,
        changePercent: marketData.vixChange,
      },
      nvda: {
        price: nvda.price,
        change: nvda.changePercentage,
        changePercent: nvda.changePercentage,
      },
      tsla: {
        price: tsla.price,
        change: tsla.changePercentage,
        changePercent: tsla.changePercentage,
      },
      aapl: {
        price: aapl.price,
        change: aapl.changePercentage,
        changePercent: aapl.changePercentage,
      },
      googl: {
        price: googl.price,
        change: googl.changePercentage,
        changePercent: googl.changePercentage,
      },
      amzn: {
        price: amzn.price,
        change: amzn.changePercentage,
        changePercent: amzn.changePercentage,
      },
      btc: {
        price: cryptoData.bitcoin,
        change: cryptoData.bitcoinChange,
        changePercent: cryptoData.bitcoinChange,
      },
      eth: {
        price: cryptoData.ethereum,
        change: cryptoData.ethereumChange,
        changePercent: cryptoData.ethereumChange,
      },
      sol: {
        price: cryptoData.solana,
        change: cryptoData.solanaChange,
        changePercent: cryptoData.solanaChange,
      },
      xmr: {
        price: cryptoData.monero,
        change: cryptoData.moneroChange,
        changePercent: cryptoData.moneroChange,
      },
      gold: {
        price: commodityData.gold,
        change: commodityData.goldChange,
        changePercent: commodityData.goldChange,
      },
      silver: {
        price: commodityData.silver,
        change: commodityData.silverChange,
        changePercent: commodityData.silverChange,
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

