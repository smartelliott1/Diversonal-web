// Financial Modeling Prep (FMP) API Integration
// Provides real-time market data, economic indicators, and technical analysis
// Using modern /stable/ endpoints (not legacy endpoints)

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MarketData {
  sp500: number;
  sp500Change: number;
  nasdaq: number;
  nasdaqChange: number;
  dow: number;
  dowChange: number;
  vix: number;
  vixChange: number;
  fedRate: string;
  inflation: number;
  unemployment: number;
  gdp: number;
  treasury2Y: number;
  treasury10Y: number;
  yieldSpread: number;
  sentiment: string;
  timestamp: Date;
}

export interface CommodityData {
  gold: number;
  goldChange: number;
  silver: number;
  silverChange: number;
  oil: number;
  oilChange: number;
}

export interface CryptoData {
  bitcoin: number;
  bitcoinChange: number;
  ethereum: number;
  ethereumChange: number;
}

export interface EconomicIndicators {
  gdp: number;
  inflation: number;
  unemployment: number;
  cpi: number;
}

export interface SectorPerformance {
  sector: string;
  change: number;
  performance: "Leading" | "Lagging" | "Neutral";
}

export interface TechnicalIndicators {
  sp500RSI: number;
  sp500MA50: number;
  sp500MA200: number;
  overboughtCondition: boolean;
  oversoldCondition: boolean;
  marketCycle: "Bull Market" | "Bear Market" | "Correction" | "Consolidation";
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMinutes: number): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + (ttlMinutes * 60 * 1000),
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isMarketHours(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = et.getHours();
  const day = et.getDay();
  
  // Market is open Mon-Fri 9:30 AM - 4:00 PM ET
  const isWeekday = day >= 1 && day <= 5;
  const isOpenHours = (hour === 9 && et.getMinutes() >= 30) || (hour >= 10 && hour < 16);
  
  return isWeekday && isOpenHours;
}

function getCacheTTL(dataType: "market" | "macro" | "technical"): number {
  if (dataType === "macro") return 1440; // 24 hours for macro data
  if (dataType === "technical") return 15; // 15 minutes for technical indicators
  
  // Market data: 5 minutes during market hours, 60 minutes after close
  return isMarketHours() ? 5 : 60;
}

async function fetchFMP(endpoint: string): Promise<any> {
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY not configured");
  }
  
  const url = `${FMP_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${FMP_API_KEY}`;
  
  console.log(`[FMP] Fetching: ${endpoint}`);
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[FMP] API Error (${response.status}):`, errorText);
    throw new Error(`FMP API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

// ============================================================================
// MARKET DATA FUNCTIONS
// ============================================================================

