"use client";
import { useState, useEffect, useRef } from "react";
// Diversonal Portfolio Allocation Platform
// AI-powered portfolio optimization with stress testing
// Recharts is a composable charting library built on React components
// It's lightweight, responsive, and works seamlessly with Next.js
// Documentation: https://recharts.org/
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
// Toast notifications for user feedback
import toast, { Toaster } from "react-hot-toast";
// PDF generation libraries
// Using dynamic import to avoid SSR issues
import html2canvas from "html2canvas";

// Type definitions for saved portfolios
interface PortfolioItem {
  name: string;
  value: number;
  color: string;
  breakdown?: string;
}

interface StockRecommendation {
  ticker: string;
  name: string;
  rationale: string;
  positionSize: "Large" | "Medium" | "Small";
  riskLevel: "Low" | "Moderate" | "High";
}

interface AssetClassRecommendations {
  recommendations: StockRecommendation[];
  breakdown: Array<{ name: string; value: number; color: string }>;
}

interface DetailedRecommendations {
  [assetClass: string]: AssetClassRecommendations | string;
  marketContext: string;
}

interface SavedPortfolio {
  id: string;
  name: string;
  date: string;
  portfolioData: PortfolioItem[];
  formData: {
    age: string;
    risk: string;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  };
  detailedRecommendations?: DetailedRecommendations;
}

