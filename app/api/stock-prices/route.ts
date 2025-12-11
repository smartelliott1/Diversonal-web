import { NextRequest, NextResponse } from "next/server";

// Stock Prices API - Fetches real-time prices for specific tickers
// Used to display live prices in recommendation UI

// Crypto tickers that need to be routed to crypto quote API
const CRYPTO_TICKERS = ['BTC', 'ETH', 'XMR', 'LINK', 'SOL', 'ADA'];

// Check if a ticker is a cryptocurrency
function isCryptoTicker(ticker: string): boolean {
  return CRYPTO_TICKERS.includes(ticker.toUpperCase());
}

// Convert crypto ticker to FMP format (BTC -> BTCUSD)
function getCryptoSymbol(ticker: string): string {
  return `${ticker.toUpperCase()}USD`;
}

async function fetchFMP(endpoint: string): Promise<any> {
  const FMP_API_KEY = process.env.FMP_API_KEY;
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY not configured");
  }
  
  const url = `https://financialmodelingprep.com${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${FMP_API_KEY}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
    cache: 'no-store', // Always get fresh data
  });
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }
  
  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickers } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: "Invalid tickers array" },
        { status: 400 }
      );
    }

    console.log(`[Stock Prices] Fetching prices for ${tickers.length} tickers:`, tickers);
    
    // Fetch all tickers in parallel (limit to 50 to avoid overwhelming API)
    const tickersToFetch = tickers.slice(0, 50);
    const pricePromises = tickersToFetch.map(async (ticker) => {
      try {
        // Check if this is a crypto ticker and use appropriate symbol format
        const isCrypto = isCryptoTicker(ticker);
        const symbol = isCrypto ? getCryptoSymbol(ticker) : ticker;
        
        console.log(`[Stock Prices] Fetching ${ticker} as ${symbol} (crypto: ${isCrypto})`);
        
        const data = await fetchFMP(`/stable/quote?symbol=${symbol}`);
        if (data && data[0]) {
          return {
            ticker, // Return original ticker for mapping
            price: data[0].price,
            change: data[0].change,
            changePercentage: data[0].changePercentage,
            exchange: data[0].exchange || null, // Include exchange for TradingView chart
            success: true,
          };
        }
        return { ticker, success: false, error: "No data" };
      } catch (error) {
        console.error(`[Stock Prices] Error fetching ${ticker}:`, error);
        return { ticker, success: false, error: "Fetch failed" };
      }
    });

    const results = await Promise.all(pricePromises);
    
    // Create a map of ticker -> price data
    const priceMap: Record<string, any> = {};
    results.forEach((result) => {
      if (result.success) {
        priceMap[result.ticker] = {
          price: result.price,
          change: result.change,
          changePercentage: result.changePercentage,
          exchange: result.exchange,
        };
      }
    });

    console.log(`[Stock Prices] Successfully fetched ${Object.keys(priceMap).length}/${tickersToFetch.length} prices`);
    
    return NextResponse.json({ prices: priceMap });
    
  } catch (error: any) {
    console.error("[Stock Prices] Error:", error);
    
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch stock prices: ${error?.message || 'Unknown error'}`
      : "Stock prices temporarily unavailable.";
    
    return NextResponse.json(
      { error: errorMessage, prices: {} },
      { status: 500 }
    );
  }
}