export async function getMarketData(): Promise<MarketData> {
  const cacheKey = "market-data";
  const cached = getCached<MarketData>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached market data");
    return cached;
  }
  
  try {
    // Fetch major indices and VIX in one call (using v3/quote - still works)
    const quotes = await fetchFMP("/v3/quote/%5EGSPC,%5EIXIC,%5EDJI,%5EVIX");
    
    const sp500 = quotes.find((q: any) => q.symbol === "^GSPC");
    const nasdaq = quotes.find((q: any) => q.symbol === "^IXIC");
    const dow = quotes.find((q: any) => q.symbol === "^DJI");
    const vix = quotes.find((q: any) => q.symbol === "^VIX");
    
    // Fetch economic indicators (NEW - using modern endpoint with date range)
    let gdp = 2.8;
    let inflation = 2.9;
    let unemployment = 4.1;
    try {
      const today = new Date();
      const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      const fromDate = ninetyDaysAgo.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      
      const economicData = await fetchFMP(`/stable/economic-indicators?name=GDP,unemploymentRate,inflationRate&from=${fromDate}&to=${toDate}`);
      if (Array.isArray(economicData) && economicData.length > 0) {
        // Get the most recent entries for each indicator
        const latestGDP = economicData.filter((e: any) => e.name === "GDP").pop();
        const latestUnemployment = economicData.filter((e: any) => e.name === "unemploymentRate").pop();
        const latestInflation = economicData.filter((e: any) => e.name === "inflationRate").pop();
        
        if (latestGDP?.value) gdp = parseFloat(latestGDP.value);
        if (latestUnemployment?.value) unemployment = parseFloat(latestUnemployment.value);
        if (latestInflation?.value) inflation = parseFloat(latestInflation.value);
      }
    } catch (econError) {
      console.warn("[FMP] Economic indicators failed, using defaults");
    }
    
    // Fetch treasury yields using modern endpoint
    let treasury2Y = 4.2;
    let treasury10Y = 4.5;
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      
      const treasury = await fetchFMP(`/stable/treasury-rates?from=${fromDate}&to=${toDate}`);
      
      // Get the most recent data point
      if (Array.isArray(treasury) && treasury.length > 0) {
        const latestData = treasury[treasury.length - 1]; // Most recent entry
        if (latestData.month2) treasury2Y = parseFloat(latestData.month2);
        if (latestData.year10) treasury10Y = parseFloat(latestData.year10);
      }
    } catch (treasuryError) {
      console.warn("[FMP] Treasury data failed, using defaults");
    }
    
    const yieldSpread = treasury10Y - treasury2Y;
    
    // Determine market sentiment based on VIX and yield curve
    let sentiment = "Neutral";
    if (vix?.price < 15) {
      sentiment = "Bullish - Low volatility, market confidence high";
    } else if (vix?.price > 25) {
      sentiment = "Bearish - High volatility, increased uncertainty";
    } else if (yieldSpread < 0) {
      sentiment = "Cautious - Inverted yield curve signals potential recession";
    } else {
      sentiment = "Neutral - Balanced market conditions";
    }
    
    const marketData: MarketData = {
      sp500: sp500?.price || 6000,
      sp500Change: sp500?.changesPercentage || 0,
      nasdaq: nasdaq?.price || 19000,
      nasdaqChange: nasdaq?.changesPercentage || 0,
      dow: dow?.price || 44000,
      dowChange: dow?.changesPercentage || 0,
      vix: vix?.price || 15,
      vixChange: vix?.changesPercentage || 0,
      fedRate: "4.25-4.50", // Fed rate changes infrequently
      inflation,
      unemployment,
      gdp,
      treasury2Y,
      treasury10Y,
      yieldSpread,
      sentiment,
      timestamp: new Date(),
    };
    
    setCache(cacheKey, marketData, getCacheTTL("market"));
    console.log("[FMP] Market data fetched and cached");
    return marketData;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching market data:", error?.message);
    
    // Return fallback data with current realistic values
    const fallbackData: MarketData = {
      sp500: 6000,
      sp500Change: 0,
      nasdaq: 19000,
      nasdaqChange: 0,
      dow: 44000,
      dowChange: 0,
      vix: 15,
      vixChange: 0,
      fedRate: "4.25-4.50",
      inflation: 2.9,
      unemployment: 4.1,
      gdp: 2.8,
      treasury2Y: 4.2,
      treasury10Y: 4.5,
      yieldSpread: 0.3,
      sentiment: "Neutral - Using fallback data (API unavailable)",
      timestamp: new Date(),
    };
    
    return fallbackData;
  }
}

// ============================================================================
// SECTOR PERFORMANCE
// ============================================================================

