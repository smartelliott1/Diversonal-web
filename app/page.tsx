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
          <div className="relative rounded-sm border-8 border-black bg-black shadow-2xl" style={{ transform: 'translateZ(10px)' }}>
            {/* Screen Glow Effect */}
            <div className="absolute -inset-1 rounded-sm bg-gradient-to-r from-[#00FF99]/20 via-[#00FF99]/10 to-[#00FF99]/20 opacity-50 blur-xl"></div>
            
            {/* Screen Content Container */}
            <div className="relative overflow-hidden rounded-sm bg-black aspect-[16/10]">
              {/* Feature 0: Portfolio Allocation - EXACT screenshot match */}
              <div className={`feature-screen absolute inset-0 p-3 transition-opacity duration-700 ${currentFeature === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col text-[8px]">
                  {/* Top: Asset Bars + Profile Sidebar */}
                  <div className="flex gap-3 mb-2">
                    {/* Asset Class Bars */}
                    <div className="flex-1 space-y-1">
                      {/* Equities */}
                      <div className="flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-2 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#00FF99]"></div>
                        <div className="w-[35%]">
                          <span className="text-[9px] font-medium text-white">Equities</span>
                          <span className="text-[7px] text-gray-500 block">(S&P: 22%, Tech: 8.5%)</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#00FF99] rounded-full" style={{width:'38%'}}></div></div>
                        <span className="text-[9px] font-bold text-[#00FF99] w-8 text-right">38.2%</span>
                      </div>
                      {/* Bonds */}
                      <div className="flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-2 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#3B82F6]"></div>
                        <div className="w-[35%]">
                          <span className="text-[9px] font-medium text-white">Bonds</span>
                          <span className="text-[7px] text-gray-500 block">(Gov: 16.5%, Corp: 12%)</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#3B82F6] rounded-full" style={{width:'28%'}}></div></div>
                        <span className="text-[9px] font-bold text-[#00FF99] w-8 text-right">28.5%</span>
                      </div>
                      {/* Commodities */}
                      <div className="flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-2 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#F59E0B]"></div>
                        <div className="w-[35%]">
                          <span className="text-[9px] font-medium text-white">Commodities</span>
                          <span className="text-[7px] text-gray-500 block">(Gold: 6.3%, Silver: 3%)</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#F59E0B] rounded-full" style={{width:'11%'}}></div></div>
                        <span className="text-[9px] font-bold text-[#00FF99] w-8 text-right">11.3%</span>
                      </div>
                      {/* Real Estate */}
                      <div className="flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-2 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#8B5CF6]"></div>
                        <div className="w-[35%]">
                          <span className="text-[9px] font-medium text-white">Real Estate</span>
                          <span className="text-[7px] text-gray-500 block">(REITs: 10.2%)</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#8B5CF6] rounded-full" style={{width:'14%'}}></div></div>
                        <span className="text-[9px] font-bold text-[#00FF99] w-8 text-right">13.7%</span>
                      </div>
                      {/* Crypto + Cash row */}
                      <div className="flex gap-1">
                        <div className="flex-1 flex items-center gap-1.5 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-2 py-1">
                          <div className="h-2 w-2 rounded-full bg-[#06B6D4]"></div>
                          <span className="text-[8px] text-white">Crypto</span>
                          <div className="flex-1 h-1 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#06B6D4] rounded-full" style={{width:'5%'}}></div></div>
                          <span className="text-[8px] font-bold text-[#00FF99]">4.8%</span>
                        </div>
                        <div className="flex-1 flex items-center gap-1.5 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-2 py-1">
                          <div className="h-2 w-2 rounded-full bg-[#EAB308]"></div>
                          <span className="text-[8px] text-white">Cash</span>
                          <div className="flex-1 h-1 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#EAB308] rounded-full" style={{width:'4%'}}></div></div>
                          <span className="text-[8px] font-bold text-[#00FF99]">3.5%</span>
                        </div>
                      </div>
                    </div>
                    {/* Profile Sidebar */}
                    <div className="w-[100px] rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-2">
                      <span className="text-[8px] font-bold text-white block mb-1">Your Profile</span>
                      <div className="space-y-0.5 text-[7px]">
                        <div className="flex justify-between"><span className="text-gray-500">Risk Tolerance</span><span className="text-white">28/100</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Time Horizon</span><span className="text-white">7+ years</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Age</span><span className="text-white">40</span></div>
                        <div className="pt-1 border-t border-[#2A2A2A]">
                          <span className="text-gray-500 block">Sectors</span>
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            <span className="px-1 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[6px] text-gray-400">Energy</span>
                            <span className="px-1 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[6px] text-gray-400">Tech</span>
                            <span className="px-1 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[6px] text-gray-400">AI</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-[#2A2A2A]">
                          <span className="text-gray-500 block">Goal</span>
                          <span className="text-[6px] text-white leading-tight">Grow cash, low risk</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Reasoning Section - Major portion */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[8px] text-gray-300 mb-1.5 leading-relaxed">Given your conservative risk tolerance and goal to grow your $250k with minimal risk over 7+ years, this allocation balances steady growth with strong downside protection.</p>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[8px] font-bold text-white">Risk Balance</span>
                        <p className="text-[7px] text-gray-400 leading-relaxed">• Equities kept moderate to align with your low risk score<br/>• Bonds and cash form solid foundation, cushioning market dips</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-white">Growth Strategy</span>
                        <p className="text-[7px] text-gray-400 leading-relaxed">• Tech, energy, and crypto sectors tap into AI, blockchain upside<br/>• Real estate provides inflation-hedged income</p>
                      </div>
                    </div>
                    {/* Question chips */}
                    <div className="flex gap-1 mt-2">
                      <span className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-gray-400">Why so much in equities?</span>
                      <span className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-gray-400">How does my age affect this?</span>
                    </div>
                    {/* Input */}
                    <div className="flex gap-1 mt-1.5">
                      <div className="flex-1 px-2 py-1 rounded-sm bg-[#111] border border-[#222] text-[7px] text-gray-500">Ask a follow-up question...</div>
                      <button className="px-2 py-1 rounded-sm bg-[#00FF99] text-[7px] text-black font-semibold">Send</button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 1: Stock Picks - EXACT screenshot match (vertical list) */}
              <div className={`feature-screen absolute inset-0 p-2 transition-opacity duration-700 ${currentFeature === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col text-[7px]">
                  {/* Header: Weights | Asset Tabs | Save */}
                  <div className="flex items-center justify-between mb-1.5">
                    <button className="px-2 py-1 rounded-sm border border-[#2A2A2A] bg-black text-[8px] text-white flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      Individual Weights
                    </button>
                    <div className="flex gap-1">
                      <button className="px-2 py-0.5 rounded-sm bg-[#00FF99] text-black text-[8px] font-semibold">Equities</button>
                      <button className="px-2 py-0.5 rounded-sm text-gray-400 text-[8px]">Bonds</button>
                      <button className="px-2 py-0.5 rounded-sm text-gray-400 text-[8px]">Commodities</button>
                      <button className="px-2 py-0.5 rounded-sm text-gray-400 text-[8px]">Real Estate</button>
                      <button className="px-2 py-0.5 rounded-sm text-gray-400 text-[8px]">Crypto</button>
                      <button className="px-2 py-0.5 rounded-sm text-gray-400 text-[8px]">Cash</button>
                    </div>
                    <button className="px-2 py-1 rounded-sm border border-[#00FF99] text-[#00FF99] text-[8px] flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      Save Portfolio
                    </button>
                  </div>
                  
                  {/* Ticker Stream */}
                  <div className="flex gap-3 px-1 py-1 mb-1.5 border-y border-[#2A2A2A] overflow-hidden">
                    <div className="flex items-center gap-1"><span className="text-gray-400">DOW</span><span className="text-white font-semibold">48061</span><span className="text-green-400">+0.37%</span></div>
                    <div className="flex items-center gap-1"><span className="text-gray-400">NVDA</span><span className="text-white font-semibold">$174.95</span><span className="text-green-400">+2.35%</span></div>
                    <div className="flex items-center gap-1"><span className="text-gray-400">AAPL</span><span className="text-white font-semibold">$271.72</span><span className="text-red-400">-0.04%</span></div>
                    <div className="flex items-center gap-1"><span className="text-gray-400">BTC</span><span className="text-white font-semibold">$85,863</span><span className="text-red-400">-0.40%</span></div>
                    <div className="flex items-center gap-1"><span className="text-gray-400">GOLD</span><span className="text-white font-semibold">$4366</span><span className="text-red-400">-0.17%</span></div>
                  </div>
                  
                  {/* Stock Cards - Vertical List */}
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    {/* XOM Card */}
                    <div className="rounded-sm border-2 border-white/20 bg-black">
                      <div className="grid grid-cols-[1fr_0.8fr_1.5fr_1.2fr] gap-2 p-2">
                        {/* Col 1: Ticker/Price/Buttons */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-[#00FF99]">XOM</span>
                            <span className="text-[9px] font-bold text-white">$116.54</span>
                            <span className="text-[7px] text-red-400">-0.74%</span>
                          </div>
                          <span className="text-[7px] text-gray-500 block mb-1">Exxon Mobil Corporation</span>
                          <div className="flex gap-1">
                            <button className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-white flex items-center gap-0.5">📈 View Chart</button>
                            <button className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-gray-400">⊙ Ask AI why</button>
                          </div>
                        </div>
                        {/* Col 2: Fear & Greed */}
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[6px] uppercase text-gray-500 mb-0.5">Fear & Greed</span>
                          <svg viewBox="0 0 100 60" className="w-10 h-6">
                            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#2A2A2A" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="63"/>
                          </svg>
                          <span className="text-[9px] font-bold text-yellow-400">50</span>
                          <span className="text-[6px] text-yellow-400">Neutral</span>
                        </div>
                        {/* Col 3: Key Metrics */}
                        <div>
                          <span className="text-[6px] uppercase text-gray-500 block mb-0.5">Key Metrics</span>
                          <div className="grid grid-cols-4 gap-x-2 text-[6px]">
                            <div><span className="text-gray-500">P/E</span><br/><span className="text-white">13.7</span></div>
                            <div><span className="text-gray-500">Rev</span><br/><span className="text-green-400">+1.4%</span></div>
                            <div><span className="text-gray-500">Margin</span><br/><span className="text-white">9.9%</span></div>
                            <div><span className="text-gray-500">Div</span><br/><span className="text-green-400">3.61%</span></div>
                            <div><span className="text-gray-500">50D</span><br/><span className="text-white">$116</span></div>
                            <div><span className="text-gray-500">200D</span><br/><span className="text-white">$111</span></div>
                            <div><span className="text-gray-500">Cap</span><br/><span className="text-white">$491B</span></div>
                          </div>
                        </div>
                        {/* Col 4: Recent News */}
                        <div>
                          <span className="text-[6px] uppercase text-gray-500 block mb-0.5">Recent News</span>
                          <p className="text-[7px] text-gray-300 leading-tight">Aaron Wealth Advisors LLC Increases Stock Holdings in Exxon Mobil $XOM ↗</p>
                          <span className="text-[6px] text-gray-500">defenseworldnet • 12/17/2025</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* AAPL Card */}
                    <div className="rounded-sm border-2 border-white/20 bg-black">
                      <div className="grid grid-cols-[1fr_0.8fr_1.5fr_1.2fr] gap-2 p-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-[#00FF99]">AAPL</span>
                            <span className="text-[9px] font-bold text-white">$272.19</span>
                            <span className="text-[7px] text-green-400">+0.13%</span>
                          </div>
                          <span className="text-[7px] text-gray-500 block mb-1">Apple Inc.</span>
                          <div className="flex gap-1">
                            <button className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-white flex items-center gap-0.5">📈 View Chart</button>
                            <button className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-gray-400">⊙ Ask AI why</button>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[6px] uppercase text-gray-500 mb-0.5">Fear & Greed</span>
                          <svg viewBox="0 0 100 60" className="w-10 h-6">
                            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#2A2A2A" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="55"/>
                          </svg>
                          <span className="text-[9px] font-bold text-yellow-400">56</span>
                          <span className="text-[6px] text-yellow-400">Neutral</span>
                        </div>
                        <div>
                          <span className="text-[6px] uppercase text-gray-500 block mb-0.5">Key Metrics</span>
                          <div className="grid grid-cols-4 gap-x-2 text-[6px]">
                            <div><span className="text-gray-500">P/E</span><br/><span className="text-white">34.1</span></div>
                            <div><span className="text-gray-500">Rev</span><br/><span className="text-green-400">+6.4%</span></div>
                            <div><span className="text-gray-500">Margin</span><br/><span className="text-white">26.9%</span></div>
                            <div><span className="text-gray-500">Div</span><br/><span className="text-green-400">0.40%</span></div>
                            <div><span className="text-gray-500">50D</span><br/><span className="text-white">$269</span></div>
                            <div><span className="text-gray-500">200D</span><br/><span className="text-white">$230</span></div>
                            <div><span className="text-gray-500">Cap</span><br/><span className="text-white">$4.0T</span></div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[6px] uppercase text-gray-500 block mb-0.5">Recent News</span>
                          <p className="text-[7px] text-gray-300 leading-tight">Apple becomes a debt collector with its new developer agreement ↗</p>
                          <span className="text-[6px] text-gray-500">techcrunch • 12/18/2025</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* MSFT Card */}
                    <div className="rounded-sm border-2 border-white/20 bg-black">
                      <div className="grid grid-cols-[1fr_0.8fr_1.5fr_1.2fr] gap-2 p-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-[#00FF99]">MSFT</span>
                            <span className="text-[9px] font-bold text-white">$483.98</span>
                            <span className="text-[7px] text-green-400">+1.65%</span>
                          </div>
                          <span className="text-[7px] text-gray-500 block mb-1">Microsoft Corporation</span>
                          <div className="flex gap-1">
                            <button className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-white flex items-center gap-0.5">📈 View Chart</button>
                            <button className="px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-gray-400">⊙ Ask AI why</button>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[6px] uppercase text-gray-500 mb-0.5">Fear & Greed</span>
                          <svg viewBox="0 0 100 60" className="w-10 h-6">
                            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#2A2A2A" strokeWidth="8" strokeLinecap="round"/>
                            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="59"/>
                          </svg>
                          <span className="text-[9px] font-bold text-yellow-400">53</span>
                          <span className="text-[6px] text-yellow-400">Neutral</span>
                        </div>
                        <div>
                          <span className="text-[6px] uppercase text-gray-500 block mb-0.5">Key Metrics</span>
                          <div className="grid grid-cols-4 gap-x-2 text-[6px]">
                            <div><span className="text-gray-500">P/E</span><br/><span className="text-white">36.3</span></div>
                            <div><span className="text-gray-500">Rev</span><br/><span className="text-green-400">+14.9%</span></div>
                            <div><span className="text-gray-500">Margin</span><br/><span className="text-white">36.1%</span></div>
                            <div><span className="text-gray-500">Div</span><br/><span className="text-green-400">0.65%</span></div>
                            <div><span className="text-gray-500">50D</span><br/><span className="text-white">$502</span></div>
                            <div><span className="text-gray-500">200D</span><br/><span className="text-white">$473</span></div>
                            <div><span className="text-gray-500">Cap</span><br/><span className="text-white">$3.6T</span></div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[6px] uppercase text-gray-500 block mb-0.5">Recent News</span>
                          <p className="text-[7px] text-gray-300 leading-tight">Nebius: The Only Hyperscaler Worth Buying Right Now ↗</p>
                          <span className="text-[6px] text-gray-500">seekingalpha • 12/18/2025</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feature 2: Stress Testing - EXACT screenshot match */}
              <div className={`feature-screen absolute inset-0 p-2 transition-opacity duration-700 ${currentFeature === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full flex flex-col text-[7px]">
                  {/* Run Another Test Button */}
                  <button className="w-full py-1 mb-1.5 rounded-sm border border-[#00FF99] text-[#00FF99] text-[8px] font-medium flex items-center justify-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Run Another Test
                  </button>
                  
                  {/* Main Content - 2 Columns */}
                  <div className="grid grid-cols-5 gap-2 mb-1.5">
                    {/* LEFT: Timeline Chart */}
                    <div className="col-span-3 rounded-sm border-2 border-white/20 bg-black p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[7px] uppercase tracking-wide text-gray-400">Timeline</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900">Moderate</span>
                      </div>
                      <div className="h-16 relative">
                        <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00FF99" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#00FF99" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="20" x2="300" y2="20" stroke="#333" strokeWidth="0.5" strokeDasharray="4"/>
                          <line x1="0" y1="40" x2="300" y2="40" stroke="#333" strokeWidth="0.5" strokeDasharray="4"/>
                          <line x1="0" y1="60" x2="300" y2="60" stroke="#333" strokeWidth="0.5" strokeDasharray="4"/>
                          <path d="M0 25 L30 28 L60 30 L90 45 L120 50 L150 42 L180 35 L210 28 L240 22 L270 18 L300 15 L300 80 L0 80 Z" fill="url(#chartGrad2)"/>
                          <path d="M0 25 L30 28 L60 30 L90 45 L120 50 L150 42 L180 35 L210 28 L240 22 L270 18 L300 15" fill="none" stroke="#00FF99" strokeWidth="2"/>
                        </svg>
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[6px] text-gray-500">
                          <span>0</span><span>3</span><span>6</span><span>9</span><span>12mo</span>
                        </div>
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[5px] text-gray-500">
                          <span>$307k</span><span>$250k</span><span>$199k</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* RIGHT: Metrics + AI Analysis */}
                    <div className="col-span-2 space-y-1.5">
                      {/* Metrics Box */}
                      <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-1.5">
                        <span className="text-[6px] uppercase tracking-wide text-gray-500">Metrics</span>
                        <div className="flex gap-2 mt-0.5">
                          <div className="rounded-sm border border-[#00FF99]/50 bg-black p-1.5 text-center">
                            <span className="text-[12px] font-bold text-[#00FF99] block">+11.5%</span>
                            <span className="text-[5px] text-[#00FF99]">CHANGE</span>
                          </div>
                          <div className="text-[6px] space-y-0.5">
                            <div className="flex justify-between gap-2"><span className="text-gray-500">Initial:</span><span className="text-white">$250.0k</span></div>
                            <div className="flex justify-between gap-2"><span className="text-gray-500">Low/High:</span><span className="text-white">$221.3k / $278.8k</span></div>
                            <div className="flex justify-between gap-2"><span className="text-gray-500">Final:</span><span className="text-white font-semibold">$278.8k</span></div>
                          </div>
                        </div>
                      </div>
                      {/* AI Analysis */}
                      <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-1.5">
                        <span className="text-[6px] uppercase tracking-wide text-gray-500">Claude Analysis</span>
                        <p className="text-[6px] text-gray-300 leading-relaxed mt-0.5">The Trump tariff scare (2018-2019) triggered a sharp market correction with equities dropping 15-20%. Markets recovered within 6-9 months as impacts proved less severe.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recovery Path Buttons */}
                  <div className="mb-1.5">
                    <span className="text-[6px] uppercase tracking-wide text-gray-500 block mb-1">Recovery Path</span>
                    <div className="grid grid-cols-4 gap-1">
                      <button className="py-1 rounded-sm border border-[#2A2A2A] bg-black text-center"><span className="text-[8px] font-bold text-white block">V</span><span className="text-[5px] text-gray-500">Fast</span></button>
                      <button className="py-1 rounded-sm border border-[#2A2A2A] bg-black text-center"><span className="text-[8px] font-bold text-white block">U</span><span className="text-[5px] text-gray-500">Gradual</span></button>
                      <button className="py-1 rounded-sm border border-[#2A2A2A] bg-black text-center"><span className="text-[8px] font-bold text-white block">L</span><span className="text-[5px] text-gray-500">Slow</span></button>
                      <button className="py-1 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] text-center"><span className="text-[8px] font-bold text-white block">W</span><span className="text-[5px] text-gray-500">Double</span></button>
                    </div>
                  </div>
                  
                  {/* Asset Class Impact Grid */}
                  <div className="grid grid-cols-6 gap-1 mb-1.5">
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-1 text-center">
                      <span className="text-[7px] text-white font-medium block">Equities</span>
                      <div className="text-[6px] space-y-0.5 mt-0.5">
                        <div className="flex justify-between"><span className="text-gray-500">High:</span><span className="text-green-400">+18.5%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Low:</span><span className="text-red-400">-16.2%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="text-green-400 font-semibold">+14.8%</span></div>
                      </div>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-1 text-center">
                      <span className="text-[7px] text-white font-medium block">Bonds</span>
                      <div className="text-[6px] space-y-0.5 mt-0.5">
                        <div className="flex justify-between"><span className="text-gray-500">High:</span><span className="text-green-400">+6.8%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Low:</span><span className="text-red-400">-2.1%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="text-green-400 font-semibold">+2.4%</span></div>
                      </div>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-1 text-center">
                      <span className="text-[7px] text-white font-medium block">Commod.</span>
                      <div className="text-[6px] space-y-0.5 mt-0.5">
                        <div className="flex justify-between"><span className="text-gray-500">High:</span><span className="text-green-400">+8.2%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Low:</span><span className="text-red-400">-11.5%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="text-green-400 font-semibold">+3.7%</span></div>
                      </div>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-1 text-center">
                      <span className="text-[7px] text-white font-medium block">Real Est.</span>
                      <div className="text-[6px] space-y-0.5 mt-0.5">
                        <div className="flex justify-between"><span className="text-gray-500">High:</span><span className="text-green-400">+12.3%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Low:</span><span className="text-red-400">-13.8%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="text-green-400 font-semibold">+9.1%</span></div>
                      </div>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-1 text-center">
                      <span className="text-[7px] text-white font-medium block">Crypto</span>
                      <div className="text-[6px] space-y-0.5 mt-0.5">
                        <div className="flex justify-between"><span className="text-gray-500">High:</span><span className="text-green-400">+45.2%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Low:</span><span className="text-red-400">-28.5%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="text-green-400 font-semibold">+38.6%</span></div>
                      </div>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-black p-1 text-center">
                      <span className="text-[7px] text-white font-medium block">Cash</span>
                      <div className="text-[6px] space-y-0.5 mt-0.5">
                        <div className="flex justify-between"><span className="text-gray-500">High:</span><span className="text-white">0.0%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Low:</span><span className="text-red-400">-2.2%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">End:</span><span className="text-red-400 font-semibold">-2.2%</span></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rebalance Portfolio */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-black p-1.5">
                    <span className="text-[6px] uppercase tracking-wide text-gray-500 block mb-1">Rebalance Portfolio</span>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-[6px] text-gray-400 w-10">Equities</span>
                        <div className="flex-1 h-1 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#00FF99] rounded-full relative" style={{width:'38%'}}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#00FF99] rounded-full border border-black"></div></div></div>
                        <span className="text-[7px] text-[#00FF99] font-bold w-8">38.2%</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-[6px] text-gray-400 w-10">Bonds</span>
                        <div className="flex-1 h-1 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#00FF99] rounded-full relative" style={{width:'28%'}}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#00FF99] rounded-full border border-black"></div></div></div>
                        <span className="text-[7px] text-[#00FF99] font-bold w-8">28.5%</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-[6px] text-gray-400 w-10">Commod.</span>
                        <div className="flex-1 h-1 bg-[#2A2A2A] rounded-full"><div className="h-full bg-[#00FF99] rounded-full relative" style={{width:'11%'}}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#00FF99] rounded-full border border-black"></div></div></div>
                        <span className="text-[7px] text-[#00FF99] font-bold w-8">11.3%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-2 py-0.5 rounded-sm border border-[#2A2A2A] text-[6px] text-gray-400">Reset</button>
                      <span className="px-2 py-0.5 rounded-sm bg-[#1A1A1A] text-[7px] text-white font-medium">Total: 100%</span>
                      <button className="px-3 py-0.5 rounded-sm bg-[#00FF99] text-[7px] text-black font-semibold">Run Test</button>
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
            <Link href="/my-portfolios" className="text-sm text-[#B4B4B4] hover:text-white transition-colors">
              My Portfolios
            </Link>
            <span className="text-[#3A3A3A]">|</span>
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
            {/* Updated Mock UI - Matches actual feature */}
            <div className="rounded-sm border border-[#2A2A2A] bg-[#0A0A0A] p-5 hover:border-[#00FF99]/30 transition-all duration-300">
              <div className="flex gap-4">
                {/* Asset Class Bars */}
                <div className="flex-1 space-y-2">
                  {/* Equities */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 hover:border-[#00FF99]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[30%]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#00FF99]" style={{ boxShadow: '0 0 8px #00FF9960' }}></div>
                        <span className="text-xs font-medium text-white">Equities</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#00FF99]" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-[#00FF99] w-10 text-right">45%</span>
                    </div>
                  </div>
                  {/* Bonds */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 hover:border-[#00FF99]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[30%]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" style={{ boxShadow: '0 0 8px #3B82F660' }}></div>
                        <span className="text-xs font-medium text-white">Bonds</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-[#00FF99] w-10 text-right">20%</span>
                    </div>
                  </div>
                  {/* Crypto */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 hover:border-[#00FF99]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[30%]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" style={{ boxShadow: '0 0 8px #F59E0B60' }}></div>
                        <span className="text-xs font-medium text-white">Crypto</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-[#00FF99] w-10 text-right">15%</span>
                    </div>
                  </div>
                  {/* Real Estate */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 hover:border-[#00FF99]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[30%]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" style={{ boxShadow: '0 0 8px #8B5CF660' }}></div>
                        <span className="text-xs font-medium text-white">Real Estate</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: '12%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-[#00FF99] w-10 text-right">12%</span>
                    </div>
                  </div>
                  {/* Cash */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 hover:border-[#00FF99]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-[30%]">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]" style={{ boxShadow: '0 0 8px #06B6D460' }}></div>
                        <span className="text-xs font-medium text-white">Cash</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#06B6D4]" style={{ width: '8%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-[#00FF99] w-10 text-right">8%</span>
                    </div>
                  </div>
                </div>
                
                {/* Profile Sidebar */}
                <div className="w-[140px] flex-shrink-0 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-3">
                  <h4 className="text-[10px] font-bold text-white mb-2">Your Profile</h4>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Risk</span>
                      <span className="text-white font-medium">65/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Horizon</span>
                      <span className="text-white font-medium">7+ years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age</span>
                      <span className="text-white font-medium">32</span>
                    </div>
                    <div className="pt-1.5 border-t border-[#2A2A2A]">
                      <span className="text-gray-500 block mb-1">Sectors</span>
                      <div className="flex flex-wrap gap-0.5">
                        <span className="px-1 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[8px] text-gray-400">Tech</span>
                        <span className="px-1 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[8px] text-gray-400">AI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Reasoning Preview */}
              <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  <span className="text-[#00FF99]">AI:</span> Your aggressive risk tolerance and long time horizon support a growth-oriented allocation with 45% equities...
                </p>
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
            {/* Updated Mock UI - Matches actual feature with Fear & Greed */}
            <div className="order-2 lg:order-1 rounded-sm border border-[#2A2A2A] bg-[#0A0A0A] p-5 hover:border-[#00FF99]/30 transition-all duration-300">
              {/* Asset Class Tabs */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-sm bg-[#00FF99]/20 text-[#00FF99] text-xs font-semibold border border-[#00FF99]/30">Equities</button>
                  <button className="px-3 py-1.5 rounded-sm bg-[#1A1A1A] text-gray-400 text-xs font-medium border border-[#2A2A2A]">Crypto</button>
                  <button className="px-3 py-1.5 rounded-sm bg-[#1A1A1A] text-gray-400 text-xs font-medium border border-[#2A2A2A]">Bonds</button>
                </div>
                <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-2 py-1 text-[10px] font-medium text-[#00FF99]">Live Data</div>
              </div>
              
              {/* Stock Cards with Fear & Greed */}
              <div className="space-y-3">
                {/* NVDA Card */}
                <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-3 hover:border-[#00FF99]/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">NVDA</span>
                        <span className="text-xs font-semibold text-[#00FF99]">$142.50</span>
                      </div>
                      <p className="text-[10px] text-gray-500">NVIDIA Corporation</p>
                    </div>
                    <div className="flex gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#00FF99]/20 text-[#00FF99] border border-[#00FF99]/30">Large</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">Mod</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Fear & Greed Gauge */}
                    <div className="flex flex-col items-center">
                      <svg viewBox="0 0 36 20" className="w-14 h-8">
                        <path d="M4 18 A14 14 0 0 1 32 18" fill="none" stroke="#2A2A2A" strokeWidth="4" strokeLinecap="round"/>
                        <path d="M4 18 A14 14 0 0 1 32 18" fill="none" stroke="#34D399" strokeWidth="4" strokeLinecap="round" strokeDasharray="44" strokeDashoffset="8"/>
                      </svg>
                      <span className="text-xs font-bold text-emerald-400">72</span>
                      <span className="text-[9px] text-emerald-400">Greed</span>
                    </div>
                    {/* Key Metrics */}
                    <div className="flex-1 grid grid-cols-4 gap-2 text-[10px]">
                      <div><span className="text-gray-500">P/E</span> <span className="text-white font-medium block">58.2</span></div>
                      <div><span className="text-gray-500">Rev</span> <span className="text-green-400 font-medium block">+122%</span></div>
                      <div><span className="text-gray-500">Margin</span> <span className="text-white font-medium block">55.8%</span></div>
                      <div><span className="text-gray-500">Cap</span> <span className="text-white font-medium block">3.5T</span></div>
                    </div>
                  </div>
                </div>
                
                {/* AAPL Card */}
                <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-3 hover:border-[#00FF99]/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">AAPL</span>
                        <span className="text-xs font-semibold text-[#00FF99]">$198.30</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Apple Inc.</p>
                    </div>
                    <div className="flex gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#00FF99]/20 text-[#00FF99] border border-[#00FF99]/30">Large</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">Low</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <svg viewBox="0 0 36 20" className="w-14 h-8">
                        <path d="M4 18 A14 14 0 0 1 32 18" fill="none" stroke="#2A2A2A" strokeWidth="4" strokeLinecap="round"/>
                        <path d="M4 18 A14 14 0 0 1 32 18" fill="none" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" strokeDasharray="44" strokeDashoffset="20"/>
                      </svg>
                      <span className="text-xs font-bold text-yellow-400">54</span>
                      <span className="text-[9px] text-yellow-400">Neutral</span>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2 text-[10px]">
                      <div><span className="text-gray-500">P/E</span> <span className="text-white font-medium block">31.4</span></div>
                      <div><span className="text-gray-500">Rev</span> <span className="text-green-400 font-medium block">+4.9%</span></div>
                      <div><span className="text-gray-500">Margin</span> <span className="text-white font-medium block">26.3%</span></div>
                      <div><span className="text-gray-500">Cap</span> <span className="text-white font-medium block">3.0T</span></div>
                    </div>
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
            {/* Updated Mock UI - Matches actual feature */}
            <div className="rounded-sm border border-[#2A2A2A] bg-[#0A0A0A] p-5 hover:border-[#00FF99]/30 transition-all duration-300">
              <div className="flex gap-4">
                {/* Scenario Presets */}
                <div className="w-[160px] flex-shrink-0 space-y-2">
                  <p className="text-[9px] uppercase tracking-wide text-gray-500 mb-1.5">Presets</p>
                  <button className="w-full text-left px-2.5 py-1.5 rounded-sm border border-[#00FF99] bg-[#00FF99]/10 text-[10px] text-[#00FF99] font-medium">
                    🔻 2008 Crisis
                  </button>
                  <button className="w-full text-left px-2.5 py-1.5 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] text-[10px] text-gray-400">
                    📈 Tech Bubble
                  </button>
                  <button className="w-full text-left px-2.5 py-1.5 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] text-[10px] text-gray-400">
                    🦠 COVID Crash
                  </button>
                  <button className="w-full text-left px-2.5 py-1.5 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] text-[10px] text-gray-400">
                    💹 Bull Rally
                  </button>
                  <input 
                    type="text" 
                    placeholder="Custom..."
                    className="w-full px-2.5 py-1.5 rounded-sm border border-[#2A2A2A] bg-black text-[10px] text-gray-400 placeholder-gray-600 mt-1"
                    readOnly
                  />
                </div>
                
                {/* Results Panel */}
                <div className="flex-1 space-y-3">
                  {/* Impact Summary */}
                  <div className="rounded-sm border border-[#D95F5F]/50 bg-[#D95F5F]/10 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">2008 Financial Crisis</span>
                      <span className="text-base font-bold text-[#D95F5F]">-38.5%</span>
                    </div>
                    <p className="text-[9px] text-gray-400">Estimated drawdown: -$38,500 on $100K</p>
                  </div>
                  
                  {/* Asset Class Impact */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-3">
                    <p className="text-[9px] uppercase tracking-wide text-gray-500 mb-2">Impact by Asset</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-14">Equities</span>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div className="h-full bg-[#D95F5F] rounded-full" style={{ width: '55%' }}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#D95F5F] w-10 text-right">-55%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-14">Crypto</span>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div className="h-full bg-[#D95F5F] rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#D95F5F] w-10 text-right">-70%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-14">Bonds</span>
                        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00FF99] rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-[#00FF99] w-10 text-right">+15%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recovery Timeline */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wide text-gray-500">Recovery</span>
                      <span className="text-[10px] font-semibold text-[#F59E0B]">~3.5 years</span>
                    </div>
                    <div className="mt-1.5 flex gap-0.5">
                      {[1,2,3,4,5,6,7,8].map((i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= 5 ? 'bg-[#D95F5F]' : i <= 7 ? 'bg-[#F59E0B]' : 'bg-[#00FF99]'}`}></div>
                      ))}
                    </div>
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
