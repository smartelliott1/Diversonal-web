"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SignInModal from "./components/auth/SignInModal";
import SignUpModal from "./components/auth/SignUpModal";
import ProfileDropdown from "./components/auth/ProfileDropdown";
import MyPortfoliosModal from "./components/auth/MyPortfoliosModal";

const PRODUCTS = [
  {
    number: "01",
    name: "Develop",
    description: "AI-generated portfolio allocation across 6 asset classes, tailored to your risk profile and goals.",
    status: "Live" as const,
    href: "/develop",
  },
  {
    number: "02",
    name: "Optimize",
    description: "De-risk, leverage, and tax-optimize an existing portfolio using brokerage-grade analysis.",
    status: "Coming Soon" as const,
    href: "/optimize",
  },
  {
    number: "03",
    name: "Trading Agent",
    description: "Real-time market analysis and technical commentary powered by Agent Opti.",
    status: "Live" as const,
    href: "/markets",
  },
];

export default function Home() {
  const { data: session } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showMyPortfoliosModal, setShowMyPortfoliosModal] = useState(false);

  const [tickerData, setTickerData] = useState<Array<{
    label: string;
    symbol: string;
    price: string;
    change: number;
  }>>([]);
  const [tickerLoading, setTickerLoading] = useState(true);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch("/api/ticker-data");
        const data = await res.json();
        if (data.tickers) setTickerData(data.tickers);
      } catch {
        // silent
      } finally {
        setTickerLoading(false);
      }
    };
    fetchTickers();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/90 backdrop-blur-sm border-b border-[#1A1A1A]">
        <div className="mx-auto max-w-7xl px-6 flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-[0.25em] text-[#00FF99] uppercase">
            Diversonal
            <span className="ml-2 text-xs font-black tracking-widest text-white align-middle">BETA</span>
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <ProfileDropdown onMyPortfoliosClick={() => setShowMyPortfoliosModal(true)} />
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="px-4 py-2 text-sm text-[#808080] hover:text-white transition-colors"
              >
                Sign In
              </button>
            )}
            <Link
              href="/get-started"
              className="px-5 py-2 rounded-sm bg-[#00FF99] text-black text-sm font-semibold hover:bg-[#00E689] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Ticker Strip */}
      <div className="fixed top-16 left-0 right-0 z-40 overflow-hidden bg-[#0F0F0F] border-b border-[#1A1A1A] py-2.5">
        {!tickerLoading && tickerData.length > 0 ? (
          <div className="ticker-wrapper">
            <div className="ticker-content">
              {[...tickerData, ...tickerData].map((t, i) => (
                <div key={i} className="ticker-item">
                  <div className="text-[10px] text-[#505050] uppercase tracking-wider">{t.label}</div>
                  <div className="text-sm font-semibold text-[#E6E6E6]">{t.price}</div>
                  <div className={`text-xs ${t.change >= 0 ? 'text-[#00FF99]' : 'text-[#FF4444]'}`}>
                    {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[38px]" />
        )}
      </div>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center pt-32">
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Green glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00FF99]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="mb-6 text-xs tracking-[0.3em] uppercase text-[#00FF99]">
            AI-Powered Investment Intelligence
          </p>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] mb-6">
            Invest with<br />Intelligence.
          </h1>
          <p className="text-lg text-[#606060] mb-10 max-w-xl mx-auto">
            Professional-grade portfolio tools powered by advanced AI. Built for the modern investor.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="px-8 py-3.5 rounded-sm bg-[#00FF99] text-black text-sm font-semibold hover:bg-[#00E689] transition-colors"
            >
              Get Started
            </Link>
            {!session && (
              <button
                onClick={() => setShowSignInModal(true)}
                className="px-8 py-3.5 rounded-sm border border-[#2A2A2A] text-sm text-[#808080] hover:text-white hover:border-[#3A3A3A] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#404040] mb-16 text-center">
            The Platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1A1A1A]">
            {PRODUCTS.map((product) => (
              <Link
                key={product.number}
                href={product.href}
                className="group relative bg-[#0F0F0F] p-8 hover:bg-[#111111] transition-colors"
              >
                {/* Hover border accent */}
                <div className="absolute inset-0 border border-transparent group-hover:border-[#00FF99]/20 transition-colors pointer-events-none" />

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00FF99]">{product.number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm font-medium tracking-wide ${
                    product.status === 'Live'
                      ? 'bg-[#00FF99]/10 text-[#00FF99]'
                      : 'bg-[#1A1A1A] text-[#505050]'
                  }`}>
                    {product.status}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#00FF99] transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-[#505050] leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-8 flex items-center gap-1.5 text-[#404040] group-hover:text-[#00FF99] transition-colors text-xs">
                  <span>{product.status === 'Live' ? 'Open' : 'Learn more'}</span>
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 text-center border-t border-[#1A1A1A]">
        <p className="text-xs tracking-[0.3em] uppercase text-[#404040] mb-6">
          Ready?
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
          Build your portfolio.
        </h2>
        <Link
          href="/get-started"
          className="inline-block px-10 py-4 rounded-sm bg-[#00FF99] text-black text-sm font-semibold hover:bg-[#00E689] transition-colors"
        >
          Get Started — it's free
        </Link>
      </section>

      {/* Modals */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSwitchToSignUp={() => { setShowSignInModal(false); setShowSignUpModal(true); }}
      />
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSwitchToSignIn={() => { setShowSignUpModal(false); setShowSignInModal(true); }}
      />
      <MyPortfoliosModal
        isOpen={showMyPortfoliosModal}
        onClose={() => setShowMyPortfoliosModal(false)}
        onLoadPortfolio={() => setShowMyPortfoliosModal(false)}
      />
    </div>
  );
}
