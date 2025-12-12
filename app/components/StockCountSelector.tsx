"use client";
import { useState, useEffect } from "react";

interface StockCountSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
  assetClass: string;
  allocation?: number; // Allocation % for smart defaults
}

// Min/max by asset class (user specified limits)
const ASSET_CLASS_LIMITS: Record<string, { min: number; max: number }> = {
  "Equities": { min: 1, max: 15 },
  "Bonds": { min: 1, max: 5 },
  "Cryptocurrencies": { min: 1, max: 5 },
  "Commodities": { min: 1, max: 4 },
  "Real Estate": { min: 1, max: 4 },
  "Cash": { min: 1, max: 3 },
};

// Calculate smart default based on allocation %
function getSmartDefault(assetClass: string, allocation: number): number {
  const limits = ASSET_CLASS_LIMITS[assetClass] || ASSET_CLASS_LIMITS["Equities"];
  
  let defaultCount: number;
  if (allocation <= 5) {
    defaultCount = 1;
  } else if (allocation <= 15) {
    defaultCount = 2;
  } else if (allocation <= 30) {
    defaultCount = Math.min(4, limits.max);
  } else {
    // 31%+: use 5+ picks, capped by max
    defaultCount = Math.min(assetClass === "Equities" ? 7 : 5, limits.max);
  }
  
  return Math.min(defaultCount, limits.max);
}

export default function StockCountSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  assetClass,
  allocation = 20 // Default to 20% if not provided
}: StockCountSelectorProps) {
  const limits = ASSET_CLASS_LIMITS[assetClass] || ASSET_CLASS_LIMITS["Equities"];
  const smartDefault = getSmartDefault(assetClass, allocation);
  const [count, setCount] = useState(smartDefault);

  // Reset count when asset class or allocation changes
  useEffect(() => {
    setCount(getSmartDefault(assetClass, allocation));
  }, [assetClass, allocation]);

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

  const handleSubmit = () => {
    onSelect(count);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-black rounded-lg border border-[#2A2A2A] shadow-2xl shadow-black/50 overflow-hidden">
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
                <p className="text-sm text-[#808080]">Choose number of recommendations</p>
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
        
        {/* Number Input */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-4">
            {/* Decrement */}
            <button
              onClick={() => setCount(c => Math.max(limits.min, c - 1))}
              disabled={count <= limits.min}
              className="flex items-center justify-center w-12 h-12 rounded-lg border border-[#2A2A2A] bg-[#242424] text-[#B4B4B4] hover:border-[#3A3A3A] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            {/* Number Display/Input */}
            <input
              type="number"
              min={limits.min}
              max={limits.max}
              value={count}
              onChange={(e) => {
                const val = parseInt(e.target.value) || limits.min;
                setCount(Math.min(limits.max, Math.max(limits.min, val)));
              }}
              className="w-20 h-16 text-center text-3xl font-bold text-[#00FF99] bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg focus:border-[#00FF99] focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            
            {/* Increment */}
            <button
              onClick={() => setCount(c => Math.min(limits.max, c + 1))}
              disabled={count >= limits.max}
              className="flex items-center justify-center w-12 h-12 rounded-lg border border-[#2A2A2A] bg-[#242424] text-[#B4B4B4] hover:border-[#3A3A3A] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <p className="mt-4 text-center text-xs text-[#808080]">
            Range: {limits.min} – {limits.max} (suggested: {smartDefault} for {allocation}% allocation)
          </p>
        </div>
        
        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] bg-transparent text-sm font-medium text-[#808080] hover:text-white hover:border-[#3A3A3A] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg bg-[#00FF99] text-sm font-semibold text-[#0F0F0F] hover:bg-[#00E689] transition-all"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

export { ASSET_CLASS_LIMITS };
