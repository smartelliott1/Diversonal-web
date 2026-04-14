// Agent Opti Context API - Fetches comprehensive data for a specific ticker
import { NextRequest, NextResponse } from "next/server";
import { getMarketData, getCryptoData, getCommodityData, calculateDiversonalFearGreedIndex } from "@/app/lib/financialData";

const FMP_API_KEY = process.env.FMP_API_KEY;

async function fetchFMP(endpoint: string): Promise<any> {
  if (!FMP_API_KEY) {
    throw new Error("FMP_API_KEY not configured");
  }
  
  const url = `https://financialmodelingprep.com${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${FMP_API_KEY}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });
  
  if (!response.ok) {
    console.error(`[Agent Opti Context] FMP error for ${endpoint}: ${response.status}`);
    return null;
  }
  
  return await response.json();
}

// Crypto symbols that need special handling
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'LINK', 'XMR', 'DOT', 'AVAX'];

// Commodity symbols that need special handling
const COMMODITY_SYMBOLS = ['GC', 'SI', 'CL', 'NG'];
const COMMODITY_NAMES: Record<string, string> = {
  'GC': 'Gold',
  'SI': 'Silver', 
  'CL': 'Crude Oil',
  'NG': 'Natural Gas',
};

function isCrypto(symbol: string): boolean {
  const upper = symbol.toUpperCase().replace('USD', '');
  return CRYPTO_SYMBOLS.includes(upper);
}

function isCommodity(symbol: string): boolean {
  const upper = symbol.toUpperCase().replace('USD', '');
  return COMMODITY_SYMBOLS.includes(upper);
}

function formatCryptoSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.endsWith('USD')) return upper;
  return `${upper}USD`;
}

function formatCommoditySymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.endsWith('USD')) return upper;
  return `${upper}USD`;
}

// Week multiplier: 5 trading days for stocks, 7 for crypto (24/7 markets)
function getWeekMultiplier(isCryptoAsset: boolean): number {
  return isCryptoAsset ? 7 : 5;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    console.log(`[Agent Opti Context] Fetching data for ${symbol}...`);
    
    const isCryptoAsset = isCrypto(symbol);
    const isCommodityAsset = isCommodity(symbol);
    const fmpSymbol = isCryptoAsset 
      ? formatCryptoSymbol(symbol) 
      : isCommodityAsset 
        ? formatCommoditySymbol(symbol) 
        : symbol;
    const w = getWeekMultiplier(isCryptoAsset); // Week multiplier for MAs

    // Fetch data in parallel (including income statement for accurate P/E)
    const [
      quoteData,
      profileData,
      incomeData,
      ratiosData,
      marketData,
      cryptoData,
      commodityData,
      fearGreedData,
      // Daily MAs
      ema9Data,
      ema21Data,
      sma20Data,
      sma50Data,
      sma200Data,
      // Weekly MAs (using daily candles with week multiplier)
      ema21wData,
      sma20wData,
      sma50wData,
      // Momentum indicators
      rsiData,
      adxData,
      williamsData,
      // Fundamental data (price targets)
      priceTargetData,
    ] = await Promise.all([
      fetchFMP(`/stable/quote?symbol=${fmpSymbol}`),
      (isCryptoAsset || isCommodityAsset) ? null : fetchFMP(`/stable/profile?symbol=${symbol}`),
      (isCryptoAsset || isCommodityAsset) ? null : fetchFMP(`/api/v3/income-statement/${symbol}?period=quarter&limit=8`),
      (isCryptoAsset || isCommodityAsset) ? null : fetchFMP(`/api/v3/ratios-ttm/${symbol}`),
      getMarketData(),
      getCryptoData(),
      getCommodityData(),
      calculateDiversonalFearGreedIndex(),
      // Daily MAs
      fetchFMP(`/stable/technical-indicators/ema?symbol=${fmpSymbol}&periodLength=9&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/ema?symbol=${fmpSymbol}&periodLength=21&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${fmpSymbol}&periodLength=20&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${fmpSymbol}&periodLength=50&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${fmpSymbol}&periodLength=200&timeframe=1day`),
      // Weekly MAs (using daily candles × week multiplier)
      fetchFMP(`/stable/technical-indicators/ema?symbol=${fmpSymbol}&periodLength=${21 * w}&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${fmpSymbol}&periodLength=${20 * w}&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/sma?symbol=${fmpSymbol}&periodLength=${50 * w}&timeframe=1day`),
      // Momentum
      fetchFMP(`/stable/technical-indicators/rsi?symbol=${fmpSymbol}&periodLength=14&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/adx?symbol=${fmpSymbol}&periodLength=14&timeframe=1day`),
      fetchFMP(`/stable/technical-indicators/williams?symbol=${fmpSymbol}&periodLength=14&timeframe=1day`),
      // Fundamental data (price targets) - stocks only
      (isCryptoAsset || isCommodityAsset) ? null : fetchFMP(`/stable/price-target-consensus?symbol=${symbol}`),
    ]);

    // Extract quote
    const quote = quoteData?.[0];
    if (!quote) {
      return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
    }

    const profile = profileData?.[0];
    const ratios = ratiosData?.[0];

    // Extract technical indicators (latest values)
    const technicals = {
      // Daily MAs
      ema9: ema9Data?.[0]?.ema,
      ema21: ema21Data?.[0]?.ema,
      sma20: sma20Data?.[0]?.sma,
      sma50: sma50Data?.[0]?.sma,
      sma200: sma200Data?.[0]?.sma,
      // Weekly MAs
      ema21w: ema21wData?.[0]?.ema,
      sma20w: sma20wData?.[0]?.sma,
      sma50w: sma50wData?.[0]?.sma,
      // Momentum
      rsi: rsiData?.[0]?.rsi,
      adx: adxData?.[0]?.adx,
      williamsR: williamsData?.[0]?.williams,
    };

    // Calculate TTM EPS from last 4 quarters (more accurate than annual which can be 3-15 months stale)
    const currentPrice = quote.price;
    let ttmEPS: number | null = null;
    
    if (incomeData && Array.isArray(incomeData) && incomeData.length > 0) {
      // Sum diluted EPS from last 4 quarters
      const quarters = incomeData.slice(0, 4);
      const validQuarters = quarters.filter((q: any) => typeof q?.epsdiluted === 'number');
      
      if (validQuarters.length === 4) {
        ttmEPS = validQuarters.reduce((sum: number, q: any) => sum + q.epsdiluted, 0);
      } else if (validQuarters.length > 0) {
        // If less than 4 quarters, annualize what we have
        const sumEPS = validQuarters.reduce((sum: number, q: any) => sum + q.epsdiluted, 0);
        ttmEPS = (sumEPS / validQuarters.length) * 4;
      }
    }
    
    const trailingPE = (currentPrice && ttmEPS && ttmEPS > 0)
      ? currentPrice / ttmEPS
      : null;

    // Compute YoY revenue + EPS growth from income statement (more reliable than FMP pre-computed growth endpoint)
    let revenueGrowthYoY: number | null = null;
    let epsGrowthYoY: number | null = null;
    if (incomeData && Array.isArray(incomeData) && incomeData.length >= 5) {
      const q0 = incomeData[0]; // most recent quarter
      const q4 = incomeData[4]; // same quarter last year
      if (q0?.revenue && q4?.revenue && q4.revenue !== 0) {
        revenueGrowthYoY = (q0.revenue - q4.revenue) / q4.revenue;
      }
      if (typeof q0?.epsdiluted === 'number' && typeof q4?.epsdiluted === 'number' && q4.epsdiluted !== 0) {
        epsGrowthYoY = (q0.epsdiluted - q4.epsdiluted) / q4.epsdiluted;
      }
    }

    // Extract price targets (filtered to what matters)
    const priceTarget = priceTargetData?.[0] ? {
      consensus: priceTargetData[0].targetConsensus,
      high: priceTargetData[0].targetHigh,
      low: priceTargetData[0].targetLow,
      median: priceTargetData[0].targetMedian,
    } : null;

    // Growth computed from raw income statement (true YoY, avoids FMP pre-computed endpoint inaccuracies)
    const growth = {
      quarterly: (revenueGrowthYoY !== null || epsGrowthYoY !== null) ? {
        revenue: revenueGrowthYoY,
        eps: epsGrowthYoY,
      } : null,
      annual: null,
    };

    // Build ticker context for Agent Opti
    const tickerContext = {
      symbol: symbol,
      name: isCommodityAsset 
        ? COMMODITY_NAMES[symbol] || quote.name || symbol
        : profile?.companyName || quote.name || symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage || quote.changePercentage,
      dayLow: quote.dayLow,
      dayHigh: quote.dayHigh,
      yearLow: quote.yearLow,
      yearHigh: quote.yearHigh,
      volume: quote.volume,
      avgVolume: quote.avgVolume,
      marketCap: quote.marketCap,
      pe: trailingPE, // Real-time P/E calculated from current price / TTM diluted EPS
      eps: ttmEPS,
      beta: profile?.beta,
      sector: isCommodityAsset ? 'Commodity' : profile?.sector,
      industry: profile?.industry,
      exchange: quote.exchange || profile?.exchange,
      // Key metrics
      dividendYield: ratios?.dividendYieldTTM,
      priceToBook: ratios?.priceToBookRatioTTM,
      priceToSales: ratios?.priceToSalesRatioTTM,
      debtToEquity: ratios?.debtEquityRatioTTM,
      currentRatio: ratios?.currentRatioTTM,
      roe: ratios?.returnOnEquityTTM,
      // Description
      description: profile?.description?.substring(0, 500),
      isCrypto: isCryptoAsset,
      isCommodity: isCommodityAsset,
      // Technical indicators
      technicals,
      // Fundamental data
      priceTarget,
      growth,
    };

    // Build market context
    const marketContext = {
      sp500: {
        price: marketData.sp500,
        change: marketData.sp500Change,
      },
      nasdaq: {
        price: marketData.nasdaq,
        change: marketData.nasdaqChange,
      },
      dow: {
        price: marketData.dow,
        change: marketData.dowChange,
      },
      vix: marketData.vix,
      fearGreed: fearGreedData,
      bitcoin: {
        price: cryptoData.bitcoin,
        change: cryptoData.bitcoinChange,
      },
      gold: {
        price: commodityData.gold,
        change: commodityData.goldChange,
      },
    };

    // Format as text context for Agent Opti - three modes
    const textContexts = {
      technical: formatTechnicalContext(tickerContext, marketContext),
      fundamental: formatFundamentalContext(tickerContext, marketContext),
      hybrid: formatHybridContext(tickerContext, marketContext),
    };

    console.log(`[Agent Opti Context] Successfully fetched data for ${symbol}`);

    return NextResponse.json({
      ticker: tickerContext,
      market: marketContext,
      textContext: textContexts.hybrid, // Default to hybrid for backwards compatibility
      textContexts, // All three modes
    });

  } catch (error: any) {
    console.error("[Agent Opti Context] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch context data" },
      { status: 500 }
    );
  }
}

// Helper: format percentage
// Helper: format percentage with sign
function fmtPct(val: number | null | undefined): string {
  if (val === null || val === undefined) return 'N/A';
  const pct = val * 100;
  return pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
}

// Helper: determine if US market is currently open (ET hours)
function getMarketStatus(): string {
  const now = new Date();
  // Convert to ET (UTC-5 standard, UTC-4 daylight)
  const etOffset = isDST(now) ? -4 : -5;
  const etMs = now.getTime() + (now.getTimezoneOffset() + etOffset * 60) * 60000;
  const et = new Date(etMs);
  const day = et.getDay(); // 0=Sun, 6=Sat
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 30;  // 9:30am
  const marketClose = 16 * 60;      // 4:00pm
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && timeInMinutes >= marketOpen && timeInMinutes < marketClose;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${days[et.getDay()]} ${months[et.getMonth()]} ${et.getDate()}, ${et.getFullYear()}`;
  const h = et.getHours() % 12 || 12;
  const m = et.getMinutes().toString().padStart(2, '0');
  const ampm = et.getHours() < 12 ? 'AM' : 'PM';
  const timeStr = `${h}:${m} ${ampm} ET`;
  const status = isOpen ? 'OPEN' : 'CLOSED — prices reflect last close';
  return `${dateStr}, ${timeStr} — Market: ${status}`;
}

