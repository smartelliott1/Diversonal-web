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
// Uses Fear & Greed scoring with RSI + Grok analysis

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

// Fetch RSI for any ticker
async function getTickerRSI(ticker: string): Promise<number | null> {
  try {
    const data = await fetchFMP(`/stable/technical-indicators/rsi?symbol=${ticker}&periodLength=14&timeframe=1day`);
    if (data && data[0] && typeof data[0].rsi === 'number') {
      console.log(`[Asset Data] RSI for ${ticker}: ${data[0].rsi.toFixed(2)}`);
      return data[0].rsi;
    }
    return null;
  } catch (error: any) {
    console.error(`[Asset Data] Error fetching RSI for ${ticker}:`, error?.message);
    return null;
  }
}

// Fetch price changes for momentum
interface PriceChangeData {
  "1D": number | null;
  "5D": number | null;
  "1M": number | null;
  "3M": number | null;
}

async function getPriceChange(ticker: string): Promise<PriceChangeData | null> {
  try {
    const data = await fetchFMP(`/stable/stock-price-change?symbol=${ticker}`);
    if (data && data[0]) {
      return {
        "1D": data[0]["1D"] ?? null,
        "5D": data[0]["5D"] ?? null,
        "1M": data[0]["1M"] ?? null,
        "3M": data[0]["3M"] ?? null,
      };
    }
    return null;
  } catch (error: any) {
    console.error(`[Asset Data] Error fetching price change for ${ticker}:`, error?.message);
    return null;
  }
}

interface AssetDataRequest {
  ticker: string;
  assetClass: string;
}

