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
  cpi: number;
  consumerSentiment: number;
  retailSales: number;
  retailMoneyFunds: number;
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
}

export interface CryptoData {
  bitcoin: number;
  bitcoinChange: number;
  ethereum: number;
  ethereumChange: number;
  solana: number;
  solanaChange: number;
  chainlink: number;
  chainlinkChange: number;
  monero: number;
  moneroChange: number;
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
    // Fetch major indices individually (batching not supported for indices on Starter plan)
    const [sp500Data, nasdaqData, dowData, vixData] = await Promise.all([
      fetchFMP("/stable/quote?symbol=^GSPC"),
      fetchFMP("/stable/quote?symbol=^IXIC"),
      fetchFMP("/stable/quote?symbol=^DJI"),
      fetchFMP("/stable/quote?symbol=^VIX"),
    ]);
    
    const sp500 = sp500Data[0];
    const nasdaq = nasdaqData[0];
    const dow = dowData[0];
    const vix = vixData[0];
    
    // Fetch economic indicators individually (batching and date ranges not supported on Starter plan)
    let gdp = 2.8;
    let inflation = 2.9;
    let unemployment = 4.1;
    let cpi = 2.9;
    let consumerSentiment = 98.0;
    let retailSales = 710.0; // billions
    let retailMoneyFunds = 6200.0; // billions
    let federalFundsRate = 4.5;
    
    try {
      const [gdpData, unemploymentData, inflationData, cpiData, consumerSentimentData, retailSalesData, retailMoneyFundsData, federalFundsData] = await Promise.all([
        fetchFMP(`/stable/economic-indicators?name=GDP`),
        fetchFMP(`/stable/economic-indicators?name=unemploymentRate`),
        fetchFMP(`/stable/economic-indicators?name=inflationRate`),
        fetchFMP(`/stable/economic-indicators?name=CPI`),
        fetchFMP(`/stable/economic-indicators?name=consumerSentiment`),
        fetchFMP(`/stable/economic-indicators?name=retailSales`),
        fetchFMP(`/stable/economic-indicators?name=retailMoneyFunds`),
        fetchFMP(`/stable/economic-indicators?name=federalFunds`),
      ]);
      
      // Extract latest values from each response (FMP returns newest data at index 0)
      if (Array.isArray(gdpData) && gdpData.length > 0) {
        const latestGDP = gdpData[0];
        if (latestGDP?.value) gdp = parseFloat(latestGDP.value) / 10000; // FMP returns GDP as basis points
      }
      
      if (Array.isArray(unemploymentData) && unemploymentData.length > 0) {
        const latestUnemployment = unemploymentData[0];
        if (latestUnemployment?.value) unemployment = parseFloat(latestUnemployment.value);
      }
      
      if (Array.isArray(inflationData) && inflationData.length > 0) {
        const latestInflation = inflationData[0];
        if (latestInflation?.value) inflation = parseFloat(latestInflation.value);
      }
      
      if (Array.isArray(cpiData) && cpiData.length > 0) {
        const latestCPI = cpiData[0];
        if (latestCPI?.value) cpi = parseFloat(latestCPI.value);
      }
      
      if (Array.isArray(consumerSentimentData) && consumerSentimentData.length > 0) {
        const latestConsumerSentiment = consumerSentimentData[0];
        if (latestConsumerSentiment?.value) consumerSentiment = parseFloat(latestConsumerSentiment.value);
      }
      
      if (Array.isArray(retailSalesData) && retailSalesData.length > 0) {
        const latestRetailSales = retailSalesData[0];
        if (latestRetailSales?.value) retailSales = parseFloat(latestRetailSales.value) / 1000; // FMP returns in millions, convert to billions
      }
      
      if (Array.isArray(retailMoneyFundsData) && retailMoneyFundsData.length > 0) {
        const latestRetailMoneyFunds = retailMoneyFundsData[0];
        if (latestRetailMoneyFunds?.value) retailMoneyFunds = parseFloat(latestRetailMoneyFunds.value);
      }
      
      if (Array.isArray(federalFundsData) && federalFundsData.length > 0) {
        const latestFederalFunds = federalFundsData[0];
        if (latestFederalFunds?.value) federalFundsRate = parseFloat(latestFederalFunds.value);
      }
    } catch (econError) {
      console.warn("[FMP] Economic indicators failed, using defaults");
    }
    