function isDST(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return date.getTimezoneOffset() < Math.max(jan, jul);
}

// Helper: base price info shared by all modes
function formatBaseInfo(ticker: any, market: any): string {
  const change = ticker.changePercent || 0;
  const changeStr = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  const sp500Chg = market.sp500.change >= 0 ? `+${market.sp500.change.toFixed(2)}%` : `${market.sp500.change.toFixed(2)}%`;

  let rangeContext = '';
  if (ticker.yearLow && ticker.yearHigh && ticker.price) {
    const pctFromLow = ((ticker.price - ticker.yearLow) / (ticker.yearLow) * 100).toFixed(0);
    const pctFromHigh = ((ticker.yearHigh - ticker.price) / (ticker.yearHigh) * 100).toFixed(0);
    rangeContext = `\n52-week range: $${ticker.yearLow?.toFixed(2)} - $${ticker.yearHigh?.toFixed(2)} (${pctFromLow}% above low, ${pctFromHigh}% below high)`;
  }

  let volumeContext = '';
  if (ticker.volume && ticker.avgVolume && ticker.avgVolume > 0) {
    const volRatio = (ticker.volume / ticker.avgVolume);
    const volDesc = volRatio > 1.5 ? 'heavy volume' : volRatio < 0.5 ? 'light volume' : 'average volume';
    volumeContext = `, ${volDesc} (${volRatio.toFixed(1)}x avg)`;
  }

  return `${getMarketStatus()}

${ticker.symbol} (${ticker.name}) at $${ticker.price?.toFixed(2)} (${changeStr} today${volumeContext})${rangeContext}
Market: S&P ${sp500Chg}, VIX ${market.vix?.toFixed(1)}, Fear/Greed ${market.fearGreed?.value} (${market.fearGreed?.label || ''})`;
}