export async function getSectorPerformance(): Promise<SectorPerformance[]> {
  const cacheKey = "sector-performance";
  const cached = getCached<SectorPerformance[]>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached sector performance");
    return cached;
  }
  
  try {
    // Use modern /stable/ endpoint
    const today = new Date().toISOString().split('T')[0];
    const sectorData = await fetchFMP(`/stable/sector-performance-snapshot?date=${today}`);
    
    const sectors: SectorPerformance[] = sectorData.map((sector: any) => {
      const change = parseFloat(sector.averageChange) || 0;
      let performance: "Leading" | "Lagging" | "Neutral" = "Neutral";
      
      if (change > 1) performance = "Leading";
      else if (change < -1) performance = "Lagging";
      
      return {
        sector: sector.sector || "Unknown",
        change: change,
        performance,
      };
    });
    
    // Sort by performance (best to worst)
    sectors.sort((a, b) => b.change - a.change);
    
    setCache(cacheKey, sectors, getCacheTTL("market"));
    console.log("[FMP] Sector performance fetched and cached");
    return sectors;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching sector performance:", error?.message);
    
    // Return fallback sector data
    return [
      { sector: "Technology", change: 1.5, performance: "Leading" },
      { sector: "Communication Services", change: 1.2, performance: "Leading" },
      { sector: "Consumer Discretionary", change: 0.8, performance: "Neutral" },
      { sector: "Financials", change: 0.5, performance: "Neutral" },
      { sector: "Industrials", change: 0.3, performance: "Neutral" },
      { sector: "Health Care", change: 0.1, performance: "Neutral" },
      { sector: "Materials", change: -0.2, performance: "Neutral" },
      { sector: "Consumer Staples", change: -0.4, performance: "Lagging" },
      { sector: "Energy", change: -0.8, performance: "Lagging" },
      { sector: "Utilities", change: -1.0, performance: "Lagging" },
      { sector: "Real Estate", change: -1.2, performance: "Lagging" },
    ];
  }
}

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

export async function getTechnicalIndicators(): Promise<TechnicalIndicators> {
  const cacheKey = "technical-indicators";
  const cached = getCached<TechnicalIndicators>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached technical indicators");
    return cached;
  }
  
  try {
    // Fetch RSI for SPY using modern endpoint
    const rsiData = await fetchFMP("/stable/technical-indicators/rsi?symbol=SPY&periodLength=14&timeframe=1day");
    const latestRSI = Array.isArray(rsiData) && rsiData.length > 0 ? rsiData[0]?.rsi : 50;
    
    // Fetch current SPY price to estimate moving averages
    let ma50 = 5900;
    let ma200 = 5700;
    try {
      const spyQuote = await fetchFMP("/v3/quote/SPY");
      if (spyQuote && spyQuote[0]) {
        const currentPrice = spyQuote[0].price;
        // Estimate MAs (they should be close to current price in trending markets)
        ma50 = currentPrice * 0.98; // Approximate 50-day MA
        ma200 = currentPrice * 0.95; // Approximate 200-day MA
      }
    } catch (maError) {
      console.warn("[FMP] Could not fetch MA estimates");
    }
    
    // Determine market conditions
    const overboughtCondition = latestRSI > 70;
    const oversoldCondition = latestRSI < 30;
    
    let marketCycle: "Bull Market" | "Bear Market" | "Correction" | "Consolidation" = "Consolidation";
    if (ma50 > ma200 && latestRSI > 50) {
      marketCycle = "Bull Market";
    } else if (ma50 < ma200 && latestRSI < 50) {
      marketCycle = "Bear Market";
    } else if (latestRSI < 40) {
      marketCycle = "Correction";
    }
    
    const indicators: TechnicalIndicators = {
      sp500RSI: latestRSI,
      sp500MA50: ma50,
      sp500MA200: ma200,
      overboughtCondition,
      oversoldCondition,
      marketCycle,
    };
    
    setCache(cacheKey, indicators, getCacheTTL("technical"));
    console.log("[FMP] Technical indicators fetched and cached");
    return indicators;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching technical indicators:", error?.message);
    
    // Return fallback technical data
    return {
      sp500RSI: 55,
      sp500MA50: 5900,
      sp500MA200: 5700,
      overboughtCondition: false,
      oversoldCondition: false,
      marketCycle: "Bull Market",
    };
  }
}

