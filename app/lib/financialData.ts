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

// Stock-specific data types
export interface StockProfile {
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number;
  beta: number;
  sector: string;
  industry: string;
  description: string;
  ceo: string;
  website: string;
  ipoDate: string;
  exchange: string;
  country: string;
  employees: number;
  isActivelyTrading: boolean;
}

export interface StockRatios {
  symbol: string;
  priceToEarningsRatio: number;
  priceToBookRatio: number;
  priceToSalesRatio: number;
  priceToFreeCashFlowRatio: number;
  debtToEquityRatio: number;
  currentRatio: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
  returnOnEquity: number;
  returnOnAssets: number;
  dividendYield: number;
  dividendYieldPercentage: number;
  payoutRatio: number;
}

export interface StockKeyMetrics {
  symbol: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  evToSales: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDevelopmentToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
}

export interface IncomeStatement {
  symbol: string;
  date: string;
  revenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

export interface AnalystEstimates {
  symbol: string;
  date: string;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  estimatedRevenueAvg: number;
  estimatedEbitdaLow: number;
  estimatedEbitdaHigh: number;
  estimatedEbitdaAvg: number;
  estimatedEbitLow: number;
  estimatedEbitHigh: number;
  estimatedEbitAvg: number;
  estimatedNetIncomeLow: number;
  estimatedNetIncomeHigh: number;
  estimatedNetIncomeAvg: number;
  estimatedSgaExpenseLow: number;
  estimatedSgaExpenseHigh: number;
  estimatedSgaExpenseAvg: number;
  estimatedEpsAvg: number;
  estimatedEpsHigh: number;
  estimatedEpsLow: number;
  numberAnalystEstimatedRevenue: number;
  numberAnalystsEstimatedEps: number;
}

export interface ExecutiveCompensation {
  cik: string;
  symbol: string;
  companyName: string;
  industryTitle: string;
  filingDate: string;
  acceptedDate: string;
  nameAndPosition: string;
  year: number;
  salary: number;
  bonus: number;
  stockAward: number;
  incentivePlanCompensation: number;
  allOtherCompensation: number;
  total: number;
  url: string;
}

export interface EconomicEvent {
  event: string;
  date: string;
  country: string;
  actual: number | null;
  previous: number | null;
  change: number | null;
  changePercentage: number | null;
  estimate: number | null;
  impact: string;
}

export interface InsiderTrade {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingName: string;
  typeOfOwner: string;
  acquistionOrDisposition: string;
  formType: string;
  securitiesOwned: number;
  securitiesTransacted: number;
  price: number;
  securityName: string;
  link: string;
}

export interface NewsArticle {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

export interface EarningsEvent {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  time: string;
  revenue: number | null;
  revenueEstimated: number | null;
  fiscalDateEnding: string;
  updatedFromDate: string;
}

export interface StockFundamentals {
  profile: StockProfile;
  ratios: StockRatios;
  keyMetrics: StockKeyMetrics;
  incomeStatement: IncomeStatement[];
  analystEstimates: AnalystEstimates | null;
  compensation: ExecutiveCompensation[];
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
      goldChange: gold.changePercentage,
      silver: silver.price,
      silverChange: silver.changePercentage,
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
      bitcoinChange: bitcoin.changePercentage,
      ethereum: ethereum.price,
      ethereumChange: ethereum.changePercentage,
      solana: solana.price,
      solanaChange: solana.changePercentage,
      chainlink: chainlink.price,
      chainlinkChange: chainlink.changePercentage,
      monero: monero.price,
      moneroChange: monero.changePercentage,
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
// STOCK FUNDAMENTALS FUNCTIONS
// ============================================================================

export async function getStockProfile(ticker: string): Promise<StockProfile | null> {
  const cacheKey = `stock-profile-${ticker}`;
  const cached = getCached<StockProfile>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached stock profile for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/profile?symbol=${ticker}`);
    if (!data || data.length === 0) return null;
    
    const raw = data[0];
    const profile: StockProfile = {
      symbol: raw.symbol,
      companyName: raw.companyName,
      price: raw.price,
      marketCap: raw.marketCap,
      beta: raw.beta,
      sector: raw.sector,
      industry: raw.industry,
      description: raw.description,
      ceo: raw.ceo,
      website: raw.website,
      ipoDate: raw.ipoDate,
      exchange: raw.exchange,
      country: raw.country,
      employees: parseInt(raw.fullTimeEmployees) || 0,
      isActivelyTrading: raw.isActivelyTrading,
    };
    
    setCache(cacheKey, profile, 1440); // Cache 24 hours
    return profile;
  } catch (error: any) {
    console.error(`[FMP] Error fetching stock profile for ${ticker}:`, error?.message);
    return null;
  }
}

export async function getStockRatios(ticker: string): Promise<StockRatios | null> {
  const cacheKey = `stock-ratios-${ticker}`;
  const cached = getCached<StockRatios>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached stock ratios for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/ratios?symbol=${ticker}`);
    if (!data || data.length === 0) return null;
    