// TECHNICAL context (simplified - key levels only)
function formatTechnicalSection(ticker: any): string {
  const t = ticker.technicals || {};
  const p = ticker.price;
  if (!t.ema9 && !t.rsi) return '';
  
  let lines: string[] = [];
  
  // Key MAs with price position
  if (t.ema9 && t.ema21) {
    const crossover = t.ema9 > t.ema21 ? 'bullish' : 'bearish';
    lines.push(`EMAs: 9-day $${t.ema9.toFixed(2)}, 21-day $${t.ema21.toFixed(2)} (${crossover} crossover)`);
  }
  if (t.sma50) {
    const pos = p > t.sma50 ? 'above' : 'below';
    lines.push(`50-day SMA: $${t.sma50.toFixed(2)} (price ${pos})`);
  }
  if (t.sma200) {
    const pos = p > t.sma200 ? 'above' : 'below';
    lines.push(`200-day SMA: $${t.sma200.toFixed(2)} (price ${pos})`);
  }
  if (t.sma50w) {
    const pos = p > t.sma50w ? 'above' : 'below';
    lines.push(`50-week SMA: $${t.sma50w.toFixed(2)} (price ${pos})`);
  }
  
  // Momentum
  let momentum: string[] = [];
  if (t.rsi !== undefined) {
    const sig = t.rsi > 70 ? 'overbought' : t.rsi < 30 ? 'oversold' : 'neutral';
    momentum.push(`RSI ${t.rsi.toFixed(0)} (${sig})`);
  }
  if (t.adx !== undefined) {
    const sig = t.adx > 25 ? 'trending' : 'ranging';
    momentum.push(`ADX ${t.adx.toFixed(0)} (${sig})`);
  }
  if (t.williamsR !== undefined) {
    const sig = t.williamsR > -20 ? 'overbought' : t.williamsR < -80 ? 'oversold' : 'neutral';
    momentum.push(`Williams %R ${t.williamsR.toFixed(0)} (${sig})`);
  }
  if (momentum.length > 0) {
    lines.push(`Momentum: ${momentum.join(', ')}`);
  }

  return lines.length > 0 ? `\n\nTECHNICALS:\n${lines.join('\n')}` : '';
}

