"use client";
import Link from "next/link";
import Navigation from "../components/layout/Navigation";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navigation />
      
      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#E6E6E6] mb-4">
              What would you like to do?
            </h1>
            <p className="text-lg text-[#B4B4B4]">
              Choose your path to smarter investing
            </p>
          </div>

          {/* Main CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Develop a Portfolio */}
            <Link
              href="/develop"
              className="group relative overflow-hidden rounded-sm border border-[#2A2A2A] bg-black p-8 transition-all duration-300 hover:border-[#00FF99]/50 hover:bg-black/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FF99]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-sm bg-[#00FF99]/10 border border-[#00FF99]/20">
                  <svg className="h-7 w-7 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-semibold text-[#E6E6E6] mb-3 group-hover:text-[#00FF99] transition-colors">
                  Develop a Portfolio
                </h2>
                
                <p className="text-[#B4B4B4] mb-6 leading-relaxed">
                  Build an AI-optimized asset allocation from scratch based on your age, risk tolerance, goals, and market outlook.
                </p>
                
                <div className="flex items-center gap-2 text-[#00FF99] font-medium">
                  <span>Start Building</span>
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Optimize my Portfolio */}
            <Link
              href="/optimize"
              className="group relative overflow-hidden rounded-sm border border-[#2A2A2A] bg-black p-8 transition-all duration-300 hover:border-[#00FF99]/50 hover:bg-black/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FF99]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-sm bg-[#00FF99]/10 border border-[#00FF99]/20">
                  <svg className="h-7 w-7 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-semibold text-[#E6E6E6] mb-3 group-hover:text-[#00FF99] transition-colors">
                  Optimize my Portfolio
                </h2>
                
                <p className="text-[#B4B4B4] mb-6 leading-relaxed">
                  Input your existing holdings and get AI-powered suggestions to derisk, leverage, or optimize for tax efficiency.
                </p>
                
                <div className="flex items-center gap-2 text-[#00FF99] font-medium">
                  <span>Start Optimizing</span>
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
            <span className="text-sm text-[#808080]">or</span>
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>

          {/* Secondary CTA */}
          <div className="text-center">
            <Link
              href="/markets"
              className="group inline-flex items-center gap-3 rounded-sm border border-[#2A2A2A] bg-black px-6 py-4 transition-all duration-200 hover:border-[#3A3A3A] hover:bg-[#242424]"
            >
              <svg className="h-5 w-5 text-[#B4B4B4] group-hover:text-[#E6E6E6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <div className="text-left">
                <span className="block text-[#E6E6E6] font-medium group-hover:text-white">
                  Browse Charts & Watchlist
                </span>
                <span className="block text-xs text-[#808080]">
                  TradingView-powered market data
                </span>
              </div>
              <svg className="h-4 w-4 text-[#808080] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#B4B4B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

