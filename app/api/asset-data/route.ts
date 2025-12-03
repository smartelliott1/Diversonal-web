import { NextRequest, NextResponse } from "next/server";
import { callGrok } from "@/app/lib/grokClient";
import { 
  getStockNews,
  getStockRatios,
  getStockKeyMetrics,
  getCryptoNews,
  getCryptoQuote,
  getCryptoRSI,
  getCryptoSMAs,
} from "@/app/lib/financialData";

// Asset Data API
// Fetches asset-class-specific data for the right column

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

interface AssetDataRequest {
  ticker: string;
  assetClass: string;
}

// Response types for different asset classes
interface EquityMetrics {
  peRatio: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
  dividendYield: number | null;
  sma50: number | null;
  sma200: number | null;
  marketCap: number | null;
  growthPeriod?: string | null;
}

interface CryptoMetrics {
  volume: number | null;
  marketCap: number | null;
  rsi: number | null;
  rsiLabel: string | null;
  sma20Week: number | null;
  sma50Week: number | null;
  sma200Week: number | null;
  price: number | null;
}

interface CashMetrics {
  yield: number;
}

interface AssetDataResponse {
  ticker: string;
  assetClass: string;
  sentiment?: {
    score: number;
    label: "Bullish" | "Neutral" | "Bearish";
  };
  metrics?: EquityMetrics | CryptoMetrics | CashMetrics;
  headline?: {
    title: string;
    site: string;
    publishedDate: string;
    url: string;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssetDataRequest = await request.json();
    const { ticker, assetClass } = body;
    
    if (!ticker || !assetClass) {
      return NextResponse.json(
        { error: "Missing ticker or assetClass" },
        { status: 400 }
      );
    }
    
    console.log(`[Asset Data] Fetching data for ${ticker} (${assetClass})`);
    
    // Handle Cash separately - no API calls needed
    if (assetClass === "Cash") {
      const response: AssetDataResponse = {
        ticker,
        assetClass,
        metrics: {
          yield: 4.0, // Hardcoded ~4% money market yield
        } as CashMetrics,
      };
      return NextResponse.json(response);
    }
    
    // Handle Cryptocurrencies
    if (assetClass === "Cryptocurrencies") {
      return handleCryptoAsset(ticker, assetClass);
    }
    
    // Handle Equities
    if (assetClass === "Equities") {
      return handleEquityAsset(ticker, assetClass);
    }
    
    // Handle Bonds, Real Estate, Commodities - sentiment + news only
    return handleSimplifiedAsset(ticker, assetClass);
    
  } catch (error: any) {
    console.error("[Asset Data] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch asset data" },
      { status: 500 }
    );
  }
}