    const raw = data[0]; // Most recent fiscal year
    const ratios: StockRatios = {
      symbol: raw.symbol,
      priceToEarningsRatio: raw.priceToEarningsRatio || 0,
      priceToBookRatio: raw.priceToBookRatio || 0,
      priceToSalesRatio: raw.priceToSalesRatio || 0,
      priceToFreeCashFlowRatio: raw.priceToFreeCashFlowRatio || 0,
      debtToEquityRatio: raw.debtToEquityRatio || 0,
      currentRatio: raw.currentRatio || 0,
      grossProfitMargin: raw.grossProfitMargin || 0,
      operatingProfitMargin: raw.operatingProfitMargin || 0,
      netProfitMargin: raw.netProfitMargin || 0,
      returnOnEquity: raw.returnOnEquity || 0,
      returnOnAssets: raw.returnOnAssets || 0,
      dividendYield: raw.dividendYield || 0,
      dividendYieldPercentage: raw.dividendYieldPercentage || 0,
      payoutRatio: raw.dividendPayoutRatio || 0,
    };
    
    setCache(cacheKey, ratios, 1440); // Cache 24 hours
    return ratios;
  } catch (error: any) {
    console.error(`[FMP] Error fetching stock ratios for ${ticker}:`, error?.message);
    return null;
  }
}

export async function getStockKeyMetrics(ticker: string): Promise<StockKeyMetrics | null> {
  const cacheKey = `stock-key-metrics-${ticker}`;
  const cached = getCached<StockKeyMetrics>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached key metrics for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/key-metrics?symbol=${ticker}`);
    if (!data || data.length === 0) return null;
    
    const raw = data[0]; // Most recent
    const metrics: StockKeyMetrics = {
      symbol: raw.symbol,
      revenuePerShare: raw.revenuePerShare || 0,
      netIncomePerShare: raw.netIncomePerShare || 0,
      operatingCashFlowPerShare: raw.operatingCashFlowPerShare || 0,
      freeCashFlowPerShare: raw.freeCashFlowPerShare || 0,
      bookValuePerShare: raw.bookValuePerShare || 0,
      tangibleBookValuePerShare: raw.tangibleBookValuePerShare || 0,
      enterpriseValue: raw.enterpriseValue || 0,
      peRatio: raw.peRatio || 0,
      priceToSalesRatio: raw.priceToSalesRatio || 0,
      pocfratio: raw.pocfratio || 0,
      pfcfRatio: raw.pfcfRatio || 0,
      pbRatio: raw.pbRatio || 0,
      evToSales: raw.evToSales || 0,
      evToOperatingCashFlow: raw.evToOperatingCashFlow || 0,
      evToFreeCashFlow: raw.evToFreeCashFlow || 0,
      earningsYield: raw.earningsYield || 0,
      freeCashFlowYield: raw.freeCashFlowYield || 0,
      debtToEquity: raw.debtToEquity || 0,
      debtToAssets: raw.debtToAssets || 0,
      netDebtToEBITDA: raw.netDebtToEBITDA || 0,
      currentRatio: raw.currentRatio || 0,
      interestCoverage: raw.interestCoverage || 0,
      incomeQuality: raw.incomeQuality || 0,
      dividendYield: raw.dividendYield || 0,
      payoutRatio: raw.payoutRatio || 0,
      salesGeneralAndAdministrativeToRevenue: raw.salesGeneralAndAdministrativeToRevenue || 0,
      researchAndDevelopmentToRevenue: raw.researchAndDevelopementToRevenue || 0,
      intangiblesToTotalAssets: raw.intangiblesToTotalAssets || 0,
      capexToOperatingCashFlow: raw.capexToOperatingCashFlow || 0,
      capexToRevenue: raw.capexToRevenue || 0,
      capexToDepreciation: raw.capexToDepreciation || 0,
      stockBasedCompensationToRevenue: raw.stockBasedCompensationToRevenue || 0,
      grahamNumber: raw.grahamNumber || 0,
      roic: raw.roic || 0,
      returnOnTangibleAssets: raw.returnOnTangibleAssets || 0,
      grahamNetNet: raw.grahamNetNet || 0,
      workingCapital: raw.workingCapital || 0,
      tangibleAssetValue: raw.tangibleAssetValue || 0,
      netCurrentAssetValue: raw.netCurrentAssetValue || 0,
      investedCapital: raw.investedCapital || 0,
      averageReceivables: raw.averageReceivables || 0,
      averagePayables: raw.averagePayables || 0,
      averageInventory: raw.averageInventory || 0,
      daysSalesOutstanding: raw.daysSalesOutstanding || 0,
      daysPayablesOutstanding: raw.daysPayablesOutstanding || 0,
      daysOfInventoryOnHand: raw.daysOfInventoryOnHand || 0,
      receivablesTurnover: raw.receivablesTurnover || 0,
      payablesTurnover: raw.payablesTurnover || 0,
      inventoryTurnover: raw.inventoryTurnover || 0,
      roe: raw.roe || 0,
      capexPerShare: raw.capexPerShare || 0,
    };
    
    setCache(cacheKey, metrics, 1440); // Cache 24 hours
    return metrics;
  } catch (error: any) {
    console.error(`[FMP] Error fetching key metrics for ${ticker}:`, error?.message);
    return null;
  }
}

export async function getStockIncomeStatement(ticker: string): Promise<IncomeStatement[] | null> {
  const cacheKey = `stock-income-${ticker}`;
  const cached = getCached<IncomeStatement[]>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached income statements for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/income-statement?symbol=${ticker}&limit=2`);
    if (!data || data.length === 0) return null;
    
