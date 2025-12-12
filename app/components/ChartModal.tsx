"use client";
import { useEffect, useRef } from "react";

// Crypto tickers that need special TradingView symbol formatting
const CRYPTO_TICKERS = ['BTC', 'ETH', 'XMR', 'LINK', 'SOL', 'ADA'];

// Get the correct TradingView symbol for cryptocurrencies
function getCryptoTradingViewSymbol(ticker: string): string {
  const upperTicker = ticker.toUpperCase();
  // Monero (XMR) is not on Coinbase due to regulatory reasons, use Kraken
  if (upperTicker === 'XMR') return 'KRAKEN:XMRUSD';
  return `COINBASE:${upperTicker}USD`;
}

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  name?: string;
  exchange?: string | null;
}

export default function ChartModal({ isOpen, onClose, ticker, name, exchange }: ChartModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    
    // Clear any existing widget
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    
    // Determine the correct TradingView symbol
    // Handle crypto tickers specially (they need COINBASE:BTCUSD format)
    const isCrypto = CRYPTO_TICKERS.includes(ticker.toUpperCase());
    const tvSymbol = ticker.includes(':') 
      ? ticker 
      : isCrypto
        ? getCryptoTradingViewSymbol(ticker)
        : `${exchange || 'NASDAQ'}:${ticker}`;
    
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "America/New_York",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": true,
      "backgroundColor": "rgba(15, 15, 15, 1)",
      "gridColor": "rgba(42, 42, 42, 0.6)",
      "studies": []
    });
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    
    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);
  }, [isOpen, ticker, exchange]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-[90vw] h-[85vh] bg-[#0F0F0F] rounded-lg border border-[#2A2A2A] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00FF99]/10 border border-[#00FF99]/20">
              <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#E6E6E6]">{ticker}</h2>
              {name && <p className="text-sm text-[#808080]">{name}</p>}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-[#2A2A2A] bg-[#242424] text-[#808080] hover:text-white hover:border-[#3A3A3A] hover:bg-[#2A2A2A] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Chart Container */}
        <div 
          ref={containerRef}
          className="flex-1 tradingview-widget-container"
        />
        
        {/* Footer Attribution */}
        <div className="px-6 py-2 border-t border-[#2A2A2A] bg-[#1A1A1A]">
          <a 
            href="https://www.tradingview.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-[#808080] hover:text-[#B4B4B4] transition-colors"
          >
            Chart by TradingView
          </a>
        </div>
      </div>
    </div>
  );
}

