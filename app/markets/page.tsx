"use client";
import { useEffect, useRef, useState } from "react";
import Navigation from "../components/layout/Navigation";

export default function MarketsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || isLoaded) return;
    
    // Clear any existing widget
    containerRef.current.innerHTML = '';
    
    // Create widget container div
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    
    // Create and configure script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.textContent = JSON.stringify({
      "autosize": true,
      "symbol": "NASDAQ:AAPL",
      "interval": "D",
      "timezone": "America/Chicago",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "backgroundColor": "#0F0F0F",
      "gridColor": "rgba(128, 128, 128, 0.18)",
      "allow_symbol_change": true,
      "calendar": false,
      "hide_volume": true,
      "support_host": "https://www.tradingview.com"
    });
    
    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
    setIsLoaded(true);
  }, [isLoaded]);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navigation />
      
      <main className="pt-16 h-screen flex flex-col">
        <div 
          ref={containerRef}
          className="tradingview-widget-container flex-1 w-full"
          style={{ height: 'calc(100vh - 64px)' }}
        />
        
        {/* TradingView Attribution */}
        <div className="fixed bottom-4 right-4 z-10">
          <div className="flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A]/90 px-3 py-2 backdrop-blur-sm">
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