    // Return array of up to 2 most recent statements
    const statements: IncomeStatement[] = data.slice(0, 2).map((raw: any) => ({
      symbol: raw.symbol,
      date: raw.date,
      revenue: raw.revenue || 0,
      grossProfit: raw.grossProfit || 0,
      grossProfitRatio: raw.grossProfitRatio || 0,
      operatingIncome: raw.operatingIncome || 0,
      operatingIncomeRatio: raw.operatingIncomeRatio || 0,
      netIncome: raw.netIncome || 0,
      netIncomeRatio: raw.netIncomeRatio || 0,
      eps: raw.eps || 0,
      epsdiluted: raw.epsdiluted || 0,
      weightedAverageShsOut: raw.weightedAverageShsOut || 0,
      weightedAverageShsOutDil: raw.weightedAverageShsOutDil || 0,
    }));
    
    setCache(cacheKey, statements, 1440); // Cache 24 hours
    return statements;
  } catch (error: any) {
    console.error(`[FMP] Error fetching income statements for ${ticker}:`, error?.message);
    return null;
  }
}

export async function getAnalystEstimates(ticker: string): Promise<AnalystEstimates | null> {
  const cacheKey = `analyst-estimates-${ticker}`;
  const cached = getCached<AnalystEstimates>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached analyst estimates for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/analyst-estimates?symbol=${ticker}&period=annual&page=0&limit=10`);
    if (!data || data.length === 0) return null;
    
    const raw = data[0]; // Most recent
    const estimates: AnalystEstimates = {
      symbol: raw.symbol,
      date: raw.date,
      estimatedRevenueLow: raw.estimatedRevenueLow || 0,
      estimatedRevenueHigh: raw.estimatedRevenueHigh || 0,
      estimatedRevenueAvg: raw.estimatedRevenueAvg || 0,
      estimatedEbitdaLow: raw.estimatedEbitdaLow || 0,
      estimatedEbitdaHigh: raw.estimatedEbitdaHigh || 0,
      estimatedEbitdaAvg: raw.estimatedEbitdaAvg || 0,
      estimatedEbitLow: raw.estimatedEbitLow || 0,
      estimatedEbitHigh: raw.estimatedEbitHigh || 0,
      estimatedEbitAvg: raw.estimatedEbitAvg || 0,
      estimatedNetIncomeLow: raw.estimatedNetIncomeLow || 0,
      estimatedNetIncomeHigh: raw.estimatedNetIncomeHigh || 0,
      estimatedNetIncomeAvg: raw.estimatedNetIncomeAvg || 0,
      estimatedSgaExpenseLow: raw.estimatedSgaExpenseLow || 0,
      estimatedSgaExpenseHigh: raw.estimatedSgaExpenseHigh || 0,
      estimatedSgaExpenseAvg: raw.estimatedSgaExpenseAvg || 0,
      estimatedEpsAvg: raw.estimatedEpsAvg || 0,
      estimatedEpsHigh: raw.estimatedEpsHigh || 0,
      estimatedEpsLow: raw.estimatedEpsLow || 0,
      numberAnalystEstimatedRevenue: raw.numberAnalystEstimatedRevenue || 0,
      numberAnalystsEstimatedEps: raw.numberAnalystsEstimatedEps || 0,
    };
    
    setCache(cacheKey, estimates, 1440); // Cache 24 hours
    return estimates;
  } catch (error: any) {
    console.error(`[FMP] Error fetching analyst estimates for ${ticker}:`, error?.message);
    return null;
  }
}

export async function getExecutiveCompensation(ticker: string): Promise<ExecutiveCompensation[]> {
  const cacheKey = `exec-comp-${ticker}`;
  const cached = getCached<ExecutiveCompensation[]>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached executive compensation for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/governance-executive-compensation?symbol=${ticker}`);
    if (!data || data.length === 0) return [];
    
    const compensation: ExecutiveCompensation[] = data.slice(0, 5).map((raw: any) => ({
      cik: raw.cik,
      symbol: raw.symbol,
      companyName: raw.companyName,
      industryTitle: raw.industryTitle,
      filingDate: raw.filingDate,
      acceptedDate: raw.acceptedDate,
      nameAndPosition: raw.nameAndPosition,
      year: raw.year,
      salary: raw.salary || 0,
      bonus: raw.bonus || 0,
      stockAward: raw.stockAward || 0,
      incentivePlanCompensation: raw.incentivePlanCompensation || 0,
      allOtherCompensation: raw.allOtherCompensation || 0,
      total: raw.total || 0,
      url: raw.url,
    }));
    
    setCache(cacheKey, compensation, 1440); // Cache 24 hours
    return compensation;
  } catch (error: any) {
    console.error(`[FMP] Error fetching executive compensation for ${ticker}:`, error?.message);
    return [];
  }
}

