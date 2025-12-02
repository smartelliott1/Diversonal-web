import { NextRequest, NextResponse } from "next/server";
import { callGrok } from "@/app/lib/grokClient";
import { 
  getStockNews,
  getStockRatios,
  getStockKeyMetrics,
  getStockIncomeStatement
} from "@/app/lib/financialData";

// Stage 3: Stock Data API
// Fetches sentiment (via Grok analysis of momentum, fundamentals, and headlines), key metrics, and a headline to display

// Helper to fetch from FMP API
async function fetchFMP(endpoint: string): Promise<any> {
  const FMP_API_KEY = process.env.FMP_API_KEY;
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY not configured");
  }
  
  const url = `https://financialmodelingprep.com${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${FMP_API_KEY}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }
  
  return await response.json();
}

// Interface for price change data
interface PriceChangeData {
  "1D": number | null;
  "5D": number | null;
  "1M": number | null;
  "3M": number | null;
  "6M": number | null;
  "ytd": number | null;
  "1Y": number | null;
}

// Fetch multi-timeframe price changes
async function getStockPriceChange(ticker: string): Promise<PriceChangeData | null> {
  try {
    const data = await fetchFMP(`/stable/stock-price-change?symbol=${ticker}`);
    if (data && data[0]) {
      return {
        "1D": data[0]["1D"] ?? null,
        "5D": data[0]["5D"] ?? null,
        "1M": data[0]["1M"] ?? null,
        "3M": data[0]["3M"] ?? null,
        "6M": data[0]["6M"] ?? null,
        "ytd": data[0]["ytd"] ?? null,
        "1Y": data[0]["1Y"] ?? null,
      };
    }
    return null;
  } catch (error: any) {
    console.error(`[Stock Data] Error fetching price change for ${ticker}:`, error?.message);
    return null;
  }
}

interface StockDataRequest {
  ticker: string;
}

interface StockDataResponse {
  ticker: string;
  sentiment: {
    score: number; // 0-100
    label: "Bullish" | "Neutral" | "Bearish";
  };
  metrics: {
    peRatio: number | null;
    epsGrowth: number | null;
    revenueGrowth: number | null;
    profitMargin: number | null;
    dividendYield: number | null;
  };
  headline: {
    title: string;
    site: string;
    publishedDate: string;
    url: string;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: StockDataRequest = await request.json();
    const { ticker } = body;
    
    if (!ticker) {
      return NextResponse.json(
        { error: "No ticker provided" },
        { status: 400 }
      );
    }
    
    console.log(`[Stock Data] Fetching data for ${ticker}`);
    
    // Fetch all data in parallel (including price momentum)
    const [newsArticles, ratios, keyMetrics, incomeStatements, priceChange] = await Promise.all([
      getStockNews(ticker, 10),
      getStockRatios(ticker),
      getStockKeyMetrics(ticker),
      getStockIncomeStatement(ticker),
      getStockPriceChange(ticker)
    ]);
    
    // Calculate growth metrics BEFORE the prompt (so we can include them)
    let epsGrowth: number | null = null;
    let revenueGrowth: number | null = null;
    let growthPeriod: string | null = null;
    
    if (incomeStatements && Array.isArray(incomeStatements) && incomeStatements.length >= 2) {
      const latest = incomeStatements[0];
      const previous = incomeStatements[1];
      
      if (latest && previous) {
        // Determine time period between statements
        const latestDate = new Date(latest.date);
        const previousDate = new Date(previous.date);
        const monthsDiff = Math.round((latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        // Label the period (YoY for ~12 months, QoQ for ~3 months, otherwise just show months)
        if (monthsDiff >= 10 && monthsDiff <= 14) {
          growthPeriod = 'YoY';
        } else if (monthsDiff >= 2 && monthsDiff <= 4) {
          growthPeriod = 'QoQ';
        } else if (monthsDiff > 0) {
          growthPeriod = `${monthsDiff}M`;
        }
        
        // Calculate EPS Growth
        if (latest.eps && previous.eps && previous.eps !== 0) {
          epsGrowth = ((latest.eps - previous.eps) / Math.abs(previous.eps)) * 100;
        }
        
        // Calculate Revenue Growth
        if (latest.revenue && previous.revenue && previous.revenue !== 0) {
          revenueGrowth = ((latest.revenue - previous.revenue) / Math.abs(previous.revenue)) * 100;
        }
      }
    }
    
    // Format helper for percentage display
    const formatPct = (val: number | null | undefined, suffix: string = '%'): string => {
      if (val === null || val === undefined) return 'N/A';
      return `${val > 0 ? '+' : ''}${val.toFixed(2)}${suffix}`;
    };
    
    // Process sentiment using Grok with momentum, fundamentals, AND headlines
    let sentiment = {
      score: 50,
      label: "Neutral" as "Bullish" | "Neutral" | "Bearish"
    };
    let selectedHeadline = null;
    
    // Build the comprehensive prompt
    try {
      const headlinesList = newsArticles && newsArticles.length > 0 
        ? newsArticles.map((article, idx) => 
            `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
          ).join('\n')
        : 'No recent news available';
      
      // Build momentum section
      const momentumSection = priceChange ? `
**PRICE MOMENTUM:**
- 1 Day: ${formatPct(priceChange["1D"])}
- 5 Day: ${formatPct(priceChange["5D"])}
- 1 Month: ${formatPct(priceChange["1M"])}
- 3 Month: ${formatPct(priceChange["3M"])}
- 6 Month: ${formatPct(priceChange["6M"])}
- YTD: ${formatPct(priceChange["ytd"])}
- 1 Year: ${formatPct(priceChange["1Y"])}` : `
**PRICE MOMENTUM:**
- Data unavailable`;
      
      // Build fundamentals section
      const peRatio = ratios?.priceToEarningsRatio || keyMetrics?.peRatio;
      const profitMargin = ratios?.netProfitMargin ? ratios.netProfitMargin * 100 : null;
      
      const fundamentalsSection = `
**FUNDAMENTALS:**
- P/E Ratio: ${peRatio ? peRatio.toFixed(1) : 'N/A'}
- EPS Growth${growthPeriod ? ` (${growthPeriod})` : ''}: ${epsGrowth !== null ? formatPct(epsGrowth) : 'N/A'}
- Revenue Growth${growthPeriod ? ` (${growthPeriod})` : ''}: ${revenueGrowth !== null ? formatPct(revenueGrowth) : 'N/A'}
- Profit Margin: ${profitMargin !== null ? profitMargin.toFixed(1) + '%' : 'N/A'}`;
      
      const prompt = `Analyze ${ticker} and calculate a sentiment score based on the following data:
${momentumSection}
${fundamentalsSection}

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Calculate a sentiment score from 0-100 using these weights:
- Price Momentum (20%): Is the stock trending up or down across timeframes? Consistent direction = stronger signal.
- Fundamentals (20%): Is the business healthy? Growing EPS/revenue = bullish. High P/E with weak growth = bearish.
- News Sentiment (60%): What's the narrative? Major catalysts, risks, or mixed signals?

Scoring Guidelines:
- 0-20: Extremely Bearish (downtrend + weak fundamentals + negative news)
- 21-40: Bearish (mostly negative signals across categories)
- 41-60: Neutral (mixed signals or insufficient data)
- 61-80: Bullish (uptrend + solid fundamentals + positive news)
- 81-100: Extremely Bullish (strong momentum + growth + overwhelmingly positive news)

Be analytical. Avoid defaulting to 50. If momentum is negative but news is positive, weigh accordingly.

Return ONLY valid JSON:
{
  "sentiment": <0-100>,
  "label": "<Bullish|Neutral|Bearish>",
  "headlineNumber": <1-${newsArticles?.length || 1}>
}`;

      const grokResponse = await callGrok(prompt);
      const parsed = JSON.parse(grokResponse);
      
      sentiment = {
        score: parsed.sentiment,
        label: parsed.label
      };
      
      // Get the selected headline
      if (newsArticles && newsArticles.length > 0) {
        const headlineIndex = (parsed.headlineNumber || 1) - 1;
        if (newsArticles[headlineIndex]) {
          selectedHeadline = {
            title: newsArticles[headlineIndex].title,
            site: newsArticles[headlineIndex].site,
            publishedDate: newsArticles[headlineIndex].publishedDate,
            url: newsArticles[headlineIndex].url
          };
        } else {
          selectedHeadline = {
            title: newsArticles[0].title,
            site: newsArticles[0].site,
            publishedDate: newsArticles[0].publishedDate,
            url: newsArticles[0].url
          };
        }
      }
      
      console.log(`[Stock Data] ${ticker} sentiment: ${sentiment.score} (${sentiment.label})`);
    } catch (error: any) {
      console.error(`[Stock Data] Error analyzing sentiment for ${ticker}:`, error?.message);
      // Use first headline as fallback
      if (newsArticles && newsArticles.length > 0) {
        selectedHeadline = {
          title: newsArticles[0].title,
          site: newsArticles[0].site,
          publishedDate: newsArticles[0].publishedDate,
          url: newsArticles[0].url
        };
      }
    }
    
    // Process metrics for response
    const metrics = {
      peRatio: ratios?.priceToEarningsRatio || keyMetrics?.peRatio || null,
      epsGrowth,
      revenueGrowth,
      profitMargin: ratios?.netProfitMargin ? ratios.netProfitMargin * 100 : null,
      dividendYield: ratios?.dividendYieldPercentage || keyMetrics?.dividendYield || null,
      growthPeriod
    };
    
    const response: StockDataResponse = {
      ticker,
      sentiment,
      metrics,
      headline: selectedHeadline
    };
    
    console.log(`[Stock Data] Successfully fetched data for ${ticker}`);
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("[Stock Data] Error:", error);
    
    return NextResponse.json(
      { error: error?.message || "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}

