// Fetches fundamental data for individual stocks from FMP API

import { fundamentalsConfig } from './fundamentalsConfig';
import { rateLimiter } from './fundamentalsRateLimit';

export interface StockFundamentals {
  ticker: string;
  sector: string;
  profile: any;
  ratios: any;
  keyMetrics: any;
  incomeStatement: any;
  incomeStatementHistory: any[]; // Last 2 years for growth calculations
  analystEstimates: any | null;
  lastUpdated: string;
  error?: string;
}

async function fetchFMP(endpoint: string, symbol: string, additionalParams?: string): Promise<any> {
  const { fmpApiKey, fmpBaseUrl } = fundamentalsConfig;
  
  if (!fmpApiKey) {
    throw new Error('FMP_API_KEY not configured');
  }

  const extraParams = additionalParams ? `&${additionalParams}` : '';
  const url = `${fmpBaseUrl}${endpoint}?symbol=${symbol}${extraParams}&apikey=${fmpApiKey}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function fetchStockFundamentals(
  ticker: string,
  sector: string
): Promise<StockFundamentals> {
  console.log(`[Fundamentals] Fetching data for ${ticker}...`);

  const result: StockFundamentals = {
    ticker,
    sector,
    profile: null,
    ratios: null,
    keyMetrics: null,
    incomeStatement: null,
    incomeStatementHistory: [],
    analystEstimates: null,
    lastUpdated: new Date().toISOString(),
  };

  try {
    // Fetch profile (required)
    result.profile = await rateLimiter.executeWithRateLimit(async () => {
      const data = await fetchFMP('/stable/profile', ticker);
      return data[0] || null;
    });

    if (!result.profile) {
      result.error = 'Profile not found';
      return result;
    }

    // Fetch ratios (required)
    result.ratios = await rateLimiter.executeWithRateLimit(async () => {
      const data = await fetchFMP('/stable/ratios', ticker);
      return data[0] || null;
    });

    // Fetch key metrics (required)
    result.keyMetrics = await rateLimiter.executeWithRateLimit(async () => {
      const data = await fetchFMP('/stable/key-metrics', ticker);
      return data[0] || null;
    });

    // Fetch income statement (required) - get last 2 years for growth calculation
    const incomeStatements = await rateLimiter.executeWithRateLimit(async () => {
      const data = await fetchFMP('/stable/income-statement', ticker);
      return data || [];
    });
    
    result.incomeStatement = incomeStatements[0] || null;
    result.incomeStatementHistory = incomeStatements.slice(0, 2); // Store last 2 years

    // Fetch analyst estimates (optional)
    try {
      result.analystEstimates = await rateLimiter.executeWithRateLimit(async () => {
        const data = await fetchFMP('/stable/analyst-estimates', ticker, 'period=annual');
        return data[0] || null;
      });
    } catch (error) {
      console.warn(`[Fundamentals] Analyst estimates unavailable for ${ticker}`);
      result.analystEstimates = null;
    }

    console.log(`[Fundamentals] ✓ Successfully fetched data for ${ticker}`);
    return result;

  } catch (error: any) {
    console.error(`[Fundamentals] ✗ Error fetching ${ticker}:`, error.message);
    result.error = error.message;
    return result;
  }
}

export async function fetchAllStocks(
  stocks: Array<{ ticker: string; sector: string }>
): Promise<StockFundamentals[]> {
  console.log(`[Fundamentals] Starting fetch for ${stocks.length} stocks...`);
  
  // Group stocks by ticker to avoid duplicate fetches
  const tickerMap = new Map<string, Array<string>>();
  for (const stock of stocks) {
    if (!tickerMap.has(stock.ticker)) {
      tickerMap.set(stock.ticker, []);
    }
    tickerMap.get(stock.ticker)!.push(stock.sector);
  }
  
  const uniqueTickers = Array.from(tickerMap.keys());
  console.log(`[Fundamentals] Fetching ${uniqueTickers.length} unique tickers (${stocks.length} total entries with multi-sector stocks)`);
  
  const startTime = Date.now();
  const fetchedData = new Map<string, StockFundamentals>();
  let successCount = 0;
  let errorCount = 0;

  // Fetch each unique ticker once
  for (let i = 0; i < uniqueTickers.length; i++) {
    const ticker = uniqueTickers[i];
    const progress = ((i + 1) / uniqueTickers.length * 100).toFixed(1);
    
    console.log(`[Fundamentals] Progress: ${i + 1}/${uniqueTickers.length} (${progress}%)`);
    
    try {
      // Fetch with the first sector (we'll replicate for other sectors)
      const sectors = tickerMap.get(ticker)!;
      const fundamentals = await fetchStockFundamentals(ticker, sectors[0]);
      fetchedData.set(ticker, fundamentals);
      
      if (fundamentals.error) {
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`[Fundamentals] Failed to process ${ticker}:`, error);
      errorCount++;
      // Continue with next stock
    }
  }

  // Build results array with proper sector assignments
  const results: StockFundamentals[] = [];
  for (const stock of stocks) {
    const fetchedStock = fetchedData.get(stock.ticker);
    if (fetchedStock) {
      // Create a copy with the correct sector
      results.push({
        ...fetchedStock,
        sector: stock.sector,
      });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Fundamentals] Completed in ${duration}s - Success: ${successCount}, Errors: ${errorCount}`);

  return results;
}

