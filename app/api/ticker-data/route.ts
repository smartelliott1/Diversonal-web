import { NextRequest, NextResponse } from "next/server";

// Ticker Data API - Fetches real-time data for landing page ticker stream
// Returns stocks, indices, crypto, and commodities

async function fetchFMP(endpoint: string): Promise<any> {
  const FMP_API_KEY = process.env.FMP_API_KEY;
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY not configured");
  }
  
  const url = `https://financialmodelingprep.com${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${FMP_API_KEY}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
    cache: 'no-store', // Always get fresh data for landing page
  });
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }
  
  return await response.json();
}

export async function GET(request: NextRequest) {
  try {
    console.log("[Ticker Data] Fetching real-time ticker data...");
    
    // Fetch all ticker symbols in parallel
    const [
      sp500Data,
      nasdaqData,
      vixData,
      nvdaData,
      tslaData,
      aaplData,
      googlData,
      amznData,
      btcData,
      ethData,
      solData,
      xmrData,
      goldData,
      silverData,
    ] = await Promise.all([
      fetchFMP("/stable/quote?symbol=^GSPC"),
      fetchFMP("/stable/quote?symbol=^IXIC"),
      fetchFMP("/stable/quote?symbol=^VIX"),
      fetchFMP("/stable/quote?symbol=NVDA"),
      fetchFMP("/stable/quote?symbol=TSLA"),
      fetchFMP("/stable/quote?symbol=AAPL"),
      fetchFMP("/stable/quote?symbol=GOOGL"),
      fetchFMP("/stable/quote?symbol=AMZN"),
      fetchFMP("/stable/quote?symbol=BTCUSD"),
      fetchFMP("/stable/quote?symbol=ETHUSD"),
      fetchFMP("/stable/quote?symbol=SOLUSD"),
      fetchFMP("/stable/quote?symbol=XMRUSD"),
      fetchFMP("/stable/quote?symbol=GCUSD"),
      fetchFMP("/stable/quote?symbol=SIUSD"),
    ]);
    
    // Format response data
    const tickerData = [
      {
        label: "S&P 500",
        symbol: "^GSPC",
        price: sp500Data[0].price.toFixed(2),
        change: sp500Data[0].changePercentage,
      },
      {
        label: "Nasdaq",
        symbol: "^IXIC",
        price: nasdaqData[0].price.toFixed(2),
        change: nasdaqData[0].changePercentage,
      },
      {
        label: "VIX",
        symbol: "^VIX",
        price: vixData[0].price.toFixed(2),
        change: vixData[0].changePercentage,
      },
      {
        label: "NVDA",
        symbol: "NVDA",
        price: `$${nvdaData[0].price.toFixed(2)}`,
        change: nvdaData[0].changePercentage,
      },
      {
        label: "TSLA",
        symbol: "TSLA",
        price: `$${tslaData[0].price.toFixed(2)}`,
        change: tslaData[0].changePercentage,
      },
      {
        label: "AAPL",
        symbol: "AAPL",
        price: `$${aaplData[0].price.toFixed(2)}`,
        change: aaplData[0].changePercentage,
      },
      {
        label: "GOOGL",
        symbol: "GOOGL",
        price: `$${googlData[0].price.toFixed(2)}`,
        change: googlData[0].changePercentage,
      },
      {
        label: "AMZN",
        symbol: "AMZN",
        price: `$${amznData[0].price.toFixed(2)}`,
        change: amznData[0].changePercentage,
      },
      {
        label: "BTC",
        symbol: "BTCUSD",
        price: `$${btcData[0].price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change: btcData[0].changePercentage,
      },
      {
        label: "ETH",
        symbol: "ETHUSD",
        price: `$${ethData[0].price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change: ethData[0].changePercentage,
      },
      {
        label: "SOL",
        symbol: "SOLUSD",
        price: `$${solData[0].price.toFixed(2)}`,
        change: solData[0].changePercentage,
      },
      {
        label: "XMR",
        symbol: "XMRUSD",
        price: `$${xmrData[0].price.toFixed(2)}`,
        change: xmrData[0].changePercentage,
      },
      {
        label: "GOLD",
        symbol: "GCUSD",
        price: `$${goldData[0].price.toFixed(2)}`,
        change: goldData[0].changePercentage,
      },
      {
        label: "SILVER",
        symbol: "SIUSD",
        price: `$${silverData[0].price.toFixed(2)}`,
        change: silverData[0].changePercentage,
      },
    ];
    
    console.log("[Ticker Data] Successfully fetched", tickerData.length, "ticker symbols");
    
    return NextResponse.json({ tickers: tickerData });
    
  } catch (error: any) {
    console.error("[Ticker Data] Error:", error);
    
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch ticker data: ${error?.message || 'Unknown error'}`
      : "Ticker data temporarily unavailable.";
    
    return NextResponse.json(
      { error: errorMessage, tickers: [] },
      { status: 500 }
    );
  }
}