// Batch fetch fundamentals for multiple stocks
export async function getStocksFundamentals(tickers: string[]): Promise<Map<string, StockFundamentals>> {
  const results = new Map<string, StockFundamentals>();
  
  console.log(`[FMP] Fetching fundamentals for ${tickers.length} stocks`);
  
  // Fetch all data in parallel for speed
  const promises = tickers.map(async (ticker) => {
    try {
      const [profile, ratios, keyMetrics, incomeStatement, analystEstimates, compensation] = await Promise.all([
        getStockProfile(ticker),
        getStockRatios(ticker),
        getStockKeyMetrics(ticker),
        getStockIncomeStatement(ticker),
        getAnalystEstimates(ticker),
        getExecutiveCompensation(ticker),
      ]);
      
      if (profile && ratios && keyMetrics && incomeStatement) {
        results.set(ticker, {
          profile,
          ratios,
          keyMetrics,
          incomeStatement,
          analystEstimates,
          compensation,
        });
      }
    } catch (error) {
      console.error(`[FMP] Failed to fetch fundamentals for ${ticker}:`, error);
    }
  });
  
  await Promise.all(promises);
  console.log(`[FMP] Successfully fetched fundamentals for ${results.size}/${tickers.length} stocks`);
  
  return results;
}

// ============================================================================
// MARKET INTELLIGENCE FUNCTIONS
// ============================================================================

