"use client";
import Navigation from "../components/layout/Navigation";

export default function OptimizePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navigation />
      
      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Coming Soon Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00FF99]/30 bg-[#00FF99]/10 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-[#00FF99] animate-pulse" />
            <span className="text-sm font-medium text-[#00FF99]">Coming Soon</span>
          </div>

          {/* Header */}
          <h1 className="text-4xl font-bold text-[#E6E6E6] mb-4">
            Portfolio Optimizer
          </h1>
          <p className="text-lg text-[#B4B4B4] mb-12 max-w-2xl mx-auto">
            Input your existing holdings and get AI-powered suggestions to derisk, leverage, or optimize for tax efficiency.
          </p>

          {/* Feature Preview */}
          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-left p-4 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-[#00FF99]/10">
                  <svg className="h-5 w-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-[#E6E6E6] font-semibold mb-2">Derisk Mode</h3>
                <p className="text-sm text-[#808080]">Reduce volatility while maintaining growth potential</p>
              </div>
              
              <div className="text-left p-4 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-[#00FF99]/10">
                  <svg className="h-5 w-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-[#E6E6E6] font-semibold mb-2">Leverage Mode</h3>
                <p className="text-sm text-[#808080]">Amplify returns for aggressive growth strategies</p>
              </div>
              
              <div className="text-left p-4 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-[#00FF99]/10">
                  <svg className="h-5 w-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-[#E6E6E6] font-semibold mb-2">Tax Optimization</h3>
                <p className="text-sm text-[#808080]">Minimize tax burden through strategic rebalancing</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

