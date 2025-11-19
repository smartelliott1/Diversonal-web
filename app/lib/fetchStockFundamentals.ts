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

    // Fetch income statement (required)
    result.incomeStatement = await rateLimiter.executeWithRateLimit(async () => {
      const data = await fetchFMP('/stable/income-statement', ticker);
      return data[0] || null;
    });

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
  
  const startTime = Date.now();
  const results: StockFundamentals[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const progress = ((i + 1) / stocks.length * 100).toFixed(1);
    
    console.log(`[Fundamentals] Progress: ${i + 1}/${stocks.length} (${progress}%)`);
    
    try {
      const fundamentals = await fetchStockFundamentals(stock.ticker, stock.sector);
      results.push(fundamentals);
      
      if (fundamentals.error) {
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`[Fundamentals] Failed to process ${stock.ticker}:`, error);
      errorCount++;
      // Continue with next stock
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Fundamentals] Completed in ${duration}s - Success: ${successCount}, Errors: ${errorCount}`);

  return results;
}

