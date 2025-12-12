"use client";
import { useEffect, useRef } from "react";
import Navigation from "../components/layout/Navigation";

export default function MarketsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing widget
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": true,
      "hotlist": false,
      "interval": "D",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": "NASDAQ:AAPL",
      "theme": "dark",
      "timezone": "America/Chicago",
      "backgroundColor": "#0F0F0F",
      "gridColor": "rgba(128, 128, 128, 0.18)",
      "watchlist": [],
      "withdateranges": false,
      "compareSymbols": [],
      "studies": [],
      "autosize": true
    });
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = 'calc(100% - 32px)';
    widgetContainer.style.width = '100%';
    
    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navigation />
      
      <main className="pt-16 h-screen">
        <div 
          ref={containerRef}
          className="tradingview-widget-container h-full w-full"
        />
        
        {/* TradingView Attribution */}
        <div className="fixed bottom-4 right-4 z-10">
          <div className="flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-black/90 px-3 py-2 backdrop-blur-sm">
            <a 
              href="https://www.tradingview.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-[#808080] hover:text-[#B4B4B4] transition-colors"
            >
              Charts by TradingView
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