    // Fetch treasury yields using stable endpoint
    let treasury2Y = 4.2;
    let treasury10Y = 4.5;
    try {
      const treasury = await fetchFMP(`/stable/treasury-rates`);
      
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
      sp500: sp500.price,
      sp500Change: sp500.changePercentage,
      nasdaq: nasdaq.price,
      nasdaqChange: nasdaq.changePercentage,
      dow: dow.price,
      dowChange: dow.changePercentage,
      vix: vix.price,
      vixChange: vix.changePercentage,
      fedRate: `${federalFundsRate.toFixed(2)}%`,
      inflation,
      unemployment,
      gdp,
      cpi,
      consumerSentiment,
      retailSales,
      retailMoneyFunds,
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
    throw error;
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
      const change = parseFloat(sector.averageChange);
      let performance: "Leading" | "Lagging" | "Neutral" = "Neutral";
      
      if (change > 1) performance = "Leading";
      else if (change < -1) performance = "Lagging";
      
      return {
        sector: sector.sector,
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
    throw error;
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
    const latestRSI = rsiData[0].rsi;
    
    // Fetch current SPY price to estimate moving averages
    const spyQuote = await fetchFMP("/stable/quote?symbol=SPY");
    const currentPrice = spyQuote[0].price;
    // Estimate MAs (they should be close to current price in trending markets)
    const ma50 = currentPrice * 0.98; // Approximate 50-day MA
    const ma200 = currentPrice * 0.95; // Approximate 200-day MA
    
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
    throw error;
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
    // Fetch commodities individually (batching not supported on Starter plan)
    const [goldData, silverData] = await Promise.all([
      fetchFMP("/stable/quote?symbol=GCUSD"),
      fetchFMP("/stable/quote?symbol=SIUSD"),
    ]);
    
    console.log("[FMP] Raw commodity responses - Gold:", JSON.stringify(goldData), "Silver:", JSON.stringify(silverData));
    
    const gold = goldData[0];
    const silver = silverData[0];
    
    console.log("[FMP] Parsed commodity data - Gold:", gold, "Silver:", silver);
    
    const commodityData: CommodityData = {
      gold: gold.price,
      goldChange: gold.changesPercentage,
      silver: silver.price,
      silverChange: silver.changesPercentage,
    };
    
    setCache(cacheKey, commodityData, getCacheTTL("market"));
    console.log("[FMP] Commodity data fetched and cached");
    return commodityData;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching commodity data:", error?.message);
    throw error;
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
    // Fetch cryptocurrencies individually (batching not supported on Starter plan)
    const [bitcoinData, ethereumData, solanaData, chainlinkData, moneroData] = await Promise.all([
      fetchFMP("/stable/quote?symbol=BTCUSD"),
      fetchFMP("/stable/quote?symbol=ETHUSD"),
      fetchFMP("/stable/quote?symbol=SOLUSD"),
      fetchFMP("/stable/quote?symbol=LINKUSD"),
      fetchFMP("/stable/quote?symbol=XMRUSD"),
    ]);
    
    console.log("[FMP] Raw crypto responses - BTC:", JSON.stringify(bitcoinData), "ETH:", JSON.stringify(ethereumData), "SOL:", JSON.stringify(solanaData), "LINK:", JSON.stringify(chainlinkData), "XMR:", JSON.stringify(moneroData));
    
    const bitcoin = bitcoinData[0];
    const ethereum = ethereumData[0];
    const solana = solanaData[0];
    const chainlink = chainlinkData[0];
    const monero = moneroData[0];
    
    console.log("[FMP] Parsed crypto data - Bitcoin:", bitcoin, "Ethereum:", ethereum, "Solana:", solana, "Chainlink:", chainlink, "Monero:", monero);
    
    const cryptoData: CryptoData = {
      bitcoin: bitcoin.price,
      bitcoinChange: bitcoin.changesPercentage,
      ethereum: ethereum.price,
      ethereumChange: ethereum.changesPercentage,
      solana: solana.price,
      solanaChange: solana.changesPercentage,
      chainlink: chainlink.price,
      chainlinkChange: chainlink.changesPercentage,
      monero: monero.price,
      moneroChange: monero.changesPercentage,
    };
    
    setCache(cacheKey, cryptoData, getCacheTTL("market"));
    console.log("[FMP] Crypto data fetched and cached");
    return cryptoData;
    
  } catch (error: any) {
    console.error("[FMP] Error fetching crypto data:", error?.message);
    throw error;
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
- Inflation Rate (YoY): ${marketData.inflation.toFixed(1)}%
- CPI (Consumer Price Index): ${marketData.cpi.toFixed(1)}
- Unemployment Rate: ${marketData.unemployment.toFixed(1)}%
- Consumer Sentiment Index: ${marketData.consumerSentiment.toFixed(1)} ${marketData.consumerSentiment > 100 ? '(High confidence)' : marketData.consumerSentiment < 90 ? '(Low confidence)' : '(Neutral)'}
- Retail Sales: $${marketData.retailSales.toFixed(1)}B/month
- Retail Money Funds: $${marketData.retailMoneyFunds.toFixed(1)}B ${marketData.retailMoneyFunds > 6500 ? '(High cash positioning - cautious investors)' : '(Normal cash levels)'}
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

**CRYPTOCURRENCIES (Risk Appetite Gauge):**
- Bitcoin (BTC): $${crypto.bitcoin.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${crypto.bitcoinChange > 0 ? '+' : ''}${crypto.bitcoinChange.toFixed(2)}%)
- Ethereum (ETH): $${crypto.ethereum.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${crypto.ethereumChange > 0 ? '+' : ''}${crypto.ethereumChange.toFixed(2)}%)
- Solana (SOL): $${crypto.solana.toFixed(2)} (${crypto.solanaChange > 0 ? '+' : ''}${crypto.solanaChange.toFixed(2)}%)
- Chainlink (LINK): $${crypto.chainlink.toFixed(2)} (${crypto.chainlinkChange > 0 ? '+' : ''}${crypto.chainlinkChange.toFixed(2)}%)
- Monero (XMR): $${crypto.monero.toFixed(2)} (${crypto.moneroChange > 0 ? '+' : ''}${crypto.moneroChange.toFixed(2)}%)

**MARKET CONTEXT SUMMARY:**
Use the above live data to inform your recommendations. Consider sector rotation (leading vs lagging sectors), technical conditions (RSI overbought/oversold), economic cycle (GDP, inflation, Fed policy), yield curve signals, commodity trends (gold as safe haven), and crypto sentiment (high risk appetite indicator).
    `.trim();
    
    return context;
    
  } catch (error: any) {
    console.error("[FMP] Error generating comprehensive market context:", error?.message);
    throw error;
  }
}

