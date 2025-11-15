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
    
    const formData = {
      age: (document.getElementById("age") as HTMLInputElement)?.value || "",
      risk: (document.getElementById("risk") as HTMLSelectElement)?.value || "",
      horizon: (document.getElementById("horizon") as HTMLSelectElement)?.value || "",
      capital: (document.getElementById("capital") as HTMLInputElement)?.value || "",
      goal: (document.getElementById("goal") as HTMLInputElement)?.value || "",
      sectors: selectedSectors,
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
    // Populate form fields
    if (portfolio.formData.age) {
      (document.getElementById("age") as HTMLInputElement).value = portfolio.formData.age;
    }
    if (portfolio.formData.risk) {
      (document.getElementById("risk") as HTMLSelectElement).value = portfolio.formData.risk;
    }
    if (portfolio.formData.horizon) {
      (document.getElementById("horizon") as HTMLSelectElement).value = portfolio.formData.horizon;
    }
    if (portfolio.formData.capital) {
      (document.getElementById("capital") as HTMLInputElement).value = portfolio.formData.capital;
    }
    if (portfolio.formData.goal) {
      (document.getElementById("goal") as HTMLInputElement).value = portfolio.formData.goal;
    }
    setSelectedSectors(portfolio.formData.sectors || []);
    
    // Restore detailed recommendations if they exist
    if (portfolio.detailedRecommendations) {
      setDetailedRecommendations(portfolio.detailedRecommendations);
    } else {
      setDetailedRecommendations(null);
    }
    
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
      const formData = {
        age: (document.getElementById("age") as HTMLInputElement)?.value || "",
        risk: (document.getElementById("risk") as HTMLSelectElement)?.value || "",
        horizon: (document.getElementById("horizon") as HTMLSelectElement)?.value || "",
        capital: (document.getElementById("capital") as HTMLInputElement)?.value || "",
        goal: (document.getElementById("goal") as HTMLInputElement)?.value || "",
        sectors: selectedSectors,
      };

      const response = await fetch("/api/detailed-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          portfolio: currentPortfolioData,
          formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to generate recommendations");
      }

      // Check if response is streaming
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream") || contentType?.includes("text/plain")) {
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
              
              // Set first asset class as active tab
              const firstAssetClass = Object.keys(data).find(key => key !== "marketContext");
              if (firstAssetClass) {
                setActiveTab(firstAssetClass);
              }
              
              toast.success("Detailed recommendations generated!");
            }
          } catch (parseError) {
            console.error("Error parsing streamed response:", parseError);
            throw new Error("Invalid response format");
          }
        }
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setDetailedRecommendations(data);
        
        // Set first asset class as active tab
        const firstAssetClass = Object.keys(data).find(key => key !== "marketContext");
        if (firstAssetClass) {
          setActiveTab(firstAssetClass);
        }
        
        toast.success("Detailed recommendations generated!");
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
      const capital = parseInt(
        (document.getElementById("capital") as HTMLInputElement)?.value || "10000"
      );
      const horizon = (document.getElementById("horizon") as HTMLSelectElement)?.value || "";

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
      
      // Update portfolio data with AI-generated results
      setPortfolioData(data.portfolio || defaultPortfolioData);
      setPortfolioReasoning(data.reasoning || "");
      setShowResult(true);
      
      toast.success("AI-optimized portfolio generated successfully!");
      
      // Scroll to result
      setTimeout(() => {
        document.getElementById("portfolio-result")?.scrollIntoView({ behavior: "smooth" });
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
  
  const InfoIcon = ({ tooltip }: { tooltip: string }) => (
    <div className="group relative inline-flex items-center">
      <svg
        className="h-4 w-4 text-[#00FF99] cursor-help transition-colors hover:opacity-80"
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
      <span className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
        {tooltip}
      </span>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#171A1F] px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-center text-5xl font-normal tracking-[0.3em] text-[#00FF99] uppercase sm:text-6xl md:text-7xl" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
          Diversonal
        </h1>
        <p className="mb-8 text-center text-lg text-gray-300 sm:text-xl md:mb-12">
          Describe yourself and your vision to receive your AI-optimized portfolio allocation
        </p>

        {/* Saved Portfolios Toggle */}
        {savedPortfolios.length > 0 && (
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowSavedPortfolios(!showSavedPortfolios)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#00FF99]/30 bg-[#00FF99]/10 px-4 py-2 text-sm font-medium text-[#00FF99] transition-all hover:bg-[#00FF99]/20"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved Portfolios ({savedPortfolios.length})
            </button>
          </div>
        )}

        {/* Saved Portfolios List */}
        {showSavedPortfolios && savedPortfolios.length > 0 && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Saved Portfolios</h2>
              <button
                onClick={() => setShowSavedPortfolios(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {savedPortfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-[#00FF99] hover:shadow-md"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{portfolio.name}</h3>
                    <p className="text-sm text-gray-500">Saved on {portfolio.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadPortfolio(portfolio)}
                      className="rounded-lg bg-[#00FF99] px-3 py-1.5 text-sm font-medium text-[#171A1F] transition-all hover:bg-[#00E689]"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-all hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto border-t border-gray-700 bg-[#1C1F26] p-8 sm:p-10 md:p-12">
        <form
          className="space-y-6 sm:space-y-7"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="age" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Your age
              <InfoIcon tooltip="Your current age helps determine appropriate investment strategies" />
            </label>
            <input
              id="age"
              type="number"
              placeholder="e.g., 32"
              required
              className="w-full rounded-lg border border-gray-600 bg-[#171A1F] px-5 py-4 text-base text-gray-100 placeholder-gray-500 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
            />
          </div>

          <div>
            <label htmlFor="risk" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Risk tolerance
              <InfoIcon tooltip="How comfortable you are with potential investment losses. Low = conservative, High = aggressive" />
            </label>
            <select
              id="risk"
              required
              className="w-full appearance-none rounded-lg border border-gray-600 bg-[#171A1F] bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2300FF99%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat px-5 py-4 text-base text-gray-100 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
            >
              <option value="">Select risk tolerance…</option>
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label htmlFor="horizon" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Time horizon
              <InfoIcon tooltip="How long you plan to invest before needing the money. Longer horizons allow for more aggressive strategies" />
            </label>
            <select
              id="horizon"
              required
              className="w-full appearance-none rounded-lg border border-gray-600 bg-[#171A1F] bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2300FF99%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat px-5 py-4 text-base text-gray-100 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
            >
              <option value="">Select time horizon…</option>
              <option>&lt;1 year</option>
              <option>1-3 years</option>
              <option>3-7 years</option>
              <option>7+ years</option>
              <option>15+ years</option>
            </select>
          </div>

          <div>
            <label htmlFor="capital" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Available capital ($)
              <InfoIcon tooltip="The total amount of money you have available to invest" />
            </label>
            <input
              id="capital"
              type="number"
              placeholder="e.g., 25000"
              required
              className="w-full rounded-lg border border-gray-600 bg-[#171A1F] px-5 py-4 text-base text-gray-100 placeholder-gray-500 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
            />
          </div>

          <div>
            <label htmlFor="goal" className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Investment goal
              <span className="text-xs font-normal text-gray-400">(Be specific for better results)</span>
              <InfoIcon tooltip="What you're investing for: retirement, buying a home, education, wealth growth, etc." />
            </label>
            <input
              id="goal"
              type="text"
              placeholder="e.g., Save $50k for down payment by 2027, Build $2M retirement fund, Generate $5k monthly income"
              required
              className="w-full rounded-lg border border-gray-600 bg-[#171A1F] px-5 py-4 text-base text-gray-100 placeholder-gray-500 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
            />
            <p className="mt-2 flex items-start gap-2 text-sm text-gray-400">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Pro tip:</strong> Specific goals with amounts and timelines help our AI optimize better. 
                &quot;Save $50k for down payment by 2027&quot; beats &quot;buy a home&quot;
              </span>
            </p>
          </div>

          <div>
            <label className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-200 sm:text-lg">
              Sector convictions
              <InfoIcon tooltip="Industries or sectors you believe in or want to focus on. Select any combination." />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-gray-600 bg-[#171A1F] p-5 focus-within:border-[#00FF99] focus-within:ring-2 focus-within:ring-[#00FF99]/40">
              {sectors.map((sector) => (
                <label
                  key={sector}
                  className="flex cursor-pointer items-center gap-3 text-base text-gray-200 transition-colors hover:text-[#00FF99]"
                >
                  <input
                    type="checkbox"
                    name="sectors"
                    value={sector}
                    checked={selectedSectors.includes(sector)}
                    onChange={() => handleSectorChange(sector)}
                    className="h-5 w-5 cursor-pointer rounded border-2 border-gray-600 bg-[#171A1F] transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40 focus:ring-offset-0 checked:border-[#00FF99] checked:bg-[#00FF99]"
                    style={{ accentColor: '#00FF99' }}
                  />
                  <span className="font-medium">{sector}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-xl bg-[#00FF99] px-6 py-4 text-lg font-bold text-[#171A1F] shadow-lg shadow-[#00FF99]/30 transition-all hover:scale-[1.02] hover:bg-[#00E689] hover:shadow-xl hover:shadow-[#00FF99]/40 focus:outline-none focus:ring-4 focus:ring-[#00FF99]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-[#171A1F]/20">
                  <div className="h-full bg-[#171A1F]/60 animate-[progressBar_2s_ease-in-out_infinite]" style={{
                    animation: 'progressBar 2s ease-in-out infinite',
                  }}></div>
                </div>
              )}
              <span className="inline-flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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

      {showResult && (
        <section id="portfolio-result" ref={portfolioRef} className="mx-auto max-w-5xl mt-8 border-t border-gray-700 bg-[#1C1F26] p-8 sm:p-10 md:p-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 sm:text-3xl">Your AI-Optimized Portfolio</h2>
              {portfolioReasoning && (
                <p className="mt-2 text-sm text-gray-400 italic">{portfolioReasoning}</p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#00FF99] bg-white px-4 py-2 text-sm font-semibold text-[#00FF99] transition-all hover:bg-[#00FF99] hover:text-[#171A1F]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                JSON
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          <ul className="mb-8 space-y-2 pl-5 text-base leading-relaxed text-gray-200 sm:text-lg">
            {currentPortfolioData.map((item, index) => (
              <li key={index}>
                <strong>{item.name}:</strong> {item.value}%
                {item.breakdown && <span className="text-gray-400"> ({item.breakdown})</span>}
              </li>
            ))}
          </ul>

          {/* Asset Allocation Chart */}
          {/* Recharts provides responsive, accessible charts that work well in React/Next.js */}
          {/* The ResponsiveContainer automatically adjusts to parent size for mobile compatibility */}
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-100">Asset Allocation</h3>
            
            {/* Pie Chart - Mobile-friendly and visually appealing */}
            <div className="mb-8 h-64 sm:h-80">
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
                  >
                    {/* Customize colors here - each Cell represents a slice */}
                    {/* TODO: Adjust colors to match your brand guidelines if needed */}
                    {currentPortfolioData.map((entry, index) => (
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

            {/* Bar Chart - Alternative visualization */}
            <div className="h-64 sm:h-80">
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
                      backgroundColor: '#171A1F', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#00FF99'
                    }}
                    labelStyle={{ color: '#00FF99' }}
                    itemStyle={{ color: '#00FF99' }}
                  />
                  <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                    {/* Customize bar colors - using Diversonal green for highest value */}
                    {/* TODO: Adjust bar colors based on your brand palette */}
                    {barChartData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={currentPortfolioData[index].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deep Dive Stock Recommendations Buttons */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              onClick={handleGetDetailedRecommendations}
              disabled={detailPanelLoading}
              className="relative inline-flex items-center gap-3 overflow-hidden rounded-xl border-2 border-[#00FF99] bg-[#00FF99] px-8 py-4 text-base font-bold text-[#171A1F] shadow-lg shadow-[#00FF99]/30 transition-all hover:scale-[1.02] hover:bg-[#00E689] hover:border-[#00E689] hover:shadow-xl hover:shadow-[#00FF99]/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detailPanelLoading && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-[#171A1F]/20">
                  <div className="h-full bg-[#171A1F]/60 animate-[progressBar_2s_ease-in-out_infinite]"></div>
                </div>
              )}
              {detailPanelLoading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Markets...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Deep Dive Stock Picks with AI Reasoning
                </>
              )}
            </button>
            
            {/* View Recommendations button - shows when data exists but panel is minimized */}
            {detailedRecommendations && isPanelMinimized && !detailPanelLoading && (
              <button
                onClick={() => setIsPanelMinimized(false)}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#00FF99] bg-transparent px-6 py-3 text-sm font-semibold text-[#00FF99] transition-all hover:bg-[#00FF99] hover:text-[#171A1F]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Detailed Recommendations
              </button>
            )}
          </div>

          {/* Stress Testing Section */}
          <div className="mt-12 border-t border-gray-700 bg-[#171A1F] p-8">
            <h3 className="mb-4 text-2xl font-bold text-gray-100">Stress Testing</h3>
            <p className="mb-6 text-sm text-gray-400">
              Test how your portfolio would perform under different market scenarios. Enter a custom scenario or choose from common stress tests.
            </p>

            {/* Pre-defined Scenarios */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold text-gray-300">Quick Scenarios:</p>
              <div className="flex flex-wrap gap-2">
                {predefinedScenarios.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setStressTestScenario(scenario);
                      handleStressTest(scenario);
                    }}
                    disabled={stressTestLoading}
                    className="rounded-lg border border-gray-600 bg-[#1C1F26] px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:border-[#00FF99] hover:bg-[#00FF99]/10 hover:text-[#00FF99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scenario}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Scenario Input */}
            <div className="mb-6">
              <label htmlFor="stress-scenario" className="mb-2 block text-sm font-semibold text-gray-200">
                Custom Scenario
              </label>
              <div className="flex gap-2">
                <input
                  id="stress-scenario"
                  type="text"
                  value={stressTestScenario}
                  onChange={(e) => setStressTestScenario(e.target.value)}
                  placeholder="e.g., Oil prices spike 50%, causing energy sector volatility"
                  className="flex-1 rounded-lg border border-gray-600 bg-[#1C1F26] px-4 py-3 text-base text-gray-100 placeholder-gray-500 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !stressTestLoading) {
                      handleStressTest(stressTestScenario);
                    }
                  }}
                />
                <button
                  onClick={() => handleStressTest(stressTestScenario)}
                  disabled={stressTestLoading || !stressTestScenario.trim()}
                  className="relative overflow-hidden rounded-xl bg-[#00FF99] px-6 py-3 font-semibold text-[#171A1F] transition-all hover:bg-[#00E689] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stressTestLoading && (
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-[#171A1F]/20">
                      <div className="h-full bg-[#171A1F]/60 animate-[progressBar_2s_ease-in-out_infinite]"></div>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-2">
                    {stressTestLoading ? (
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Run Test"
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Stress Test Results */}
            {stressTestResult && (
              <div className="mt-8 border-t border-gray-700 bg-[#1C1F26] p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-100">Stress Test Results</h4>
                    <p className="mt-1 text-sm text-gray-400 italic">{stressTestResult.analysis}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${stressTestResult.percentageChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stressTestResult.percentageChange > 0 ? '+' : ''}{stressTestResult.percentageChange.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      Final Value: ${stressTestResult.finalValue.toLocaleString()}
                    </div>
                    <div className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      stressTestResult.riskLevel === 'Severe' ? 'bg-red-100 text-red-700' :
                      stressTestResult.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                      stressTestResult.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {stressTestResult.riskLevel} Risk
                    </div>
                  </div>
                </div>

                {/* Asset Impact Breakdown */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {stressTestResult.impact && Object.entries(stressTestResult.impact).map(([asset, impact]: [string, any]) => (
                    <div key={asset} className="rounded-lg border border-gray-700 bg-[#171A1F] p-3">
                      <div className="text-xs font-medium text-gray-400 capitalize">{asset}</div>
                      <div className={`text-lg font-bold ${impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {impact > 0 ? '+' : ''}{impact.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Portfolio Value Chart */}
                {stressTestResult.portfolioValue && stressTestResult.portfolioValue.length > 0 && (
                  <div className="h-64 sm:h-80">
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
                            backgroundColor: '#171A1F', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#00FF99',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                          labelStyle={{ color: '#00FF99', fontSize: '14px', fontWeight: '600' }}
                          itemStyle={{ color: '#00FF99' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#00FF99" 
                          strokeWidth={3}
                          dot={{ fill: '#00FF99', r: 4 }}
                          activeDot={{ r: 6 }}
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

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-[#1C1F26] p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-100">Save Portfolio</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter portfolio name..."
              className="mb-4 w-full rounded-lg border border-gray-600 bg-[#171A1F] px-4 py-3 text-base text-gray-100 placeholder-gray-500 outline-none transition-all focus:border-[#00FF99] focus:ring-2 focus:ring-[#00FF99]/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePortfolio();
                if (e.key === "Escape") setShowSaveDialog(false);
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSavePortfolio}
                className="flex-1 rounded-lg bg-[#00FF99] px-4 py-3 font-semibold text-[#171A1F] transition-all hover:bg-[#00E689]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName("");
                }}
                className="flex-1 rounded-lg border border-gray-600 bg-[#171A1F] px-4 py-3 font-semibold text-gray-300 transition-all hover:bg-[#171A1F]/80"
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

              {/* Tabs - show parsed classes during loading, all classes when complete */}
              {!detailPanelLoading && detailedRecommendations && (
                <div className="sticky top-[100px] z-10 border-b border-gray-700 bg-[#171A1F]">
                  <div className="flex overflow-x-auto">
                    {Object.keys(detailedRecommendations)
                      .filter(key => key !== "marketContext")
                      .map((assetClass) => (
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
                {Object.keys(detailPanelLoading ? partialRecommendations : (detailedRecommendations || {}))
                  .filter(key => key !== "marketContext")
                  .map((assetClass) => {
                    if (activeTab !== assetClass) return null;
                    
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
                          </div>
                        )}

                        {/* Recommendations List */}
                        {data.recommendations && data.recommendations.length > 0 ? (
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
                            {detailPanelLoading ? 'Regenerating...' : 'Regenerate Recommendations'}
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