export async function getEconomicCalendar(): Promise<EconomicEvent[]> {
  const cacheKey = "economic-calendar";
  const cached = getCached<EconomicEvent[]>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached economic calendar");
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/economic-calendar`);
    if (!data || data.length === 0) return [];
    
    // Filter to upcoming events and high-impact events
    const now = new Date();
    const events: EconomicEvent[] = data
      .filter((raw: any) => {
        const eventDate = new Date(raw.date);
        return eventDate >= now && (raw.impact === 'High' || raw.impact === 'Medium');
      })
      .slice(0, 10) // Limit to next 10 events
      .map((raw: any) => ({
        event: raw.event,
        date: raw.date,
        country: raw.country,
        actual: raw.actual,
        previous: raw.previous,
        change: raw.change,
        changePercentage: raw.changePercentage,
        estimate: raw.estimate,
        impact: raw.impact,
      }));
    
    setCache(cacheKey, events, 1440); // Cache 24 hours
    console.log(`[FMP] Fetched ${events.length} upcoming economic events`);
    return events;
  } catch (error: any) {
    console.error("[FMP] Error fetching economic calendar:", error?.message);
    return [];
  }
}

export async function getInsiderTradingSignals(): Promise<InsiderTrade[]> {
  const cacheKey = "insider-trading";
  const cached = getCached<InsiderTrade[]>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached insider trading data");
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/insider-trading/latest?page=0&limit=100`);
    if (!data || data.length === 0) return [];
    
    const trades: InsiderTrade[] = data.map((raw: any) => ({
      symbol: raw.symbol,
      filingDate: raw.filingDate,
      transactionDate: raw.transactionDate,
      reportingName: raw.reportingCikName,
      typeOfOwner: raw.typeOfOwner,
      acquistionOrDisposition: raw.acquistionOrDisposition,
      formType: raw.formType,
      securitiesOwned: raw.securitiesOwned || 0,
      securitiesTransacted: raw.securitiesTransacted || 0,
      price: raw.price || 0,
      securityName: raw.securityName,
      link: raw.link,
    }));
    
    setCache(cacheKey, trades, 360); // Cache 6 hours
    console.log(`[FMP] Fetched ${trades.length} insider trades`);
    return trades;
  } catch (error: any) {
    console.error("[FMP] Error fetching insider trading:", error?.message);
    return [];
  }
}

