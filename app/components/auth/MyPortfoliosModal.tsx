"use client";

import { useState, useEffect } from "react";

interface SavedPortfolio {
  id: string;
  name: string;
  createdAt: string;
  age: string;
  risk: number;
  horizon: string;
  capital: string;
  goal: string;
  sectors: string[];
  portfolioData: any;
  detailedRecommendations?: any;
}

interface MyPortfoliosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPortfolio: (portfolio: SavedPortfolio) => void;
}

export default function MyPortfoliosModal({ isOpen, onClose, onLoadPortfolio }: MyPortfoliosModalProps) {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPortfolios();
    }
  }, [isOpen]);

  const fetchPortfolios = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/portfolios");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch portfolios");
      }

      setPortfolios(data.portfolios || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

      setPortfolios(portfolios.filter(p => p.id !== portfolioId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete portfolio");
    } finally {
      setDeletingId(null);
    }
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 25) return "Low";
    if (risk <= 50) return "Moderate";
    if (risk <= 75) return "High";
    return "Aggressive";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCapital = (capital: string) => {
    const num = parseInt(capital.replace(/\D/g, ""), 10);
    if (isNaN(num)) return capital;
    return `$${num.toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-black border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-semibold text-white">My Portfolios</h2>
          <button
            onClick={onClose}
            className="text-[#808080] hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#00FF99] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchPortfolios}
                className="px-4 py-2 text-[#00FF99] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-[#2A2A2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#808080] mb-2">No saved portfolios yet</p>
              <p className="text-[#B4B4B4] text-sm">
                Generate a portfolio and it will be automatically saved here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="group p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl hover:border-[#00FF99]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate mb-1">
                        {portfolio.name}
                      </h3>
                      <p className="text-[#808080] text-sm mb-3">
                        {formatDate(portfolio.createdAt)}
                      </p>
                      
                      {/* Portfolio Details */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-black rounded-lg text-xs text-[#B4B4B4]">
                          {formatCapital(portfolio.capital)}
                        </span>
                        <span className="px-2 py-1 bg-black rounded-lg text-xs text-[#B4B4B4]">
                          {getRiskLabel(portfolio.risk)} Risk
                        </span>
                        <span className="px-2 py-1 bg-black rounded-lg text-xs text-[#B4B4B4]">
                          {portfolio.horizon}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onLoadPortfolio(portfolio);
                          onClose();
                        }}
                        className="px-4 py-2 bg-[#00FF99] text-black rounded-lg text-sm font-medium hover:bg-[#00FF99]/90 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(portfolio.id)}
                        disabled={deletingId === portfolio.id}
                        className="p-2 text-[#808080] hover:text-red-400 transition-colors disabled:opacity-50"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

