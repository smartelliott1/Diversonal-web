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

interface AnalysisMessage {
  role: "user" | "assistant";
  content: string;
}

interface SavedOptimizePortfolio {
  id: string;
  name: string;
  capital: string;
  updatedAt: string;
  portfolioData: { holdings: Holding[]; mode: OptimizeMode };
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

function isStreaming(content: string) {
  return content.length > 0 && !content.endsWith(".") && !content.endsWith("!") && !content.endsWith("?");
}

export default function OptimizePage() {
  const { data: session } = useSession();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [mode, setMode] = useState<OptimizeMode>("derisk");

  const [tickerInput, setTickerInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [costBasisInput, setCostBasisInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [analysisMessages, setAnalysisMessages] = useState<AnalysisMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [currentPortfolioId, setCurrentPortfolioId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedOptimizePortfolio[]>([]);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);

  const tickerWrapperRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  const filteredTickers = tickerInput
    ? POPULAR_TICKERS.filter(
        (t) =>
          t.symbol.toLowerCase().includes(tickerInput.toLowerCase()) ||
          t.name.toLowerCase().includes(tickerInput.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tickerWrapperRef.current && !tickerWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [analysisMessages]);

  const addHolding = () => {
    const ticker = tickerInput.trim().toUpperCase();
    const value = parseFloat(valueInput);
    if (!ticker || !value || value <= 0) return;
    const costBasis = costBasisInput ? parseFloat(costBasisInput) : undefined;
    setHoldings((prev) => [...prev, { id: crypto.randomUUID(), ticker, value, costBasis }]);
    setTickerInput("");
    setValueInput("");
    setCostBasisInput("");
    setShowDropdown(false);
  };

  const removeHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSave = async () => {
    if (!saveName.trim() || !session?.user) return;
    setIsSaving(true);
    try {
      if (currentPortfolioId) {
        await fetch("/api/portfolios", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentPortfolioId, portfolioData: { holdings, mode } }),
        });
      } else {
        const res = await fetch("/api/portfolios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: saveName.trim(),
            goal: "__optimize__",
            age: "", risk: 0, horizon: "", capital: totalValue.toString(), sectors: [],
            portfolioData: { holdings, mode },
            isManuallySaved: true,
          }),
        });
        const data = await res.json();
        if (data.portfolio?.id) setCurrentPortfolioId(data.portfolio.id);
      }
      setShowSaveModal(false);
      setSaveName("");
    } finally {
      setIsSaving(false);
    }
  };

  const openLoadModal = async () => {
    setShowLoadModal(true);
    setIsLoadingPortfolios(true);
    try {
      const res = await fetch("/api/portfolios?type=optimize");
      const data = await res.json();
      setSavedPortfolios(data.portfolios || []);
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  const loadPortfolio = (p: SavedOptimizePortfolio) => {
    setHoldings(p.portfolioData.holdings.map(h => ({ ...h, id: crypto.randomUUID() })));
    setMode(p.portfolioData.mode);
    setCurrentPortfolioId(p.id);
    setAnalysisMessages([]);
    setShowLoadModal(false);
  };

  const handleAnalyze = async () => {
    if (!holdings.length || isAnalyzing) return;

    if (!session?.user) {
      setAnalysisMessages([
        { role: "user", content: `Analyze my ${holdings.length}-position portfolio ($${totalValue.toLocaleString()}) for ${MODE_CONFIG[mode].label.toLowerCase()} opportunities.` },
        { role: "assistant", content: "Please sign in to analyze your portfolio." },
      ]);
      return;
    }

    setAnalysisMessages([{ role: "assistant", content: "" }]);
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
        const chunk = decoder.decode(value, { stream: true });
        setAnalysisMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setAnalysisMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const lastMsg = analysisMessages[analysisMessages.length - 1];
  const hasMessages = analysisMessages.length > 0;

  const holdingsWithBasis = holdings.filter(h => h.costBasis && h.costBasis > 0);
  const showBasisSection = mode === 'tax' && holdingsWithBasis.length > 0 && !hasMessages;

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="pt-16 flex" style={{ height: "100vh" }}>
        {/* Left Panel — Holdings Input */}
        <div className="w-[320px] min-w-[320px] border-r border-[#2A2A2A] flex flex-col bg-black">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#E6E6E6]">Your Portfolio</span>
            <div className="flex items-center gap-2">
              {totalValue > 0 && (
                <span className="text-sm font-mono text-[#00FF99]">${totalValue.toLocaleString()}</span>
              )}
              {session?.user && (
                <>
                  <button onClick={openLoadModal} title="Load portfolio"
                    className="text-[#505050] hover:text-[#E6E6E6] transition-colors p-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  {holdings.length > 0 && (
                    <button onClick={() => setShowSaveModal(true)} title="Save portfolio"
                      className="text-[#505050] hover:text-[#00FF99] transition-colors p-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Holdings List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {holdings.length === 0 ? (
              <p className="text-xs text-[#505050] text-center pt-10">Add your holdings below.</p>
            ) : (
              holdings.map((h) => {
                const weight = (h.value / totalValue) * 100;
                const barColor = weight >= 20 ? '#FF4444' : weight >= 10 ? '#FFB700' : '#00FF99';
                return (
                  <div
                    key={h.id}
                    className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 hover:border-[#00FF99]/20 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-[#00FF99] w-14 shrink-0">
                          {h.ticker}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs text-[#E6E6E6]">${h.value.toLocaleString()}</div>
                          {h.costBasis && (
                            <div className="text-[10px] text-[#505050]">basis ${h.costBasis}/sh</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px]" style={{ color: barColor, opacity: 0.85 }}>{weight.toFixed(1)}%</span>
                        <button
                          onClick={() => removeHolding(h.id)}
                          className="text-[#404040] hover:text-[#FF4444] transition-colors text-sm leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {/* Weight bar */}
                    <div className="mt-2 h-0.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${weight}%`, backgroundColor: barColor, opacity: 0.75 }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Holding Form */}
          <div className="p-3 border-t border-[#2A2A2A] space-y-2">
            <div className="relative" ref={tickerWrapperRef}>
              <input
                value={tickerInput}
                onChange={(e) => { setTickerInput(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
                placeholder="Ticker (e.g. AAPL)"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#505050] outline-none hover:border-[#3A3A3A] focus:border-[#00FF99] transition-all duration-200"
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
                      <span className="text-[#00FF99] font-mono font-semibold w-12 shrink-0">{t.symbol}</span>
                      <span className="text-[#606060]">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
                type="number"
                min="0"
                placeholder="$ Value"
                className="flex-1 bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#505050] outline-none hover:border-[#3A3A3A] focus:border-[#00FF99] transition-all duration-200"
              />
              <input
                value={costBasisInput}
                onChange={(e) => setCostBasisInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHolding()}
                type="number"
                min="0"
                placeholder="Basis/sh"
                title="Optional: cost basis per share (for tax analysis)"
                className="w-24 bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#505050] outline-none hover:border-[#3A3A3A] focus:border-[#00FF99] transition-all duration-200"
              />
            </div>

            <button
              onClick={addHolding}
              disabled={!tickerInput.trim() || !valueInput}
              className="w-full py-2 rounded-sm bg-[#0F0F0F] border border-[#2A2A2A] text-xs text-[#808080] hover:border-[#00FF99]/40 hover:text-[#00FF99] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Add Holding
            </button>
          </div>
        </div>

        {/* Right Panel — Mode + Chat Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header + Mode Selector */}
          <div className="px-6 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[#E6E6E6]">Portfolio Optimizer</span>
              <p className="text-xs text-[#505050] mt-0.5">{MODE_CONFIG[mode].description}</p>
            </div>
            <div className="flex items-center bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm p-0.5">
              {(Object.entries(MODE_CONFIG) as [OptimizeMode, { label: string }][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setAnalysisMessages([]); }}
                  className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${
                    mode === key
                      ? "bg-[#00FF99]/15 text-[#00FF99] border border-[#00FF99]/30"
                      : "text-[#505050] hover:text-[#808080]"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat / Results Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {!hasMessages ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                {showBasisSection && (
                  <div className="w-full max-w-sm mx-auto mb-6 text-left">
                    <p className="text-[10px] text-[#404040] uppercase tracking-wider mb-3">
                      Cost Basis Entered — {holdingsWithBasis.length} of {holdings.length} position{holdings.length > 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      {holdingsWithBasis.map(h => {
                        const weight = (h.value / totalValue) * 100;
                        return (
                          <div key={h.id} className="flex items-center gap-3 text-xs">
                            <span className="text-[#606060] font-mono w-14 shrink-0">{h.ticker}</span>
                            <div className="flex-1 h-0.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                              <div className="h-full bg-[#00FF99]/40 rounded-full" style={{ width: `${weight}%` }} />
                            </div>
                            <span className="text-[#404040] w-20 text-right shrink-0">${h.costBasis}/sh</span>
                          </div>
                        );
                      })}
                    </div>
                    {holdings.length > holdingsWithBasis.length && (
                      <p className="text-[10px] text-[#303030] mt-2">
                        {holdings.length - holdingsWithBasis.length} position{holdings.length - holdingsWithBasis.length > 1 ? 's' : ''} missing cost basis — add for full P/L analysis.
                      </p>
                    )}
                  </div>
                )}
                {holdings.length === 0 ? (
                  <>
                    <p className="text-sm text-[#404040] mb-1">No holdings yet.</p>
                    <p className="text-xs text-[#303030]">Add positions on the left to begin.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#606060] mb-1">
                      {holdings.length} position{holdings.length > 1 ? "s" : ""} &nbsp;·&nbsp; ${totalValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#404040]">
                      Click &ldquo;Analyze&rdquo; to get your {MODE_CONFIG[mode].label.toLowerCase()} recommendations.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="max-w-2xl w-full mx-auto space-y-6">
                {analysisMessages.map((msg, idx) => (
                  <div key={idx}>
                    {msg.role === "user" ? (
                      /* User bubble — right-aligned, green tint */
                      <div className="flex justify-end">
                        <p className="text-sm text-[#00FF99]/90 bg-[#00FF99]/10 rounded-sm px-4 py-2.5 max-w-[85%] leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      /* Assistant message — left-aligned, streaming */
                      <div className="flex justify-start">
                        {msg.content === "" ? (
                          /* Thinking dots */
                          <span className="inline-flex items-center gap-1.5 text-gray-500 py-2">
                            <span className="w-1.5 h-1.5 bg-[#505050] rounded-full animate-pulse" />
                            <span className="w-1.5 h-1.5 bg-[#505050] rounded-full animate-pulse [animation-delay:75ms]" />
                            <span className="w-1.5 h-1.5 bg-[#505050] rounded-full animate-pulse [animation-delay:150ms]" />
                          </span>
                        ) : (
                          <div
                            className={`text-base leading-relaxed text-gray-300 max-w-[90%] ${
                              isAnalyzing && idx === analysisMessages.length - 1 && isStreaming(msg.content)
                                ? "shimmer-text"
                                : ""
                            }`}
                          >
                            {msg.content.split(/\n\n+/).map((para, i) =>
                              para.trim() ? <p key={i} className="mb-3">{para}</p> : null
                            )}
                            {isAnalyzing && idx === analysisMessages.length - 1 && (
                              <span className="streaming-cursor" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="px-6 py-4 border-t border-[#2A2A2A] flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!holdings.length || isAnalyzing}
              className="group relative overflow-hidden px-6 py-3 rounded-sm bg-[#00FF99] text-black text-sm font-semibold hover:bg-[#00E689] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Portfolio"}
            </button>

            {hasMessages && !isAnalyzing && (
              <button
                onClick={() => setAnalysisMessages([])}
                className="px-4 py-3 rounded-sm border border-[#2A2A2A] text-xs text-[#606060] hover:text-white hover:border-[#3A3A3A] transition-colors"
              >
                New Analysis
              </button>
            )}

            {!session?.user && holdings.length > 0 && (
              <p className="text-xs text-[#505050] ml-1">Sign in required to analyze</p>
            )}
          </div>
        </div>
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm w-80 p-5">
            <h3 className="text-sm font-semibold text-[#E6E6E6] mb-4">Save Portfolio</h3>
            <input
              autoFocus
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="Portfolio name..."
              className="w-full bg-black border border-[#2A2A2A] rounded-sm px-3 py-2 text-sm text-[#E6E6E6] placeholder-[#505050] outline-none focus:border-[#00FF99] transition-colors mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!saveName.trim() || isSaving}
                className="flex-1 py-2 rounded-sm bg-[#00FF99] text-black text-xs font-semibold hover:bg-[#00E689] transition-colors disabled:opacity-40"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setShowSaveModal(false); setSaveName(""); }}
                className="px-4 py-2 rounded-sm border border-[#2A2A2A] text-xs text-[#606060] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm w-96 max-h-[70vh] flex flex-col">
            <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#E6E6E6]">Saved Portfolios</h3>
              <button onClick={() => setShowLoadModal(false)} className="text-[#505050] hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {isLoadingPortfolios ? (
                <p className="text-xs text-[#505050] text-center py-8">Loading...</p>
              ) : savedPortfolios.length === 0 ? (
                <p className="text-xs text-[#505050] text-center py-8">No saved portfolios yet.</p>
              ) : (
                savedPortfolios.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-black border border-[#2A2A2A] rounded-sm px-3 py-2.5 hover:border-[#3A3A3A] transition-colors">
                    <div>
                      <div className="text-sm text-[#E6E6E6]">{p.name}</div>
                      <div className="text-[10px] text-[#505050] mt-0.5">
                        ${Number(p.capital).toLocaleString()} · {p.portfolioData.holdings.length} position{p.portfolioData.holdings.length !== 1 ? "s" : ""} · {p.portfolioData.mode}
                      </div>
                    </div>
                    <button
                      onClick={() => loadPortfolio(p)}
                      className="text-xs text-[#00FF99] hover:text-white transition-colors ml-3 shrink-0"
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