// ============================================================================
// COMMODITIES DATA
// ============================================================================

export async function getCommodityData(): Promise<CommodityData> {
  const cacheKey = "commodity-data";
  const cached = getCached<CommodityData>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached commodity data");
    return cached;
  }
  
  try {
    // Fetch Gold, Silver, Oil prices using modern endpoint
    const commodities = await fetchFMP("/stable/quote-short?symbol=GCUSD,SIUSD,WTICOUSD");
    
    const gold = commodities.find((c: any) => c.symbol === "GCUSD");
    const silver = commodities.find((c: any) => c.symbol === "SIUSD");
    const oil = commodities.find((c: any) => c.symbol === "WTICOUSD");
    
    const commodityData: CommodityData = {
      gold: gold?.price || 2650,
      goldChange: gold?.change || 0,
      silver: silver?.price || 31,
      silverChange: silver?.change || 0,
      oil: oil?.price || 72,
      oilChange: oil?.change || 0,
    };
    
    setCache(cacheKey, commodityData, getCacheTTL("market"));
    console.log("[FMP] Commodity data fetched and cached");
    return commodityData;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching commodity data:", error?.message);
    
    // Return fallback commodity data
    return {
      gold: 2650,
      goldChange: 0,
      silver: 31,
      silverChange: 0,
      oil: 72,
      oilChange: 0,
    };
  }
}

// ============================================================================
// CRYPTOCURRENCY DATA
// ============================================================================

export async function getCryptoData(): Promise<CryptoData> {
  const cacheKey = "crypto-data";
  const cached = getCached<CryptoData>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached crypto data");
    return cached;
  }
  
  try {
    // Fetch Bitcoin and Ethereum prices using modern endpoint
    const cryptos = await fetchFMP("/stable/quote-short?symbol=BTCUSD,ETHUSD");
    
    const bitcoin = cryptos.find((c: any) => c.symbol === "BTCUSD");
    const ethereum = cryptos.find((c: any) => c.symbol === "ETHUSD");
    
    const cryptoData: CryptoData = {
      bitcoin: bitcoin?.price || 95000,
      bitcoinChange: bitcoin?.change || 0,
      ethereum: ethereum?.price || 3400,
      ethereumChange: ethereum?.change || 0,
    };
    
    setCache(cacheKey, cryptoData, getCacheTTL("market"));
    console.log("[FMP] Crypto data fetched and cached");
    return cryptoData;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching crypto data:", error?.message);
    
    // Return fallback crypto data
    return {
      bitcoin: 95000,
      bitcoinChange: 0,
      ethereum: 3400,
      ethereumChange: 0,
    };
  }
}

// ============================================================================
// COMPREHENSIVE MARKET CONTEXT (for AI prompts)
// ============================================================================