// FUNDAMENTAL context (simplified - key metrics only)
function formatFundamentalSection(ticker: any): string {
  if (ticker.isCrypto || ticker.isCommodity) return '';
  
  let lines: string[] = [];
  
  // Valuation
  if (ticker.pe) lines.push(`P/E: ${ticker.pe.toFixed(1)}`);
  if (ticker.eps) lines.push(`EPS (TTM): $${ticker.eps.toFixed(2)}`);
  if (ticker.marketCap) lines.push(`Market Cap: $${(ticker.marketCap / 1e9).toFixed(0)}B`);
  
  // Price target
  const pt = ticker.priceTarget;
  if (pt?.consensus && ticker.price) {
    const upside = ((pt.consensus / ticker.price - 1) * 100).toFixed(1);
    const upsideStr = parseFloat(upside) >= 0 ? `+${upside}%` : `${upside}%`;
    lines.push(`Analyst target: $${pt.consensus.toFixed(0)} (${upsideStr})`);
  }
  
  // Growth
  const g = ticker.growth;
  if (g?.quarterly?.eps !== undefined) {
    lines.push(`EPS growth (quarterly YoY): ${fmtPct(g.quarterly.eps)}`);
  }
  if (g?.quarterly?.revenue !== undefined) {
    lines.push(`Revenue growth (quarterly YoY): ${fmtPct(g.quarterly.revenue)}`);
  }
  
  // Sector
  if (ticker.sector) lines.push(`Sector: ${ticker.sector}`);
  
  return lines.length > 0 ? `\n\nFUNDAMENTALS:\n${lines.join('\n')}` : '';
}

// TECHNICAL MODE
function formatTechnicalContext(ticker: any, market: any): string {
  return formatBaseInfo(ticker, market) + formatTechnicalSection(ticker);
}

// FUNDAMENTAL MODE
function formatFundamentalContext(ticker: any, market: any): string {
  return formatBaseInfo(ticker, market) + formatFundamentalSection(ticker);
}

// HYBRID MODE
function formatHybridContext(ticker: any, market: any): string {
  return formatBaseInfo(ticker, market) + formatFundamentalSection(ticker) + formatTechnicalSection(ticker);
}
