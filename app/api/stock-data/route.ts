import { NextRequest, NextResponse } from "next/server";
import { callGrok } from "@/app/lib/grokClient";
import { 
  getStockNews,
  getStockRatios,
  getStockKeyMetrics,
  getStockIncomeStatement,
  getStockProfile,
  getAnalystEstimates
} from "@/app/lib/financialData";

// Stage 3: Stock Data API
// Fetches Fear & Greed (via RSI + Grok analysis of momentum, fundamentals, and headlines), key metrics, and a headline to display

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

// Fetch RSI (14-day, 1day timeframe) for any ticker
async function getTickerRSI(ticker: string): Promise<number | null> {
  try {
    const data = await fetchFMP(`/stable/technical-indicators/rsi?symbol=${ticker}&periodLength=14&timeframe=1day`);
    if (data && data[0] && typeof data[0].rsi === 'number') {
      console.log(`[Stock Data] RSI for ${ticker}: ${data[0].rsi.toFixed(2)}`);
      return data[0].rsi;
    }
    return null;
  } catch (error: any) {
    console.error(`[Stock Data] Error fetching RSI for ${ticker}:`, error?.message);
    return null;
  }
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

// Fear & Greed labels
type FearGreedLabel = "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";

interface StockDataResponse {
  ticker: string;
  fearGreed: {
    score: number; // 0-100
    label: FearGreedLabel;
    rsi: number | null; // Raw RSI value for display
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
    
    // Fetch all data in parallel (including price momentum and RSI)
    const [newsArticles, ratios, keyMetrics, incomeStatements, priceChange, rsi, profile, analystEstimates] = await Promise.all([
      getStockNews(ticker, 10),
      getStockRatios(ticker),
      getStockKeyMetrics(ticker),
      getStockIncomeStatement(ticker),
      getStockPriceChange(ticker),
      getTickerRSI(ticker),
      getStockProfile(ticker),
      getAnalystEstimates(ticker)
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
    
    // Calculate real-time trailing PE using current price (more accurate than FMP's stale ratio)
    const currentPrice = profile?.price;
    const annualEPS = incomeStatements?.[0]?.epsdiluted;
    const trailingPE = (currentPrice && annualEPS && annualEPS > 0)
      ? currentPrice / annualEPS
      : null;
    
    // Calculate forward PE using next fiscal year estimate
    let forwardPE: number | null = null;
    let forwardPEFiscalYear: string | null = null;
    
    if (currentPrice && analystEstimates) {
      const currentYear = new Date().getFullYear();
      const estimateDate = new Date(analystEstimates.date);
      const estimateYear = estimateDate.getFullYear();
      
      // Only use if estimate is for next 1-2 fiscal years (not 5 years out)
      if (estimateYear <= currentYear + 2 && analystEstimates.estimatedEpsAvg > 0) {
        forwardPE = currentPrice / analystEstimates.estimatedEpsAvg;
        forwardPEFiscalYear = `FY${estimateYear}`;
      }
    }
    
    // Format helper for percentage display
    const formatPct = (val: number | null | undefined, suffix: string = '%'): string => {
      if (val === null || val === undefined) return 'N/A';
      return `${val > 0 ? '+' : ''}${val.toFixed(2)}${suffix}`;
    };
    
    // Process Fear & Greed using RSI + Grok analysis of momentum, fundamentals, and headlines
    let fearGreed = {
      score: 50,
      label: "Neutral" as FearGreedLabel,
      rsi: rsi
    };
    let selectedHeadline = null;
    
    // Build the comprehensive prompt for Fear/Greed scoring
    try {
      const headlinesList = newsArticles && newsArticles.length > 0 
        ? newsArticles.map((article, idx) => 
            `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
          ).join('\n')
        : 'No recent news available';
      
      // Build momentum section (last 3 months only)
      const momentumSection = priceChange ? `
**PRICE MOMENTUM (Last 3 Months):**
- 1 Day: ${formatPct(priceChange["1D"])}
- 5 Day: ${formatPct(priceChange["5D"])}
- 1 Month: ${formatPct(priceChange["1M"])}
- 3 Month: ${formatPct(priceChange["3M"])}` : `
**PRICE MOMENTUM:**
- Data unavailable`;
      
      // Build fundamentals section
      const profitMargin = ratios?.netProfitMargin ? ratios.netProfitMargin * 100 : null;
      
      const fundamentalsSection = `
**FUNDAMENTALS:**
- P/E Ratio: ${trailingPE ? trailingPE.toFixed(1) : 'N/A'}
- EPS Growth${growthPeriod ? ` (${growthPeriod})` : ''}: ${epsGrowth !== null ? formatPct(epsGrowth) : 'N/A'}
- Revenue Growth${growthPeriod ? ` (${growthPeriod})` : ''}: ${revenueGrowth !== null ? formatPct(revenueGrowth) : 'N/A'}
- Profit Margin: ${profitMargin !== null ? profitMargin.toFixed(1) + '%' : 'N/A'}`;
      
      const prompt = `Analyze ${ticker} for FEAR & GREED indicators. Score each category from 0-100 where:
- LOW scores (0-40) = FEAR (panic selling, negative sentiment, weak conditions)
- MID scores (41-60) = NEUTRAL
- HIGH scores (61-100) = GREED (aggressive buying, euphoria, strong momentum)

${momentumSection}
${fundamentalsSection}

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Score each category for FEAR vs GREED using the FULL 0-100 range:

**MOMENTUM SCORE (0-100) - How greedy/fearful is recent price action?**
- 0-20: EXTREME FEAR - Crash, capitulation, negative across all recent timeframes (example: 9)
- 21-40: FEAR - Declining over the past 3 months, weak price action (example: 32)
- 41-60: NEUTRAL - Mixed, choppy, no clear trend
- 61-80: GREED - Rising over the past 3 months, strong momentum (example: 72)
- 81-100: EXTREME GREED - Parabolic rally, strongly positive across all recent timeframes (example: 88)

**FUNDAMENTALS SCORE (0-100) - Are fundamentals driving fear or greed?**
- 0-20: EXTREME FEAR - Terrible metrics, losses, collapsing margins (example: 15)
- 21-40: FEAR - Declining growth, concerning trends
- 41-60: NEUTRAL - Average, mixed metrics
- 61-80: GREED - Strong growth, healthy margins
- 81-100: EXTREME GREED - Exceptional growth fueling buying frenzy (example: 85)

**NEWS SCORE (0-100) - What sentiment is news driving?**
- 0-20: EXTREME FEAR - Disaster news, fraud, bankruptcy, major lawsuits (example: 2)
- 21-40: FEAR - Negative coverage, downgrades, layoffs
- 41-60: NEUTRAL - Routine news, mixed coverage
- 61-80: GREED - Positive developments, upgrades, expansion
- 81-100: EXTREME GREED - Breakthrough news, acquisition, blowout earnings (example: 95)

BE DECISIVE - Use extreme scores (2, 9, 15, 85, 88, 95) when conditions warrant. Avoid clustering around 50-60.

Return ONLY valid JSON:
{
  "momentumScore": 72,
  "fundamentalsScore": 58,
  "newsScore": 45,
  "headlineNumber": 1
}`;

      const grokResponse = await callGrok(prompt);
      
      // Strip markdown code fences if present (Grok sometimes wraps JSON in ```json blocks)
      let jsonStr = grokResponse.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // Calculate Fear & Greed score with RSI as primary indicator
      // Weights: RSI 35%, News 30%, Momentum 25%, Fundamentals 10%
      const rsiScore = rsi !== null ? rsi : 50; // Default to neutral if RSI unavailable
      const fearGreedScore = Math.round(
        (rsiScore * 0.35) +
        (parsed.newsScore * 0.30) +
        (parsed.momentumScore * 0.25) +
        (parsed.fundamentalsScore * 0.10)
      );
      
      // Determine Fear & Greed label based on score
      let label: FearGreedLabel;
      if (fearGreedScore <= 20) {
        label = "Extreme Fear";
      } else if (fearGreedScore <= 40) {
        label = "Fear";
      } else if (fearGreedScore <= 60) {
        label = "Neutral";
      } else if (fearGreedScore <= 80) {
        label = "Greed";
      } else {
        label = "Extreme Greed";
      }
      
      fearGreed = {
        score: fearGreedScore,
        label,
        rsi
      };
      
      console.log(`[Stock Data] ${ticker} Fear & Greed - RSI: ${rsi?.toFixed(1) ?? 'N/A'}, Momentum: ${parsed.momentumScore}, News: ${parsed.newsScore}, Fundamentals: ${parsed.fundamentalsScore} => Score: ${fearGreedScore} (${label})`);
      
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
    } catch (error: any) {
      console.error(`[Stock Data] Error analyzing Fear & Greed for ${ticker}:`, error?.message);
      // Still use RSI if available for fallback calculation
      if (rsi !== null) {
        let label: FearGreedLabel;
        if (rsi <= 20) label = "Extreme Fear";
        else if (rsi <= 40) label = "Fear";
        else if (rsi <= 60) label = "Neutral";
        else if (rsi <= 80) label = "Greed";
        else label = "Extreme Greed";
        
        fearGreed = { score: Math.round(rsi), label, rsi };
      }
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
      peRatio: trailingPE,  // Real-time PE using current price
      forwardPE,
      forwardPEFiscalYear,
      epsGrowth,
      revenueGrowth,
      profitMargin: ratios?.netProfitMargin ? ratios.netProfitMargin * 100 : null,
      dividendYield: ratios?.dividendYieldPercentage || keyMetrics?.dividendYield || null,
      growthPeriod
    };
    
    const response: StockDataResponse = {
      ticker,
      fearGreed,
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