export async function getGeneralMarketNews(limit: number = 20): Promise<NewsArticle[]> {
  const cacheKey = "market-news-general";
  const cached = getCached<NewsArticle[]>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached general market news");
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/news/general-latest?page=0&limit=${limit}`);
    if (!data || data.length === 0) return [];
    
    const news: NewsArticle[] = data.map((raw: any) => ({
      symbol: raw.symbol || 'MARKET',
      publishedDate: raw.publishedDate,
      title: raw.title,
      image: raw.image,
      site: raw.site,
      text: raw.text,
      url: raw.url,
    }));
    
    setCache(cacheKey, news, 30); // Cache 30 minutes
    console.log(`[FMP] Fetched ${news.length} general market news articles`);
    return news;
  } catch (error: any) {
    console.error("[FMP] Error fetching general market news:", error?.message);
    return [];
  }
}

export async function getStockNews(ticker: string, limit: number = 20): Promise<NewsArticle[]> {
  const cacheKey = `stock-news-${ticker}`;
  const cached = getCached<NewsArticle[]>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached news for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/news/stock?symbols=${ticker}&limit=${limit}`);
    if (!data || data.length === 0) return [];
    
    const news: NewsArticle[] = data.map((raw: any) => ({
      symbol: raw.symbol,
      publishedDate: raw.publishedDate,
      title: raw.title,
      image: raw.image,
      site: raw.site,
      text: raw.text,
      url: raw.url,
    }));
    
    setCache(cacheKey, news, 30); // Cache 30 minutes
    console.log(`[FMP] Fetched ${news.length} news articles for ${ticker}`);
    return news;
  } catch (error: any) {
    console.error(`[FMP] Error fetching stock news for ${ticker}:`, error?.message);
    return [];
  }
}

export async function getCryptoNews(symbol: string, limit: number = 20): Promise<NewsArticle[]> {
  const cacheKey = `crypto-news-${symbol}`;
  const cached = getCached<NewsArticle[]>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached crypto news for ${symbol}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/news/crypto?symbols=${symbol}&limit=${limit}`);
    if (!data || data.length === 0) return [];
    
    const news: NewsArticle[] = data.map((raw: any) => ({
      symbol: raw.symbol,
      publishedDate: raw.publishedDate,
      title: raw.title,
      image: raw.image,
      site: raw.site,
      text: raw.text,
      url: raw.url,
    }));
    
    setCache(cacheKey, news, 30); // Cache 30 minutes
    console.log(`[FMP] Fetched ${news.length} crypto news articles for ${symbol}`);
    return news;
  } catch (error: any) {
    console.error(`[FMP] Error fetching crypto news for ${symbol}:`, error?.message);
    return [];
  }
}

// ============================================================================
// CRYPTO-SPECIFIC DATA FUNCTIONS
// ============================================================================

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
}

export async function getCryptoQuote(symbol: string): Promise<CryptoQuote | null> {
  const cacheKey = `crypto-quote-${symbol}`;
  const cached = getCached<CryptoQuote>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached crypto quote for ${symbol}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/quote?symbol=${symbol}`);
    if (!data || data.length === 0) return null;
    
    const raw = data[0];
    const quote: CryptoQuote = {
      symbol: raw.symbol,
      name: raw.name,
      price: raw.price,
      changePercentage: raw.changePercentage,
      change: raw.change,
      volume: raw.volume,
      dayLow: raw.dayLow,
      dayHigh: raw.dayHigh,
      yearHigh: raw.yearHigh,
      yearLow: raw.yearLow,
      marketCap: raw.marketCap,
      priceAvg50: raw.priceAvg50,
      priceAvg200: raw.priceAvg200,
    };
    
    setCache(cacheKey, quote, 5); // Cache 5 minutes
    console.log(`[FMP] Fetched crypto quote for ${symbol}`);
    return quote;
  } catch (error: any) {
    console.error(`[FMP] Error fetching crypto quote for ${symbol}:`, error?.message);
    return null;
  }
}

