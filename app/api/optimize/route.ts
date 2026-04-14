// Portfolio Optimizer — AI analysis with streaming (Claude Sonnet 4.6)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";
import { getMarketData, calculateDiversonalFearGreedIndex } from "@/app/lib/financialData";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const MODEL = "claude-sonnet-4-6";

type OptimizeMode = "derisk" | "leverage" | "tax";

interface Holding {
  ticker: string;
  value: number;
  costBasis?: number; // per-share cost basis (for tax mode)
}

const SYSTEM_PROMPTS: Record<OptimizeMode, string> = {
  derisk: `You are a professional risk management analyst. Speak directly, like an analyst on a trading desk — no fluff, no markdown, no asterisks, no bullets.

Analyze this portfolio for risk. Identify:
1. Any position over 20% as a concentration risk
2. High-beta names driving most of the downside volatility
3. Missing defensive positions (bonds, gold, dividend ETFs, low-vol names)

For each issue, give a specific action: what to trim or sell, what to add, and the target weight. Use exact ticker names and dollar amounts from the portfolio. "Trim NVDA from 33% to 20%, free up roughly $16k" is the right level of specificity. 3-4 sentences per point.`,

  leverage: `You are an aggressive growth strategist. Speak directly, no fluff, no markdown, no asterisks, no bullets.

Given this portfolio, identify the 1-2 best leverage opportunities:
1. Which position has the strongest trend and conviction worth sizing up
2. Specific instrument to use: leveraged ETF equivalent (TQQQ for Nasdaq exposure, SOXL for semis, MSTU for MicroStrategy, etc.) or direct margin on the position
3. Recommended size as % of portfolio
4. Clear stop-loss level (price or % below entry)

Only recommend leverage on positions with clear trend confirmation. Be honest about the risk. 3-4 sentences per recommendation.`,

  tax: `You are a tax-efficient investing specialist. Speak directly, no markdown, no asterisks, no bullets.

Analyze these holdings for tax optimization:
1. Flag positions with unrealized losses — sell to realize the loss and offset gains. Suggest a replacement ETF that avoids the wash-sale rule (no substantially identical security within 30 days of the sale)
2. Note positions likely held under 1 year — short-term gains are taxed at ~37% ordinary income rate vs 0-20% long-term. Holding past the 1-year mark may be worth waiting for
3. Estimate approximate tax savings from harvesting losses at a blended 25% rate
4. Note any wash-sale warnings

Be specific with ticker names and dollar amounts. If cost basis was not provided for a position, note that it's needed for accurate analysis. 3-4 sentences per point.`,
};

// Crypto symbols that need USD suffix for FMP quotes
const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "LINK", "XMR", "DOT", "AVAX"];

function formatTickerForFMP(ticker: string): string {
  const upper = ticker.toUpperCase().replace("USD", "");
  if (CRYPTO_SYMBOLS.includes(upper)) return `${upper}USD`;
  return ticker.toUpperCase();
}

async function fetchQuote(ticker: string): Promise<{ price: number; changePercent: number } | null> {
  if (!FMP_API_KEY) return null;
  try {
    const fmpTicker = formatTickerForFMP(ticker);
    const res = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${fmpTicker}&apikey=${FMP_API_KEY}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const quote = data?.[0];
    if (!quote?.price) return null;
    return { price: quote.price, changePercent: quote.changesPercentage || 0 };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "API not configured" }, { status: 500 });
    }

    const { holdings, mode }: { holdings: Holding[]; mode: OptimizeMode } = await request.json();

    if (!holdings?.length || !mode) {
      return NextResponse.json({ error: "Holdings and mode required" }, { status: 400 });
    }

    const validMode: OptimizeMode = ["derisk", "leverage", "tax"].includes(mode) ? mode : "derisk";

    // Fetch current prices for all holdings in parallel
    const prices = await Promise.all(holdings.map((h) => fetchQuote(h.ticker)));

    // Compute portfolio totals
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

    // Build per-holding context lines
    const holdingLines = holdings.map((h, i) => {
      const quote = prices[i];
      const weight = ((h.value / totalValue) * 100).toFixed(1);
      let line = `${h.ticker.toUpperCase()}  $${h.value.toLocaleString()} (${weight}%)`;

      if (quote) {
        const changeStr =
          quote.changePercent >= 0
            ? `+${quote.changePercent.toFixed(2)}%`
            : `${quote.changePercent.toFixed(2)}%`;
        line += ` — current $${quote.price.toFixed(2)} (${changeStr} today)`;

        if (h.costBasis && quote.price) {
          const estShares = h.value / quote.price;
          const gainPct = ((quote.price - h.costBasis) / h.costBasis) * 100;
          const unrealizedDollar = (quote.price - h.costBasis) * estShares;
          const gainStr = gainPct >= 0 ? `+${gainPct.toFixed(1)}%` : `${gainPct.toFixed(1)}%`;
          const dollarStr =
            unrealizedDollar >= 0
              ? `+$${unrealizedDollar.toFixed(0)}`
              : `-$${Math.abs(unrealizedDollar).toFixed(0)}`;
          line += ` — cost basis $${h.costBasis}/sh — unrealized ${gainStr} (${dollarStr})`;
        }
      } else if (h.costBasis) {
        line += ` — cost basis $${h.costBasis}/sh (current price unavailable)`;
      }

      return line;
    });

    // Fetch market context (optional — don't fail if unavailable)
    let marketLine = "";
    try {
      const [marketData, fearGreed] = await Promise.all([
        getMarketData(),
        calculateDiversonalFearGreedIndex(),
      ]);
      if (marketData?.sp500Change !== undefined && marketData?.vix) {
        const sp500Str =
          marketData.sp500Change >= 0
            ? `+${marketData.sp500Change.toFixed(2)}%`
            : `${marketData.sp500Change.toFixed(2)}%`;
        marketLine = `\nMarket: S&P 500 ${sp500Str}, VIX ${marketData.vix.toFixed(1)}, Fear/Greed ${fearGreed?.index} (${fearGreed?.label || ""})`;
      }
    } catch {
      // non-critical — proceed without market context
    }

    const portfolioContext = `Portfolio ($${totalValue.toLocaleString()} total, ${holdings.length} position${holdings.length > 1 ? "s" : ""}):
${holdingLines.join("\n")}${marketLine}`;

    const prompt = `${portfolioContext}

Analyze this portfolio and provide specific ${validMode} recommendations.`;

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1500,
            temperature: 0.3,
            system: SYSTEM_PROMPTS[validMode],
            messages: [{ role: "user", content: prompt }],
          });

          for await (const chunk of response) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error("[Optimize] Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[Optimize] Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