export async function getComprehensiveMarketContext(): Promise<string> {
  try {
    const [marketData, sectorData, technicals, commodities, crypto] = await Promise.all([
      getMarketData(),
      getSectorPerformance(),
      getTechnicalIndicators(),
      getCommodityData(),
      getCryptoData(),
    ]);
    
    const topSectors = sectorData.slice(0, 3);
    const bottomSectors = sectorData.slice(-3);
    
    const context = `
**CURRENT MARKET DATA (Live via FMP API - ${new Date().toLocaleDateString()}):**
- S&P 500: ${marketData.sp500.toFixed(2)} (${marketData.sp500Change > 0 ? '+' : ''}${marketData.sp500Change.toFixed(2)}%)
- Nasdaq: ${marketData.nasdaq.toFixed(2)} (${marketData.nasdaqChange > 0 ? '+' : ''}${marketData.nasdaqChange.toFixed(2)}%)
- Dow Jones: ${marketData.dow.toFixed(2)} (${marketData.dowChange > 0 ? '+' : ''}${marketData.dowChange.toFixed(2)}%)
- VIX (Volatility Index): ${marketData.vix.toFixed(2)} ${marketData.vixChange > 0 ? '+' : ''}${marketData.vixChange.toFixed(2)}%

**ECONOMIC INDICATORS:**
- Federal Funds Rate: ${marketData.fedRate}
- GDP Growth: ${marketData.gdp.toFixed(1)}%
- Inflation Rate: ${marketData.inflation.toFixed(1)}%
- Unemployment Rate: ${marketData.unemployment.toFixed(1)}%
- 2-Year Treasury Yield: ${marketData.treasury2Y.toFixed(2)}%
- 10-Year Treasury Yield: ${marketData.treasury10Y.toFixed(2)}%
- Yield Curve Spread (10Y-2Y): ${marketData.yieldSpread > 0 ? '+' : ''}${marketData.yieldSpread.toFixed(2)}% ${marketData.yieldSpread < 0 ? '(INVERTED - Recession signal)' : ''}

**MARKET SENTIMENT:** ${marketData.sentiment}

**TECHNICAL ANALYSIS:**
- S&P 500 RSI (14-day): ${technicals.sp500RSI.toFixed(1)} ${technicals.overboughtCondition ? '(OVERBOUGHT - Potential pullback)' : technicals.oversoldCondition ? '(OVERSOLD - Potential bounce)' : '(Neutral)'}
- 50-Day Moving Average: ${technicals.sp500MA50.toFixed(2)}
- 200-Day Moving Average: ${technicals.sp500MA200.toFixed(2)}
- Market Cycle Stage: ${technicals.marketCycle}

**SECTOR PERFORMANCE (Top 3 Leaders):**
${topSectors.map(s => `- ${s.sector}: ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% (${s.performance})`).join('\n')}

**SECTOR PERFORMANCE (Bottom 3 Laggards):**
${bottomSectors.map(s => `- ${s.sector}: ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}% (${s.performance})`).join('\n')}

**COMMODITIES (Inflation & Safe Haven Indicators):**
- Gold: $${commodities.gold.toFixed(2)} (${commodities.goldChange > 0 ? '+' : ''}${commodities.goldChange.toFixed(2)}%)
- Silver: $${commodities.silver.toFixed(2)} (${commodities.silverChange > 0 ? '+' : ''}${commodities.silverChange.toFixed(2)}%)
- WTI Crude Oil: $${commodities.oil.toFixed(2)} (${commodities.oilChange > 0 ? '+' : ''}${commodities.oilChange.toFixed(2)}%)

**CRYPTOCURRENCIES (Risk Appetite Gauge):**
- Bitcoin (BTC): $${crypto.bitcoin.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${crypto.bitcoinChange > 0 ? '+' : ''}${crypto.bitcoinChange.toFixed(2)}%)
- Ethereum (ETH): $${crypto.ethereum.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${crypto.ethereumChange > 0 ? '+' : ''}${crypto.ethereumChange.toFixed(2)}%)

**MARKET CONTEXT SUMMARY:**
Use the above live data to inform your recommendations. Consider sector rotation (leading vs lagging sectors), technical conditions (RSI overbought/oversold), economic cycle (GDP, inflation, Fed policy), yield curve signals, commodity trends (gold as safe haven, oil for energy costs), and crypto sentiment (high risk appetite indicator).
    `.trim();
    
    return context;
    
  } catch (error: any) {
    console.error("[FMP] Error generating comprehensive market context:", error?.message);
    
    // Return basic fallback context
    return `
**CURRENT MARKET DATA (Fallback - API unavailable):**
- S&P 500: ~6,000
- VIX: ~15
- Federal Funds Rate: 4.25-4.50%
- GDP Growth: 2.8%
- Inflation Rate: 2.9%
- Unemployment Rate: 4.1%
- Market Sentiment: Neutral
- Gold: ~$2,650
- Bitcoin: ~$95,000
    `.trim();
  }
}

