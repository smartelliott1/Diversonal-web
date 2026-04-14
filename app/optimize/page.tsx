"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Navigation from "../components/layout/Navigation";

type OptimizeMode = "derisk" | "leverage" | "tax";

interface Holding {
  id: string;
  ticker: string;
  value: number;
  costBasis?: number;
}

const MODE_CONFIG: Record<OptimizeMode, { label: string; description: string }> = {
  derisk: {
    label: "Derisk",
    description: "Identify concentration risk, high-beta positions, and missing hedges.",
  },
  leverage: {
    label: "Leverage",
    description: "Find your best positions to size up with specific instruments and stop-losses.",
  },
  tax: {
    label: "Tax Optimize",
    description: "Harvest losses, flag short-term gains, and reduce your tax bill.",
  },
};

const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "GS", name: "Goldman Sachs" },
  { symbol: "V", name: "Visa" },
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "Nasdaq ETF" },
  { symbol: "GC", name: "Gold" },
  { symbol: "CL", name: "Crude Oil" },
  { symbol: "PLTR", name: "Palantir" },
  { symbol: "COIN", name: "Coinbase" },
  { symbol: "MSTR", name: "MicroStrategy" },
  { symbol: "LLY", name: "Eli Lilly" },
  { symbol: "UNH", name: "UnitedHealth" },
  { symbol: "XOM", name: "Exxon" },
  { symbol: "COST", name: "Costco" },
  { symbol: "TLT", name: "20yr Treasury ETF" },
  { symbol: "GLD", name: "Gold ETF" },
  { symbol: "CRWD", name: "CrowdStrike" },
  { symbol: "HOOD", name: "Robinhood" },
  { symbol: "RKLB", name: "Rocket Lab" },
];

