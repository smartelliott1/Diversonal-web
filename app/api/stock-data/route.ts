import { NextRequest, NextResponse } from "next/server";
import { callGrok } from "@/app/lib/grokClient";
import { 
  getStockNews,
  getStockRatios,
  getStockKeyMetrics,
  getStockIncomeStatement
} from "@/app/lib/financialData";

// Stage 3: Stock Data API
// Fetches sentiment (via Grok analysis of headlines), key metrics, and a headline to display

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
    
    // Fetch all data in parallel
    const [newsArticles, ratios, keyMetrics, incomeStatements] = await Promise.all([
      getStockNews(ticker, 10),
      getStockRatios(ticker),
      getStockKeyMetrics(ticker),
      getStockIncomeStatement(ticker)
    ]);
    
    // Process sentiment from headlines using Grok
    let sentiment = {
      score: 50,
      label: "Neutral" as "Bullish" | "Neutral" | "Bearish"
    };
    let selectedHeadline = null;
    
    if (newsArticles && newsArticles.length > 0) {
      try {
        const headlinesList = newsArticles.map((article, idx) => 
          `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
        ).join('\n');
        
        const prompt = `Analyze these ${newsArticles.length} recent news headlines for ${ticker}:

${headlinesList}

Based on the overall tone, momentum, and sentiment of ALL these headlines, provide:
1. A sentiment score from 0-100 where:
   - 0-30: Extremely Bearish (major negative news, significant concerns)
   - 31-45: Bearish (mostly negative sentiment, caution advised)
   - 46-55: Neutral (mixed signals, balanced news)
   - 56-70: Bullish (mostly positive sentiment, optimistic outlook)
   - 71-100: Extremely Bullish (overwhelmingly positive, strong momentum)

2. A sentiment label: "Bullish", "Neutral", or "Bearish"
3. The number (1-${newsArticles.length}) of the MOST impactful/relevant headline to display

Be analytical and avoid defaulting to middle values. Consider:
- Is the news uniformly positive/negative or mixed?
- Are there major catalysts (earnings beats, product launches, partnerships)?
- Are there significant risks (lawsuits, departures, regulatory issues)?

Return ONLY valid JSON format:
{
  "sentiment": 82,
  "label": "Bullish",
  "headlineNumber": 1
}`;

        const grokResponse = await callGrok(prompt);
        const parsed = JSON.parse(grokResponse);
        
        sentiment = {
          score: parsed.sentiment,
          label: parsed.label
        };
        
        // Get the selected headline
        const headlineIndex = (parsed.headlineNumber || 1) - 1;
        if (newsArticles[headlineIndex]) {
          selectedHeadline = {
            title: newsArticles[headlineIndex].title,
            site: newsArticles[headlineIndex].site,
            publishedDate: newsArticles[headlineIndex].publishedDate,
            url: newsArticles[headlineIndex].url
          };
        }
        
        console.log(`[Stock Data] ${ticker} sentiment: ${sentiment.score} (${sentiment.label})`);
      } catch (error: any) {
        console.error(`[Stock Data] Error analyzing sentiment for ${ticker}:`, error?.message);
        // Use first headline as fallback
        selectedHeadline = {
          title: newsArticles[0].title,
          site: newsArticles[0].site,
          publishedDate: newsArticles[0].publishedDate,
          url: newsArticles[0].url
        };
      }
    }
    
    // Process metrics
    const metrics = {
      peRatio: ratios?.priceToEarningsRatio || keyMetrics?.peRatio || null,
      epsGrowth: null as number | null,
      revenueGrowth: null as number | null,
      profitMargin: ratios?.netProfitMargin || null,
      dividendYield: ratios?.dividendYieldPercentage || keyMetrics?.dividendYield || null,
      growthPeriod: null as string | null
    };
    
    // Calculate growth metrics from income statements
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
          metrics.growthPeriod = 'YoY';
        } else if (monthsDiff >= 2 && monthsDiff <= 4) {
          metrics.growthPeriod = 'QoQ';
        } else if (monthsDiff > 0) {
          metrics.growthPeriod = `${monthsDiff}M`;
        }
        
        // Calculate EPS Growth
        if (latest.eps && previous.eps && previous.eps !== 0) {
          metrics.epsGrowth = ((latest.eps - previous.eps) / Math.abs(previous.eps)) * 100;
        }
        
        // Calculate Revenue Growth
        if (latest.revenue && previous.revenue && previous.revenue !== 0) {
          metrics.revenueGrowth = ((latest.revenue - previous.revenue) / Math.abs(previous.revenue)) * 100;
        }
      }
    }
    
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