async function handleEquityAsset(ticker: string, assetClass: string): Promise<NextResponse> {
  // Fetch all data in parallel
  const [newsArticles, ratios, keyMetrics, quoteData] = await Promise.all([
    getStockNews(ticker, 10),
    getStockRatios(ticker),
    getStockKeyMetrics(ticker),
    fetchFMP(`/stable/quote?symbol=${ticker}`),
  ]);
  
  // Get quote data for SMAs and market cap
  const quote = quoteData && quoteData.length > 0 ? quoteData[0] : null;
  
  // Calculate revenue growth from income statements
  let revenueGrowth: number | null = null;
  let growthPeriod: string | null = null;
  
  try {
    const incomeData = await fetchFMP(`/stable/income-statement?symbol=${ticker}&limit=2`);
    if (incomeData && incomeData.length >= 2) {
      const latest = incomeData[0];
      const previous = incomeData[1];
      
      if (latest && previous && previous.revenue && previous.revenue !== 0) {
        revenueGrowth = ((latest.revenue - previous.revenue) / Math.abs(previous.revenue)) * 100;
        
        const latestDate = new Date(latest.date);
        const previousDate = new Date(previous.date);
        const monthsDiff = Math.round((latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsDiff >= 10 && monthsDiff <= 14) {
          growthPeriod = 'YoY';
        } else if (monthsDiff >= 2 && monthsDiff <= 4) {
          growthPeriod = 'QoQ';
        } else if (monthsDiff > 0) {
          growthPeriod = `${monthsDiff}M`;
        }
      }
    }
  } catch (e) {
    console.error(`[Asset Data] Error fetching income statements for ${ticker}:`, e);
  }
  
  // Build metrics
  const metrics: EquityMetrics = {
    peRatio: ratios?.priceToEarningsRatio || keyMetrics?.peRatio || null,
    revenueGrowth,
    profitMargin: ratios?.netProfitMargin ? ratios.netProfitMargin * 100 : null,
    dividendYield: ratios?.dividendYieldPercentage || keyMetrics?.dividendYield || null,
    sma50: quote?.priceAvg50 || null,
    sma200: quote?.priceAvg200 || null,
    marketCap: quote?.marketCap || null,
    growthPeriod,
  };
  
  // Analyze sentiment with Grok
  const { sentiment, selectedHeadline } = await analyzeSentiment(ticker, newsArticles, metrics);
  
  const response: AssetDataResponse = {
    ticker,
    assetClass,
    sentiment,
    metrics,
    headline: selectedHeadline,
  };
  
  return NextResponse.json(response);
}

async function handleCryptoAsset(ticker: string, assetClass: string): Promise<NextResponse> {
  // Convert ticker to FMP crypto format (e.g., BTC -> BTCUSD)
  const cryptoSymbol = ticker.endsWith('USD') ? ticker : `${ticker}USD`;
  
  // Fetch all crypto data in parallel
  const [cryptoQuote, cryptoRSI, cryptoSMAs, newsArticles] = await Promise.all([
    getCryptoQuote(cryptoSymbol),
    getCryptoRSI(cryptoSymbol),
    getCryptoSMAs(cryptoSymbol),
    getCryptoNews(cryptoSymbol, 10),
  ]);
  
  // Build crypto metrics
  const metrics: CryptoMetrics = {
    volume: cryptoQuote?.volume || null,
    marketCap: cryptoQuote?.marketCap || null,
    rsi: cryptoRSI?.rsi || null,
    rsiLabel: cryptoRSI?.label || null,
    sma20Week: cryptoSMAs?.sma140 || null,
    sma50Week: cryptoSMAs?.sma350 || null,
    sma200Week: cryptoSMAs?.sma1400 || null,
    price: cryptoQuote?.price || null,
  };
  
  // Analyze sentiment with Grok
  const { sentiment, selectedHeadline } = await analyzeCryptoSentiment(ticker, newsArticles, metrics);
  
  const response: AssetDataResponse = {
    ticker,
    assetClass,
    sentiment,
    metrics,
    headline: selectedHeadline,
  };
  
  return NextResponse.json(response);
}

async function handleSimplifiedAsset(ticker: string, assetClass: string): Promise<NextResponse> {
  // For Bonds, Real Estate, Commodities - just sentiment + news
  // Use stock news endpoint as these are typically ETFs/stocks
  const newsArticles = await getStockNews(ticker, 10);
  
  // Analyze sentiment with Grok (simplified)
  const { sentiment, selectedHeadline } = await analyzeSimpleSentiment(ticker, newsArticles, assetClass);
  
  const response: AssetDataResponse = {
    ticker,
    assetClass,
    sentiment,
    headline: selectedHeadline,
  };
  
  return NextResponse.json(response);
}

async function analyzeSentiment(
  ticker: string,
  newsArticles: any[],
  metrics: EquityMetrics
): Promise<{ sentiment: { score: number; label: "Bullish" | "Neutral" | "Bearish" }; selectedHeadline: any }> {
  let sentiment = { score: 50, label: "Neutral" as "Bullish" | "Neutral" | "Bearish" };
  let selectedHeadline = null;
  
  try {
    const headlinesList = newsArticles && newsArticles.length > 0 
      ? newsArticles.map((article, idx) => 
          `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
        ).join('\n')
      : 'No recent news available';
    
    const formatPct = (val: number | null | undefined, suffix: string = '%'): string => {
      if (val === null || val === undefined) return 'N/A';
      return `${val > 0 ? '+' : ''}${val.toFixed(2)}${suffix}`;
    };
    
    const fundamentalsSection = `
**FUNDAMENTALS:**
- P/E Ratio: ${metrics.peRatio ? metrics.peRatio.toFixed(1) : 'N/A'}
- Revenue Growth${metrics.growthPeriod ? ` (${metrics.growthPeriod})` : ''}: ${metrics.revenueGrowth !== null ? formatPct(metrics.revenueGrowth) : 'N/A'}
- Profit Margin: ${metrics.profitMargin !== null ? metrics.profitMargin.toFixed(1) + '%' : 'N/A'}
- 50-Day SMA: ${metrics.sma50 ? '$' + metrics.sma50.toFixed(2) : 'N/A'}
- 200-Day SMA: ${metrics.sma200 ? '$' + metrics.sma200.toFixed(2) : 'N/A'}`;
    
    const prompt = `Analyze ${ticker} and provide a sentiment score from 0-100:
${fundamentalsSection}

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Score guidelines:
- 0-40: Bearish (negative news, weak fundamentals)
- 41-60: Neutral (mixed signals)
- 61-100: Bullish (positive news, strong fundamentals)

Return ONLY valid JSON:
{
  "sentimentScore": 65,
  "headlineNumber": 1
}`;

    const grokResponse = await callGrok(prompt);
    let jsonStr = grokResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    const score = parsed.sentimentScore;
    
    let label: "Bullish" | "Neutral" | "Bearish";
    if (score >= 60) label = "Bullish";
    else if (score <= 40) label = "Bearish";
    else label = "Neutral";
    
    sentiment = { score, label };
    
    if (newsArticles && newsArticles.length > 0) {
      const headlineIndex = (parsed.headlineNumber || 1) - 1;
      const article = newsArticles[headlineIndex] || newsArticles[0];
      selectedHeadline = {
        title: article.title,
        site: article.site,
        publishedDate: article.publishedDate,
        url: article.url
      };
    }
  } catch (error: any) {
    console.error(`[Asset Data] Error analyzing sentiment for ${ticker}:`, error?.message);
    if (newsArticles && newsArticles.length > 0) {
      selectedHeadline = {
        title: newsArticles[0].title,
        site: newsArticles[0].site,
        publishedDate: newsArticles[0].publishedDate,
        url: newsArticles[0].url
      };
    }
  }
  
  return { sentiment, selectedHeadline };
}

async function analyzeCryptoSentiment(
  ticker: string,
  newsArticles: any[],
  metrics: CryptoMetrics
): Promise<{ sentiment: { score: number; label: "Bullish" | "Neutral" | "Bearish" }; selectedHeadline: any }> {
  let sentiment = { score: 50, label: "Neutral" as "Bullish" | "Neutral" | "Bearish" };
  let selectedHeadline = null;
  
  try {
    const headlinesList = newsArticles && newsArticles.length > 0 
      ? newsArticles.map((article, idx) => 
          `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
        ).join('\n')
      : 'No recent news available';
    
    const formatNum = (val: number | null | undefined): string => {
      if (val === null || val === undefined) return 'N/A';
      if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
      return `$${val.toFixed(2)}`;
    };
    
    const technicalSection = `
**TECHNICAL INDICATORS:**
- RSI (14-day): ${metrics.rsi ? metrics.rsi.toFixed(1) : 'N/A'} ${metrics.rsiLabel ? `(${metrics.rsiLabel})` : ''}
- Current Price: ${metrics.price ? formatNum(metrics.price) : 'N/A'}
- 20-Week SMA: ${metrics.sma20Week ? formatNum(metrics.sma20Week) : 'N/A'}
- 50-Week SMA: ${metrics.sma50Week ? formatNum(metrics.sma50Week) : 'N/A'}
- 200-Week SMA: ${metrics.sma200Week ? formatNum(metrics.sma200Week) : 'N/A'}
- Market Cap: ${metrics.marketCap ? formatNum(metrics.marketCap) : 'N/A'}
- 24h Volume: ${metrics.volume ? formatNum(metrics.volume) : 'N/A'}`;
    
    const prompt = `Analyze ${ticker} cryptocurrency and provide a sentiment score from 0-100:
${technicalSection}

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Score guidelines:
- 0-40: Bearish (negative news, oversold conditions, below key SMAs)
- 41-60: Neutral (mixed signals)
- 61-100: Bullish (positive news, strong momentum, above key SMAs)

Return ONLY valid JSON:
{
  "sentimentScore": 65,
  "headlineNumber": 1
}`;

    const grokResponse = await callGrok(prompt);
    let jsonStr = grokResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    const score = parsed.sentimentScore;
    
    let label: "Bullish" | "Neutral" | "Bearish";
    if (score >= 60) label = "Bullish";
    else if (score <= 40) label = "Bearish";
    else label = "Neutral";
    
    sentiment = { score, label };
    
    if (newsArticles && newsArticles.length > 0) {
      const headlineIndex = (parsed.headlineNumber || 1) - 1;
      const article = newsArticles[headlineIndex] || newsArticles[0];
      selectedHeadline = {
        title: article.title,
        site: article.site,
        publishedDate: article.publishedDate,
        url: article.url
      };
    }
  } catch (error: any) {
    console.error(`[Asset Data] Error analyzing crypto sentiment for ${ticker}:`, error?.message);
    if (newsArticles && newsArticles.length > 0) {
      selectedHeadline = {
        title: newsArticles[0].title,
        site: newsArticles[0].site,
        publishedDate: newsArticles[0].publishedDate,
        url: newsArticles[0].url
      };
    }
  }
  
  return { sentiment, selectedHeadline };
}

async function analyzeSimpleSentiment(
  ticker: string,
  newsArticles: any[],
  assetClass: string
): Promise<{ sentiment: { score: number; label: "Bullish" | "Neutral" | "Bearish" }; selectedHeadline: any }> {
  let sentiment = { score: 50, label: "Neutral" as "Bullish" | "Neutral" | "Bearish" };
  let selectedHeadline = null;
  
  try {
    const headlinesList = newsArticles && newsArticles.length > 0 
      ? newsArticles.map((article, idx) => 
          `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
        ).join('\n')
      : 'No recent news available';
    
    const prompt = `Analyze ${ticker} (${assetClass}) and provide a sentiment score from 0-100 based on recent news:

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Score guidelines:
- 0-40: Bearish (predominantly negative news)
- 41-60: Neutral (mixed or routine news)
- 61-100: Bullish (predominantly positive news)

Return ONLY valid JSON:
{
  "sentimentScore": 50,
  "headlineNumber": 1
}`;

    const grokResponse = await callGrok(prompt);
    let jsonStr = grokResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    const score = parsed.sentimentScore;
    
    let label: "Bullish" | "Neutral" | "Bearish";
    if (score >= 60) label = "Bullish";
    else if (score <= 40) label = "Bearish";
    else label = "Neutral";
    
    sentiment = { score, label };
    
    if (newsArticles && newsArticles.length > 0) {
      const headlineIndex = (parsed.headlineNumber || 1) - 1;
      const article = newsArticles[headlineIndex] || newsArticles[0];
      selectedHeadline = {
        title: article.title,
        site: article.site,
        publishedDate: article.publishedDate,
        url: article.url
      };
    }
  } catch (error: any) {
    console.error(`[Asset Data] Error analyzing sentiment for ${ticker}:`, error?.message);
    if (newsArticles && newsArticles.length > 0) {
      selectedHeadline = {
        title: newsArticles[0].title,
        site: newsArticles[0].site,
        publishedDate: newsArticles[0].publishedDate,
        url: newsArticles[0].url
      };
    }
  }
  
  return { sentiment, selectedHeadline };
}