export default function OptimizePage() {
  const { data: session } = useSession();

  // Holdings state
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [mode, setMode] = useState<OptimizeMode>("derisk");

  // Add-holding form state
  const [tickerInput, setTickerInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [costBasisInput, setCostBasisInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Analysis state
  const [result, setResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tickerWrapperRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  // Filter tickers for autocomplete
  const filteredTickers = tickerInput
    ? POPULAR_TICKERS.filter(
        (t) =>
          t.symbol.toLowerCase().includes(tickerInput.toLowerCase()) ||
          t.name.toLowerCase().includes(tickerInput.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tickerWrapperRef.current && !tickerWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll result to bottom while streaming
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [result]);

  const addHolding = () => {
    const ticker = tickerInput.trim().toUpperCase();
    const value = parseFloat(valueInput);
    if (!ticker || !value || value <= 0) return;

    const costBasis = costBasisInput ? parseFloat(costBasisInput) : undefined;

    setHoldings((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ticker, value, costBasis },
    ]);
    setTickerInput("");
    setValueInput("");
    setCostBasisInput("");
    setShowDropdown(false);
  };

  const removeHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const handleAnalyze = async () => {
    if (!holdings.length || isAnalyzing) return;

    if (!session?.user) {
      setResult("Please sign in to analyze your portfolio.");
      return;
    }

    setResult("");
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings, mode }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to analyze");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setResult("Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navigation />

      <main className="pt-16 flex" style={{ height: "100vh" }}>
        {/* Left Panel — Holdings Input */}
        <div className="w-[320px] min-w-[320px] border-r border-[#2A2A2A] flex flex-col bg-black">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#E6E6E6]">Your Portfolio</span>
            {totalValue > 0 && (
              <span className="text-sm font-mono text-[#00FF99]">
                ${totalValue.toLocaleString()}
              </span>
            )}
          </div>

          {/* Holdings List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {holdings.length === 0 ? (
              <p className="text-xs text-[#404040] text-center pt-10">
                Add your holdings below.
              </p>
            ) : (
              holdings.map((h) => {
                const weight = ((h.value / totalValue) * 100).toFixed(1);
                return (
                  <div
                    key={h.id}
                    className="flex items-center justify-between bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-[#00FF99] w-14 shrink-0">
                        {h.ticker}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-[#E6E6E6]">
                          ${h.value.toLocaleString()}
                        </div>
                        {h.costBasis && (
                          <div className="text-[10px] text-[#505050]">
                            basis ${h.costBasis}/sh
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#404040]">{weight}%</span>
                      <button
                        onClick={() => removeHolding(h.id)}
                        className="text-[#404040] hover:text-[#FF4444] transition-colors text-sm leading-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Holding Form */}
          <div className="p-3 border-t border-[#2A2A2A] space-y-2">
            {/* Ticker input with autocomplete */}
            <div className="relative" ref={tickerWrapperRef}>
              <input
                value={tickerInput}
                onChange={(e) => {
                  setTickerInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
                placeholder="Ticker (e.g. AAPL)"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#404040] focus:outline-none focus:border-[#00FF99]/40"
              />
              {showDropdown && filteredTickers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#111111] border border-[#2A2A2A] rounded-sm z-50 max-h-44 overflow-y-auto">
                  {filteredTickers.map((t) => (
                    <button
                      key={t.symbol}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTickerInput(t.symbol);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#1A1A1A] transition-colors flex items-center gap-2"
                    >
                      <span className="text-[#00FF99] font-mono font-semibold w-12 shrink-0">
                        {t.symbol}
                      </span>
                      <span className="text-[#606060]">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Value + Cost Basis inputs */}
            <div className="flex gap-2">
              <input
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
                type="number"
                min="0"
                placeholder="$ Value"
                className="flex-1 bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#404040] focus:outline-none focus:border-[#00FF99]/40"
              />
              <input
                value={costBasisInput}
                onChange={(e) => setCostBasisInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
                type="number"
                min="0"
                placeholder="Basis/sh"
                title="Optional: cost basis per share (used for tax analysis)"
                className="w-24 bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#404040] focus:outline-none focus:border-[#00FF99]/40"
              />
            </div>

            <button
              onClick={addHolding}
              disabled={!tickerInput.trim() || !valueInput}
              className="w-full py-2 rounded-sm bg-[#0F0F0F] border border-[#2A2A2A] text-xs text-[#606060] hover:border-[#00FF99]/40 hover:text-[#00FF99] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Add Holding
            </button>
          </div>
        </div>

        {/* Right Panel — Mode Selection + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header + Mode Selector */}
          <div className="px-6 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[#E6E6E6]">Portfolio Optimizer</span>
              <p className="text-xs text-[#505050] mt-0.5">{MODE_CONFIG[mode].description}</p>
            </div>

            {/* Mode pills */}
            <div className="flex items-center bg-[#111111] border border-[#2A2A2A] rounded-sm p-0.5">
              {(Object.entries(MODE_CONFIG) as [OptimizeMode, { label: string }][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMode(key);
                      setResult("");
                    }}
                    className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${
                      mode === key
                        ? "bg-[#00FF99]/15 text-[#00FF99] border border-[#00FF99]/30"
                        : "text-[#505050] hover:text-[#808080]"
                    }`}
                  >
                    {cfg.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Results Area */}
          <div ref={resultRef} className="flex-1 overflow-y-auto px-6 py-6">
            {!result && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                {holdings.length === 0 ? (
                  <>
                    <p className="text-sm text-[#404040] mb-1">No holdings yet.</p>
                    <p className="text-xs text-[#303030]">
                      Add positions on the left to begin.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#606060] mb-1">
                      {holdings.length} position{holdings.length > 1 ? "s" : ""} &nbsp;·&nbsp; $
                      {totalValue.toLocaleString()} total
                    </p>
                    <p className="text-xs text-[#404040]">
                      Click &ldquo;Analyze&rdquo; to get your{" "}
                      {MODE_CONFIG[mode].label.toLowerCase()} recommendations.
                    </p>
                  </>
                )}
              </div>
            ) : isAnalyzing && !result ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#00FF99]/30 border-t-[#00FF99] rounded-full animate-spin mb-3" />
                <p className="text-sm text-[#606060]">Analyzing your portfolio...</p>
              </div>
            ) : (
              <div className="max-w-2xl">
                {/* Summary bar */}
                <div className="mb-5 flex items-center gap-3 text-xs text-[#505050]">
                  <span>{holdings.length} position{holdings.length > 1 ? "s" : ""}</span>
                  <span className="text-[#303030]">·</span>
                  <span>${totalValue.toLocaleString()}</span>
                  <span className="text-[#303030]">·</span>
                  <span className="text-[#00FF99]">{MODE_CONFIG[mode].label}</span>
                </div>

                {/* Streamed text */}
                <div className="text-sm text-[#D0D0D0] leading-[1.75]">
                  {result.split(/\n\n+/).map((para, i) =>
                    para.trim() ? (
                      <p key={i} className="mb-4">
                        {para}
                      </p>
                    ) : null
                  )}
                  {isAnalyzing && (
                    <span className="inline-block w-1.5 h-[1em] bg-[#00FF99] animate-pulse align-middle ml-0.5" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="px-6 py-4 border-t border-[#2A2A2A] flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!holdings.length || isAnalyzing}
              className="px-6 py-2.5 rounded-sm bg-[#00FF99] text-black text-sm font-semibold hover:bg-[#00E689] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Portfolio"}
            </button>

            {result && !isAnalyzing && (
              <button
                onClick={() => setResult("")}
                className="px-4 py-2.5 rounded-sm border border-[#2A2A2A] text-xs text-[#606060] hover:text-white hover:border-[#3A3A3A] transition-colors"
              >
                Clear
              </button>
            )}

            {!session?.user && holdings.length > 0 && (
              <p className="text-xs text-[#505050] ml-1">Sign in required to analyze</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
