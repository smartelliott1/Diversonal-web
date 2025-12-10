"use client";
import { useEffect } from "react";

interface StockCountSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
  assetClass: string;
}

// Max limits by asset class
const ASSET_CLASS_LIMITS: Record<string, { options: number[]; default: number }> = {
  "Equities": { options: [6, 8, 10, 12, 15], default: 8 },
  "Bonds": { options: [4, 6, 8], default: 6 },
  "Cryptocurrencies": { options: [4, 6, 8, 10], default: 6 },
  "Commodities": { options: [3, 4, 6], default: 4 },
  "Real Estate": { options: [3, 4, 6], default: 4 },
  "Cash": { options: [2, 3, 4], default: 2 },
};

export default function StockCountSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  assetClass 
}: StockCountSelectorProps) {
  const limits = ASSET_CLASS_LIMITS[assetClass] || ASSET_CLASS_LIMITS["Equities"];

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00FF99]/10 border border-[#00FF99]/20">
                <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#E6E6E6]">Regenerate {assetClass}</h2>
                <p className="text-sm text-[#808080]">How many recommendations?</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[#808080] hover:text-white hover:bg-[#2A2A2A] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Options */}
        <div className="p-6">
          <div className="grid grid-cols-5 gap-3">
            {limits.options.map((count) => (
              <button
                key={count}
                onClick={() => {
                  onSelect(count);
                  onClose();
                }}
                className={`
                  flex items-center justify-center h-12 rounded-lg border text-lg font-semibold transition-all
                  ${count === limits.default 
                    ? 'border-[#00FF99] bg-[#00FF99]/10 text-[#00FF99] hover:bg-[#00FF99]/20' 
                    : 'border-[#2A2A2A] bg-[#242424] text-[#B4B4B4] hover:border-[#3A3A3A] hover:bg-[#2A2A2A] hover:text-white'
                  }
                `}
              >
                {count}
              </button>
            ))}
          </div>
          
          <p className="mt-4 text-center text-xs text-[#808080]">
            {limits.default} is the recommended default for {assetClass}
          </p>
        </div>
        
        {/* Cancel */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-[#2A2A2A] bg-transparent text-sm font-medium text-[#808080] hover:text-white hover:border-[#3A3A3A] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export { ASSET_CLASS_LIMITS };