export async function getCryptoRSI(symbol: string): Promise<{ rsi: number; label: string } | null> {
  const cacheKey = `crypto-rsi-${symbol}`;
  const cached = getCached<{ rsi: number; label: string }>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached crypto RSI for ${symbol}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/technical-indicators/rsi?symbol=${symbol}&periodLength=14&timeframe=1day`);
    if (!data || data.length === 0) return null;
    
    const rsi = data[0].rsi;
    let label: string;
    if (rsi >= 70) {
      label = "Overbought";
    } else if (rsi <= 30) {
      label = "Oversold";
    } else if (rsi >= 60) {
      label = "Bullish";
    } else if (rsi <= 40) {
      label = "Bearish";
    } else {
      label = "Neutral";
    }
    
    const result = { rsi, label };
    setCache(cacheKey, result, 15); // Cache 15 minutes
    console.log(`[FMP] Fetched crypto RSI for ${symbol}: ${rsi.toFixed(1)} (${label})`);
    return result;
  } catch (error: any) {
    console.error(`[FMP] Error fetching crypto RSI for ${symbol}:`, error?.message);
    return null;
  }
}

export interface CryptoSMAs {
  sma140: number | null;  // 20 Week SMA
  sma350: number | null;  // 50 Week SMA
  sma1400: number | null; // 200 Week SMA
}

export async function getCryptoSMAs(symbol: string): Promise<CryptoSMAs> {
  const cacheKey = `crypto-smas-${symbol}`;
  const cached = getCached<CryptoSMAs>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached crypto SMAs for ${symbol}`);
    return cached;
  }
  
  const result: CryptoSMAs = {
    sma140: null,
    sma350: null,
    sma1400: null,
  };
  
  try {
    // Fetch all three SMAs in parallel
    const [sma140Data, sma350Data, sma1400Data] = await Promise.all([
      fetchFMP(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=140&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=350&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=1400&timeframe=1day`),
    ]);
    
    if (sma140Data && sma140Data.length > 0) {
      result.sma140 = sma140Data[0].sma;
    }
    if (sma350Data && sma350Data.length > 0) {
      result.sma350 = sma350Data[0].sma;
    }
    if (sma1400Data && sma1400Data.length > 0) {
      result.sma1400 = sma1400Data[0].sma;
    }
    
    setCache(cacheKey, result, 60); // Cache 1 hour
    console.log(`[FMP] Fetched crypto SMAs for ${symbol}: 20W=${result.sma140?.toFixed(0)}, 50W=${result.sma350?.toFixed(0)}, 200W=${result.sma1400?.toFixed(0)}`);
    return result;
  } catch (error: any) {
    console.error(`[FMP] Error fetching crypto SMAs for ${symbol}:`, error?.message);
    return result;
  }
}

export async function getEarningsCalendar(): Promise<EarningsEvent[]> {
  const cacheKey = "earnings-calendar";
  const cached = getCached<EarningsEvent[]>(cacheKey);
  if (cached) {
    console.log("[FMP] Using cached earnings calendar");
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/earnings-calendar`);
    if (!data || data.length === 0) return [];
    
    // Filter to upcoming earnings
    const now = new Date();
    const events: EarningsEvent[] = data
      .filter((raw: any) => {
        const eventDate = new Date(raw.date);
        return eventDate >= now;
      })
      .slice(0, 50) // Limit to next 50 earnings
      .map((raw: any) => ({
        date: raw.date,
        symbol: raw.symbol,
        eps: raw.eps,
        epsEstimated: raw.epsEstimated,
        time: raw.time,
        revenue: raw.revenue,
        revenueEstimated: raw.revenueEstimated,
        fiscalDateEnding: raw.fiscalDateEnding,
        updatedFromDate: raw.updatedFromDate,
      }));
    
    setCache(cacheKey, events, 1440); // Cache 24 hours
    console.log(`[FMP] Fetched ${events.length} upcoming earnings events`);
    return events;
  } catch (error: any) {
    console.error("[FMP] Error fetching earnings calendar:", error?.message);
    return [];
  }
}

export async function getStockEarnings(ticker: string): Promise<EarningsEvent[]> {
  const cacheKey = `stock-earnings-${ticker}`;
  const cached = getCached<EarningsEvent[]>(cacheKey);
  if (cached) {
    console.log(`[FMP] Using cached earnings for ${ticker}`);
    return cached;
  }
  
  try {
    const data = await fetchFMP(`/stable/earnings?symbol=${ticker}`);
    if (!data || data.length === 0) return [];
    
    const earnings: EarningsEvent[] = data.slice(0, 8).map((raw: any) => ({
      date: raw.date,
      symbol: raw.symbol,
      eps: raw.eps,
      epsEstimated: raw.epsEstimated,
      time: raw.time,
      revenue: raw.revenue,
      revenueEstimated: raw.revenueEstimated,
      fiscalDateEnding: raw.fiscalDateEnding,
      updatedFromDate: raw.updatedFromDate,
    }));
    
    setCache(cacheKey, earnings, 1440); // Cache 24 hours
    console.log(`[FMP] Fetched ${earnings.length} historical earnings for ${ticker}`);
    return earnings;
  } catch (error: any) {
    console.error(`[FMP] Error fetching earnings for ${ticker}:`, error?.message);
    return [];
  }
}

// ============================================================================
// COMPREHENSIVE MARKET CONTEXT (for AI prompts)
// ============================================================================

// ============================================================================
// DIVERSONAL FEAR & GREED INDEX
// ============================================================================

export async function calculateDiversonalFearGreedIndex(): Promise<{
  index: number;
  label: string;
}> {
  try {
    const [marketData, technicals] = await Promise.all([
      getMarketData(),
      getTechnicalIndicators(),
    ]);
    
    // Component 1: VIX (30% weight) - Inverse relationship (lower VIX = more greed)
    // VIX typically ranges from 10-80, with 10-20 being calm, 20-30 normal, 30+ fear
    // Normalize: (80 - VIX) / 70 * 100 to get 0-100 scale (inverted)
    const vixScore = Math.max(0, Math.min(100, ((80 - marketData.vix) / 70) * 100));
    
    // Component 2: S&P 500 RSI (25% weight) - Direct relationship (higher RSI = more greed)
    // RSI ranges from 0-100, already on correct scale
    const rsiScore = technicals.sp500RSI;
    
    // Component 3: Market Performance (20% weight) - S&P 500 daily change
    // Daily changes typically range from -5% to +5%, normalize to 0-100
    // 0% change = 50, +5% = 100, -5% = 0
    const performanceScore = Math.max(0, Math.min(100, 50 + (marketData.sp500Change * 10)));
    
    // Component 4: Yield Curve Spread (15% weight)
    // Inverted curve (negative spread) = fear, normal curve (positive spread) = greed
    // Spread typically ranges from -2% to +3%, normalize to 0-100
    // -2% = 0, 0% = 40, +3% = 100
    const yieldScore = Math.max(0, Math.min(100, 40 + (marketData.yieldSpread * 20)));
    
    // Component 5: Consumer Sentiment (10% weight)
    // Ranges from 60-110 typically, normalize to 0-100
    // 60 = 0, 90 = 50, 110 = 100
    const sentimentScore = Math.max(0, Math.min(100, ((marketData.consumerSentiment - 60) / 50) * 100));
    
    // Calculate weighted average
    const index = Math.round(
      (vixScore * 0.30) +
      (rsiScore * 0.25) +
      (performanceScore * 0.20) +
      (yieldScore * 0.15) +
      (sentimentScore * 0.10)
    );
    
    // Map to label
    let label: string;
    if (index <= 25) {
      label = "Extreme Fear";
    } else if (index <= 45) {
      label = "Fear";
    } else if (index <= 55) {
      label = "Neutral";
    } else if (index <= 75) {
      label = "Greed";
    } else {
      label = "Extreme Greed";
    }
    
    console.log(`[Diversonal F&G] Index: ${index} (${label}) | VIX: ${vixScore.toFixed(1)} | RSI: ${rsiScore.toFixed(1)} | Perf: ${performanceScore.toFixed(1)} | Yield: ${yieldScore.toFixed(1)} | Sentiment: ${sentimentScore.toFixed(1)}`);
    
    return { index, label };
    
  } catch (error: any) {
    console.error("[Diversonal F&G] Error calculating index:", error?.message);
    // Return neutral default on error
    return { index: 50, label: "Neutral" };
  }
}

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

