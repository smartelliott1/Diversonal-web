"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navigation from "../components/layout/Navigation";
import SignInModal from "../components/auth/SignInModal";
import SignUpModal from "../components/auth/SignUpModal";
import SavePortfolioModal from "../components/SavePortfolioModal";
import { sessionCache, CACHE_KEYS, CACHE_TTL } from "../lib/sessionCache";

interface SavedPortfolio {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  age: string;
  risk: number;
  horizon: string;
  capital: string;
  goal: string;
  sectors: string[];
  portfolioData: Array<{ name: string; value: number; color: string; breakdown?: string }>;
  detailedRecommendations?: any;
  isManuallySaved?: boolean;
  // Full state persistence fields
  stockModalCache?: any;
  allocationChatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  allocationReasoning?: string;
  stockData?: any;
  marketContext?: any;
  activeTab?: string;
}

type TabType = 'developed' | 'optimized' | 'history';

export default function MyPortfoliosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Auth modals
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('developed');
  
  // Data state - separate for saved and history
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
  const [allPortfolios, setAllPortfolios] = useState<SavedPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  
  // Expanded portfolio for viewing details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Export PDF state
  const [exportingPortfolio, setExportingPortfolio] = useState<SavedPortfolio | null>(null);

  // Get the active portfolios based on current tab
  const portfolios = activeTab === 'developed' ? savedPortfolios : allPortfolios;

  // Fetch saved portfolios (manually saved only)
  const fetchSavedPortfolios = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = sessionCache.get<SavedPortfolio[]>(CACHE_KEYS.MY_PORTFOLIOS);
      if (cached) {
        setSavedPortfolios(cached);
        console.log("[MyPortfolios] Loaded saved from cache");
        return cached;
      }
    }

    try {
      const res = await fetch("/api/portfolios?filter=saved");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch portfolios");
      }

      const fetched = data.portfolios || [];
      setSavedPortfolios(fetched);
      sessionCache.set(CACHE_KEYS.MY_PORTFOLIOS, fetched, CACHE_TTL.MY_PORTFOLIOS);
      console.log("[MyPortfolios] Fetched saved portfolios");
      return fetched;
    } catch (err) {
      throw err;
    }
  };

  // Fetch all portfolios (for history)
  const fetchAllPortfolios = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = sessionCache.get<SavedPortfolio[]>(CACHE_KEYS.PORTFOLIO_HISTORY);
      if (cached) {
        setAllPortfolios(cached);
        console.log("[MyPortfolios] Loaded history from cache");
        return cached;
      }
    }

    try {
      const res = await fetch("/api/portfolios?filter=all");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch portfolios");
      }

      const fetched = data.portfolios || [];
      setAllPortfolios(fetched);
      sessionCache.set(CACHE_KEYS.PORTFOLIO_HISTORY, fetched, CACHE_TTL.PORTFOLIO_HISTORY);
      console.log("[MyPortfolios] Fetched all portfolios");
      return fetched;
    } catch (err) {
      throw err;
    }
  };

  // Fetch portfolios based on active tab
  const fetchPortfolios = async (forceRefresh = false) => {
    setLoading(true);
    setError("");

    try {
      if (activeTab === 'developed') {
        await fetchSavedPortfolios(forceRefresh);
      } else if (activeTab === 'history') {
        await fetchAllPortfolios(forceRefresh);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchPortfolios();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  // Refetch when tab changes
  useEffect(() => {
    if (status === "authenticated" && (activeTab === 'developed' || activeTab === 'history')) {
      fetchPortfolios();
    }
  }, [activeTab]);

  // Handle delete
  const handleDelete = async (portfolioId: string) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;

    setDeletingId(portfolioId);

    try {
      const res = await fetch(`/api/portfolios?id=${portfolioId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete portfolio");
      }

      // Update both local states and caches
      const updatedSaved = savedPortfolios.filter(p => p.id !== portfolioId);
      const updatedAll = allPortfolios.filter(p => p.id !== portfolioId);
      setSavedPortfolios(updatedSaved);
      setAllPortfolios(updatedAll);
      sessionCache.set(CACHE_KEYS.MY_PORTFOLIOS, updatedSaved, CACHE_TTL.MY_PORTFOLIOS);
      sessionCache.set(CACHE_KEYS.PORTFOLIO_HISTORY, updatedAll, CACHE_TTL.PORTFOLIO_HISTORY);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete portfolio");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle rename portfolio
  const handleRename = async (portfolioId: string) => {
    if (!newName.trim()) {
      setRenamingId(null);
      return;
    }

    try {
      const res = await fetch("/api/portfolios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: portfolioId, name: newName.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename portfolio");
      }

      // Update local state
      const updatePortfolio = (p: SavedPortfolio) => 
        p.id === portfolioId ? { ...p, name: newName.trim() } : p;
      
      const updatedSaved = savedPortfolios.map(updatePortfolio);
      const updatedAll = allPortfolios.map(updatePortfolio);
      
      setSavedPortfolios(updatedSaved);
      setAllPortfolios(updatedAll);
      sessionCache.set(CACHE_KEYS.MY_PORTFOLIOS, updatedSaved, CACHE_TTL.MY_PORTFOLIOS);
      sessionCache.set(CACHE_KEYS.PORTFOLIO_HISTORY, updatedAll, CACHE_TTL.PORTFOLIO_HISTORY);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename portfolio");
    } finally {
      setRenamingId(null);
      setNewName("");
    }
  };

  // Start renaming a portfolio
  const startRename = (portfolio: SavedPortfolio) => {
    setRenamingId(portfolio.id);
    setNewName(portfolio.name);
  };

  // Handle load portfolio - navigate to develop page with portfolio data
  const handleLoadPortfolio = (portfolio: SavedPortfolio) => {
    // Store portfolio ID so develop page can update it
    sessionCache.set(CACHE_KEYS.LOADED_PORTFOLIO_ID, portfolio.id);

    // Store form state
    sessionCache.set(CACHE_KEYS.FORM_STATE, {
      selectedSectors: portfolio.sectors,
      riskTolerance: portfolio.risk,
      savedFormData: {
        age: portfolio.age,
        risk: portfolio.risk,
        horizon: portfolio.horizon,
        capital: portfolio.capital,
        goal: portfolio.goal,
        sectors: portfolio.sectors,
      },
    });
    
    // Store portfolio state
    sessionCache.set(CACHE_KEYS.PORTFOLIO_STATE, {
      portfolioData: portfolio.portfolioData,
      portfolioReasoning: portfolio.allocationReasoning || "",
      showResult: true,
      activeTab: portfolio.activeTab || portfolio.portfolioData[0]?.name || "Equities",
      activeResultTab: 'portfolio',
    });

    // Store recommendations (indefinite cache - stock picks never expire)
    if (portfolio.detailedRecommendations) {
      sessionCache.set(CACHE_KEYS.STOCK_RECOMMENDATIONS, portfolio.detailedRecommendations, CACHE_TTL.RECOMMENDATIONS);
    }

    // Store stock modal cache (per-ticker chat history)
    if (portfolio.stockModalCache) {
      sessionCache.set(CACHE_KEYS.STOCK_MODAL_CACHE, portfolio.stockModalCache);
    }

    // Store allocation chat history
    if (portfolio.allocationChatHistory || portfolio.allocationReasoning) {
      sessionCache.set(CACHE_KEYS.ALLOCATION_CHAT, {
        chatHistory: portfolio.allocationChatHistory || [],
        reasoningText: portfolio.allocationReasoning || "",
      });
    }

    // Store stock data (will be refreshed, but useful for initial display)
    if (portfolio.stockData) {
      sessionCache.set(CACHE_KEYS.STOCK_DATA, portfolio.stockData, CACHE_TTL.STOCK_DATA);
    }

    // Store market context (will be refreshed)
    if (portfolio.marketContext) {
      sessionCache.set(CACHE_KEYS.MARKET_CONTEXT, portfolio.marketContext, CACHE_TTL.MARKET_CONTEXT);
    }

    router.push('/develop');
  };

  // Utility functions
  const getRiskLabel = (risk: number) => {
    if (risk <= 25) return { label: "Conservative", color: "text-blue-400" };
    if (risk <= 50) return { label: "Moderate", color: "text-yellow-400" };
    if (risk <= 75) return { label: "Aggressive", color: "text-orange-400" };
    return { label: "Very Aggressive", color: "text-red-400" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCapital = (capital: string) => {
    const num = parseInt(capital.replace(/\D/g, ""), 10);
    if (isNaN(num)) return capital;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Render portfolio card
  const renderPortfolioCard = (portfolio: SavedPortfolio) => {
    const riskInfo = getRiskLabel(portfolio.risk);
    const isExpanded = expandedId === portfolio.id;

    return (
      <div
        key={portfolio.id}
        onClick={() => handleLoadPortfolio(portfolio)}
        className="group bg-[#0A0A0A] border border-[#2A2A2A] rounded-sm overflow-hidden hover:border-[#00FF99]/30 transition-all duration-300 cursor-pointer"
      >
        {/* Card Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {renamingId === portfolio.id ? (
                  <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(portfolio.id);
                        if (e.key === 'Escape') {
                          setRenamingId(null);
                          setNewName("");
                        }
                      }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 bg-[#1A1A1A] border border-[#00FF99]/50 rounded-sm text-white text-lg font-semibold focus:outline-none focus:border-[#00FF99]"
                    />
                    <button
                      onClick={() => handleRename(portfolio.id)}
                      className="p-1.5 text-[#00FF99] hover:bg-[#00FF99]/10 rounded-sm transition-colors"
                      title="Save"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setRenamingId(null);
                        setNewName("");
                      }}
                      className="p-1.5 text-[#808080] hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                      title="Cancel"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <h3 className="text-white font-semibold text-lg truncate">
                    {portfolio.name}
                  </h3>
                )}
                {renamingId !== portfolio.id && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskInfo.color} bg-current/10`}>
                    {riskInfo.label}
                  </span>
                )}
              </div>
              <p className="text-[#808080] text-sm">
                {getTimeAgo(portfolio.createdAt)}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleLoadPortfolio(portfolio)}
                className="px-4 py-2 bg-[#00FF99] text-black rounded-sm text-sm font-semibold hover:bg-[#00FF99]/90 transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => setExpandedId(isExpanded ? null : portfolio.id)}
                className="p-2 text-[#808080] hover:text-white transition-colors"
                title="View details"
              >
                <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => startRename(portfolio)}
                className="p-2 text-[#808080] hover:text-[#00FF99] transition-colors"
                title="Rename"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setExportingPortfolio(portfolio)}
                className="p-2 text-[#808080] hover:text-[#00FF99] transition-colors"
                title="Export PDF"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(portfolio.id)}
                disabled={deletingId === portfolio.id}
                className="p-2 text-[#808080] hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === portfolio.id ? (
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Portfolio Summary Bar */}
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[#1A1A1A] mb-4">
            {portfolio.portfolioData.map((item, idx) => (
              <div
                key={idx}
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
                className="transition-all"
                title={`${item.name}: ${item.value}%`}
              />
            ))}
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-[#1A1A1A] rounded-sm text-xs text-[#B4B4B4] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatCapital(portfolio.capital)}
            </span>
            <span className="px-3 py-1.5 bg-[#1A1A1A] rounded-sm text-xs text-[#B4B4B4] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {portfolio.horizon}
            </span>
            <span className="px-3 py-1.5 bg-[#1A1A1A] rounded-sm text-xs text-[#B4B4B4] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Age {portfolio.age}
            </span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-[#2A2A2A] p-5 bg-black/50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {/* Goal */}
            <div className="mb-4">
              <h4 className="text-[#808080] text-xs uppercase tracking-wider mb-2">Investment Goal</h4>
              <p className="text-[#E6E6E6] text-sm">{portfolio.goal}</p>
            </div>

            {/* Sectors */}
            <div className="mb-4">
              <h4 className="text-[#808080] text-xs uppercase tracking-wider mb-2">Selected Sectors</h4>
              <div className="flex flex-wrap gap-2">
                {portfolio.sectors.map((sector, idx) => (
                  <span key={idx} className="px-2 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-[#B4B4B4]">
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* Allocation Breakdown */}
            <div>
              <h4 className="text-[#808080] text-xs uppercase tracking-wider mb-2">Allocation</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {portfolio.portfolioData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#1A1A1A] rounded-sm">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#B4B4B4] flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-[#00FF99] font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex justify-between text-xs text-[#808080]">
              <span>Created: {formatDate(portfolio.createdAt)}</span>
              <span>Updated: {formatDate(portfolio.updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render unauthenticated state
  if (status === "unauthenticated") {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-black pt-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Sign in to view your portfolios</h1>
              <p className="text-[#808080] mb-8 max-w-md mx-auto">
                Create an account or sign in to save and manage your AI-generated portfolios
              </p>
              <button
                onClick={() => setShowSignInModal(true)}
                className="px-8 py-3 bg-[#00FF99] text-black rounded-sm font-semibold hover:bg-[#00FF99]/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </main>

        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSwitchToSignUp={() => {
            setShowSignInModal(false);
            setShowSignUpModal(true);
          }}
        />
        <SignUpModal
          isOpen={showSignUpModal}
          onClose={() => setShowSignUpModal(false)}
          onSwitchToSignIn={() => {
            setShowSignUpModal(false);
            setShowSignInModal(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black pt-24 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Portfolios</h1>
            <p className="text-[#808080]">View and manage all your saved work in Diversonal</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setActiveTab('developed')}
              className={`flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-semibold transition-all border-2 ${
                activeTab === 'developed'
                  ? 'bg-[#00FF99] text-black border-[#00FF99]'
                  : 'bg-[#1A1A1A] text-[#B4B4B4] border-[#2A2A2A] hover:border-[#00FF99]/50 hover:text-white'
              }`}
            >
              Saved Developments
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'developed'
                  ? 'bg-black/20 text-black'
                  : 'bg-[#2A2A2A] text-[#808080]'
              }`}>
                {savedPortfolios.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('optimized')}
              className={`flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-semibold transition-all border-2 ${
                activeTab === 'optimized'
                  ? 'bg-[#00FF99] text-black border-[#00FF99]'
                  : 'bg-[#1A1A1A] text-[#B4B4B4] border-[#2A2A2A] hover:border-[#00FF99]/50 hover:text-white'
              }`}
            >
              Saved Optimizations
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'optimized'
                  ? 'bg-black/20 text-black'
                  : 'bg-[#2A2A2A] text-[#808080]'
              }`}>
                0
              </span>
              <span className="px-1.5 py-0.5 bg-[#2A2A2A] rounded text-[10px] text-[#808080] uppercase tracking-wider">
                Soon
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-semibold transition-all border-2 ${
                activeTab === 'history'
                  ? 'bg-[#00FF99] text-black border-[#00FF99]'
                  : 'bg-[#1A1A1A] text-[#B4B4B4] border-[#2A2A2A] hover:border-[#00FF99]/50 hover:text-white'
              }`}
            >
              All History
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'history'
                  ? 'bg-black/20 text-black'
                  : 'bg-[#2A2A2A] text-[#808080]'
              }`}>
                {allPortfolios.length}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'developed' && (
            <div>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-[#808080]">
                  {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'} saved
                </p>
                <button
                  onClick={() => fetchPortfolios(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#808080] hover:text-white transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-2 border-[#00FF99] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={() => fetchPortfolios(true)}
                    className="px-4 py-2 text-[#00FF99] hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : portfolios.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#2A2A2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No portfolios yet</h3>
                  <p className="text-[#808080] mb-6 max-w-md mx-auto">
                    Start by developing a new portfolio. It will be automatically saved here.
                  </p>
                  <button
                    onClick={() => router.push('/develop')}
                    className="px-6 py-3 bg-[#00FF99] text-black rounded-sm font-semibold hover:bg-[#00FF99]/90 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Develop a Portfolio
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {portfolios.map(renderPortfolioCard)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimized' && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-[#808080] max-w-md mx-auto">
                Portfolio optimization is in development. Soon you'll be able to optimize existing portfolios and save the results here.
              </p>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-2 border-[#00FF99] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : portfolios.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#2A2A2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No activity yet</h3>
                  <p className="text-[#808080]">Your portfolio development and optimization history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Sort by date descending for history view */}
                  {[...portfolios]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className="flex items-center gap-4 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-sm hover:border-[#3A3A3A] transition-colors"
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-full bg-[#00FF99]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{portfolio.name}</p>
                          <p className="text-sm text-[#808080]">
                            Portfolio developed • {formatCapital(portfolio.capital)} • {portfolio.horizon}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-[#808080]">{getTimeAgo(portfolio.createdAt)}</p>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => handleLoadPortfolio(portfolio)}
                          className="px-3 py-1.5 text-sm text-[#00FF99] hover:bg-[#00FF99]/10 rounded-sm transition-colors flex-shrink-0"
                        >
                          View
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Export PDF Modal */}
      {exportingPortfolio && (
        <SavePortfolioModal
          isOpen={true}
          onClose={() => setExportingPortfolio(null)}
          portfolioData={exportingPortfolio.portfolioData}
          formData={{
            age: exportingPortfolio.age,
            risk: exportingPortfolio.risk,
            horizon: exportingPortfolio.horizon,
            capital: exportingPortfolio.capital,
            goal: exportingPortfolio.goal,
            sectors: exportingPortfolio.sectors,
          }}
          detailedRecommendations={exportingPortfolio.detailedRecommendations}
          exportOnly={true}
          portfolioName={exportingPortfolio.name}
        />
      )}
    </>
  );
}