// Fear & Greed labels
type FearGreedLabel = "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";

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
  fearGreed?: {
    score: number;
    label: FearGreedLabel;
    rsi: number | null;
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
    
    // Handle Bonds, Real Estate, Commodities - Fear & Greed + news only
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
  const [newsArticles, ratios, keyMetrics, quoteData, priceChange, rsi] = await Promise.all([
    getStockNews(ticker, 10),
    getStockRatios(ticker),
    getStockKeyMetrics(ticker),
    fetchFMP(`/stable/quote?symbol=${ticker}`),
    getPriceChange(ticker),
    getTickerRSI(ticker),
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
  
  // Analyze Fear & Greed with Grok using original formula
  const { fearGreed, selectedHeadline } = await analyzeFearGreed(ticker, newsArticles, priceChange, metrics, rsi);
  
  const response: AssetDataResponse = {
    ticker,
    assetClass,
    fearGreed,
    metrics,
    headline: selectedHeadline,
  };
  
  return NextResponse.json(response);
}

async function handleCryptoAsset(ticker: string, assetClass: string): Promise<NextResponse> {
  // Convert ticker to FMP crypto format (e.g., BTC -> BTCUSD)
  const cryptoSymbol = ticker.endsWith('USD') ? ticker : `${ticker}USD`;
  
  // Fetch all crypto data in parallel
  const [cryptoQuote, cryptoRSI, cryptoSMAs, newsArticles, priceChange] = await Promise.all([
    getCryptoQuote(cryptoSymbol),
    getCryptoRSI(cryptoSymbol),
    getCryptoSMAs(cryptoSymbol),
    getCryptoNews(cryptoSymbol, 10),
    getPriceChange(cryptoSymbol),
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
  
  // Analyze Fear & Greed with Grok
  const rsi = cryptoRSI?.rsi || null;
  const { fearGreed, selectedHeadline } = await analyzeCryptoFearGreed(ticker, newsArticles, priceChange, metrics, rsi);
  
  const response: AssetDataResponse = {
    ticker,
    assetClass,
    fearGreed,
    metrics,
    headline: selectedHeadline,
  };
  
  return NextResponse.json(response);
}

async function handleSimplifiedAsset(ticker: string, assetClass: string): Promise<NextResponse> {
  // For Bonds, Real Estate, Commodities - Fear & Greed + news only
  const [newsArticles, priceChange, rsi] = await Promise.all([
    getStockNews(ticker, 10),
    getPriceChange(ticker),
    getTickerRSI(ticker),
  ]);
  
  // Analyze Fear & Greed with Grok (simplified - news only)
  const { fearGreed, selectedHeadline } = await analyzeSimpleFearGreed(ticker, newsArticles, priceChange, rsi, assetClass);
  
  const response: AssetDataResponse = {
    ticker,
    assetClass,
    fearGreed,
    headline: selectedHeadline,
  };
  
  return NextResponse.json(response);
}

// Format helper for percentage display
function formatPct(val: number | null | undefined, suffix: string = '%'): string {
  if (val === null || val === undefined) return 'N/A';
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}${suffix}`;
}

// Get Fear & Greed label from score
function getFearGreedLabel(score: number): FearGreedLabel {
  if (score <= 20) return "Extreme Fear";
  if (score <= 40) return "Fear";
  if (score <= 60) return "Neutral";
  if (score <= 80) return "Greed";
  return "Extreme Greed";
}

async function analyzeFearGreed(
  ticker: string,
  newsArticles: any[],
  priceChange: PriceChangeData | null,
  metrics: EquityMetrics,
  rsi: number | null
): Promise<{ fearGreed: { score: number; label: FearGreedLabel; rsi: number | null }; selectedHeadline: any }> {
  let fearGreed = { score: 50, label: "Neutral" as FearGreedLabel, rsi };
  let selectedHeadline = null;
  
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
    const fundamentalsSection = `
**FUNDAMENTALS:**
- P/E Ratio: ${metrics.peRatio ? metrics.peRatio.toFixed(1) : 'N/A'}
- Revenue Growth${metrics.growthPeriod ? ` (${metrics.growthPeriod})` : ''}: ${metrics.revenueGrowth !== null ? formatPct(metrics.revenueGrowth) : 'N/A'}
- Profit Margin: ${metrics.profitMargin !== null ? metrics.profitMargin.toFixed(1) + '%' : 'N/A'}`;
    
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
    
    // Strip markdown code fences if present
    let jsonStr = grokResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Calculate Fear & Greed score with RSI as primary indicator
    // Weights: RSI 35%, News 30%, Momentum 25%, Fundamentals 10%
    const rsiScore = rsi !== null ? rsi : 50;
    const fearGreedScore = Math.round(
      (rsiScore * 0.35) +
      (parsed.newsScore * 0.30) +
      (parsed.momentumScore * 0.25) +
      (parsed.fundamentalsScore * 0.10)
    );
    
    fearGreed = {
      score: fearGreedScore,
      label: getFearGreedLabel(fearGreedScore),
      rsi
    };
    
    console.log(`[Asset Data] ${ticker} Fear & Greed - RSI: ${rsi?.toFixed(1) ?? 'N/A'}, Momentum: ${parsed.momentumScore}, News: ${parsed.newsScore}, Fundamentals: ${parsed.fundamentalsScore} => Score: ${fearGreedScore} (${fearGreed.label})`);
    
    // Get the selected headline
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
    console.error(`[Asset Data] Error analyzing Fear & Greed for ${ticker}:`, error?.message);
    // Use RSI as fallback
    if (rsi !== null) {
      fearGreed = { score: Math.round(rsi), label: getFearGreedLabel(Math.round(rsi)), rsi };
    }
    if (newsArticles && newsArticles.length > 0) {
      selectedHeadline = {
        title: newsArticles[0].title,
        site: newsArticles[0].site,
        publishedDate: newsArticles[0].publishedDate,
        url: newsArticles[0].url
      };
    }
  }
  
  return { fearGreed, selectedHeadline };
}

async function analyzeCryptoFearGreed(
  ticker: string,
  newsArticles: any[],
  priceChange: PriceChangeData | null,
  metrics: CryptoMetrics,
  rsi: number | null
): Promise<{ fearGreed: { score: number; label: FearGreedLabel; rsi: number | null }; selectedHeadline: any }> {
  let fearGreed = { score: 50, label: "Neutral" as FearGreedLabel, rsi };
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
    
    // Build momentum section
    const momentumSection = priceChange ? `
**PRICE MOMENTUM (Last 3 Months):**
- 1 Day: ${formatPct(priceChange["1D"])}
- 5 Day: ${formatPct(priceChange["5D"])}
- 1 Month: ${formatPct(priceChange["1M"])}
- 3 Month: ${formatPct(priceChange["3M"])}` : `
**PRICE MOMENTUM:**
- Data unavailable`;
    
    const technicalSection = `
**TECHNICAL INDICATORS:**
- RSI (14-day): ${metrics.rsi ? metrics.rsi.toFixed(1) : 'N/A'} ${metrics.rsiLabel ? `(${metrics.rsiLabel})` : ''}
- Current Price: ${metrics.price ? formatNum(metrics.price) : 'N/A'}
- 20-Week SMA: ${metrics.sma20Week ? formatNum(metrics.sma20Week) : 'N/A'}
- 50-Week SMA: ${metrics.sma50Week ? formatNum(metrics.sma50Week) : 'N/A'}
- 200-Week SMA: ${metrics.sma200Week ? formatNum(metrics.sma200Week) : 'N/A'}
- Market Cap: ${metrics.marketCap ? formatNum(metrics.marketCap) : 'N/A'}
- 24h Volume: ${metrics.volume ? formatNum(metrics.volume) : 'N/A'}`;
    
    const prompt = `Analyze ${ticker} cryptocurrency for FEAR & GREED indicators. Score each category from 0-100 where:
- LOW scores (0-40) = FEAR (panic selling, capitulation, weak conditions)
- MID scores (41-60) = NEUTRAL
- HIGH scores (61-100) = GREED (FOMO buying, euphoria, strong momentum)

${momentumSection}
${technicalSection}

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Score each category for FEAR vs GREED using the FULL 0-100 range:

**MOMENTUM SCORE (0-100) - How greedy/fearful is recent price action?**
- 0-20: EXTREME FEAR - Crash, capitulation, negative across all recent timeframes (example: 9)
- 21-40: FEAR - Declining over the past 3 months, weak price action (example: 32)
- 41-60: NEUTRAL - Mixed, choppy, no clear trend
- 61-80: GREED - Rising over the past 3 months, strong momentum (example: 72)
- 81-100: EXTREME GREED - Parabolic rally, strongly positive across all recent timeframes (example: 88)

**FUNDAMENTALS SCORE (0-100) - Are technicals driving fear or greed?**
- 0-20: EXTREME FEAR - Price below all major SMAs, oversold RSI (example: 15)
- 21-40: FEAR - Price below key SMAs, weak technicals
- 41-60: NEUTRAL - Mixed signals, consolidation
- 61-80: GREED - Price above SMAs, bullish structure
- 81-100: EXTREME GREED - Price far above all SMAs, overbought RSI (example: 85)

**NEWS SCORE (0-100) - What sentiment is news driving?**
- 0-20: EXTREME FEAR - Exchange hacks, regulatory crackdowns, major failures (example: 2)
- 21-40: FEAR - Negative coverage, FUD, bearish outlooks
- 41-60: NEUTRAL - Routine news, mixed coverage
- 61-80: GREED - Adoption news, ETF flows, positive developments
- 81-100: EXTREME GREED - Institutional FOMO, all-time highs, mainstream euphoria (example: 95)

BE DECISIVE - Use extreme scores (2, 9, 15, 85, 88, 95) when conditions warrant. Avoid clustering around 50-60.

Return ONLY valid JSON:
{
  "momentumScore": 72,
  "fundamentalsScore": 58,
  "newsScore": 45,
  "headlineNumber": 1
}`;

    const grokResponse = await callGrok(prompt);
    
    let jsonStr = grokResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Calculate Fear & Greed score with RSI as primary indicator
    // Weights: RSI 35%, News 30%, Momentum 25%, Fundamentals 10%
    const rsiScore = rsi !== null ? rsi : 50;
    const fearGreedScore = Math.round(
      (rsiScore * 0.35) +
      (parsed.newsScore * 0.30) +
      (parsed.momentumScore * 0.25) +
      (parsed.fundamentalsScore * 0.10)
    );
    
    fearGreed = {
      score: fearGreedScore,
      label: getFearGreedLabel(fearGreedScore),
      rsi
    };
    
    console.log(`[Asset Data] ${ticker} Crypto Fear & Greed - RSI: ${rsi?.toFixed(1) ?? 'N/A'}, Momentum: ${parsed.momentumScore}, News: ${parsed.newsScore}, Fundamentals: ${parsed.fundamentalsScore} => Score: ${fearGreedScore} (${fearGreed.label})`);
    
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
    console.error(`[Asset Data] Error analyzing crypto Fear & Greed for ${ticker}:`, error?.message);
    if (rsi !== null) {
      fearGreed = { score: Math.round(rsi), label: getFearGreedLabel(Math.round(rsi)), rsi };
    }
    if (newsArticles && newsArticles.length > 0) {
      selectedHeadline = {
        title: newsArticles[0].title,
        site: newsArticles[0].site,
        publishedDate: newsArticles[0].publishedDate,
        url: newsArticles[0].url
      };
    }
  }
  
  return { fearGreed, selectedHeadline };
}

async function analyzeSimpleFearGreed(
  ticker: string,
  newsArticles: any[],
  priceChange: PriceChangeData | null,
  rsi: number | null,
  assetClass: string
): Promise<{ fearGreed: { score: number; label: FearGreedLabel; rsi: number | null }; selectedHeadline: any }> {
  let fearGreed = { score: 50, label: "Neutral" as FearGreedLabel, rsi };
  let selectedHeadline = null;
  
  try {
    const headlinesList = newsArticles && newsArticles.length > 0 
      ? newsArticles.map((article, idx) => 
          `${idx + 1}. "${article.title}" (${article.site}, ${article.publishedDate})`
        ).join('\n')
      : 'No recent news available';
    
    // Build momentum section
    const momentumSection = priceChange ? `
**PRICE MOMENTUM (Last 3 Months):**
- 1 Day: ${formatPct(priceChange["1D"])}
- 5 Day: ${formatPct(priceChange["5D"])}
- 1 Month: ${formatPct(priceChange["1M"])}
- 3 Month: ${formatPct(priceChange["3M"])}` : `
**PRICE MOMENTUM:**
- Data unavailable`;
    
    const prompt = `Analyze ${ticker} (${assetClass}) for FEAR & GREED indicators. Score each category from 0-100 where:
- LOW scores (0-40) = FEAR (panic selling, negative sentiment)
- MID scores (41-60) = NEUTRAL
- HIGH scores (61-100) = GREED (aggressive buying, positive sentiment)

${momentumSection}

**NEWS HEADLINES (${newsArticles?.length || 0} recent articles):**
${headlinesList}

Score each category for FEAR vs GREED using the FULL 0-100 range:

**MOMENTUM SCORE (0-100) - How greedy/fearful is recent price action?**
- 0-20: EXTREME FEAR - Crash, capitulation (example: 9)
- 21-40: FEAR - Declining, weak action (example: 32)
- 41-60: NEUTRAL - Mixed, choppy
- 61-80: GREED - Rising, strong momentum (example: 72)
- 81-100: EXTREME GREED - Parabolic rally (example: 88)

**NEWS SCORE (0-100) - What sentiment is news driving?**
- 0-20: EXTREME FEAR - Disaster news, major problems (example: 2)
- 21-40: FEAR - Negative coverage, concerns
- 41-60: NEUTRAL - Routine news, mixed coverage
- 61-80: GREED - Positive developments
- 81-100: EXTREME GREED - Breakthrough news (example: 95)

BE DECISIVE - Use extreme scores when conditions warrant. Avoid clustering around 50-60.

Return ONLY valid JSON:
{
  "momentumScore": 55,
  "newsScore": 50,
  "headlineNumber": 1
}`;

    const grokResponse = await callGrok(prompt);
    
    let jsonStr = grokResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Calculate Fear & Greed score - simplified for these asset classes
    // Weights: RSI 40%, Momentum 35%, News 25% (no fundamentals)
    const rsiScore = rsi !== null ? rsi : 50;
    const fearGreedScore = Math.round(
      (rsiScore * 0.40) +
      (parsed.momentumScore * 0.35) +
      (parsed.newsScore * 0.25)
    );
    
    fearGreed = {
      score: fearGreedScore,
      label: getFearGreedLabel(fearGreedScore),
      rsi
    };
    
    console.log(`[Asset Data] ${ticker} (${assetClass}) Fear & Greed - RSI: ${rsi?.toFixed(1) ?? 'N/A'}, Momentum: ${parsed.momentumScore}, News: ${parsed.newsScore} => Score: ${fearGreedScore} (${fearGreed.label})`);
    
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
    console.error(`[Asset Data] Error analyzing Fear & Greed for ${ticker}:`, error?.message);
    if (rsi !== null) {
      fearGreed = { score: Math.round(rsi), label: getFearGreedLabel(Math.round(rsi)), rsi };
    }
    if (newsArticles && newsArticles.length > 0) {
      selectedHeadline = {
        title: newsArticles[0].title,
        site: newsArticles[0].site,
        publishedDate: newsArticles[0].publishedDate,
        url: newsArticles[0].url
      };
    }
  }
  
  return { fearGreed, selectedHeadline };
}