export default function Home() {
  // View mode state: landing -> form -> results
  const [viewMode, setViewMode] = useState<'landing' | 'form' | 'results'>('landing');
  const [activeResultTab, setActiveResultTab] = useState<'portfolio' | 'stockPicks' | 'stressTest'>('portfolio');
  
  // Store form data to use across tabs
  const [savedFormData, setSavedFormData] = useState<{
    age: string;
    risk: string;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  } | null>(null);
  
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
  const [showSavedPortfolios, setShowSavedPortfolios] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [portfolioReasoning, setPortfolioReasoning] = useState("");
  const [stressTestScenario, setStressTestScenario] = useState("");
  const [stressTestLoading, setStressTestLoading] = useState(false);
  const [stressTestResult, setStressTestResult] = useState<any>(null);
  const [detailedRecommendations, setDetailedRecommendations] = useState<DetailedRecommendations | null>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(true);
  const [detailPanelLoading, setDetailPanelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Equities");
  const [streamingText, setStreamingText] = useState<string>("");
  const [parsedAssetClasses, setParsedAssetClasses] = useState<string[]>([]);
  const [partialRecommendations, setPartialRecommendations] = useState<DetailedRecommendations>({} as DetailedRecommendations);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const streamingTextRef = useRef<HTMLDivElement>(null);
  
  // Available sectors for selection
  const sectors = ["Technology", "Energy", "Finance", "Healthcare", "Cryptocurrency", "Blockchain Integration", "Real Estate", "Precious Metals", "Aerospace", "Quantum Computing"];
  
  // Default portfolio data (shown before generation)
  const defaultPortfolioData: PortfolioItem[] = [
    { name: "Equities", value: 40, color: "#00FF99" },
    { name: "Bonds", value: 25, color: "#4A90E2" },
    { name: "Commodities", value: 10, color: "#FFB84D" },
    { name: "Real Estate", value: 12, color: "#9B59B6" },
    { name: "Cryptocurrencies", value: 8, color: "#00D4FF" },
    { name: "Cash", value: 5, color: "#FFD93D" },
  ];
  
  // Load saved portfolios from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("diversonal-portfolios");
      if (saved) {
        try {
          setSavedPortfolios(JSON.parse(saved));
        } catch (e) {
          console.error("Error loading saved portfolios:", e);
        }
      }
    }
  }, []);

  // Auto-scroll streaming text to bottom as it arrives
  useEffect(() => {
    if (streamingTextRef.current) {
      streamingTextRef.current.scrollTop = streamingTextRef.current.scrollHeight;
    }
  }, [streamingText]);
  
  const handleSectorChange = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };
  
  // Save portfolio to localStorage
  const handleSavePortfolio = () => {
    if (!saveName.trim()) {
      toast.error("Please enter a name for your portfolio");
      return;
    }
    
    // Use saved form data instead of reading from DOM
    const formData = savedFormData || {
      age: "",
      risk: "",
      horizon: "",
      capital: "",
      goal: "",
      sectors: [],
    };
    
    const dataToSave = currentPortfolioData;
    
    const newPortfolio: SavedPortfolio = {
      id: Date.now().toString(),
      name: saveName.trim(),
      date: new Date().toLocaleDateString(),
      portfolioData: dataToSave,
      formData,
      detailedRecommendations: detailedRecommendations || undefined,
    };
    
    const updated = [...savedPortfolios, newPortfolio];
    setSavedPortfolios(updated);
    localStorage.setItem("diversonal-portfolios", JSON.stringify(updated));
    setShowSaveDialog(false);
    setSaveName("");
    toast.success("Portfolio saved successfully!");
  };
  
  // Delete saved portfolio
  const handleDeletePortfolio = (id: string) => {
    const updated = savedPortfolios.filter((p) => p.id !== id);
    setSavedPortfolios(updated);
    localStorage.setItem("diversonal-portfolios", JSON.stringify(updated));
    toast.success("Portfolio deleted");
  };
  
  // Load saved portfolio
  const handleLoadPortfolio = (portfolio: SavedPortfolio) => {
    // Save form data to state
    setSavedFormData(portfolio.formData);
    setSelectedSectors(portfolio.formData.sectors || []);
    
    // Restore portfolio data
    setPortfolioData(portfolio.portfolioData);
    
    // Restore detailed recommendations if they exist
    if (portfolio.detailedRecommendations) {
      setDetailedRecommendations(portfolio.detailedRecommendations);
    } else {
      setDetailedRecommendations(null);
    }
    
    // Switch to results view
    setViewMode('results');
    setActiveResultTab('portfolio');
    setShowResult(true);
    
    setShowSavedPortfolios(false);
    toast.success(`Loaded: ${portfolio.name}`);
  };
  
  // Export to PDF
  const handleExportPDF = async () => {
    if (!portfolioRef.current) return;
    
    const loadingToast = toast.loading("Generating PDF...");
    
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import("jspdf");
      
      const canvas = await html2canvas(portfolioRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgScaledWidth, imgScaledHeight);
      pdf.save(`diversonal-portfolio-${Date.now()}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF. Please try again.");
      console.error("PDF generation error:", error);
    }
  };
  
  // Export to JSON
  const handleExportJSON = () => {
    const formData = {
      age: (document.getElementById("age") as HTMLInputElement)?.value || "",
      risk: (document.getElementById("risk") as HTMLSelectElement)?.value || "",
      horizon: (document.getElementById("horizon") as HTMLSelectElement)?.value || "",
      capital: (document.getElementById("capital") as HTMLInputElement)?.value || "",
      goal: (document.getElementById("goal") as HTMLInputElement)?.value || "",
      sectors: selectedSectors,
    };
    
    const data = {
      portfolio: currentPortfolioData,
      reasoning: portfolioReasoning,
      formData,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diversonal-portfolio-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully!");
  };
  
  // Copy to clipboard
  const handleCopyToClipboard = () => {
    const dataToUse = currentPortfolioData;
    const text = `Diversonal Portfolio Allocation\n\n${dataToUse.map(p => `${p.name}: ${p.value}%${p.breakdown ? ` (${p.breakdown})` : ""}`).join("\n")}${portfolioReasoning ? `\n\nReasoning: ${portfolioReasoning}` : ""}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Handle detailed recommendations request
  const handleGetDetailedRecommendations = async () => {
    setDetailPanelLoading(true);
    setIsPanelMinimized(false);
    setStreamingText("");
    setParsedAssetClasses([]);
    setPartialRecommendations({} as DetailedRecommendations);

    try {
      // Use saved form data instead of reading from DOM
      const formData = savedFormData || {
        age: "",
        risk: "",
        horizon: "",
        capital: "",
        goal: "",
        sectors: [],
      };

      // Filter out asset classes with 0% allocation to save API costs
      const filteredPortfolio = currentPortfolioData.filter(item => item.value > 0);

      const response = await fetch("/api/detailed-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolio: filteredPortfolio,
          formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to generate recommendations");
      }

      // Check if response is streaming or JSON (queue status)
      const contentType = response.headers.get("content-type");
      
      // Check for queue response first
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        
        // Handle queue response
        if (data.queued) {
          toast.loading(data.message || `You're in position ${data.position}. Please wait...`, {
            duration: 5000,
          });
          setDetailPanelLoading(false);
          setIsPanelMinimized(true);
          return;
        }
        
        // Handle error
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Handle regular JSON response (fallback)
        setDetailedRecommendations(data);
        setIsFirstGeneration(false);
        
        if (currentPortfolioData.length > 0) {
          setActiveTab(currentPortfolioData[0].name);
        }
        
        toast.success("Detailed recommendations generated!");
      } else if (contentType?.includes("text/event-stream") || contentType?.includes("text/plain")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;
            setStreamingText(accumulatedText);
            
            // Parse and extract completed asset class sections with data
            const detectAndExtractCompleted = (text: string) => {
              const partial: any = {};
              
              // Match complete asset class sections
              const pattern = /"(\w+)":\s*\{[\s\S]*?"recommendations":\s*\[[\s\S]*?\][\s\S]*?"breakdown":\s*\[[\s\S]*?\]\s*\}/g;
              const matches = [...text.matchAll(pattern)];
              
              matches.forEach(match => {
                const assetClass = match[1];
                if (assetClass !== 'marketContext') {
                  try {
                    // Extract and parse just this section
                    const sectionText = `{${match[0]}}`;
                    const parsed = JSON.parse(sectionText);
                    partial[assetClass] = parsed[assetClass];
                  } catch (e) {
                    // Parsing failed, section not complete yet
                  }
                }
              });
              
              return partial;
            };
            
            const partialData = detectAndExtractCompleted(accumulatedText);
            if (Object.keys(partialData).length > 0) {
              setParsedAssetClasses(Object.keys(partialData));
              setPartialRecommendations(partialData as DetailedRecommendations);
            }
          }

          // Parse final JSON
          try {
            const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              setDetailedRecommendations(data);
              setIsFirstGeneration(false);
              
              // Set first asset class from portfolio as active tab
              if (currentPortfolioData.length > 0) {
                setActiveTab(currentPortfolioData[0].name);
              }
              
              toast.success("Detailed recommendations generated!");
            }
          } catch (parseError) {
            console.error("Error parsing streamed response:", parseError);
            throw new Error("Invalid response format");
          }
        }
      }
    } catch (error: any) {
      console.error("Error generating detailed recommendations:", error);
      toast.error(error?.message || "Failed to generate detailed recommendations. Please try again.");
      setIsPanelMinimized(true);
    } finally {
      setDetailPanelLoading(false);
      setStreamingText("");
    }
  };

  // Pre-defined stress test scenarios
  const predefinedScenarios = [
    "S&P 500 drops 10% in 2026",
    "Market crash similar to 2008",
    "Rising interest rates and inflation",
    "S&P 500 rallies 20% over next year",
    "Strong economic growth drives market gains",
    "Bull market continues with 15% annual returns",
  ];

  // Handle stress test
  const handleStressTest = async (scenario: string) => {
    if (!scenario.trim()) {
      toast.error("Please enter a stress test scenario");
      return;
    }

    setStressTestLoading(true);
    setStressTestResult(null);

    try {
      // Use saved form data instead of reading from DOM
      const capital = parseInt(savedFormData?.capital || "10000");
      const horizon = savedFormData?.horizon || "";

      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario: scenario.trim(),
          portfolio: currentPortfolioData,
          initialCapital: capital,
          timeHorizon: horizon,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API error response:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate stress test`);
      }

      const data = await response.json();
      
      // Check if response has an error field
      if (data.error) {
        console.error("Error in response:", data.error);
        throw new Error(data.error);
      }
      
      setStressTestResult(data);
      toast.success("Stress test completed!");
    } catch (error: any) {
      console.error("Error generating stress test:", error);
      const errorMessage = error?.message || "Failed to generate stress test. Please try again.";
      toast.error(errorMessage);
    } finally {
      setStressTestLoading(false);
    }
  };
  
  // Handle form submission with AI-powered portfolio generation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Collect form data
      const formData = {
        age: (document.getElementById("age") as HTMLInputElement)?.value || "",
        riskTolerance: (document.getElementById("risk") as HTMLSelectElement)?.value || "",
        timeHorizon: (document.getElementById("horizon") as HTMLSelectElement)?.value || "",
        capital: (document.getElementById("capital") as HTMLInputElement)?.value || "",
        goal: (document.getElementById("goal") as HTMLInputElement)?.value || "",
        sectors: selectedSectors,
      };

      // Call the AI-powered portfolio generation API
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate portfolio");
      }

      const data = await response.json();
      
      // Save form data for use in other tabs (map API property names to our state)
      setSavedFormData({
        age: formData.age,
        risk: formData.riskTolerance,
        horizon: formData.timeHorizon,
        capital: formData.capital,
        goal: formData.goal,
        sectors: formData.sectors,
      });
      
      // Update portfolio data with AI-generated results
      setPortfolioData(data.portfolio || defaultPortfolioData);
      setPortfolioReasoning(data.reasoning || "");
      setShowResult(true);
      setViewMode('results');
      setActiveResultTab('portfolio');
      
      toast.success("AI-optimized portfolio generated successfully!");
      
      // Scroll to top of results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error generating portfolio:", error);
      toast.error("Failed to generate portfolio. Please try again.");
      // Fallback to default portfolio
      setPortfolioData(defaultPortfolioData);
      setPortfolioReasoning("");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Bar chart data format - use current portfolio data or default
  const currentPortfolioData = portfolioData.length > 0 ? portfolioData : defaultPortfolioData;
  const barChartData = currentPortfolioData.map((item) => ({
    name: item.name,
    percentage: item.value,
  }));
  
  // Landing Page Component
  const LandingSection = () => (
    <div className="snap-container">
      {/* Hero Section */}
      <section className="snap-section">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="mb-8 animate-glow text-7xl font-normal tracking-[0.3em] text-[#00FF99] uppercase sm:text-8xl md:text-9xl" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
            Diversonal
          </h1>
          <h2 className="mb-8 text-6xl font-bold text-gray-100 sm:text-7xl lg:text-8xl animate-fade-in">
            AI-Powered Portfolio Optimization
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-300 sm:text-2xl animate-fade-in">
            Professional-grade portfolio allocation powered by advanced AI. Get personalized recommendations, stress test scenarios, and detailed stock picks.
          </p>
          <div className="mt-12 animate-bounce">
            <svg className="mx-auto h-8 w-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Portfolio Generation Feature Section */}
      <section className="snap-section bg-gradient-to-b from-[#0F1216] to-[#171A1F]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-in-up">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF99]/20 to-[#00E689]/10 shadow-lg shadow-[#00FF99]/30">
                <svg className="h-8 w-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-6 text-4xl font-bold text-gray-100 sm:text-5xl">AI Portfolio Generation</h3>
              <p className="mb-6 text-lg leading-relaxed text-gray-300">
                Get personalized asset allocation across equities, bonds, commodities, cryptocurrencies, real estate, and more—all optimized by AI based on your age, risk tolerance, time horizon, and investment goals.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Diversified across 6+ asset classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sector-specific weighting based on your convictions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Visual breakdowns with pie and bar charts</span>
                </li>
              </ul>
            </div>
            <div className="glass-light rounded-2xl border border-white/10 p-6 shadow-2xl animate-fade-in">
              <div className="mb-4 rounded-lg bg-[#171A1F] p-3">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-gradient text-xl font-bold">Your Portfolio</h4>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#00FF99]/20"></div>
                    <div className="h-8 w-8 rounded-lg bg-[#00FF99]/20"></div>
                  </div>
                </div>
                {/* Mock pie chart */}
                <div className="relative mx-auto h-48 w-48">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#00FF99" strokeWidth="20" strokeDasharray="75.4 251.2" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#4A90E2" strokeWidth="20" strokeDasharray="62.8 251.2" strokeDashoffset="-75.4" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#FFB84D" strokeWidth="20" strokeDasharray="37.7 251.2" strokeDashoffset="-138.2" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#9B59B6" strokeWidth="20" strokeDasharray="50.2 251.2" strokeDashoffset="-175.9" />
                  </svg>
                </div>
                {/* Mock allocation list */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-[#1C1F26]/80 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#00FF99]"></div>
                      <span className="text-sm text-gray-300">Equities</span>
                    </div>
                    <span className="font-semibold text-[#00FF99]">40%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#1C1F26]/80 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#4A90E2]"></div>
                      <span className="text-sm text-gray-300">Bonds</span>
                    </div>
                    <span className="font-semibold text-[#00FF99]">25%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#1C1F26]/80 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#FFB84D]"></div>
                      <span className="text-sm text-gray-300">Commodities</span>
                    </div>
                    <span className="font-semibold text-[#00FF99]">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Picks Feature Section */}
      <section className="snap-section bg-gradient-to-b from-[#171A1F] to-[#1C1F26]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1 glass-light rounded-2xl border border-white/10 p-6 shadow-2xl animate-fade-in">
              <div className="rounded-lg bg-[#171A1F] p-4">
                <div className="mb-4 flex items-center justify-between border-b border-gray-700 pb-3">
                  <h4 className="text-lg font-semibold text-gray-100">Detailed Recommendations</h4>
                  <div className="rounded-full bg-[#00FF99]/20 px-3 py-1 text-xs font-semibold text-[#00FF99]">Live Data</div>
                </div>
                {/* Mock stock recommendations */}
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-700 bg-[#1C1F26] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#00FF99]">AAPL</span>
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400">Low Risk</span>
                      </div>
                      <span className="rounded-lg bg-[#00FF99]/20 px-2 py-1 text-xs font-semibold text-[#00FF99]">Large</span>
                    </div>
                    <p className="text-xs text-gray-400">Apple Inc.</p>
                    <p className="mt-2 text-sm text-gray-300">Strong fundamentals with consistent growth...</p>
                  </div>
                  <div className="rounded-lg border border-gray-700 bg-[#1C1F26] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#00FF99]">MSFT</span>
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400">Low Risk</span>
                      </div>
                      <span className="rounded-lg bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-400">Medium</span>
                    </div>
                    <p className="text-xs text-gray-400">Microsoft Corporation</p>
                    <p className="mt-2 text-sm text-gray-300">Cloud computing dominance and AI integration...</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 animate-slide-in-up">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF99]/20 to-[#00E689]/10 shadow-lg shadow-[#00FF99]/30">
                <svg className="h-8 w-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-6 text-4xl font-bold text-gray-100 sm:text-5xl">Deep Dive Stock Picks</h3>
              <p className="mb-6 text-lg leading-relaxed text-gray-300">
                Get AI-powered stock recommendations for each asset class in your portfolio. Our system analyzes real-time market data, fundamentals, and insider signals to deliver actionable investment ideas.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Specific ticker recommendations with position sizing</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time fundamentals and insider trading signals</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Detailed rationales for every recommendation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stress Testing Feature Section */}
      <section className="snap-section bg-gradient-to-b from-[#1C1F26] to-[#171A1F]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-in-up">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF99]/20 to-[#00E689]/10 shadow-lg shadow-[#00FF99]/30">
                <svg className="h-8 w-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mb-6 text-4xl font-bold text-gray-100 sm:text-5xl">Stress Testing</h3>
              <p className="mb-6 text-lg leading-relaxed text-gray-300">
                Test your portfolio under extreme market conditions. See how it would perform during crashes, rallies, sector volatility, or custom scenarios you define.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Pre-built scenarios: market crashes, bull runs, inflation spikes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Custom scenario builder with AI analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Visual timeline showing portfolio value over time</span>
                </li>
              </ul>
            </div>
            <div className="glass-light rounded-2xl border border-white/10 p-6 shadow-2xl animate-fade-in">
              <div className="rounded-lg bg-[#171A1F] p-4">
                <div className="mb-4">
                  <h4 className="mb-2 text-lg font-semibold text-gray-100">Stress Test Results</h4>
                  <div className="rounded-lg border border-gray-700 bg-[#1C1F26] p-3">
                    <p className="text-xs italic text-gray-400">Scenario: S&P 500 drops 10% in 2026</p>
                  </div>
                </div>
                {/* Mock chart */}
                <div className="mb-4 h-32 rounded-lg border border-gray-700 bg-[#1C1F26] p-3">
                  <svg viewBox="0 0 200 80" className="h-full w-full">
                    <polyline
                      points="0,40 40,35 80,30 120,45 160,55 200,50"
                      fill="none"
                      stroke="#00FF99"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                {/* Mock results */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border-2 border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10 p-3">
                    <span className="text-sm text-gray-300">Expected Change</span>
                    <span className="text-xl font-bold text-red-500">-8.3%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#1C1F26] p-2 text-center">
                      <p className="text-xs text-gray-400">Equities</p>
                      <p className="font-semibold text-red-500">-12%</p>
                    </div>
                    <div className="rounded-lg bg-[#1C1F26] p-2 text-center">
                      <p className="text-xs text-gray-400">Bonds</p>
                      <p className="font-semibold text-green-500">+2%</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-center text-xs font-bold text-white">
                    Moderate Risk
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save & Export Feature Section */}
      <section className="snap-section bg-gradient-to-b from-[#171A1F] to-[#0F1216]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1 glass-light rounded-2xl border border-white/10 p-6 shadow-2xl animate-fade-in">
              <div className="rounded-lg bg-[#171A1F] p-4">
                <div className="mb-4 rounded-lg border border-gray-700 bg-[#1C1F26] p-4">
                  <h4 className="text-gradient mb-3 text-lg font-bold">Save Portfolio</h4>
                  <div className="mb-3 rounded-lg border border-gray-600 bg-[#171A1F]/80 px-4 py-3">
                    <p className="text-sm text-gray-400">My Retirement Portfolio 2025</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg bg-gradient-to-r from-[#00FF99] to-[#00E689] px-4 py-2 text-center text-sm font-bold text-[#171A1F]">
                      Save
                    </div>
                    <div className="flex-1 rounded-lg border-2 border-gray-500 bg-gray-700/50 px-4 py-2 text-center text-sm font-bold text-gray-300">
                      Cancel
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Export Options</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border-2 border-gray-500/50 bg-gray-700/30 p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-semibold text-gray-300">PDF</p>
                    </div>
                    <div className="rounded-lg border-2 border-gray-500/50 bg-gray-700/30 p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs font-semibold text-gray-300">JSON</p>
                    </div>
                    <div className="rounded-lg border-2 border-gray-500/50 bg-gray-700/30 p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-semibold text-gray-300">Copy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 animate-slide-in-up">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FF99]/20 to-[#00E689]/10 shadow-lg shadow-[#00FF99]/30">
                <svg className="h-8 w-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <h3 className="mb-6 text-4xl font-bold text-gray-100 sm:text-5xl">Save & Export</h3>
              <p className="mb-6 text-lg leading-relaxed text-gray-300">
                Never lose your work. Save unlimited portfolios locally, compare different strategies, and export your allocations in multiple formats for easy sharing and record-keeping.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited saved portfolios in local storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Export to PDF for professional presentations</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>JSON format for data integration and backups</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="mt-16 text-center animate-fade-in">
            <button
              onClick={() => setViewMode('form')}
              className="btn-ripple group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#00FF99] via-[#00E689] to-[#00FF99] bg-[length:200%_100%] px-16 py-8 text-2xl font-bold text-[#171A1F] shadow-2xl shadow-[#00FF99]/40 transition-all duration-500 hover:scale-105 hover:bg-[position:100%_0] hover:shadow-[0_20px_60px_rgba(0,255,153,0.5)]"
            >
              <svg className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
              <svg className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <p className="mt-4 text-sm text-gray-400">Free to use • No sign-up required • AI-powered</p>
          </div>
        </div>
      </section>
    </div>
  );

  const InfoIcon = ({ tooltip }: { tooltip: string }) => (
    <div className="group relative inline-flex items-center">
      <svg
        className="h-3.5 w-3.5 cursor-help text-[#00FF99] transition-all duration-200 hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(0,255,153,0.8)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {/* Tooltip with glassmorphism and arrow */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100">
        <div className="glass relative min-w-[250px] max-w-md rounded-xl border border-[#00FF99]/30 bg-[#1C1F26]/95 px-3 py-2 shadow-2xl shadow-[#00FF99]/20 backdrop-blur-md">
          <p className="whitespace-normal text-xs leading-relaxed text-gray-100">{tooltip}</p>
          {/* Arrow pointing down */}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="border-4 border-transparent border-t-[#1C1F26]/95"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className={`relative bg-gradient-to-br from-[#0F1216] via-[#171A1F] to-[#1C1F26] ${viewMode === 'landing' ? 'h-screen overflow-hidden' : 'min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12 md:py-16'}`}>
      {/* Animated Background Gradient Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] animate-float rounded-full bg-gradient-to-br from-[#00FF99]/10 to-transparent blur-3xl"></div>
        <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] animate-float rounded-full bg-gradient-to-br from-[#00D4FF]/10 to-transparent blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] animate-float rounded-full bg-gradient-to-br from-[#9B59B6]/10 to-transparent blur-3xl" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className={`relative z-10 ${viewMode === 'landing' ? 'h-full' : 'mx-auto max-w-5xl'}`}>
        {viewMode !== 'landing' && (
          <div className="animate-fade-in">
            <h1 className="mb-4 animate-glow text-center text-7xl font-normal tracking-[0.3em] text-[#00FF99] uppercase sm:text-8xl md:text-9xl" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
              Diversonal
            </h1>
            {viewMode === 'form' && (
              <p className="mb-8 text-center text-xl text-gray-300 sm:text-2xl md:mb-12">
                Describe yourself and your vision to receive your <span className="text-gradient font-semibold">AI-optimized</span> portfolio allocation
              </p>
            )}
          </div>
        )}

        {/* Landing Page */}
        {viewMode === 'landing' && <LandingSection />}

        {/* Form View */}
        {viewMode === 'form' && (
          <div>
            {/* Saved Portfolios Toggle */}
            {savedPortfolios.length > 0 && (
              <div className="mb-6 animate-slide-in-up text-center">
                <button
                  onClick={() => setShowSavedPortfolios(!showSavedPortfolios)}
                  className="btn-ripple group inline-flex items-center gap-2 rounded-xl border border-[#00FF99]/30 bg-gradient-to-r from-[#00FF99]/10 to-[#00D4FF]/10 px-5 py-2.5 text-sm font-semibold text-[#00FF99] shadow-lg shadow-[#00FF99]/10 transition-all duration-300 hover:scale-105 hover:border-[#00FF99]/50 hover:bg-[#00FF99]/20 hover:shadow-xl hover:shadow-[#00FF99]/20"
                >
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved Portfolios ({savedPortfolios.length})
                </button>
              </div>
            )}

        <div className="glass-light animate-slide-in-up mx-auto rounded-3xl border-t border-white/10 p-8 shadow-2xl sm:p-10 md:p-12">
        <form
          className="space-y-6 sm:space-y-7"
          onSubmit={handleSubmit}
        >
          <div className="group">
            <label htmlFor="age" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 transition-colors duration-300 group-focus-within:text-[#00FF99] sm:text-lg">
              Your age
              <InfoIcon tooltip="Your current age helps determine appropriate investment strategies" />
            </label>
            <input
              id="age"
              type="number"
              placeholder="e.g., 32"
              required
              className="w-full rounded-xl border border-gray-600 bg-[#171A1F]/80 px-5 py-4 text-base text-gray-100 placeholder-gray-500 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
            />
          </div>

          <div className="group">
            <label htmlFor="risk" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 transition-colors duration-300 group-focus-within:text-[#00FF99] sm:text-lg">
              Risk tolerance
              <InfoIcon tooltip="How comfortable you are with potential investment losses. Low = conservative, High = aggressive" />
            </label>
            <select
              id="risk"
              required
              className="w-full appearance-none rounded-xl border border-gray-600 bg-[#171A1F]/80 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2300FF99%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat px-5 py-4 text-base text-gray-100 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
            >
              <option value="">Select risk tolerance…</option>
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </div>

          <div className="group">
            <label htmlFor="horizon" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 transition-colors duration-300 group-focus-within:text-[#00FF99] sm:text-lg">
              Time horizon
              <InfoIcon tooltip="How long you plan to invest before needing the money. Longer horizons allow for more aggressive strategies" />
            </label>
            <select
              id="horizon"
              required
              className="w-full appearance-none rounded-xl border border-gray-600 bg-[#171A1F]/80 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2300FF99%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat px-5 py-4 text-base text-gray-100 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
            >
              <option value="">Select time horizon…</option>
              <option>&lt;1 year</option>
              <option>1-3 years</option>
              <option>3-7 years</option>
              <option>7+ years</option>
              <option>15+ years</option>
            </select>
          </div>

          <div className="group">
            <label htmlFor="capital" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 transition-colors duration-300 group-focus-within:text-[#00FF99] sm:text-lg">
              Available capital ($)
              <InfoIcon tooltip="The total amount of money you have available to invest" />
            </label>
            <input
              id="capital"
              type="number"
              placeholder="e.g., 25000"
              required
              className="w-full rounded-xl border border-gray-600 bg-[#171A1F]/80 px-5 py-4 text-base text-gray-100 placeholder-gray-500 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
            />
          </div>

          <div className="group">
            <label htmlFor="goal" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 transition-colors duration-300 group-focus-within:text-[#00FF99] sm:text-lg">
              Investment goal
              <span className="text-xs font-normal text-gray-400">(Be specific for better results)</span>
              <InfoIcon tooltip="What you're investing for: retirement, buying a home, education, wealth growth, etc." />
            </label>
            <input
              id="goal"
              type="text"
              placeholder="e.g., Save $50k for down payment by 2027, Build $2M retirement fund, Generate $5k monthly income"
              required
              className="w-full rounded-xl border border-gray-600 bg-[#171A1F]/80 px-5 py-4 text-base text-gray-100 placeholder-gray-500 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
            />
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-[#00FF99]/20 bg-[#00FF99]/5 p-3 text-sm text-gray-300 backdrop-blur-sm">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 animate-pulse text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <strong className="text-[#00FF99]">Pro tip:</strong> Specific goals with amounts and timelines help our AI optimize better. 
                &quot;Save $50k for down payment by 2027&quot; beats &quot;buy a home&quot;
              </span>
            </p>
          </div>

          <div>
            <label className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Sector convictions
              <InfoIcon tooltip="Industries or sectors you believe in or want to focus on. Select any combination." />
            </label>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-gray-600 bg-[#171A1F]/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 focus-within:border-[#00FF99] focus-within:shadow-xl focus-within:shadow-[#00FF99]/20 focus-within:ring-2 focus-within:ring-[#00FF99]/40 sm:grid-cols-2">
              {sectors.map((sector) => (
                <label
                  key={sector}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 text-base text-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#00FF99]/10 hover:text-[#00FF99]"
                >
                  <input
                    type="checkbox"
                    name="sectors"
                    value={sector}
                    checked={selectedSectors.includes(sector)}
                    onChange={() => handleSectorChange(sector)}
                    className="h-5 w-5 cursor-pointer rounded border-2 border-gray-600 bg-[#171A1F] transition-all duration-200 focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40 focus:ring-offset-0 checked:border-[#00FF99] checked:bg-[#00FF99] checked:shadow-lg checked:shadow-[#00FF99]/30"
                    style={{ accentColor: '#00FF99' }}
                  />
                  <span className="font-medium transition-all duration-200 group-hover:translate-x-1">{sector}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-ripple group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#00FF99] via-[#00E689] to-[#00FF99] bg-[length:200%_100%] px-6 py-5 text-lg font-bold text-[#171A1F] shadow-2xl shadow-[#00FF99]/40 transition-all duration-500 hover:scale-[1.02] hover:bg-[position:100%_0] hover:shadow-[0_20px_60px_rgba(0,255,153,0.5)] focus:outline-none focus:ring-4 focus:ring-[#00FF99]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-[#171A1F]/20">
                  <div className="h-full animate-[progressBar_2s_ease-in-out_infinite] bg-[#171A1F]/60" style={{
                    animation: 'progressBar 2s ease-in-out infinite',
                  }}></div>
                </div>
              )}
              <span className="inline-flex items-center justify-center gap-2 transition-all duration-300 group-hover:gap-3">
                {isLoading ? (
                  <>
                    <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Portfolio...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Get Portfolio Recommendation
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
        </div>
          </div>
        )}

        {/* Results View with Tabs */}
        {viewMode === 'results' && (
        <>
          {/* Tab Navigation */}
          <div className="mb-8 flex items-center justify-between border-b border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveResultTab('portfolio')}
                className={`px-6 py-4 text-base font-semibold transition-all duration-300 ${
                  activeResultTab === 'portfolio'
                    ? 'border-b-2 border-[#00FF99] text-[#00FF99]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  Portfolio
                </div>
              </button>
              <button
                onClick={() => setActiveResultTab('stockPicks')}
                className={`px-6 py-4 text-base font-semibold transition-all duration-300 ${
                  activeResultTab === 'stockPicks'
                    ? 'border-b-2 border-[#00FF99] text-[#00FF99]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Stock Picks
                </div>
              </button>
              <button
                onClick={() => setActiveResultTab('stressTest')}
                className={`px-6 py-4 text-base font-semibold transition-all duration-300 ${
                  activeResultTab === 'stressTest'
                    ? 'border-b-2 border-[#00FF99] text-[#00FF99]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Stress Test
                </div>
              </button>
            </div>
            {/* Saved Portfolios Button - Floating on the right */}
            {savedPortfolios.length > 0 && (
              <button
                onClick={() => setShowSavedPortfolios(!showSavedPortfolios)}
                className="btn-ripple group inline-flex items-center gap-2 rounded-xl border border-[#00FF99]/30 bg-gradient-to-r from-[#00FF99]/10 to-[#00D4FF]/10 px-4 py-2 text-sm font-semibold text-[#00FF99] shadow-lg shadow-[#00FF99]/10 transition-all duration-300 hover:scale-105 hover:border-[#00FF99]/50 hover:bg-[#00FF99]/20"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Saved ({savedPortfolios.length})
              </button>
            )}
          </div>

          {/* Portfolio Tab */}
          {activeResultTab === 'portfolio' && (
        <section id="portfolio-result" ref={portfolioRef} className="glass-light animate-slide-in-up mx-auto max-w-5xl rounded-3xl border-t border-white/10 p-8 shadow-2xl sm:p-10 md:p-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-gradient animate-fade-in text-3xl font-bold sm:text-4xl">Your AI-Optimized Portfolio</h2>
              {portfolioReasoning && (
                <p className="mt-3 rounded-lg border border-[#00FF99]/20 bg-[#00FF99]/5 p-3 text-sm italic text-gray-300 backdrop-blur-sm">{portfolioReasoning}</p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="btn-ripple group inline-flex items-center gap-2 rounded-xl border-2 border-[#00FF99]/50 bg-gradient-to-br from-[#00FF99]/10 to-[#00D4FF]/10 px-4 py-2.5 text-sm font-semibold text-[#00FF99] shadow-lg shadow-[#00FF99]/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#00FF99] hover:bg-[#00FF99] hover:text-[#171A1F] hover:shadow-xl hover:shadow-[#00FF99]/30"
              >
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-ripple group inline-flex items-center gap-2 rounded-xl border-2 border-gray-500/50 bg-gradient-to-br from-gray-700/30 to-gray-800/30 px-4 py-2.5 text-sm font-semibold text-gray-300 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gray-400 hover:bg-gray-700 hover:text-white hover:shadow-xl"
              >
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <button
                onClick={handleExportJSON}
                className="btn-ripple group inline-flex items-center gap-2 rounded-xl border-2 border-gray-500/50 bg-gradient-to-br from-gray-700/30 to-gray-800/30 px-4 py-2.5 text-sm font-semibold text-gray-300 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gray-400 hover:bg-gray-700 hover:text-white hover:shadow-xl"
              >
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                JSON
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="btn-ripple group inline-flex items-center gap-2 rounded-xl border-2 border-gray-500/50 bg-gradient-to-br from-gray-700/30 to-gray-800/30 px-4 py-2.5 text-sm font-semibold text-gray-300 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gray-400 hover:bg-gray-700 hover:text-white hover:shadow-xl"
              >
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          <ul className="mb-8 space-y-3">
            {currentPortfolioData.map((item, index) => (
              <li 
                key={index}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-[#1C1F26]/80 to-[#171A1F]/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF99]/30 hover:shadow-xl hover:shadow-[#00FF99]/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-4 w-4 rounded-full shadow-lg transition-all duration-300 group-hover:scale-125 group-hover:shadow-xl" 
                    style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}80` }}
                  ></div>
                  <div>
                    <strong className="text-lg text-gray-100 transition-colors duration-300 group-hover:text-[#00FF99]">{item.name}</strong>
                    {item.breakdown && <span className="ml-2 text-sm text-gray-400"> ({item.breakdown})</span>}
                  </div>
                </div>
                <span className="text-xl font-bold text-[#00FF99]">{item.value}%</span>
              </li>
            ))}
          </ul>

          {/* Asset Allocation Chart */}
          {/* Recharts provides responsive, accessible charts that work well in React/Next.js */}
          {/* The ResponsiveContainer automatically adjusts to parent size for mobile compatibility */}
          <div className="mt-8">
            <h3 className="text-gradient mb-6 text-2xl font-bold">Asset Allocation</h3>
            
            {/* Pie Chart - Mobile-friendly and visually appealing */}
            <div className="glass mb-8 h-64 rounded-2xl p-6 shadow-2xl sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentPortfolioData as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {/* Customize colors here - each Cell represents a slice */}
                    {/* TODO: Adjust colors to match your brand guidelines if needed */}
                    {currentPortfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(23, 26, 31, 0.95)', 
                      border: '1px solid rgba(0, 255, 153, 0.3)', 
                      borderRadius: '12px',
                      color: '#00FF99',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 8px 32px rgba(0, 255, 153, 0.2)'
                    }}
                    labelStyle={{ color: '#00FF99', fontWeight: 'bold' }}
                    itemStyle={{ color: '#00FF99' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Alternative visualization */}
            <div className="glass h-64 rounded-2xl p-6 shadow-2xl sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(23, 26, 31, 0.95)', 
                      border: '1px solid rgba(0, 255, 153, 0.3)', 
                      borderRadius: '12px',
                      color: '#00FF99',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 8px 32px rgba(0, 255, 153, 0.2)'
                    }}
                    labelStyle={{ color: '#00FF99', fontWeight: 'bold' }}
                    itemStyle={{ color: '#00FF99' }}
                  />
                  <Bar dataKey="percentage" radius={[8, 8, 0, 0]} animationBegin={0} animationDuration={800}>
                    {/* Customize bar colors - using Diversonal green for highest value */}
                    {/* TODO: Adjust bar colors based on your brand palette */}
                    {barChartData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={currentPortfolioData[index].color} stroke={currentPortfolioData[index].color} strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
          )}

          {/* Stock Picks Tab */}
          {activeResultTab === 'stockPicks' && (
        <section className="glass-light animate-slide-in-up mx-auto max-w-5xl rounded-3xl border-t border-white/10 p-8 shadow-2xl sm:p-10 md:p-12">
          <h2 className="text-gradient mb-8 animate-fade-in text-3xl font-bold sm:text-4xl">AI Stock Picks & Analysis</h2>
          
          {/* Deep Dive Stock Recommendations Buttons */}
          <div className="mt-10 flex flex-col items-center gap-4">
            {/* Deep Dive button - only show if no recommendations exist yet */}
            {!detailedRecommendations && (
              <button
                onClick={handleGetDetailedRecommendations}
                disabled={detailPanelLoading}
                className="btn-ripple group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-[#00FF99] bg-gradient-to-r from-[#00FF99] via-[#00E689] to-[#00FF99] bg-[length:200%_100%] px-10 py-5 text-lg font-bold text-[#171A1F] shadow-2xl shadow-[#00FF99]/40 transition-all duration-500 hover:scale-105 hover:bg-[position:100%_0] hover:shadow-[0_20px_60px_rgba(0,255,153,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {detailPanelLoading && (
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-[#171A1F]/20">
                    <div className="h-full animate-[progressBar_2s_ease-in-out_infinite] bg-[#171A1F]/60"></div>
                  </div>
                )}
                {detailPanelLoading ? (
                  <>
                    <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Markets...
                  </>
                ) : (
                  <>
                    <svg className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Deep Dive Stock Picks with AI Reasoning
                  </>
                )}
              </button>
            )}
            
            {/* View Recommendations button - shows when data exists and panel is minimized */}
            {detailedRecommendations && isPanelMinimized && !detailPanelLoading && (
              <button
                onClick={() => setIsPanelMinimized(false)}
                className="btn-ripple group inline-flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-[#00FF99] bg-gradient-to-r from-[#00FF99] via-[#00E689] to-[#00FF99] bg-[length:200%_100%] px-10 py-5 text-lg font-bold text-[#171A1F] shadow-2xl shadow-[#00FF99]/40 transition-all duration-500 hover:scale-105 hover:bg-[position:100%_0] hover:shadow-[0_20px_60px_rgba(0,255,153,0.5)]"
              >
                <svg className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View My Detailed Recommendations
              </button>
            )}
          </div>
        </section>
          )}

          {/* Stress Test Tab */}
          {activeResultTab === 'stressTest' && (
        <section className="glass-light animate-slide-in-up mx-auto max-w-5xl rounded-3xl border-t border-white/10 p-8 shadow-2xl sm:p-10 md:p-12">
          {/* Stress Testing Section */}
          <div>
            <h3 className="text-gradient mb-4 text-3xl font-bold">Stress Testing</h3>
            <p className="mb-6 text-base text-gray-300">
              Test how your portfolio would perform under different market scenarios. Enter a custom scenario or choose from common stress tests.
            </p>

            {/* Pre-defined Scenarios */}
            <div className="mb-6">
              <p className="mb-4 text-base font-semibold text-gray-200">Quick Scenarios:</p>
              <div className="flex flex-wrap gap-3">
                {predefinedScenarios.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setStressTestScenario(scenario);
                      handleStressTest(scenario);
                    }}
                    disabled={stressTestLoading}
                    className="btn-ripple group rounded-xl border border-white/20 bg-gradient-to-br from-[#1C1F26]/80 to-[#171A1F]/80 px-5 py-3 text-sm font-semibold text-gray-300 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF99]/50 hover:bg-[#00FF99]/10 hover:text-[#00FF99] hover:shadow-xl hover:shadow-[#00FF99]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {scenario}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Scenario Input */}
            <div className="group mb-6">
              <label htmlFor="stress-scenario" className="mb-3 block text-base font-semibold text-gray-200 transition-colors duration-300 group-focus-within:text-[#00FF99]">
                Custom Scenario
              </label>
              <div className="flex gap-3">
                <input
                  id="stress-scenario"
                  type="text"
                  value={stressTestScenario}
                  onChange={(e) => setStressTestScenario(e.target.value)}
                  placeholder="e.g., Oil prices spike 50%, causing energy sector volatility"
                  className="flex-1 rounded-xl border border-gray-600 bg-[#171A1F]/80 px-5 py-4 text-base text-gray-100 placeholder-gray-500 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !stressTestLoading) {
                      handleStressTest(stressTestScenario);
                    }
                  }}
                />
                <button
                  onClick={() => handleStressTest(stressTestScenario)}
                  disabled={stressTestLoading || !stressTestScenario.trim()}
                  className="btn-ripple group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00FF99] to-[#00E689] px-8 py-4 font-bold text-[#171A1F] shadow-xl shadow-[#00FF99]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#00FF99]/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {stressTestLoading && (
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-[#171A1F]/20">
                      <div className="h-full animate-[progressBar_2s_ease-in-out_infinite] bg-[#171A1F]/60"></div>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-2">
                    {stressTestLoading ? (
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <span className="transition-transform duration-300 group-hover:scale-110">Run Test</span>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Stress Test Results */}
            {stressTestResult && (
              <div className="glass mt-8 animate-slide-in-up rounded-2xl border border-white/10 p-8 shadow-2xl">
                <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h4 className="text-gradient mb-3 text-2xl font-bold">Stress Test Results</h4>
                    <p className="rounded-lg border border-[#00FF99]/20 bg-[#00FF99]/5 p-4 text-sm italic leading-relaxed text-gray-300 backdrop-blur-sm">{stressTestResult.analysis}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className={`rounded-xl border-2 px-6 py-4 text-center shadow-2xl ${stressTestResult.percentageChange < 0 ? 'border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-red-500/20' : 'border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-600/10 shadow-green-500/20'}`}>
                      <div className={`text-4xl font-bold ${stressTestResult.percentageChange < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stressTestResult.percentageChange > 0 ? '+' : ''}{stressTestResult.percentageChange.toFixed(1)}%
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-300">
                        Final: ${stressTestResult.finalValue.toLocaleString()}
                      </div>
                    </div>
                    <div className={`inline-block rounded-full px-5 py-2 text-sm font-bold shadow-lg ${
                      stressTestResult.riskLevel === 'Severe' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-500/40' :
                      stressTestResult.riskLevel === 'High' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/40' :
                      stressTestResult.riskLevel === 'Moderate' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-yellow-500/40' :
                      'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/40'
                    }`}>
                      {stressTestResult.riskLevel} Risk
                    </div>
                  </div>
                </div>

                {/* Asset Impact Breakdown */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {stressTestResult.impact && Object.entries(stressTestResult.impact).map(([asset, impact]: [string, any], index: number) => (
                    <div 
                      key={asset} 
                      className="group rounded-xl border border-white/20 bg-gradient-to-br from-[#1C1F26]/80 to-[#171A1F]/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00FF99]/50 hover:shadow-xl hover:shadow-[#00FF99]/20"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="mb-2 text-sm font-semibold capitalize text-gray-300 transition-colors duration-300 group-hover:text-[#00FF99]">{asset}</div>
                      <div className={`text-2xl font-bold transition-all duration-300 ${impact < 0 ? 'text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-green-500 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}>
                        {impact > 0 ? '+' : ''}{impact.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Portfolio Value Chart */}
                {stressTestResult.portfolioValue && stressTestResult.portfolioValue.length > 0 && (
                  <div className="glass h-64 rounded-2xl p-6 shadow-2xl sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stressTestResult.months.map((month: string, index: number) => ({
                          month: index,
                          value: stressTestResult.portfolioValue[index],
                          display: index % 3 === 0, // Show quarterly labels
                        })).filter((item: any) => item.display)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          label={{ value: 'Months Passed', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 13 }}
                        />
                        <YAxis 
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(23, 26, 31, 0.95)', 
                            border: '1px solid rgba(0, 255, 153, 0.3)', 
                            borderRadius: '12px',
                            color: '#00FF99',
                            fontSize: '14px',
                            fontWeight: '500',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 8px 32px rgba(0, 255, 153, 0.2)'
                          }}
                          labelStyle={{ color: '#00FF99', fontSize: '14px', fontWeight: '600' }}
                          itemStyle={{ color: '#00FF99' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#00FF99" 
                          strokeWidth={3}
                          dot={{ fill: '#00FF99', r: 4, strokeWidth: 2, stroke: '#00FF99' }}
                          activeDot={{ r: 7, fill: '#00FF99', stroke: '#00FF99', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(0, 255, 153, 0.8))' }}
                          animationBegin={0}
                          animationDuration={800}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        )}
        </>
      )}

      {/* Saved Portfolios Modal - Outside main views */}
      {showSavedPortfolios && savedPortfolios.length > 0 && (
        <div className="glass fixed inset-0 z-50 overflow-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-4xl animate-slide-in-up">
            <div className="glass mb-8 rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-gradient text-2xl font-bold">Saved Portfolios</h2>
                <button
                  onClick={() => setShowSavedPortfolios(false)}
                  className="rounded-lg p-2 text-gray-400 transition-all duration-300 hover:rotate-90 hover:bg-white/10 hover:text-[#00FF99]"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {savedPortfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className="group rounded-xl border border-gray-700 bg-[#1C1F26] p-5 transition-all hover:border-[#00FF99]/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-100">{portfolio.name}</h3>
                        <p className="text-sm text-gray-400">{portfolio.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadPortfolio(portfolio)}
                          className="btn-ripple rounded-lg bg-[#00FF99] px-4 py-2 text-sm font-semibold text-[#171A1F] transition-all hover:scale-105"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeletePortfolio(portfolio.id)}
                          className="btn-ripple rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 transition-all hover:bg-red-500 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass w-full max-w-md animate-slide-in-up rounded-2xl border border-white/20 p-8 shadow-2xl">
            <h3 className="text-gradient mb-6 text-2xl font-bold">Save Portfolio</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter portfolio name..."
              className="mb-6 w-full rounded-xl border border-gray-600 bg-[#171A1F]/80 px-5 py-4 text-base text-gray-100 placeholder-gray-500 shadow-lg outline-none backdrop-blur-sm transition-all duration-300 focus:border-[#00FF99] focus:bg-[#171A1F] focus:shadow-xl focus:shadow-[#00FF99]/20 focus:ring-2 focus:ring-[#00FF99]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePortfolio();
                if (e.key === "Escape") setShowSaveDialog(false);
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSavePortfolio}
                className="btn-ripple flex-1 rounded-xl bg-gradient-to-r from-[#00FF99] to-[#00E689] px-5 py-4 font-bold text-[#171A1F] shadow-xl shadow-[#00FF99]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#00FF99]/40"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName("");
                }}
                className="btn-ripple flex-1 rounded-xl border-2 border-gray-500 bg-gradient-to-br from-gray-700/50 to-gray-800/50 px-5 py-4 font-bold text-gray-300 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-gray-400 hover:text-white hover:shadow-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Icon - shows when panel is minimized and data exists */}
      {detailedRecommendations && isPanelMinimized && !detailPanelLoading && (
        <button
          onClick={() => setIsPanelMinimized(false)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#00FF99] shadow-lg shadow-[#00FF99]/50 transition-all hover:scale-110 hover:shadow-xl hover:shadow-[#00FF99]/60"
          title="View Detailed Recommendations"
        >
          <svg className="h-6 w-6 text-[#171A1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      )}

      {/* Detailed Recommendations Slide-Out Panel */}
      {!isPanelMinimized && (detailedRecommendations || detailPanelLoading) && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={() => setIsPanelMinimized(true)}
          />
          
          {/* Slide-out Panel */}
          <div className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[600px] transform transition-transform duration-300 ease-in-out ${
            !isPanelMinimized ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full overflow-y-auto bg-[#171A1F] shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-[#1C1F26] p-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-100">Detailed Investment Breakdown</h3>
                  <p className="mt-1 text-sm text-gray-400">AI-powered stock and asset recommendations</p>
                </div>
                <button
                  onClick={() => setIsPanelMinimized(true)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
                  title="Minimize panel"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Streaming Text Display */}
              {detailPanelLoading && streamingText && (
                <div className="border-b border-gray-700 bg-[#1C1F26] p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-[#00FF99]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-[#00FF99]">
                      AI Generation in Progress
                    </h4>
                  </div>
                  <div ref={streamingTextRef} className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-700 bg-[#171A1F] p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-300">
                      {streamingText}
                      <span className="inline-block h-4 w-2 animate-pulse bg-[#00FF99] ml-1"></span>
                    </pre>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Streaming live from Claude AI...
                  </p>
                </div>
              )}

              {/* Market Context */}
              {detailedRecommendations && detailedRecommendations.marketContext && !detailPanelLoading && (
                <div className="border-b border-gray-700 bg-[#1C1F26] p-6">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#00FF99]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Market Context
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-300">{detailedRecommendations.marketContext}</p>
                </div>
              )}

              {/* Tabs - show all asset classes from original portfolio */}
              {!detailPanelLoading && detailedRecommendations && (
                <div className="sticky top-[100px] z-10 border-b border-gray-700 bg-[#171A1F]">
                  <div className="flex overflow-x-auto">
                    {currentPortfolioData.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => setActiveTab(item.name)}
                          className={`flex-shrink-0 px-6 py-4 text-sm font-semibold transition-colors ${
                            activeTab === item.name
                              ? 'border-b-2 border-[#00FF99] text-[#00FF99]'
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Progressive tabs during loading */}
              {detailPanelLoading && parsedAssetClasses.length > 0 && (
                <div className="sticky top-[100px] z-10 border-b border-gray-700 bg-[#171A1F]">
                  <div className="flex overflow-x-auto">
                    {parsedAssetClasses.map((assetClass) => (
                        <button
                          key={assetClass}
                          onClick={() => setActiveTab(assetClass)}
                          className={`flex-shrink-0 px-6 py-4 text-sm font-semibold transition-colors ${
                            activeTab === assetClass
                              ? 'border-b-2 border-[#00FF99] text-[#00FF99]'
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {assetClass}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab Content - show partial during loading, full when complete */}
              {((detailPanelLoading && Object.keys(partialRecommendations).length > 0) || (!detailPanelLoading && detailedRecommendations)) && (
                <div className="p-6">
                {currentPortfolioData.map((portfolioItem) => {
                    const assetClass = portfolioItem.name;
                    if (activeTab !== assetClass) return null;
                    
                    // Check if this asset class has 0% allocation
                    if (portfolioItem.value === 0) {
                      return (
                        <div key={assetClass} className="rounded-xl border border-gray-700 bg-[#1C1F26] p-12 text-center">
                          <svg className="mx-auto mb-4 h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-base leading-relaxed text-gray-400">
                            Due to your age, time horizon, and risk tolerance, you have no recommended investments in {assetClass}. If you&apos;d like to include this asset class, try regenerating with adjusted preferences or a more descriptive investment goal.
                          </p>
                        </div>
                      );
                    }
                    
                    const data = detailPanelLoading 
                      ? partialRecommendations[assetClass]
                      : (detailedRecommendations ? detailedRecommendations[assetClass] : null);
                    
                    // Type guard to check if data is AssetClassRecommendations
                    if (typeof data === 'string' || !data) return null;
                    
                    return (
                      <div key={assetClass} className="space-y-6">
                        {/* Loading indicator for partial data */}
                        {detailPanelLoading && (
                          <div className="rounded-lg border border-[#00FF99]/30 bg-[#00FF99]/10 p-3">
                            <p className="flex items-center gap-2 text-sm text-[#00FF99]">
                              <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              ✓ {assetClass} recommendations loaded. Additional analysis may still be generating...
                            </p>
                          </div>
                        )}
                        
                        {/* Pie Chart Visualization */}
                        {data.breakdown && data.breakdown.length > 0 && (
                          <div className="rounded-xl border border-gray-700 bg-[#1C1F26] p-6">
                            <h4 className="mb-4 text-lg font-semibold text-gray-100">Allocation Breakdown</h4>
                            {detailPanelLoading ? (
                              <div className="h-64 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-[#00FF99]"></div>
                                  <p className="text-sm text-gray-400">Generating allocation breakdown...</p>
                                </div>
                              </div>
                            ) : (
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={data.breakdown}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={(entry: any) => `${entry.name}: ${entry.value}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {data.breakdown.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      formatter={(value: number) => `${value}%`}
                                      contentStyle={{
                                        backgroundColor: '#171A1F',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#00FF99'
                                      }}
                                      labelStyle={{ color: '#00FF99' }}
                                      itemStyle={{ color: '#00FF99' }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recommendations List */}
                        {data.recommendations && data.recommendations.length > 0 ? (
                          detailPanelLoading ? (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-100">Recommended Positions</h4>
                              <div className="rounded-xl border border-gray-700 bg-[#1C1F26] p-12 text-center">
                                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-[#00FF99]"></div>
                                <p className="text-sm text-gray-400">Analyzing positions and generating recommendations...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-100">Recommended Positions</h4>
                              {data.recommendations.map((rec: StockRecommendation, index: number) => (
                              <div
                                key={index}
                                className="rounded-xl border border-gray-700 bg-[#1C1F26] p-5 transition-all hover:border-[#00FF99]/50"
                              >
                                {/* Ticker and Name */}
                                <div className="mb-3 flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xl font-bold text-[#00FF99]">{rec.ticker}</h5>
                                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                        rec.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                                        rec.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {rec.riskLevel} Risk
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-400">{rec.name}</p>
                                  </div>
                                  <div className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                                    rec.positionSize === 'Large' ? 'bg-[#00FF99]/20 text-[#00FF99]' :
                                    rec.positionSize === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {rec.positionSize}
                                  </div>
                                </div>

                                {/* Rationale */}
                                <p className="text-sm leading-relaxed text-gray-300">
                                  {rec.rationale}
                                </p>
                              </div>
                            ))}
                            </div>
                          )
                        ) : (
                          <div className="rounded-xl border border-gray-700 bg-[#1C1F26] p-12 text-center">
                            <svg className="mx-auto mb-4 h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-base leading-relaxed text-gray-400">
                              Based on your risk profile, time horizon, and investment goals, we don't recommend active positions in this asset class at this time.
                            </p>
                          </div>
                        )}

                        {/* Regenerate Button */}
                        <div className="mt-6 border-t border-gray-700 pt-6">
                          <button
                            onClick={handleGetDetailedRecommendations}
                            disabled={detailPanelLoading}
                            className="w-full rounded-lg border-2 border-[#00FF99] bg-transparent px-4 py-3 font-semibold text-[#00FF99] transition-all hover:bg-[#00FF99] hover:text-[#171A1F] disabled:opacity-50"
                          >
                            {detailPanelLoading 
                              ? (isFirstGeneration ? 'Generating...' : 'Regenerating...') 
                              : 'Regenerate Recommendations'
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#171A1F',
            color: '#00FF99',
            border: '1px solid #00FF99',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#00FF99',
              secondary: '#171A1F',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#171A1F',
            },
          },
        }}
      />
    </main>
  );
}
