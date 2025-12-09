"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileDropdown from "../auth/ProfileDropdown";
import SignInModal from "../auth/SignInModal";
import SignUpModal from "../auth/SignUpModal";
import MyPortfoliosModal from "../auth/MyPortfoliosModal";

interface NavigationProps {
  onMyPortfoliosClick?: () => void;
}

export default function Navigation({ onMyPortfoliosClick }: NavigationProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showMyPortfoliosModal, setShowMyPortfoliosModal] = useState(false);

  const handleMyPortfoliosClick = () => {
    if (onMyPortfoliosClick) {
      onMyPortfoliosClick();
    } else {
      setShowMyPortfoliosModal(true);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] border-b border-[#2A2A2A]">
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
                <ProfileDropdown onMyPortfoliosClick={handleMyPortfoliosClick} />
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
            <Link 
              href="/develop" 
              className={`text-sm transition-colors ${
                pathname === '/develop' 
                  ? 'text-[#00FF99] font-medium' 
                  : 'text-[#B4B4B4] hover:text-white'
              }`}
            >
              Develop a Portfolio
            </Link>
            <span className="text-[#3A3A3A]">|</span>
            <Link 
              href="/optimize" 
              className={`text-sm transition-colors ${
                pathname === '/optimize' 
                  ? 'text-[#00FF99] font-medium' 
                  : 'text-[#B4B4B4] hover:text-white'
              }`}
            >
              Optimize my Portfolio
            </Link>
            <span className="text-[#3A3A3A]">|</span>
            <Link 
              href="/markets" 
              className={`text-sm transition-colors ${
                pathname === '/markets' 
                  ? 'text-[#00FF99] font-medium' 
                  : 'text-[#B4B4B4] hover:text-white'
              }`}
            >
              TradingView
            </Link>
          </div>
        </div>
      </nav>

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
    </>
  );
}

