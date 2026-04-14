"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Navigation from "../components/layout/Navigation";

interface Message {
  id?: string;
  role: "user" | "assistant" | "divider";
  content: string;
  createdAt?: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messageCount: number;
}

interface TickerContext {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sector?: string;
  marketCap?: number;
  pe?: number;
}

interface MarketContextData {
  ticker: TickerContext | null;
  textContext: string;
  textContexts?: {
    technical: string;
    fundamental: string;
    hybrid: string;
  };
}

type OptiMode = 'technical' | 'fundamental' | 'hybrid';

// Helper function to render text with paragraph breaks
const renderFormattedText = (text: string) => {
  // Split by double newlines for paragraphs, or single newlines
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((para, paraIdx) => {
    if (!para.trim()) return null;
    
    // Handle single newlines within a paragraph as line breaks
    const lines = para.split('\n');
    
    return (
      <p key={paraIdx} className="mb-3">
        {lines.map((line, lineIdx) => (
          <span key={lineIdx}>
            {line}
            {lineIdx < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
};

// All tickers organized by sector
const ALL_TICKERS = [
  // Commodities (at top for easy access)
  { symbol: 'GC', name: 'Gold', sector: 'Commodity' },
  { symbol: 'SI', name: 'Silver', sector: 'Commodity' },
  { symbol: 'CL', name: 'Crude Oil', sector: 'Commodity' },
  { symbol: 'NG', name: 'Natural Gas', sector: 'Commodity' },
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', sector: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum', sector: 'Crypto' },
  { symbol: 'SOL', name: 'Solana', sector: 'Crypto' },
  { symbol: 'XRP', name: 'Ripple', sector: 'Crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', sector: 'Crypto' },
  { symbol: 'ADA', name: 'Cardano', sector: 'Crypto' },
  { symbol: 'LINK', name: 'Chainlink', sector: 'Crypto' },
  // Technology
  { symbol: 'NVDA', name: 'Nvidia', sector: 'Technology' },
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Technology' },
  { symbol: 'META', name: 'Meta', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Technology' },
  { symbol: 'AMD', name: 'AMD', sector: 'Technology' },
  { symbol: 'CRWD', name: 'CrowdStrike', sector: 'Technology' },
  { symbol: 'MU', name: 'Micron', sector: 'Technology' },
  { symbol: 'TSM', name: 'TSMC', sector: 'Technology' },
  { symbol: 'DDOG', name: 'Datadog', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle', sector: 'Technology' },
  { symbol: 'SHOP', name: 'Shopify', sector: 'Technology' },
  { symbol: 'PLTR', name: 'Palantir', sector: 'Technology' },
  { symbol: 'SMCI', name: 'Super Micro', sector: 'Technology' },
  { symbol: 'PANW', name: 'Palo Alto', sector: 'Technology' },
  // AI
  { symbol: 'SNOW', name: 'Snowflake', sector: 'AI' },
  { symbol: 'PATH', name: 'UiPath', sector: 'AI' },
  { symbol: 'DUOL', name: 'Duolingo', sector: 'AI' },
  { symbol: 'GTLB', name: 'GitLab', sector: 'AI' },
  { symbol: 'S', name: 'SentinelOne', sector: 'AI' },
  { symbol: 'NBIS', name: 'Nebius', sector: 'AI' },
  // Quantum Computing
  { symbol: 'IONQ', name: 'IonQ', sector: 'Quantum' },
  { symbol: 'RGTI', name: 'Rigetti', sector: 'Quantum' },
  { symbol: 'QBTS', name: 'D-Wave', sector: 'Quantum' },
  { symbol: 'QUBT', name: 'Quantum Corp', sector: 'Quantum' },
  { symbol: 'IBM', name: 'IBM', sector: 'Quantum' },
  // Finance
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Finance' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finance' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finance' },
  { symbol: 'V', name: 'Visa', sector: 'Finance' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Finance' },
  { symbol: 'PYPL', name: 'PayPal', sector: 'Finance' },
  { symbol: 'SOFI', name: 'SoFi', sector: 'Finance' },
  { symbol: 'COIN', name: 'Coinbase', sector: 'Finance' },
  { symbol: 'HOOD', name: 'Robinhood', sector: 'Finance' },
  { symbol: 'SQ', name: 'Block', sector: 'Finance' },
  // Healthcare & Biotech
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen', sector: 'Healthcare' },
  { symbol: 'REGN', name: 'Regeneron', sector: 'Biotech' },
  { symbol: 'VRTX', name: 'Vertex', sector: 'Biotech' },
  { symbol: 'BNTX', name: 'BioNTech', sector: 'Biotech' },
  { symbol: 'HIMS', name: 'Hims & Hers', sector: 'Healthcare' },
  { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'Healthcare' },
  // Energy
  { symbol: 'XOM', name: 'Exxon', sector: 'Energy' },
  { symbol: 'BP', name: 'BP', sector: 'Energy' },
  { symbol: 'VST', name: 'Vistra', sector: 'Energy' },
  { symbol: 'SMR', name: 'NuScale', sector: 'Energy' },
  { symbol: 'OKLO', name: 'Oklo', sector: 'Energy' },
  { symbol: 'BE', name: 'Bloom Energy', sector: 'Energy' },
  // Crypto Miners
  { symbol: 'MSTR', name: 'MicroStrategy', sector: 'Crypto' },
  { symbol: 'MARA', name: 'Marathon', sector: 'Crypto' },
  { symbol: 'RIOT', name: 'Riot Platforms', sector: 'Crypto' },
  // Aerospace
  { symbol: 'RKLB', name: 'Rocket Lab', sector: 'Aerospace' },
  { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Aerospace' },
  { symbol: 'SPCE', name: 'Virgin Galactic', sector: 'Aerospace' },
  // Consumer/Retail
  { symbol: 'COST', name: 'Costco', sector: 'Consumer' },
  { symbol: 'WMT', name: 'Walmart', sector: 'Consumer' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks', sector: 'Consumer' },
  { symbol: 'CMG', name: 'Chipotle', sector: 'Consumer' },
  { symbol: 'LULU', name: 'Lululemon', sector: 'Consumer' },
  // Real Estate
  { symbol: 'PLD', name: 'Prologis', sector: 'Real Estate' },
  { symbol: 'EQIX', name: 'Equinix', sector: 'Real Estate' },
  // Precious Metals
  { symbol: 'GOLD', name: 'Barrick Gold', sector: 'Metals' },
  { symbol: 'NEM', name: 'Newmont', sector: 'Metals' },
];

export default function MarketsPage() {
  const { data: session, status } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  // Ticker state
  const [currentTicker, setCurrentTicker] = useState("AAPL");
  const [tickerInput, setTickerInput] = useState("");
  const [showTickerDropdown, setShowTickerDropdown] = useState(false);
  const [marketContext, setMarketContext] = useState<MarketContextData | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const tickerInputRef = useRef<HTMLDivElement>(null);
  
  // Opti mode state
  const [optiMode, setOptiMode] = useState<OptiMode>('hybrid');
  
  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false); // Collapsed by default
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  

  // Get TradingView symbol format
  const getTradingViewSymbol = (ticker: string): string => {
    const upper = ticker.toUpperCase();
    
    // Crypto mappings
    const cryptoMap: Record<string, string> = {
      'BTC': 'BINANCE:BTCUSDT',
      'ETH': 'BINANCE:ETHUSDT',
      'SOL': 'BINANCE:SOLUSDT',
      'XRP': 'BINANCE:XRPUSDT',
      'DOGE': 'BINANCE:DOGEUSDT',
      'ADA': 'BINANCE:ADAUSDT',
      'LINK': 'BINANCE:LINKUSDT',
    };
    
    // Commodity mappings (TVC works with embedded widget)
    const commodityMap: Record<string, string> = {
      'GC': 'TVC:GOLD',      // Spot Gold
      'SI': 'TVC:SILVER',    // Spot Silver
      'CL': 'TVC:USOIL',     // US Oil (WTI)
      'NG': 'TVC:NATGAS',    // Natural Gas
    };
    
    if (cryptoMap[upper]) return cryptoMap[upper];
    if (commodityMap[upper]) return commodityMap[upper];
    return upper; // Let TradingView auto-detect the exchange
  };

  // Fetch ticker context data
  const fetchTickerContext = useCallback(async (symbol: string) => {
    setIsLoadingContext(true);
    try {
      const response = await fetch(`/api/agent-opti/context?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setMarketContext({
          ticker: data.ticker,
          textContext: data.textContext,
          textContexts: data.textContexts,
        });
      } else {
        console.error("Failed to fetch ticker context");
        setMarketContext(null);
      }
    } catch (error) {
      console.error("Error fetching ticker context:", error);
      setMarketContext(null);
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  // Initialize TradingView widget
  const initTradingView = useCallback((symbol: string) => {
    if (!containerRef.current) return;
    
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
      "hide_volume": false,
      "hotlist": false,
      "interval": "D",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": getTradingViewSymbol(symbol),
      "theme": "dark",
      "timezone": "America/Chicago",
      "backgroundColor": "#0F0F0F",
      "gridColor": "rgba(128, 128, 128, 0.18)",
      "watchlist": [],
      "withdateranges": false,
      "compareSymbols": [],
      "studies": ["RSI@tv-basicstudies"],
      "autosize": true
    });
    
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = 'calc(100% - 32px)';
    widgetContainer.style.width = '100%';
    
    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);
  }, []);

  // Handle ticker change
  const handleTickerChange = useCallback((symbol: string) => {
    const upper = symbol.toUpperCase().trim();
    if (!upper || upper === currentTicker) return;
    
    setCurrentTicker(upper);
    setTickerInput("");
    setShowTickerDropdown(false);
    
    // Update chart and fetch context in parallel
    initTradingView(upper);
    fetchTickerContext(upper);
  }, [currentTicker, initTradingView, fetchTickerContext]);

  // Initial load
  useEffect(() => {
    initTradingView(currentTicker);
    fetchTickerContext(currentTicker);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tickerInputRef.current && !tickerInputRef.current.contains(e.target as Node)) {
        setShowTickerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch chats on mount
  const fetchChats = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setIsLoadingChats(true);
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchChats();
    } else if (status === "unauthenticated") {
      setIsLoadingChats(false);
    }
  }, [status, fetchChats]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (!activeChat || !session?.user) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chats/messages?chatId=${activeChat}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [activeChat, session?.user]);

  // Insert a divider when the ticker changes mid-conversation
  const prevTickerRef = useRef(currentTicker);
  useEffect(() => {
    if (prevTickerRef.current !== currentTicker && messages.length > 0) {
      setMessages(prev => [...prev, {
        role: "divider" as const,
        content: `now analyzing ${currentTicker}`,
      }]);
    }
    prevTickerRef.current = currentTicker;
  }, [currentTicker]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create new chat
  const handleNewChat = async () => {
    setActiveChat(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  // Delete chat
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" });
      if (response.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChat === chatId) {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Update chat title
  const handleUpdateTitle = async (chatId: string) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      const response = await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chatId, title: editTitle.trim() })
      });
      
      if (response.ok) {
        setChats(prev => prev.map(c => 
          c.id === chatId ? { ...c, title: editTitle.trim() } : c
        ));
      }
    } catch (error) {
      console.error("Failed to update chat title:", error);
    }
    
    setEditingChatId(null);
  };

  // Core send logic — accepts message text directly so suggestion buttons can auto-submit
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    if (!session?.user) {
      setMessages([{
        role: "assistant",
        content: "Please sign in to chat with Agent Opti. Your conversations will be saved automatically."
      }]);
      return;
    }

    setInput("");

    // Only send messages after the most recent ticker-change divider so Grok doesn't reference the old ticker
    const lastDividerIdx = messages.findLastIndex((m: Message) => m.role === "divider");
    const priorMessages = messages
      .slice(lastDividerIdx + 1)
      .filter((m: Message) => m.role !== "divider");
    setMessages([...messages, { role: "user" as const, content: userMessage }, { role: "assistant" as const, content: "" }]);
    setIsLoading(true);

    try {
      const contextForMode = marketContext?.textContexts?.[optiMode] || marketContext?.textContext || null;

      const response = await fetch("/api/agent-opti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChat,
          message: userMessage,
          messages: priorMessages,
          marketContext: contextForMode,
          mode: optiMode,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to send message");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      let chatIdFromStream: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk.startsWith("__CHAT_ID__:")) {
          const lines = chunk.split('\n');
          chatIdFromStream = lines[0].replace("__CHAT_ID__:", "");
          accumulatedResponse += lines.slice(1).join('\n');
        } else {
          accumulatedResponse += chunk;
        }

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulatedResponse };
          return updated;
        });
      }

      if (!activeChat && chatIdFromStream) {
        setActiveChat(chatIdFromStream);
        fetchChats();
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again."
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit wrapper
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Check if message is still streaming
  const isMessageStreaming = (content: string) => {
    return content && !content.endsWith('.') && !content.endsWith('!') && !content.endsWith('?') && !content.endsWith(':');
  };

  // Filter tickers based on input
  const filteredTickers = tickerInput
    ? ALL_TICKERS.filter(t => 
        t.symbol.toLowerCase().includes(tickerInput.toLowerCase()) ||
        t.name.toLowerCase().includes(tickerInput.toLowerCase()) ||
        t.sector.toLowerCase().includes(tickerInput.toLowerCase())
      )
    : ALL_TICKERS.slice(0, 20); // Show first 20 by default

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navigation />
      
      <main className="pt-16 h-screen flex">
        {/* Chart Section */}
        <div className="w-2/3 h-full relative">
          {/* Top Bar - Ticker Search overlaid on TradingView */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center pointer-events-none">
            <div ref={tickerInputRef} className="pointer-events-auto">
              <div className="relative">
                <button
                  onClick={() => setShowTickerDropdown(!showTickerDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-[9px] bg-black hover:bg-[#1A1A1A] border-r border-b border-[#2A2A2A] text-sm transition-colors min-w-[100px]"
                >
                  <svg className="w-4 h-4 text-[#808080]" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M12.43 11.73a7 7 0 1 0-.7.7l4.2 4.2a.5.5 0 0 0 .7-.7l-4.2-4.2zM2 7a5 5 0 1 1 10 0A5 5 0 0 1 2 7z"/>
                  </svg>
                  <span className="text-white font-medium">{currentTicker}</span>
                  {isLoadingContext && (
                    <div className="w-3 h-3 border border-[#00FF99]/30 border-t-[#00FF99] rounded-full animate-spin ml-1" />
                  )}
                  <svg className="w-3 h-3 text-[#808080] ml-auto" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M3.5 4.5L6 7l2.5-2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                </button>
                
                {/* Dropdown */}
                {showTickerDropdown && (
                  <div className="absolute top-full left-0 mt-0 w-[260px] bg-black border border-[#2A2A2A] shadow-2xl z-50 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-[#2A2A2A]">
                      <input
                        type="text"
                        value={tickerInput}
                        onChange={(e) => setTickerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tickerInput.trim()) {
                            handleTickerChange(tickerInput);
                          }
                          if (e.key === 'Escape') {
                            setShowTickerDropdown(false);
                          }
                        }}
                        placeholder="Search symbol or sector..."
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm text-sm text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF99]/50"
                        autoFocus
                      />
                    </div>
                    
                    {/* Ticker List */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {filteredTickers.map((ticker) => (
                        <button
                          key={ticker.symbol}
                          onClick={() => handleTickerChange(ticker.symbol)}
                          className={`w-full px-3 py-2 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors text-left ${
                            ticker.symbol === currentTicker ? 'bg-[#1A1A1A]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{ticker.symbol}</span>
                            <span className="text-xs text-[#808080]">{ticker.name}</span>
                          </div>
                          <span className="text-[10px] text-[#606060]">{ticker.sector}</span>
                        </button>
                      ))}
                      
                      {/* Custom Search Option */}
                      {tickerInput && !filteredTickers.some(t => t.symbol.toLowerCase() === tickerInput.toLowerCase()) && (
                        <button
                          onClick={() => handleTickerChange(tickerInput)}
                          className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-[#1A1A1A] transition-colors text-left border-t border-[#2A2A2A]"
                        >
                          <svg className="w-4 h-4 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="text-sm text-[#00FF99]">Search "{tickerInput.toUpperCase()}"</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div
            ref={containerRef}
            className="tradingview-widget-container h-full w-full"
          />
        </div>

        {/* Agent Opti Chat Panel - 1/3 of screen */}
        <div className="w-1/3 h-full border-l border-[#2A2A2A] flex">
          
          {/* Chat Sidebar */}
          {showSidebar && session?.user && (
            <div className="w-[200px] h-full border-r border-[#2A2A2A] bg-[#0A0A0A] flex flex-col">
              {/* New Chat Button */}
              <div className="p-3 border-b border-[#2A2A2A]">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#00FF99] text-black rounded-sm font-medium text-sm hover:bg-[#00E689] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingChats ? (
                  <div className="p-4 text-center text-[#808080] text-sm">Loading...</div>
                ) : chats.length === 0 ? (
                  <div className="p-4 text-center text-[#808080] text-sm">
                    No chats yet.<br />Start a conversation!
                  </div>
                ) : (
                  <div className="py-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setActiveChat(chat.id);
                          setEditingChatId(null);
                        }}
                        className={`group px-3 py-2 mx-2 rounded-sm cursor-pointer transition-colors ${
                          activeChat === chat.id 
                            ? 'bg-[#1A1A1A] border border-[#00FF99]/30' 
                            : 'hover:bg-[#1A1A1A]'
                        }`}
                      >
                        {editingChatId === chat.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleUpdateTitle(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateTitle(chat.id);
                              if (e.key === "Escape") setEditingChatId(null);
                            }}
                            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#00FF99]"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#E5E5E5] truncate flex-1 pr-2">
                              {chat.title}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingChatId(chat.id);
                                  setEditTitle(chat.title);
                                }}
                                className="p-1 hover:bg-[#2A2A2A] rounded"
                                title="Rename"
                              >
                                <svg className="w-3.5 h-3.5 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleDeleteChat(chat.id, e)}
                                className="p-1 hover:bg-red-500/20 rounded"
                                title="Delete"
                              >
                                <svg className="w-3.5 h-3.5 text-[#808080] hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-[#606060] mt-1 truncate">
                          {chat.lastMessage || "No messages"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Sidebar Button */}
              <div className="p-2 border-t border-[#2A2A2A]">
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[#808080] hover:text-white text-xs transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  Hide Sidebar
                </button>
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-black relative">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2A2A2A]">
              <div className="flex items-center justify-between">
                {/* Left: sidebar toggle + title + ticker */}
                <div className="flex items-center gap-3 min-w-0">
                  {session?.user && (
                    <button
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="p-1.5 hover:bg-[#1A1A1A] rounded-sm transition-colors shrink-0"
                      title={showSidebar ? "Hide chat history" : "Show chat history"}
                    >
                      <svg className="w-5 h-5 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-semibold text-white shrink-0">Agent Opti</h2>
                      {marketContext?.ticker && (
                        <span className="flex items-center gap-1.5 text-xs shrink-0">
                          <span className="text-[#808080]">{marketContext.ticker.symbol}</span>
                          <span className={marketContext.ticker.changePercent >= 0 ? 'text-[#00FF99]' : 'text-[#FF4444]'}>
                            {marketContext.ticker.changePercent >= 0 ? '+' : ''}{marketContext.ticker.changePercent?.toFixed(2)}%
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#505050] mt-0.5">AI trading analyst</p>
                  </div>
                </div>

                {/* Right: mode pills + clear button */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Mode pills */}
                  <div className="flex items-center bg-[#111111] border border-[#2A2A2A] rounded-sm p-0.5">
                    {(['technical', 'hybrid', 'fundamental'] as OptiMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setOptiMode(m)}
                        className={`px-2.5 py-1 text-[10px] rounded-sm capitalize transition-colors ${
                          optiMode === m
                            ? 'bg-[#00FF99]/15 text-[#00FF99] border border-[#00FF99]/30'
                            : 'text-[#505050] hover:text-[#808080]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  {/* Clear chat */}
                  <button
                    onClick={handleNewChat}
                    className="p-1.5 hover:bg-[#1A1A1A] rounded-sm transition-colors"
                    title="Clear chat"
                  >
                    <svg className="w-4 h-4 text-[#505050] hover:text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto">{/**/}

              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-end pb-4 px-6">
                  {/* Minimal prompt */}
                  <p className="text-sm text-[#606060] mb-4">
                    {marketContext?.ticker 
                      ? `What would you like to know about ${marketContext.ticker.symbol}?`
                      : 'Select a ticker to get started.'
                    }
                  </p>
                  
                  {/* Suggestion buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(marketContext?.ticker ? [
                      `Analyze ${marketContext.ticker.symbol}`,
                      "Bull case?",
                      "Key risks?"
                    ] : [
                      "What's moving?",
                      "Market overview"
                    ]).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => sendMessage(suggestion)}
                        className="px-3 py-1.5 rounded-sm bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-[#808080] hover:border-[#00FF99]/50 hover:text-[#00FF99] transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  
                  {!session?.user && (
                    <p className="text-[10px] text-[#FF9900]/70 mt-3">
                      Sign in to save chat history
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6 px-6 py-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {msg.role === 'divider' ? (
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex-1 h-px bg-[#1E1E1E]" />
                          <span className="text-[10px] text-[#404040] whitespace-nowrap">{msg.content}</span>
                          <div className="flex-1 h-px bg-[#1E1E1E]" />
                        </div>
                      ) : msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <p className="text-sm text-[#00FF99]/90 bg-[#00FF99]/10 rounded-sm px-4 py-2.5 max-w-[85%]">
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        <div className={`text-sm leading-relaxed text-gray-300 ${
                          isLoading && idx === messages.length - 1 && isMessageStreaming(msg.content)
                            ? 'shimmer-text'
                            : ''
                        }`}>
                          {msg.content ? (
                            renderFormattedText(msg.content)
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-gray-500">
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested follow-ups — mode-aware */}
            {messages.filter(m => m.role !== 'divider').length > 0 && messages.filter(m => m.role !== 'divider').length <= 2 && !isLoading && (
              <div className="px-6 pb-2 flex flex-wrap gap-2">
                {({
                  technical: ["Best entry point?", "Key support levels?", "How strong is the trend?"],
                  fundamental: ["Is it overvalued?", "Growth outlook?", "How do analysts see it?"],
                  hybrid: ["Bull or bear?", "What would change your view?", "Compare to the sector?"],
                }[optiMode]).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(question)}
                    className="px-3 py-1.5 text-xs rounded-full border border-[#3A3A3A] text-gray-400 hover:border-[#00FF99]/50 hover:text-[#00FF99] transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-[#2A2A2A]">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    marketContext?.ticker
                      ? `Ask about ${marketContext.ticker.symbol}...`
                      : "Ask a question..."
                  }
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-sm bg-[#1A1A1A] border border-[#2A2A2A] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF99]/30 transition-colors resize-none"
                  disabled={isLoading}
                  style={{ maxHeight: "120px" }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-3 rounded-sm bg-[#00FF99] text-black text-sm font-semibold hover:bg-[#00E689] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* TradingView Attribution */}
        <div className="fixed bottom-4 left-4 z-10">
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
