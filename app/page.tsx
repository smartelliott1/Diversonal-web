"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
// Auth components
import SignInModal from "./components/auth/SignInModal";
import SignUpModal from "./components/auth/SignUpModal";
import ProfileDropdown from "./components/auth/ProfileDropdown";
import MyPortfoliosModal from "./components/auth/MyPortfoliosModal";

export default function Home() {
  // Auth state
  const { data: session } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showMyPortfoliosModal, setShowMyPortfoliosModal] = useState(false);

  // 3D Computer Screen Component
  const ComputerScreen3D = () => {
    const [currentFeature, setCurrentFeature] = useState(0);
    
    // Auto-cycle through features every 5 seconds
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % 3);
      }, 5000);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div className="relative z-0 w-full max-w-6xl px-6 mx-auto" style={{ perspective: '1500px' }}>
        <div 
          className="computer-screen-3d group relative mx-auto w-full transition-transform duration-500 hover:scale-[1.02]"
          style={{ 
            transform: 'rotateX(8deg) rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Monitor Base/Stand */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="mt-4 h-8 w-32 rounded-b-lg bg-gradient-to-b from-[#2A2A2A] to-black" style={{ transform: 'translateZ(-20px)' }}></div>
            <div className="mx-auto h-12 w-20 bg-gradient-to-b from-black to-[#0F0F0F]"></div>
          </div>
          
          {/* Monitor Bezel */}
          <div className="relative rounded-lg border-8 border-black bg-black shadow-2xl" style={{ transform: 'translateZ(10px)' }}>
            {/* Screen Glow Effect */}
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#00FF99]/20 via-[#00FF99]/10 to-[#00FF99]/20 opacity-50 blur-xl"></div>
            
            {/* Screen Content Container */}
            <div className="relative overflow-hidden rounded-sm bg-black aspect-[16/10]">
              {/* Feature 0: Portfolio Optimization */}
              <div className={`feature-screen absolute inset-0 p-8 transition-opacity duration-700 ${currentFeature === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col">
                  <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                    <h3 className="text-2xl font-semibold text-[#E6E6E6]">Portfolio Optimization</h3>
                    <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-3 py-1.5">
                      <span className="text-sm font-medium text-[#00FF99]">AI-Powered</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-1 items-center gap-8">
                    {/* Pie Chart */}
                    <div className="flex-shrink-0">
                      <div className="relative h-48 w-48">
                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#4A4A4A" strokeWidth="20" strokeDasharray="75.4 251.2" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#5A5A5A" strokeWidth="20" strokeDasharray="62.8 251.2" strokeDashoffset="-75.4" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#00FF99" strokeWidth="20" strokeDasharray="50.2 251.2" strokeDashoffset="-138.2" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#808080" strokeWidth="20" strokeDasharray="37.7 251.2" strokeDashoffset="-188.4" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Allocations */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-black p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-sm bg-[#4A4A4A]"></div>
                          <span className="text-sm text-[#B4B4B4]">Equities</span>
                        </div>
                        <span className="text-lg font-semibold text-[#E6E6E6]">40%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-black p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-sm bg-[#5A5A5A]"></div>
                          <span className="text-sm text-[#B4B4B4]">Bonds</span>
                        </div>
                        <span className="text-lg font-semibold text-[#E6E6E6]">25%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-sm bg-[#00FF99]"></div>
                          <span className="text-sm text-[#00FF99]">Commodities</span>
                        </div>
                        <span className="text-lg font-semibold text-[#00FF99]">20%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-black p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-sm bg-[#808080]"></div>
                          <span className="text-sm text-[#B4B4B4]">Real Estate</span>
                        </div>
                        <span className="text-lg font-semibold text-[#E6E6E6]">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 1: Stock Picks */}
              <div className={`feature-screen absolute inset-0 p-8 transition-opacity duration-700 ${currentFeature === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col">
                  <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                    <h3 className="text-2xl font-semibold text-[#E6E6E6]">Stock Recommendations</h3>
                    <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-3 py-1.5">
                      <span className="text-sm font-medium text-[#00FF99]">Live Data</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-[#E6E6E6]">AAPL</span>
                        <span className="rounded-sm bg-[#00FF99]/20 px-2.5 py-1 text-sm font-semibold text-[#00FF99]">Buy</span>
                      </div>
                      <p className="mb-3 text-sm text-[#808080]">Apple Inc. • Technology</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-1 text-xs text-[#B4B4B4]">Low Risk</span>
                        <span className="text-sm font-semibold text-[#00FF99]">+12.5%</span>
                      </div>
                    </div>
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-[#E6E6E6]">MSFT</span>
                        <span className="rounded-sm bg-[#00FF99]/20 px-2.5 py-1 text-sm font-semibold text-[#00FF99]">Buy</span>
                      </div>
                      <p className="mb-3 text-sm text-[#808080]">Microsoft Corp. • Technology</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-1 text-xs text-[#B4B4B4]">Low Risk</span>
                        <span className="text-sm font-semibold text-[#00FF99]">+8.3%</span>
                      </div>
                    </div>
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-[#E6E6E6]">NVDA</span>
                        <span className="rounded-sm bg-[#00FF99]/20 px-2.5 py-1 text-sm font-semibold text-[#00FF99]">Buy</span>
                      </div>
                      <p className="mb-3 text-sm text-[#808080]">NVIDIA Corp. • Technology</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-1 text-xs text-[#B4B4B4]">Mod Risk</span>
                        <span className="text-sm font-semibold text-[#00FF99]">+24.1%</span>
                      </div>
                    </div>
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-[#E6E6E6]">GOOGL</span>
                        <span className="rounded-sm bg-[#00FF99]/20 px-2.5 py-1 text-sm font-semibold text-[#00FF99]">Buy</span>
                      </div>
                      <p className="mb-3 text-sm text-[#808080]">Alphabet Inc. • Technology</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-1 text-xs text-[#B4B4B4]">Low Risk</span>
                        <span className="text-sm font-semibold text-[#00FF99]">+15.7%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 2: Stress Testing */}
              <div className={`feature-screen absolute inset-0 p-8 transition-opacity duration-700 ${currentFeature === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col">
                  <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                    <h3 className="text-2xl font-semibold text-[#E6E6E6]">Stress Testing</h3>
                    <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-3 py-1.5">
                      <span className="text-sm font-medium text-[#00FF99]">Scenario Analysis</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-lg font-semibold text-[#E6E6E6]">Market Crash (-30%)</span>
                        <span className="text-xl font-bold text-[#D95F5F]">-$8,400</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                        <div className="h-full w-[70%] bg-[#D95F5F]"></div>
                      </div>
                      <p className="mt-2 text-sm text-[#808080]">Portfolio resilience: Moderate</p>
                    </div>
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-lg font-semibold text-[#E6E6E6]">Rising Interest Rates</span>
                        <span className="text-xl font-bold text-[#D95F5F]">-$2,100</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                        <div className="h-full w-[20%] bg-[#D95F5F]"></div>
                      </div>
                      <p className="mt-2 text-sm text-[#808080]">Portfolio resilience: Strong</p>
                    </div>
                    
                    <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-lg font-semibold text-[#00FF99]">Tech Sector Boom</span>
                        <span className="text-xl font-bold text-[#00FF99]">+$12,800</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                        <div className="h-full w-[90%] bg-[#00FF99]"></div>
                      </div>
                      <p className="mt-2 text-sm text-[#00FF99]">High upside potential</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Indicators */}
              <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                <button 
                  onClick={() => setCurrentFeature(0)}
                  className={`h-2 rounded-full transition-all duration-300 ${currentFeature === 0 ? 'w-8 bg-[#00FF99]' : 'w-2 bg-[#808080] hover:bg-[#B4B4B4]'}`}
                  aria-label="Show portfolio optimization"
                />
                <button 
                  onClick={() => setCurrentFeature(1)}
                  className={`h-2 rounded-full transition-all duration-300 ${currentFeature === 1 ? 'w-8 bg-[#00FF99]' : 'w-2 bg-[#808080] hover:bg-[#B4B4B4]'}`}
                  aria-label="Show stock picks"
                />
                <button 
                  onClick={() => setCurrentFeature(2)}
                  className={`h-2 rounded-full transition-all duration-300 ${currentFeature === 2 ? 'w-8 bg-[#00FF99]' : 'w-2 bg-[#808080] hover:bg-[#B4B4B4]'}`}
                  aria-label="Show stress testing"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Landing Page Component
  const LandingSection = () => {
    const [landingTickerData, setLandingTickerData] = useState<Array<{
      label: string;
      symbol: string;
      price: string;
      change: number;
    }>>([]);
    const [landingTickerLoading, setLandingTickerLoading] = useState(true);

    // Fetch ticker data on mount
    useEffect(() => {
      const fetchTickerData = async () => {
        try {
          const response = await fetch("/api/ticker-data");
          const data = await response.json();
          if (data.tickers) {
            setLandingTickerData(data.tickers);
          }
        } catch (error) {
          console.error("Error fetching landing ticker data:", error);
        } finally {
          setLandingTickerLoading(false);
        }
      };

      fetchTickerData();
    }, []);

    const scrollToSection = (sectionId: string) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const scrollToNextSection = () => {
      const sections = [
        'hero-section',
        'portfolio-generation-section',
        'stock-picks-section',
        'stress-testing-section',
        'save-export-section'
      ];
      
      // Find the current section
      let currentIndex = 0;
      for (let i = 0; i < sections.length; i++) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          // Check if this section is currently visible (top is within viewport)
          if (rect.top >= -100 && rect.top <= 100) {
            currentIndex = i;
            break;
          }
        }
      }
      
      // Scroll to the next section if available
      const nextIndex = currentIndex + 1;
      if (nextIndex < sections.length) {
        scrollToSection(sections[nextIndex]);
      }
    };

    return (
    <div className="h-screen overflow-y-auto">
      {/* Fixed Navigation Bar for Landing Page */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#2A2A2A]">
        <div className="relative mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand - Left Side */}
            <Link
              href="/"
              className="group flex items-center gap-2 transition-all duration-300 hover:scale-105"
            >
              <h1 className="animate-glow inline-flex items-center text-3xl font-bold tracking-[0.3em] text-[#00FF99] uppercase transition-all duration-300 group-hover:text-[#00E689]" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
                Diversonal
                <span className="ml-2 text-sm font-black tracking-[0.225em] text-white align-middle">BETA</span>
              </h1>
            </Link>
            
            {/* Right Side - Auth + Get Started */}
            <div className="flex items-center gap-3">
              {/* Auth: Profile Dropdown or Sign In */}
              {session ? (
                <ProfileDropdown onMyPortfoliosClick={() => setShowMyPortfoliosModal(true)} />
              ) : (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-4 py-2 text-sm font-medium text-[#B4B4B4] hover:text-white transition-colors"
                >
                  Sign In
                </button>
              )}
              
              {/* Get Started Button */}
              <Link
                href="/get-started"
                className="group relative inline-flex items-center gap-2 rounded-sm bg-[#00FF99] px-5 py-2.5 text-sm font-semibold text-[#0F0F0F] transition-all duration-200 hover:bg-[#00E689]"
              >
                <span>Get Started</span>
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Center links - absolutely positioned, truly centered on screen */}
          <div className="absolute left-1/2 top-0 h-16 -translate-x-1/2 hidden md:flex items-center gap-6 pointer-events-auto">
            <Link href="/develop" className="text-sm text-[#B4B4B4] hover:text-white transition-colors">
              Develop a Portfolio
            </Link>
            <span className="text-[#3A3A3A]">|</span>
            <Link href="/optimize" className="text-sm text-[#B4B4B4] hover:text-white transition-colors">
              Optimize my Portfolio
            </Link>
            <span className="text-[#3A3A3A]">|</span>
            <Link href="/markets" className="text-sm text-[#B4B4B4] hover:text-white transition-colors">
              TradingView
            </Link>
          </div>
        </div>
      </nav>

      {/* Ticker Stream - Below Navigation */}
      <div className="fixed top-16 left-0 right-0 z-40 overflow-hidden bg-black border-b border-[#2A2A2A] py-3">
        {landingTickerLoading ? (
          <div className="text-center text-xs text-[#808080]">Loading market data...</div>
        ) : (
          <div className="ticker-wrapper">
            <div className="ticker-content">
              {/* Original set */}
              {landingTickerData.map((ticker, i) => (
                <div key={i} className="ticker-item">
                  <div className="text-xs text-gray-500 uppercase">{ticker.label}</div>
                  <div className="text-lg font-bold text-[#E6E6E6]">{ticker.price}</div>
                  <div className={`text-sm ${ticker.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {ticker.change >= 0 ? '↗ +' : '↘ '}{Math.abs(ticker.change).toFixed(2)}%
                  </div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {landingTickerData.map((ticker, i) => (
                <div key={`dup-${i}`} className="ticker-item">
                  <div className="text-xs text-gray-500 uppercase">{ticker.label}</div>
                  <div className="text-lg font-bold text-[#E6E6E6]">{ticker.price}</div>
                  <div className={`text-sm ${ticker.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {ticker.change >= 0 ? '↗ +' : '↘ '}{Math.abs(ticker.change).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <section id="hero-section" className="relative flex min-h-screen flex-col items-center justify-start pt-[180px] pb-[480px]">
        {/* Hero Header */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <h2 className="mb-4 text-5xl font-semibold text-[#E6E6E6] sm:text-6xl lg:text-7xl">
            AI-Powered Portfolio Optimization
          </h2>
          
          {/* Sub Header */}
          <p className="mx-auto max-w-3xl mb-5 text-lg text-[#B4B4B4] sm:text-xl">
            Professional-grade portfolio allocation powered by advanced AI. Get personalized recommendations, stress test scenarios, and detailed stock picks.
          </p>
          
          {/* AI Logos */}
          <div className="flex items-center justify-center gap-12 mb-8">
            {/* OpenAI Logo with Text */}
            <div className="flex items-center gap-2 text-white transition-colors duration-200 hover:text-[#00FF99]">
              <svg className="h-[30px] w-[30px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
              </svg>
              <span className="text-[17.5px] font-medium">OpenAI</span>
            </div>
            
            {/* xAI Logo (text only) */}
            <div className="text-white transition-colors duration-200 hover:text-[#00FF99]">
              <span className="text-3xl font-bold tracking-tight">xAI</span>
            </div>
            
            {/* Claude Logo with Text */}
            <div className="flex items-center gap-2 text-white transition-colors duration-200 hover:text-[#00FF99]">
              <svg className="h-[30px] w-[30px]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="1.5"/>
                <path d="M12 2L13.5 8.5L12 11L10.5 8.5L12 2Z"/>
                <path d="M12 22L13.5 15.5L12 13L10.5 15.5L12 22Z"/>
                <path d="M2 12L8.5 13.5L11 12L8.5 10.5L2 12Z"/>
                <path d="M22 12L15.5 13.5L13 12L15.5 10.5L22 12Z"/>
                <path d="M5.64 5.64L10.76 10.76L9.34 12.17L6.35 9.18L5.64 5.64Z"/>
                <path d="M18.36 18.36L13.24 13.24L14.66 11.83L17.65 14.82L18.36 18.36Z"/>
                <path d="M18.36 5.64L13.24 10.76L14.66 12.17L17.65 9.18L18.36 5.64Z"/>
                <path d="M5.64 18.36L10.76 13.24L9.34 11.83L6.35 14.82L5.64 18.36Z"/>
              </svg>
              <span className="text-[17.5px] font-medium">Claude</span>
            </div>
          </div>
        </div>

        {/* 3D Computer Screen */}
        <div className="relative z-30 mt-3 flex-shrink-0 max-w-[1312px] w-[1312px] h-[300px] mx-auto">
          <ComputerScreen3D />
        </div>

        {/* Scroll Button */}
        <button 
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:translate-y-1"
          aria-label="Scroll to next section"
        >
          <svg className="h-6 w-6 text-[#808080] hover:text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </section>

      {/* Portfolio Generation Feature Section */}
      <section id="portfolio-generation-section" className="flex min-h-screen items-center bg-black pt-[180px] pb-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-[#00FF99]/10 border border-[#00FF99]/20">
                <svg className="h-6 w-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-4 text-3xl font-semibold text-[#E6E6E6] sm:text-4xl">AI Portfolio Generation</h3>
              <p className="mb-6 text-base leading-relaxed text-[#B4B4B4]">
                Get personalized asset allocation across equities, bonds, commodities, cryptocurrencies, real estate, and more—all optimized by AI based on your age, risk tolerance, time horizon, and investment goals.
              </p>
              <ul className="space-y-3 text-[#B4B4B4]">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Diversified across 6+ asset classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sector-specific weighting based on your convictions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Visual breakdowns with pie and bar charts</span>
                </li>
              </ul>
            </div>
            <div className="rounded-sm border border-[#2A2A2A] bg-black p-6">
              <div className="mb-4 rounded-sm bg-black p-4">
                <div className="mb-4 flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <h4 className="text-lg font-semibold text-[#E6E6E6]">Your Portfolio</h4>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-sm border border-[#2A2A2A] bg-black"></div>
                    <div className="h-6 w-6 rounded-sm border border-[#2A2A2A] bg-black"></div>
                  </div>
                </div>
                {/* Mock pie chart */}
                <div className="relative mx-auto h-40 w-40">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#4A4A4A" strokeWidth="20" strokeDasharray="75.4 251.2" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#5A5A5A" strokeWidth="20" strokeDasharray="62.8 251.2" strokeDashoffset="-75.4" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#6A6A6A" strokeWidth="20" strokeDasharray="37.7 251.2" strokeDashoffset="-138.2" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#00FF99" strokeWidth="20" strokeDasharray="50.2 251.2" strokeDashoffset="-175.9" />
                  </svg>
                </div>
                {/* Mock allocation list */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-black p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-sm bg-[#4A4A4A]"></div>
                      <span className="text-sm text-[#B4B4B4]">Equities</span>
                    </div>
                    <span className="text-sm font-medium text-[#E6E6E6]">40%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-black p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-sm bg-[#5A5A5A]"></div>
                      <span className="text-sm text-[#B4B4B4]">Bonds</span>
                    </div>
                    <span className="text-sm font-medium text-[#E6E6E6]">25%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-black p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-sm bg-[#00FF99]"></div>
                      <span className="text-sm text-[#B4B4B4]">Commodities</span>
                    </div>
                    <span className="text-sm font-medium text-[#00FF99]">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        <button 
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:translate-y-1"
          aria-label="Scroll to next section"
        >
          <svg className="h-6 w-6 text-[#808080] hover:text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        </div>
      </section>

      {/* Stock Picks Feature Section */}
      <section id="stock-picks-section" className="flex min-h-screen items-center bg-black pt-[100px] pb-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1 rounded-sm border border-[#2A2A2A] bg-black p-6">
              <div className="rounded-sm bg-black p-4">
                <div className="mb-4 flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <h4 className="text-base font-semibold text-[#E6E6E6]">Detailed Recommendations</h4>
                  <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-2.5 py-1 text-xs font-medium text-[#00FF99]">Live Data</div>
                </div>
                {/* Mock stock recommendations */}
                <div className="space-y-3">
                  <div className="rounded-sm border border-[#2A2A2A] bg-black p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-[#E6E6E6]">AAPL</span>
                        <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-0.5 text-xs font-medium text-[#B4B4B4]">Low Risk</span>
                      </div>
                      <span className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-2 py-0.5 text-xs font-medium text-[#00FF99]">Large</span>
                    </div>
                    <p className="text-xs text-[#808080]">Apple Inc.</p>
                    <p className="mt-2 text-sm text-[#B4B4B4]">Strong fundamentals with consistent growth...</p>
                  </div>
                  <div className="rounded-sm border border-[#2A2A2A] bg-black p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-[#E6E6E6]">MSFT</span>
                        <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-0.5 text-xs font-medium text-[#B4B4B4]">Low Risk</span>
                      </div>
                      <span className="rounded-sm border border-[#808080] bg-[#242424] px-2 py-0.5 text-xs font-medium text-[#B4B4B4]">Medium</span>
                    </div>
                    <p className="text-xs text-[#808080]">Microsoft Corporation</p>
                    <p className="mt-2 text-sm text-[#B4B4B4]">Cloud computing dominance and AI integration...</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-[#00FF99]/10 border border-[#00FF99]/20">
                <svg className="h-6 w-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-4 text-3xl font-semibold text-[#E6E6E6] sm:text-4xl">Deep Dive Stock Picks</h3>
              <p className="mb-6 text-base leading-relaxed text-[#B4B4B4]">
                Get AI-powered stock recommendations for each asset class in your portfolio. Our system analyzes real-time market data, fundamentals, and insider signals to deliver actionable investment ideas.
              </p>
              <ul className="space-y-3 text-[#B4B4B4]">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Specific ticker recommendations with position sizing</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time fundamentals and insider trading signals</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Detailed rationales for every recommendation</span>
                </li>
              </ul>
            </div>
          </div>
        <button 
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:translate-y-1"
          aria-label="Scroll to next section"
        >
          <svg className="h-6 w-6 text-[#808080] hover:text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        </div>
      </section>

      {/* Stress Testing Feature Section */}
      <section id="stress-testing-section" className="flex min-h-screen items-center bg-black pt-[180px] pb-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-[#00FF99]/10 border border-[#00FF99]/20">
                <svg className="h-6 w-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mb-4 text-3xl font-semibold text-[#E6E6E6] sm:text-4xl">Stress Testing</h3>
              <p className="mb-6 text-base leading-relaxed text-[#B4B4B4]">
                Test your portfolio under extreme market conditions. See how it would perform during crashes, rallies, sector volatility, or custom scenarios you define.
              </p>
              <ul className="space-y-3 text-[#B4B4B4]">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Pre-built scenarios: market crashes, bull runs, inflation spikes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Custom scenario builder with AI analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Visual timeline showing portfolio value over time</span>
                </li>
              </ul>
            </div>
            <div className="rounded-sm border border-[#2A2A2A] bg-black p-6">
              <div className="rounded-sm bg-black p-4">
                <div className="mb-4">
                  <h4 className="mb-2 text-base font-semibold text-[#E6E6E6]">Stress Test Results</h4>
                  <div className="rounded-sm border border-[#2A2A2A] bg-black p-2.5">
                    <p className="text-xs text-[#808080]">Scenario: S&P 500 drops 10% in 2026</p>
                  </div>
                </div>
                {/* Mock chart */}
                <div className="mb-4 h-32 rounded-sm border border-[#2A2A2A] bg-black p-3">
                  <svg viewBox="0 0 200 80" className="h-full w-full">
                    <polyline
                      points="0,40 40,35 80,30 120,45 160,55 200,50"
                      fill="none"
                      stroke="#4A4A4A"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                {/* Mock results */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-sm border border-[#D95F5F]/50 bg-[#D95F5F]/10 p-3">
                    <span className="text-sm text-[#B4B4B4]">Expected Change</span>
                    <span className="text-lg font-semibold text-[#D95F5F]">-8.3%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-2 text-center">
                      <p className="text-xs text-[#808080]">Equities</p>
                      <p className="text-sm font-medium text-[#D95F5F]">-12%</p>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-2 text-center">
                      <p className="text-xs text-[#808080]">Bonds</p>
                      <p className="text-sm font-medium text-[#00FF99]">+2%</p>
                    </div>
                  </div>
                  <div className="rounded-sm border border-[#808080] bg-[#242424] px-4 py-2 text-center text-xs font-medium text-[#B4B4B4]">
                    Moderate Risk
                  </div>
                </div>
              </div>
            </div>
          </div>
        <button 
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:translate-y-1"
          aria-label="Scroll to next section"
        >
          <svg className="h-6 w-6 text-[#808080] hover:text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        </div>
      </section>

      {/* Save & Export Feature Section */}
      <section id="save-export-section" className="flex min-h-screen items-center bg-black pt-[230px] pb-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1 rounded-sm border border-[#2A2A2A] bg-black p-6">
              <div className="rounded-sm bg-black p-4">
                <div className="mb-4 rounded-sm border border-[#2A2A2A] bg-black p-4">
                  <h4 className="mb-3 text-base font-semibold text-[#E6E6E6]">Save Portfolio</h4>
                  <div className="mb-3 rounded-sm border border-[#2A2A2A] bg-black px-3 py-2.5">
                    <p className="text-sm text-[#B4B4B4]">My Retirement Portfolio 2025</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-sm bg-[#00FF99] px-4 py-2 text-center text-sm font-semibold text-[#0F0F0F]">
                      Save
                    </div>
                    <div className="flex-1 rounded-sm border border-[#2A2A2A] bg-[#242424] px-4 py-2 text-center text-sm font-medium text-[#B4B4B4]">
                      Cancel
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="mb-2 text-xs font-medium uppercase text-[#808080]">Export Options</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-[#B4B4B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-medium text-[#B4B4B4]">PDF</p>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-[#B4B4B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs font-medium text-[#B4B4B4]">JSON</p>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-[#B4B4B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-medium text-[#B4B4B4]">Copy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-[#00FF99]/10 border border-[#00FF99]/20">
                <svg className="h-6 w-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <h3 className="mb-4 text-3xl font-semibold text-[#E6E6E6] sm:text-4xl">Save & Export</h3>
              <p className="mb-6 text-base leading-relaxed text-[#B4B4B4]">
                Never lose your work. Save unlimited portfolios locally, compare different strategies, and export your allocations in multiple formats for easy sharing and record-keeping.
              </p>
              <ul className="space-y-3 text-[#B4B4B4]">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited saved portfolios in local storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Export to PDF for professional presentations</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>JSON format for data integration and backups</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="mt-16 text-center">
            <Link
              href="/get-started"
              className="group inline-flex items-center gap-2 rounded-sm bg-[#00FF99] px-8 py-4 text-lg font-semibold text-[#0F0F0F] transition-all duration-200 hover:bg-[#00E689]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
              <svg className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-4 text-sm text-[#808080]">Free to use • No sign-up required • AI-powered</p>
          </div>
        </div>
      </section>
    </div>
  );
  };

  return (
    <main className="relative bg-black h-screen overflow-hidden">
      <LandingSection />
      
      {/* Auth Modals */}
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

      <MyPortfoliosModal
        isOpen={showMyPortfoliosModal}
        onClose={() => setShowMyPortfoliosModal(false)}
        onLoadPortfolio={() => {}}
      />
    </main>
  );
}
