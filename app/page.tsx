"use client";
import { useState, useEffect, useRef } from "react";
// Diversonal Portfolio Allocation Platform
// AI-powered portfolio optimization with stress testing
// Recharts is a composable charting library built on React components
// It's lightweight, responsive, and works seamlessly with Next.js
// Documentation: https://recharts.org/
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
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
    risk: number;
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
  
  // Update browser history when view mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (viewMode !== 'landing') {
        url.searchParams.set('view', viewMode);
      } else {
        url.searchParams.delete('view');
      }
      window.history.pushState({ viewMode }, '', url.toString());
    }
  }, [viewMode]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.viewMode) {
          setViewMode(event.state.viewMode);
        } else {
          setViewMode('landing');
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);
  
  // Store form data to use across tabs
  const [savedFormData, setSavedFormData] = useState<{
    age: string;
    risk: number;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  } | null>(null);
  
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<number>(50);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
  const [showSavedPortfolios, setShowSavedPortfolios] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [portfolioReasoning, setPortfolioReasoning] = useState("");
  const [stressTestScenario, setStressTestScenario] = useState("");
  const [stressTestLoading, setStressTestLoading] = useState(false);
  const [stressTestResult, setStressTestResult] = useState<any>(null);
  
  // Interactive stress test enhancements
  const [stressTestHistory, setStressTestHistory] = useState<any[]>([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number>(0);
  const [visibleAssetClasses, setVisibleAssetClasses] = useState<string[]>([]);
  const [stressTestTimeHorizon, setStressTestTimeHorizon] = useState<number>(18);
  const [scenarioBuilderParams, setScenarioBuilderParams] = useState({
    marketMovement: 0,
    inflation: 2,
    volatility: 5,
  });
  const [tempPortfolioAllocation, setTempPortfolioAllocation] = useState<PortfolioItem[]>([]);
  const [recoveryPath, setRecoveryPath] = useState<'v' | 'u' | 'l' | 'w' | null>(null);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [detailedRecommendations, setDetailedRecommendations] = useState<DetailedRecommendations | null>(null);
  const [detailPanelLoading, setDetailPanelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Equities");
  
  // Three-stage Grok integration state
  const [marketContext, setMarketContext] = useState<{
    sp500: { price: number; change: number; changePercent: number };
    nasdaq: { price: number; change: number; changePercent: number };
    dow: { price: number; change: number; changePercent: number };
    russell2000: { price: number; change: number; changePercent: number };
    vix: { price: number; change: number; changePercent: number };
    nvda: { price: number; change: number; changePercent: number };
    tsla: { price: number; change: number; changePercent: number };
    aapl: { price: number; change: number; changePercent: number };
    googl: { price: number; change: number; changePercent: number };
    amzn: { price: number; change: number; changePercent: number };
    btc: { price: number; change: number; changePercent: number };
    eth: { price: number; change: number; changePercent: number };
    sol: { price: number; change: number; changePercent: number };
    xmr: { price: number; change: number; changePercent: number };
    gold: { price: number; change: number; changePercent: number };
    silver: { price: number; change: number; changePercent: number };
    fearGreed: { value: number; label: string };
    contextSummary: string;
  } | null>(null);
  const [marketContextLoading, setMarketContextLoading] = useState(false);
  const [xPosts, setXPosts] = useState<Record<string, Array<{
    author: string;
    content: string;
    engagement: number;
    timestamp: string;
    sentiment: "Bullish" | "Neutral" | "Bearish";
  }>>>({});
  const [xPostsLoading, setXPostsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [parsedAssetClasses, setParsedAssetClasses] = useState<string[]>([]);
  const [partialRecommendations, setPartialRecommendations] = useState<DetailedRecommendations>({} as DetailedRecommendations);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [goalLength, setGoalLength] = useState(0);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const streamingTextRef = useRef<HTMLDivElement>(null);
  
  // Available sectors for selection
  const sectors = ["Technology", "Energy", "Finance", "Healthcare", "Cryptocurrency", "Blockchain Integration", "Real Estate", "Precious Metals", "Aerospace", "Quantum Computing", "AI", "Biotech", "Robotics", "Consumer/Retail"];
  
  // Default portfolio data (shown before generation)
  const defaultPortfolioData: PortfolioItem[] = [
    { name: "Equities", value: 40, color: "#00FF99" },
    { name: "Bonds", value: 25, color: "#4A4A4A" },
    { name: "Commodities", value: 10, color: "#5A5A5A" },
    { name: "Real Estate", value: 12, color: "#6A6A6A" },
    { name: "Cryptocurrencies", value: 8, color: "#7A7A7A" },
    { name: "Cash", value: 5, color: "#8A8A8A" },
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
      risk: 50,
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
  
  // Navigation handlers
  const handleGoHome = () => {
    setViewMode('landing');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNewPortfolio = () => {
    setViewMode('form');
    setShowResult(false);
    setPortfolioData(defaultPortfolioData);
    setDetailedRecommendations(null);
    setStressTestResult(null);
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
    // Reset state
    setStreamingText("");
    setParsedAssetClasses([]);
    setPartialRecommendations({} as DetailedRecommendations);
    setMarketContext(null);
    setXPosts({});

    // Use saved form data
    const formData = savedFormData || {
      age: "",
      risk: "",
      horizon: "",
      capital: "",
      goal: "",
      sectors: [],
    };

    // Filter out asset classes with 0% allocation
    const filteredPortfolio = currentPortfolioData.filter(item => item.value > 0);

    // STAGE 1: Market Context
    setMarketContextLoading(true);
    try {
      console.log("[Stage 1] Fetching market context...");
      const contextResponse = await fetch("/api/market-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });

      if (!contextResponse.ok) {
        throw new Error("Failed to fetch market context");
      }

      const contextData = await contextResponse.json();
      setMarketContext(contextData);
      console.log("[Stage 1] Market context loaded:", contextData);
    } catch (error: any) {
      console.error("[Stage 1] Error:", error);
      toast.error("Market context unavailable, continuing with recommendations...");
      // Continue to Stage 2 even if Stage 1 fails
    } finally {
      setMarketContextLoading(false);
    }

    // STAGE 2: Stock Recommendations
    setDetailPanelLoading(true);
    try {
      console.log("[Stage 2] Fetching stock recommendations...");
      const response = await fetch("/api/stock-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio: filteredPortfolio,
          formData,
          marketContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to generate recommendations");
      }

      // Check if response is streaming or JSON (queue status)
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        
        // Handle queue response
        if (data.queued) {
          toast.loading(data.message || `You're in position ${data.position}. Please wait...`, {
            duration: 5000,
          });
          setDetailPanelLoading(false);
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
        
        toast.success("Recommendations generated!");
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
            
            // Parse and extract completed asset class sections
            const detectAndExtractCompleted = (text: string) => {
              const partial: any = {};
              const pattern = /"(\w+)":\s*\{[\s\S]*?"recommendations":\s*\[[\s\S]*?\][\s\S]*?"breakdown":\s*\[[\s\S]*?\]\s*\}/g;
              const matches = [...text.matchAll(pattern)];
              
              matches.forEach(match => {
                const assetClass = match[1];
                if (assetClass !== 'marketContext') {
                  try {
                    const sectionText = `{${match[0]}}`;
                    const parsed = JSON.parse(sectionText);
                    partial[assetClass] = parsed[assetClass];
                  } catch (e) {
                    // Parsing failed
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
              
              if (currentPortfolioData.length > 0) {
                setActiveTab(currentPortfolioData[0].name);
              }
              
              toast.success("Recommendations generated!");
              console.log("[Stage 2] Stock recommendations loaded");

              // STAGE 3: X Posts (after recommendations are ready)
              try {
                // Extract tickers from recommendations
                const tickers: string[] = [];
                Object.keys(data).forEach(assetClass => {
                  const assetData = data[assetClass];
                  if (typeof assetData !== 'string' && assetData.recommendations) {
                    assetData.recommendations.forEach((rec: any) => {
                      if (rec.ticker) {
                        tickers.push(rec.ticker);
                      }
                    });
                  }
                });

                if (tickers.length > 0) {
                  console.log(`[Stage 3] Fetching X posts for ${tickers.length} tickers...`);
                  setXPostsLoading(true);
                  
                  const postsResponse = await fetch("/api/x-posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tickers }),
                  });

                  if (postsResponse.ok) {
                    const postsData = await postsResponse.json();
                    setXPosts(postsData);
                    console.log("[Stage 3] X posts loaded for", Object.keys(postsData).length, "tickers");
                  }
                }
              } catch (postsError) {
                console.error("[Stage 3] Error fetching X posts:", postsError);
                // Silent fail - X posts are nice-to-have
              } finally {
                setXPostsLoading(false);
              }
            }
          } catch (parseError) {
            console.error("Error parsing streamed response:", parseError);
            throw new Error("Invalid response format");
          }
        }
      }
    } catch (error: any) {
      console.error("[Stage 2] Error:", error);
      toast.error(error?.message || "Failed to generate recommendations. Please try again.");
    } finally {
      setDetailPanelLoading(false);
      setStreamingText("");
    }
  };

  // Historical event templates with real data
  const historicalScenarios = [
    {
      name: "2008 Financial Crisis",
      description: "Market drops 37%, credit freeze",
      year: "2008"
    },
    {
      name: "2020 COVID-19",
      description: "S&P 500 drops 34% in 33 days",
      year: "2020"
    },
    {
      name: "2022 Inflation Surge",
      description: "8.5% inflation, bond sell-off",
      year: "2022"
    },
    {
      name: "Dot-com Bubble",
      description: "Tech crash 78%",
      year: "2000-02"
    },
    {
      name: "1987 Black Monday",
      description: "Dow drops 22.6% in one day",
      year: "1987"
    },
    {
      name: "Bull Market 2010s",
      description: "S&P 500 gains 250%+",
      year: "2010-19"
    },
    {
      name: "S&P 500 drops 10%",
      description: "Moderate market decline",
      year: "Scenario"
    },
    {
      name: "Bull market +20%",
      description: "Strong market rally",
      year: "Scenario"
    },
    {
      name: "Rising rates & inflation",
      description: "High inflation environment",
      year: "Scenario"
    }
  ];

  // Generate scenario description from slider params
  const generateScenarioFromSliders = () => {
    const { marketMovement, inflation, volatility } = scenarioBuilderParams;
    
    let scenarioText = "";
    
    // Market movement
    if (marketMovement > 0) {
      scenarioText += `Market rallies ${Math.abs(marketMovement)}%`;
    } else if (marketMovement < 0) {
      scenarioText += `Market drops ${Math.abs(marketMovement)}%`;
    } else {
      scenarioText += "Market remains flat";
    }
    
    // Inflation
    if (inflation > 5) {
      scenarioText += `, high inflation at ${inflation}%`;
    } else if (inflation > 2) {
      scenarioText += `, moderate inflation at ${inflation}%`;
    } else {
      scenarioText += `, low inflation at ${inflation}%`;
    }
    
    // Volatility
    if (volatility > 7) {
      scenarioText += ", with extreme volatility";
    } else if (volatility > 4) {
      scenarioText += ", with elevated volatility";
    } else {
      scenarioText += ", with low volatility";
    }
    
    return scenarioText;
  };
  
  // Calculate recovery path overlay
  const calculateRecoveryPath = (baseValues: number[], pathType: 'v' | 'u' | 'l' | 'w') => {
    if (!baseValues || baseValues.length === 0) return baseValues;
    
    const initial = baseValues[0];
    const lowest = Math.min(...baseValues);
    const lowestIndex = baseValues.indexOf(lowest);
    const recoveryLength = baseValues.length - lowestIndex;
    
    return baseValues.map((value, index) => {
      if (index <= lowestIndex) return value; // Keep decline phase
      
      const progress = (index - lowestIndex) / recoveryLength;
      const decline = initial - lowest;
      
      switch (pathType) {
        case 'v': // Fast V-shaped recovery
          return lowest + (decline * Math.pow(progress, 0.5));
        case 'u': // Gradual U-shaped recovery
          return lowest + (decline * Math.pow(progress, 1.5));
        case 'l': // Prolonged L-shaped (minimal recovery)
          return lowest + (decline * 0.3 * progress);
        case 'w': // W-shaped (double dip)
          const waveFactor = Math.sin(progress * Math.PI * 2) * 0.2;
          return lowest + (decline * progress) + (decline * waveFactor);
        default:
          return value;
      }
    });
  };
  
  // Load stress test from history
  const loadHistoricalTest = (index: number) => {
    if (index >= 0 && index < stressTestHistory.length) {
      setActiveHistoryIndex(index);
      setStressTestResult(stressTestHistory[index]);
      setStressTestScenario(stressTestHistory[index].scenarioName || "");
      setRecoveryPath(null); // Reset recovery path when switching
    }
  };
  

  // Handle stress test with history and custom portfolio support
  const handleStressTest = async (scenario: string, customPortfolio?: PortfolioItem[]) => {
    if (!scenario.trim()) {
      toast.error("Please enter a stress test scenario");
      return;
    }

    setStressTestLoading(true);
    setStressTestResult(null);
    setRecoveryPath(null); // Reset recovery path

    try {
      // Use saved form data instead of reading from DOM
      const capital = parseInt(savedFormData?.capital || "10000");
      const horizon = savedFormData?.horizon || "";
      
      // Use custom portfolio if provided (for live rebalancing), otherwise use current
      const portfolioToTest = customPortfolio || currentPortfolioData;

      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario: scenario.trim(),
          portfolio: portfolioToTest,
          initialCapital: capital,
          timeHorizon: horizon,
          customTimeHorizon: stressTestTimeHorizon, // Use custom time horizon
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
      
      // Add scenario name and timestamp to result
      const resultWithMeta = {
        ...data,
        scenarioName: scenario,
        timestamp: Date.now(),
        portfolioSnapshot: portfolioToTest,
      };
      
      setStressTestResult(resultWithMeta);
      
      // Add to history (keep last 5)
      setStressTestHistory(prev => {
        const newHistory = [resultWithMeta, ...prev].slice(0, 5);
        return newHistory;
      });
      setActiveHistoryIndex(0);
      
      // Initialize visible asset classes if first time
      if (visibleAssetClasses.length === 0 && data.impact) {
        setVisibleAssetClasses(Object.keys(data.impact));
      }
      
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
        riskTolerance: riskTolerance,
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
  
  // Initialize temp portfolio allocation when entering stress test tab
  useEffect(() => {
    if (activeResultTab === 'stressTest' && tempPortfolioAllocation.length === 0) {
      setTempPortfolioAllocation(JSON.parse(JSON.stringify(currentPortfolioData)));
    }
  }, [activeResultTab, currentPortfolioData, tempPortfolioAllocation.length]);
  
  // Update temp portfolio allocation value
  const updateTempAllocation = (index: number, newValue: number) => {
    const updated = [...tempPortfolioAllocation];
    updated[index] = { ...updated[index], value: newValue };
    setTempPortfolioAllocation(updated);
  };
  
  // Calculate total allocation
  const getTotalAllocation = () => {
    return tempPortfolioAllocation.reduce((sum, item) => sum + item.value, 0);
  };
  
  // Test rebalanced portfolio
  const testRebalancedPortfolio = () => {
    const total = getTotalAllocation();
    if (Math.abs(total - 100) > 0.1) {
      toast.error(`Portfolio must total 100% (currently ${total.toFixed(1)}%)`);
      return;
    }
    
    if (!stressTestScenario.trim()) {
      toast.error("Please select or enter a stress test scenario first");
      return;
    }
    
    handleStressTest(stressTestScenario, tempPortfolioAllocation);
  };
  
  // Navigation Component for Form and Results Views
  const Navigation = () => {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand - Left Side */}
            <button
              onClick={handleGoHome}
              className="group flex items-center gap-2 transition-all duration-300 hover:scale-105"
            >
              <h1 className="animate-glow text-3xl font-normal tracking-[0.3em] text-[#00FF99] uppercase transition-all duration-300 group-hover:text-[#00E689]" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
                Diversonal
              </h1>
            </button>
            
            {/* Navigation Items - Right Side */}
            <div className="flex items-center gap-3">
              {/* New Portfolio Button */}
              <button
                onClick={handleNewPortfolio}
                className="group inline-flex items-center gap-2 rounded-sm border border-[#2A2A2A] bg-[#242424] px-3 py-2 text-sm font-medium text-[#B4B4B4] transition-all duration-200 hover:border-[#3A3A3A] hover:bg-[#2A2A2A] hover:text-[#E6E6E6]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Portfolio</span>
                <span className="sm:hidden">New</span>
              </button>
              
              {/* Saved Portfolios Button */}
              {savedPortfolios.length > 0 && (
                <button
                  onClick={() => setShowSavedPortfolios(!showSavedPortfolios)}
                  className="group inline-flex items-center gap-2 rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-3 py-2 text-sm font-medium text-[#00FF99] transition-all duration-200 hover:border-[#00FF99]/50 hover:bg-[#00FF99]/20"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="hidden sm:inline">Saved</span>
                  <span className="rounded-sm bg-[#00FF99]/20 px-1.5 py-0.5 text-xs font-semibold">
                    {savedPortfolios.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  };
  
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
      <div className="relative z-0 w-full max-w-6xl px-6" style={{ perspective: '1500px' }}>
        <div 
          className="computer-screen-3d group relative mx-auto w-full max-w-5xl transition-transform duration-500 hover:scale-[1.02]"
          style={{ 
            transform: 'rotateX(8deg) rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Monitor Base/Stand */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="mt-4 h-8 w-32 rounded-b-lg bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A]" style={{ transform: 'translateZ(-20px)' }}></div>
            <div className="mx-auto h-12 w-20 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F]"></div>
          </div>
          
          {/* Monitor Bezel */}
          <div className="relative rounded-lg border-8 border-[#1A1A1A] bg-[#1A1A1A] shadow-2xl" style={{ transform: 'translateZ(10px)' }}>
            {/* Screen Glow Effect */}
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#00FF99]/20 via-[#00FF99]/10 to-[#00FF99]/20 opacity-50 blur-xl"></div>
            
            {/* Screen Content Container */}
            <div className="relative overflow-hidden rounded-sm bg-[#0F0F0F] aspect-[16/10]">
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
                      <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-sm bg-[#4A4A4A]"></div>
                          <span className="text-sm text-[#B4B4B4]">Equities</span>
                        </div>
                        <span className="text-lg font-semibold text-[#E6E6E6]">40%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-4">
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
                      <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-4">
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
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
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
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
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
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
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
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
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
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-lg font-semibold text-[#E6E6E6]">Market Crash (-30%)</span>
                        <span className="text-xl font-bold text-[#D95F5F]">-$8,400</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                        <div className="h-full w-[70%] bg-[#D95F5F]"></div>
                      </div>
                      <p className="mt-2 text-sm text-[#808080]">Portfolio resilience: Moderate</p>
                    </div>
                    
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand - Left Side */}
            <button
              onClick={handleGoHome}
              className="group flex items-center gap-2 transition-all duration-300 hover:scale-105"
            >
              <h1 className="animate-glow text-3xl font-normal tracking-[0.3em] text-[#00FF99] uppercase transition-all duration-300 group-hover:text-[#00E689]" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
                Diversonal
              </h1>
            </button>
            
            {/* Get Started Button - Right Side */}
            <button
              onClick={() => setViewMode('form')}
              className="group relative inline-flex items-center gap-2 rounded-sm bg-[#00FF99] px-5 py-2.5 text-sm font-semibold text-[#0F0F0F] transition-all duration-200 hover:bg-[#00E689]"
            >
              <span>Get Started</span>
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Ticker Stream - Below Navigation */}
      <div className="fixed top-16 left-0 right-0 z-40 overflow-hidden bg-[#0F0F0F] border-b border-[#2A2A2A] py-3">
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
      <section id="hero-section" className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden pt-[170px] pb-20">
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
            <div className="flex items-center gap-2 text-[#808080] transition-colors duration-200 hover:text-[#00FF99]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
              </svg>
              <span className="text-sm font-medium">OpenAI</span>
            </div>
            
            {/* xAI Logo (text only) */}
            <div className="text-[#808080] transition-colors duration-200 hover:text-[#00FF99]">
              <span className="text-2xl font-bold tracking-tight">xAI</span>
            </div>
            
            {/* Claude Logo with Text */}
            <div className="flex items-center gap-2 text-[#808080] transition-colors duration-200 hover:text-[#00FF99]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
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
              <span className="text-sm font-medium">Claude</span>
            </div>
          </div>
        </div>

        {/* 3D Computer Screen */}
        <div className="relative z-10 mt-12 flex-shrink-0 w-[1050px] h-[350px]">
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
      <section id="portfolio-generation-section" className="flex min-h-screen items-center bg-[#0F0F0F] py-20">
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
            <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
              <div className="mb-4 rounded-sm bg-[#0F0F0F] p-4">
                <div className="mb-4 flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <h4 className="text-lg font-semibold text-[#E6E6E6]">Your Portfolio</h4>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A]"></div>
                    <div className="h-6 w-6 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A]"></div>
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
                  <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-sm bg-[#4A4A4A]"></div>
                      <span className="text-sm text-[#B4B4B4]">Equities</span>
                    </div>
                    <span className="text-sm font-medium text-[#E6E6E6]">40%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-sm bg-[#5A5A5A]"></div>
                      <span className="text-sm text-[#B4B4B4]">Bonds</span>
                    </div>
                    <span className="text-sm font-medium text-[#E6E6E6]">25%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-2.5">
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
      <section id="stock-picks-section" className="flex min-h-screen items-center bg-[#0F0F0F] py-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
              <div className="rounded-sm bg-[#0F0F0F] p-4">
                <div className="mb-4 flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <h4 className="text-base font-semibold text-[#E6E6E6]">Detailed Recommendations</h4>
                  <div className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-2.5 py-1 text-xs font-medium text-[#00FF99]">Live Data</div>
                </div>
                {/* Mock stock recommendations */}
                <div className="space-y-3">
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-3">
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
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-3">
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
      <section id="stress-testing-section" className="flex min-h-screen items-center bg-[#0F0F0F] py-20">
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
            <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
              <div className="rounded-sm bg-[#0F0F0F] p-4">
                <div className="mb-4">
                  <h4 className="mb-2 text-base font-semibold text-[#E6E6E6]">Stress Test Results</h4>
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-2.5">
                    <p className="text-xs text-[#808080]">Scenario: S&P 500 drops 10% in 2026</p>
                  </div>
                </div>
                {/* Mock chart */}
                <div className="mb-4 h-32 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-3">
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
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-2 text-center">
                      <p className="text-xs text-[#808080]">Equities</p>
                      <p className="text-sm font-medium text-[#D95F5F]">-12%</p>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-2 text-center">
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
      <section id="save-export-section" className="flex min-h-screen items-center bg-[#0F0F0F] py-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
              <div className="rounded-sm bg-[#0F0F0F] p-4">
                <div className="mb-4 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                  <h4 className="mb-3 text-base font-semibold text-[#E6E6E6]">Save Portfolio</h4>
                  <div className="mb-3 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2.5">
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
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-[#B4B4B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-medium text-[#B4B4B4]">PDF</p>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-center">
                      <svg className="mx-auto mb-1 h-6 w-6 text-[#B4B4B4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs font-medium text-[#B4B4B4]">JSON</p>
                    </div>
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-center">
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
            <button
              onClick={() => setViewMode('form')}
              className="group inline-flex items-center gap-2 rounded-sm bg-[#00FF99] px-8 py-4 text-lg font-semibold text-[#0F0F0F] transition-all duration-200 hover:bg-[#00E689]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
              <svg className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <p className="mt-4 text-sm text-[#808080]">Free to use • No sign-up required • AI-powered</p>
          </div>
        </div>
      </section>
    </div>
  );
  };

  const InfoIcon = ({ tooltip }: { tooltip: string }) => (
    <div className="group relative inline-flex items-center">
      <svg
        className="h-3.5 w-3.5 cursor-help text-[#808080] transition-all duration-200 hover:text-[#00FF99]"
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
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100">
        <div className="relative min-w-[250px] max-w-md rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2">
          <p className="whitespace-normal text-xs leading-relaxed text-[#E6E6E6]">{tooltip}</p>
          {/* Arrow pointing down */}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="border-4 border-transparent border-t-[#1A1A1A]"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className={`relative bg-[#0F0F0F] ${viewMode === 'landing' ? 'h-screen overflow-hidden' : 'min-h-screen overflow-hidden px-4 py-8'}`}>
      
      {/* Navigation for Form and Results Views */}
      {viewMode !== 'landing' && <Navigation />}
      
      <div className={`relative z-10 ${viewMode === 'landing' ? 'h-full' : viewMode === 'form' ? 'w-full px-8 pt-24' : 'w-full px-8 pt-16'}`}>
        {viewMode === 'form' && (
          <div className="animate-fade-in mb-8">
            <p className="text-center text-xl text-[#B4B4B4]">
              Describe yourself and your vision to receive your <span className="font-semibold text-[#E6E6E6]">AI-optimized</span> portfolio allocation
            </p>
          </div>
        )}

        {/* Landing Page */}
        {viewMode === 'landing' && <LandingSection />}

        {/* Form View */}
        {viewMode === 'form' && (
          <div className="mx-auto max-w-4xl">
        <form
          className="animate-fade-in space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Investment Profile Section */}
          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
            <h3 className="mb-6 text-center text-xl font-semibold text-[#E6E6E6]">Investment Profile</h3>
            <div className="grid grid-cols-2 gap-5">
          <div className="group">
            <label htmlFor="age" className="mb-2 flex items-center gap-2 text-sm font-medium text-[#B4B4B4] group-focus-within:text-[#E6E6E6]">
              Your age
              <InfoIcon tooltip="Your current age helps determine appropriate investment strategies" />
            </label>
            <input
              id="age"
              type="number"
              placeholder="e.g., 32"
              required
              className="w-full rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2.5 text-sm text-[#E6E6E6] placeholder-[#808080] outline-none transition-all duration-200 hover:border-[#3A3A3A] focus:border-[#00FF99] focus:bg-[#0F0F0F]"
            />
          </div>

          <div className="group">
            <label htmlFor="risk" className="mb-2 flex items-center justify-between text-sm font-medium text-[#B4B4B4] group-focus-within:text-[#E6E6E6]">
              <span className="flex items-center gap-2">
                Risk tolerance
                <InfoIcon tooltip="Slide from 0 (ultra conservative) to 100 (maximum aggression). Your exact score determines the volatility and growth potential of your recommendations." />
              </span>
              <span className="text-[#00FF99] font-semibold">{riskTolerance}/100</span>
            </label>
            <input
              id="risk"
              type="range"
              min="0"
              max="100"
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
              required
              className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #00FF99 0%, #00FF99 ${riskTolerance}%, #2A2A2A ${riskTolerance}%, #2A2A2A 100%)`
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-[#808080]">
              <span className={riskTolerance <= 20 ? 'text-[#00FF99] font-medium' : ''}>Conservative</span>
              <span className={riskTolerance > 20 && riskTolerance <= 40 ? 'text-[#00FF99] font-medium' : ''}>Moderate</span>
              <span className={riskTolerance > 40 && riskTolerance <= 60 ? 'text-[#00FF99] font-medium' : ''}>Balanced</span>
              <span className={riskTolerance > 60 && riskTolerance <= 80 ? 'text-[#00FF99] font-medium' : ''}>Growth</span>
              <span className={riskTolerance > 80 ? 'text-[#00FF99] font-medium' : ''}>Aggressive</span>
            </div>
          </div>

          <div className="group">
            <label htmlFor="horizon" className="mb-2 flex items-center gap-2 text-sm font-medium text-[#B4B4B4] group-focus-within:text-[#E6E6E6]">
              Time horizon
              <InfoIcon tooltip="How long you plan to invest before needing the money. Longer horizons allow for more aggressive strategies" />
            </label>
            <select
              id="horizon"
              required
              className="w-full appearance-none rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23808080%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2.5 text-sm text-[#E6E6E6] outline-none transition-all duration-200 hover:border-[#3A3A3A] focus:border-[#00FF99] focus:bg-[#0F0F0F]"
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
            <label htmlFor="capital" className="mb-2 flex items-center gap-2 text-sm font-medium text-[#B4B4B4] group-focus-within:text-[#E6E6E6]">
              Available capital ($)
              <InfoIcon tooltip="The total amount of money you have available to invest" />
            </label>
            <input
              id="capital"
              type="number"
              placeholder="e.g., 25000"
              required
              className="w-full rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2.5 text-sm text-[#E6E6E6] placeholder-[#808080] outline-none transition-all duration-200 hover:border-[#3A3A3A] focus:border-[#00FF99] focus:bg-[#0F0F0F]"
            />
          </div>
            </div>
          </div>

          {/* Your Investment Vision Section */}
          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
            <h3 className="mb-6 text-center text-xl font-semibold text-[#E6E6E6]">Your Investment Vision</h3>
            <div className="space-y-4">
              <div className="group">
                <label htmlFor="goal" className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-[#B4B4B4] group-focus-within:text-[#E6E6E6]">
                  <span className="text-xs font-normal text-[#808080]">(Be specific for better results)</span>
                  <InfoIcon tooltip="What you're investing for: retirement, buying a home, education, wealth growth, etc." />
                </label>
                <textarea
                  id="goal"
                  name="goal"
                  rows={1}
                  placeholder="Tell our AI anything and everything"
                  required
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  onChange={(e) => setGoalLength(e.target.value.length)}
                  className="w-full rounded-xl border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2.5 text-center text-lg text-[#E6E6E6] placeholder-[#808080] placeholder:text-center outline-none transition-all duration-200 hover:border-[#3A3A3A] focus:border-[#00FF99] focus:bg-[#0F0F0F] resize-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs transition-colors duration-200 ${goalLength >= 50 ? 'text-[#00FF99] font-medium' : 'text-[#808080]'}`}>
                    {goalLength} characters
                  </span>
                  {goalLength >= 50 && (
                    <span className="flex items-center gap-1 text-xs text-[#00FF99]">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Great detail!
                    </span>
                  )}
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-sm border border-[#2A2A2A] bg-[#242424] p-3 text-xs text-[#B4B4B4]">
                  <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#00FF99]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong className="text-[#E6E6E6]">Pro Tip:</strong> Specific goals with amounts, timelines, and desired outcomes help our AI create a truly personalized strategy for you.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Sector Preferences Section */}
          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
            <h3 className="mb-6 text-center text-xl font-semibold text-[#E6E6E6]">Sector Preferences</h3>
            <div className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#B4B4B4]">
              Sector convictions
              <InfoIcon tooltip="Industries or sectors you believe in or want to focus on. Select any combination." />
            </label>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-4 sm:grid-cols-2">
              {sectors.map((sector) => (
                <label
                  key={sector}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-sm p-2 text-sm text-[#B4B4B4] transition-all duration-200 hover:bg-[#1A1A1A] hover:text-[#E6E6E6]"
                >
                  <input
                    type="checkbox"
                    name="sectors"
                    value={sector}
                    checked={selectedSectors.includes(sector)}
                    onChange={() => handleSectorChange(sector)}
                    className="h-4 w-4 cursor-pointer rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] transition-all duration-200 focus:border-[#00FF99] checked:border-[#00FF99] checked:bg-[#00FF99]"
                    style={{ accentColor: '#00FF99' }}
                  />
                  <span className="font-medium">{sector}</span>
                </label>
              ))}
            </div>
          </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-sm bg-[#00FF99] px-4 py-3 text-sm font-semibold text-[#0F0F0F] transition-all duration-200 hover:bg-[#00E689] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Portfolio...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        )}

        {/* Results View with Tabs */}
        {viewMode === 'results' && (
        <>
          {/* Tab Navigation - Enhanced with Incentives */}
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Portfolio Tab */}
              <button
                onClick={() => setActiveResultTab('portfolio')}
                className={`group relative overflow-hidden rounded-sm border p-3 text-left transition-all duration-200 ${
                  activeResultTab === 'portfolio'
                    ? 'border-[#00FF99] bg-[#00FF99]/10'
                    : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A] hover:bg-[#242424]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`rounded-sm p-2 transition-all ${
                    activeResultTab === 'portfolio' 
                      ? 'bg-[#00FF99]/20' 
                      : 'bg-[#242424]'
                  }`}>
                    <svg className={`h-5 w-5 transition-colors ${
                      activeResultTab === 'portfolio' ? 'text-[#00FF99]' : 'text-[#808080]'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  {activeResultTab === 'portfolio' && (
                    <div className="rounded-sm bg-[#00FF99] p-1">
                      <svg className="h-3 w-3 text-[#0F0F0F]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <h4 className={`text-base font-semibold mb-1 transition-colors ${
                  activeResultTab === 'portfolio' ? 'text-[#00FF99]' : 'text-[#E6E6E6]'
                }`}>
                  Your Allocation
                </h4>
                <p className="text-xs text-[#808080] mb-2">
                  View your optimized portfolio breakdown across asset classes
                </p>
                {activeResultTab !== 'portfolio' && (
                  <div className="text-xs text-[#00FF99] font-medium">
                    Click to view →
                  </div>
                )}
              </button>

              {/* Stock Picks Tab */}
              <button
                onClick={() => setActiveResultTab('stockPicks')}
                className={`group relative overflow-hidden rounded-sm border p-3 text-left transition-all duration-200 ${
                  activeResultTab === 'stockPicks'
                    ? 'border-[#00FF99] bg-[#00FF99]/10'
                    : detailedRecommendations 
                      ? 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A] hover:bg-[#242424]'
                      : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A] hover:bg-[#242424]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`rounded-sm p-2 transition-all ${
                    activeResultTab === 'stockPicks' 
                      ? 'bg-[#00FF99]/20' 
                      : 'bg-[#242424]'
                  }`}>
                    <svg className={`h-5 w-5 transition-colors ${
                      activeResultTab === 'stockPicks' ? 'text-[#00FF99]' : 'text-[#808080]'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  {activeResultTab === 'stockPicks' && (
                    <div className="rounded-sm bg-[#00FF99] p-1">
                      <svg className="h-3 w-3 text-[#0F0F0F]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!detailedRecommendations && activeResultTab !== 'stockPicks' && (
                    <span className="rounded-sm border border-[#00FF99]/30 bg-[#00FF99]/10 px-2 py-0.5 text-xs font-semibold text-[#00FF99]">
                      AI
                    </span>
                  )}
                </div>
                <h4 className={`text-base font-semibold mb-1 transition-colors ${
                  activeResultTab === 'stockPicks' ? 'text-[#00FF99]' : 'text-[#E6E6E6]'
                }`}>
                  Discover Stock Picks
                </h4>
                <p className="text-xs text-[#808080] mb-2">
                  Get AI-powered specific ticker recommendations with analysis
                </p>
                {activeResultTab !== 'stockPicks' && !detailedRecommendations && (
                  <div className="text-xs text-[#00FF99] font-medium">
                    Generate detailed picks →
                  </div>
                )}
                {activeResultTab !== 'stockPicks' && detailedRecommendations && (
                  <div className="text-xs text-[#00FF99] font-medium">
                    View stock picks →
                  </div>
                )}
              </button>

              {/* Stress Test Tab */}
              <button
                onClick={() => setActiveResultTab('stressTest')}
                className={`group relative overflow-hidden rounded-sm border p-3 text-left transition-all duration-200 ${
                  activeResultTab === 'stressTest'
                    ? 'border-[#00FF99] bg-[#00FF99]/10'
                    : stressTestResult
                      ? 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A] hover:bg-[#242424]'
                      : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A] hover:bg-[#242424]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`rounded-sm p-2 transition-all ${
                    activeResultTab === 'stressTest' 
                      ? 'bg-[#00FF99]/20' 
                      : 'bg-[#242424]'
                  }`}>
                    <svg className={`h-5 w-5 transition-colors ${
                      activeResultTab === 'stressTest' ? 'text-[#00FF99]' : 'text-[#808080]'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  {activeResultTab === 'stressTest' && (
                    <div className="rounded-sm bg-[#00FF99] p-1">
                      <svg className="h-3 w-3 text-[#0F0F0F]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <h4 className={`text-base font-semibold mb-1 transition-colors ${
                  activeResultTab === 'stressTest' ? 'text-[#00FF99]' : 'text-[#E6E6E6]'
                }`}>
                  Test Resilience
                </h4>
                <p className="text-xs text-[#808080] mb-2">
                  See how your portfolio performs in market crisis scenarios
                </p>
                {activeResultTab !== 'stressTest' && (
                  <div className="text-xs text-[#00FF99] font-medium">
                    Run stress test →
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Portfolio Tab */}
          {activeResultTab === 'portfolio' && (
        <section id="portfolio-result" ref={portfolioRef} className="animate-fade-in mx-auto max-w-[1800px] rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-8 sm:p-10 md:p-12">
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
            <div className="mb-8 h-64 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-6 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentPortfolioData as any}
                    cx="45%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
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
                  <Legend 
                    verticalAlign="middle" 
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={14}
                    wrapperStyle={{
                      paddingLeft: '20px',
                      fontSize: '14px',
                      lineHeight: '28px'
                    }}
                    formatter={(value: string) => {
                      const item = currentPortfolioData.find((d: any) => d.name === value);
                      return item ? `${value}: ${item.value}%` : value;
                    }}
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
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Alternative visualization */}
            <div className="h-64 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-6 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 30, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', dy: 80, fill: '#9ca3af' }}
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
        <section className="animate-fade-in mx-auto max-w-[1800px] rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6 sm:p-8">
          
          {/* Generate/Regenerate Button */}
          {!detailedRecommendations && (
            <div className="mb-8 flex flex-col items-center gap-3">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-400 mb-1">Get AI-powered stock recommendations tailored to your portfolio</p>
                <p className="text-xs text-gray-500">Powered by Grok AI • Includes real-time X sentiment analysis</p>
              </div>
              <button
                onClick={handleGetDetailedRecommendations}
                disabled={detailPanelLoading}
                className="group relative inline-flex items-center gap-3 rounded-sm border border-[#00FF99] bg-[#00FF99] px-8 py-4 text-base font-semibold text-[#0F0F0F] transition-all duration-200 hover:bg-[#00E689] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-[#00FF99]/30"
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
                    Generate Deep Dive Stock Picks
                  </>
                )}
              </button>
            </div>
          )}

          {/* Streaming Text Display - shown during generation */}
          {detailPanelLoading && streamingText && (
            <div className="mb-4 animate-fade-in">
              <div ref={streamingTextRef} className="max-h-[200px] overflow-y-auto border border-white bg-black p-2.5">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white">
                  {streamingText}
                  <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-white"></span>
                </pre>
              </div>
            </div>
          )}

          {/* Asset Class Tabs */}
          {(detailedRecommendations || (detailPanelLoading && parsedAssetClasses.length > 0)) && (
            <div>
              <div className="mb-8">
                <div className="overflow-x-auto pb-2">
                  <div className="inline-flex gap-3 rounded-xl border border-gray-700 bg-[#171A1F] p-2 shadow-md">
                    {(detailPanelLoading ? parsedAssetClasses : currentPortfolioData.map(item => item.name)).map((assetClass) => (
                      <button
                        key={assetClass}
                        onClick={() => setActiveTab(assetClass)}
                        className={`flex-shrink-0 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                          activeTab === assetClass
                            ? 'bg-[#00FF99] text-[#171A1F] shadow-lg shadow-[#00FF99]/30 scale-105'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 hover:scale-102'
                        }`}
                      >
                        {assetClass}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations Content */}
              {((detailPanelLoading && Object.keys(partialRecommendations).length > 0) || (!detailPanelLoading && detailedRecommendations)) && (
                <div className="animate-slide-in-up">
                  {currentPortfolioData.map((portfolioItem) => {
                    const assetClass = portfolioItem.name;
                    if (activeTab !== assetClass) return null;
                
                // Check if this asset class has 0% allocation
                if (portfolioItem.value === 0) {
                  return (
                    <div key={assetClass} className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-12 text-center">
                      <svg className="mx-auto mb-4 h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="rounded-lg border border-[#00FF99]/30 bg-[#00FF99]/10 p-4 mb-6">
                        <p className="flex items-center gap-2 text-sm text-[#00FF99]">
                          <svg className="h-5 w-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          ✓ {assetClass} recommendations loaded. Additional analysis may still be generating...
                        </p>
                      </div>
                    )}
                    
                    {/* TIER 1: Top Row - Allocation Breakdown (40%) + Market Context (60%) */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                      {/* Left: Allocation Breakdown - 40% */}
                      {data.breakdown && data.breakdown.length > 0 && (
                        <div className="lg:col-span-2 flex flex-col">
                          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5 shadow-sm h-full">
                            <h4 className="mb-5 text-lg font-semibold text-gray-100">Allocation Breakdown</h4>
                          {detailPanelLoading ? (
                            <div className="flex h-48 items-center justify-center">
                              <div className="text-center">
                                <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-[#00FF99]"></div>
                                <p className="text-xs text-gray-400">Generating...</p>
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
                                      borderRadius: '12px',
                                      color: '#00FF99',
                                      padding: '8px'
                                    }}
                                    labelStyle={{ color: '#00FF99', fontSize: '12px' }}
                                    itemStyle={{ color: '#00FF99', fontSize: '12px' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                          </div>
                        </div>
                      )}
                      
                      {/* Right: Market Context - 60% */}
                      {detailedRecommendations && detailedRecommendations.marketContext && !detailPanelLoading && (
                        <div className="lg:col-span-3 flex flex-col">
                          <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-5 shadow-sm h-full">
                            <div className="flex items-start gap-3 h-full">
                              <svg className="h-5 w-5 text-[#00FF99] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#00FF99] mb-2">Market Context</h4>
                                <p className="text-sm leading-relaxed text-gray-300">{detailedRecommendations.marketContext}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TIER 2: Auto-Scrolling Market Indicators Ticker */}
                    {marketContext && !marketContextLoading && (
                      <div className="mb-6 overflow-hidden bg-[#0F0F0F] border border-[#2A2A2A] rounded-sm py-3">
                        <div className="ticker-wrapper">
                          <div className="ticker-content">
                            {/* Original set */}
                            {[
                              { label: 'S&P 500', price: marketContext.sp500.price.toFixed(2), change: marketContext.sp500.changePercent },
                              { label: 'Nasdaq', price: marketContext.nasdaq.price.toFixed(2), change: marketContext.nasdaq.changePercent },
                              { label: 'Dow', price: marketContext.dow.price.toFixed(2), change: marketContext.dow.changePercent },
                              { label: 'Russell 2000', price: marketContext.russell2000.price.toFixed(2), change: marketContext.russell2000.changePercent },
                              { label: 'VIX', price: marketContext.vix.price.toFixed(2), change: marketContext.vix.changePercent },
                              { label: 'NVDA', price: `$${marketContext.nvda.price.toFixed(2)}`, change: marketContext.nvda.changePercent },
                              { label: 'TSLA', price: `$${marketContext.tsla.price.toFixed(2)}`, change: marketContext.tsla.changePercent },
                              { label: 'AAPL', price: `$${marketContext.aapl.price.toFixed(2)}`, change: marketContext.aapl.changePercent },
                              { label: 'GOOGL', price: `$${marketContext.googl.price.toFixed(2)}`, change: marketContext.googl.changePercent },
                              { label: 'AMZN', price: `$${marketContext.amzn.price.toFixed(2)}`, change: marketContext.amzn.changePercent },
                              { label: 'BTC', price: `$${marketContext.btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: marketContext.btc.changePercent },
                              { label: 'ETH', price: `$${marketContext.eth.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: marketContext.eth.changePercent },
                              { label: 'SOL', price: `$${marketContext.sol.price.toFixed(2)}`, change: marketContext.sol.changePercent },
                              { label: 'XMR', price: `$${marketContext.xmr.price.toFixed(2)}`, change: marketContext.xmr.changePercent },
                              { label: 'GOLD', price: `$${marketContext.gold.price.toFixed(2)}`, change: marketContext.gold.changePercent },
                              { label: 'SILVER', price: `$${marketContext.silver.price.toFixed(2)}`, change: marketContext.silver.changePercent },
                              { label: 'Fear & Greed', price: marketContext.fearGreed.value.toString(), change: 0, isIndex: true },
                            ].map((indicator, i) => (
                              <div key={i} className="ticker-item">
                                <div className="text-xs text-gray-500 uppercase">{indicator.label}</div>
                                <div className="text-lg font-bold text-[#E6E6E6]">{indicator.price}</div>
                                {!indicator.isIndex && (
                                  <div className={`text-sm ${indicator.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {indicator.change >= 0 ? '↗ +' : '↘ '}{Math.abs(indicator.change).toFixed(2)}%
                                  </div>
                                )}
                                {indicator.isIndex && (
                                  <div className="text-xs text-gray-400">{marketContext.fearGreed.label}</div>
                                )}
                              </div>
                            ))}
                            {/* Duplicate set for seamless loop */}
                            {[
                              { label: 'S&P 500', price: marketContext.sp500.price.toFixed(2), change: marketContext.sp500.changePercent },
                              { label: 'Nasdaq', price: marketContext.nasdaq.price.toFixed(2), change: marketContext.nasdaq.changePercent },
                              { label: 'Dow', price: marketContext.dow.price.toFixed(2), change: marketContext.dow.changePercent },
                              { label: 'Russell 2000', price: marketContext.russell2000.price.toFixed(2), change: marketContext.russell2000.changePercent },
                              { label: 'VIX', price: marketContext.vix.price.toFixed(2), change: marketContext.vix.changePercent },
                              { label: 'NVDA', price: `$${marketContext.nvda.price.toFixed(2)}`, change: marketContext.nvda.changePercent },
                              { label: 'TSLA', price: `$${marketContext.tsla.price.toFixed(2)}`, change: marketContext.tsla.changePercent },
                              { label: 'AAPL', price: `$${marketContext.aapl.price.toFixed(2)}`, change: marketContext.aapl.changePercent },
                              { label: 'GOOGL', price: `$${marketContext.googl.price.toFixed(2)}`, change: marketContext.googl.changePercent },
                              { label: 'AMZN', price: `$${marketContext.amzn.price.toFixed(2)}`, change: marketContext.amzn.changePercent },
                              { label: 'BTC', price: `$${marketContext.btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: marketContext.btc.changePercent },
                              { label: 'ETH', price: `$${marketContext.eth.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: marketContext.eth.changePercent },
                              { label: 'SOL', price: `$${marketContext.sol.price.toFixed(2)}`, change: marketContext.sol.changePercent },
                              { label: 'XMR', price: `$${marketContext.xmr.price.toFixed(2)}`, change: marketContext.xmr.changePercent },
                              { label: 'GOLD', price: `$${marketContext.gold.price.toFixed(2)}`, change: marketContext.gold.changePercent },
                              { label: 'SILVER', price: `$${marketContext.silver.price.toFixed(2)}`, change: marketContext.silver.changePercent },
                              { label: 'Fear & Greed', price: marketContext.fearGreed.value.toString(), change: 0, isIndex: true },
                            ].map((indicator, i) => (
                              <div key={`dup-${i}`} className="ticker-item">
                                <div className="text-xs text-gray-500 uppercase">{indicator.label}</div>
                                <div className="text-lg font-bold text-[#E6E6E6]">{indicator.price}</div>
                                {!indicator.isIndex && (
                                  <div className={`text-sm ${indicator.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {indicator.change >= 0 ? '↗ +' : '↘ '}{Math.abs(indicator.change).toFixed(2)}%
                                  </div>
                                )}
                                {indicator.isIndex && (
                                  <div className="text-xs text-gray-400">{marketContext.fearGreed.label}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TIER 3: Stock Positions - 2 Column Layout (Ticker Details | X Posts) */}
                    <div>
                      {data.recommendations && data.recommendations.length > 0 ? (
                        detailPanelLoading ? (
                          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center">
                            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-[#00FF99]"></div>
                            <p className="text-xs text-gray-400">Analyzing positions...</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {data.recommendations.map((rec: StockRecommendation, index: number) => (
                              <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Ticker Details */}
                                <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5 transition-all hover:border-[#00FF99]/30 hover:shadow-md">
                                  {/* Ticker and Name */}
                                  <div className="mb-4 flex items-start justify-between">
                                    <div>
                                      <div className="mb-2 flex items-center gap-2">
                                        <h5 className="text-2xl font-bold text-[#00FF99]">{rec.ticker}</h5>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          rec.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                          rec.riskLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                          'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                          {rec.riskLevel} Risk
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-400">{rec.name}</p>
                                    </div>
                                    <div className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                      rec.positionSize === 'Large' ? 'bg-[#00FF99]/20 text-[#00FF99] border border-[#00FF99]/30' :
                                      rec.positionSize === 'Medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                    }`}>
                                      {rec.positionSize}
                                    </div>
                                  </div>

                                  {/* Rationale */}
                                  <div>
                                    <h6 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                                      📊 AI Analysis
                                    </h6>
                                    <p className="text-sm leading-relaxed text-gray-300">
                                      {rec.rationale}
                                    </p>
                                  </div>
                                </div>

                                {/* Right: X Posts */}
                                <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-5">
                                  {xPostsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                      <div className="text-center">
                                        <svg className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-xs text-gray-400">Loading X posts...</p>
                                      </div>
                                    </div>
                                  ) : xPosts[rec.ticker] && xPosts[rec.ticker].length > 0 ? (
                                    <div>
                                      <h6 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                                        💬 X Pulse
                                      </h6>
                                      <div className="space-y-3">
                                        {xPosts[rec.ticker].map((post, postIndex) => (
                                          <div 
                                            key={postIndex}
                                            className={`border-l-2 pl-3 py-2 ${
                                              post.sentiment === 'Bullish' ? 'border-green-500' :
                                              post.sentiment === 'Bearish' ? 'border-red-500' :
                                              'border-yellow-500'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center gap-2">
                                                <span className={post.sentiment === 'Bullish' ? '🟢' : post.sentiment === 'Bearish' ? '🔴' : '🟡'}></span>
                                                <span className="text-sm font-medium text-[#00FF99]">@{post.author}</span>
                                                <span className="text-xs text-gray-500">• {post.timestamp}</span>
                                              </div>
                                              <span className="text-xs text-gray-500">{post.engagement.toLocaleString()} ❤️</span>
                                            </div>
                                            <p className="text-sm text-gray-300">{post.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <p className="text-sm text-gray-400">No X posts available for {rec.ticker}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                        ) : (
                          <div className="rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center">
                            <svg className="mx-auto mb-3 h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm leading-relaxed text-gray-400">
                              Based on your risk profile, time horizon, and investment goals, we don't recommend active positions in this asset class at this time.
                            </p>
                          </div>
                        )}
                      </div>
                  </div>
                );
                })}

                {/* Regenerate Button */}
                  {!detailPanelLoading && (
                    <div className="mt-8 border-t border-gray-700 pt-8">
                      <button
                        onClick={handleGetDetailedRecommendations}
                        disabled={detailPanelLoading}
                        className="w-full rounded-xl border-2 border-[#00FF99] bg-transparent px-5 py-3 text-sm font-semibold text-[#00FF99] transition-all hover:bg-[#00FF99] hover:text-[#171A1F] disabled:opacity-50"
                      >
                        Regenerate Recommendations
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
          )}

          {/* Stress Test Tab */}
          {activeResultTab === 'stressTest' && (
        <section className="animate-fade-in mx-auto max-w-[1600px] rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-4 sm:p-6">
          <h3 className="text-gradient mb-4 text-2xl font-bold">Stress Testing</h3>
          <p className="mb-6 text-sm text-gray-300">
            Test portfolio performance under various market scenarios
          </p>

          {/* Scenario Input Section - 2 Column Layout */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-9">
            {/* LEFT COLUMN - Scenarios (55%) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Historical Event Templates - 3x3 Grid */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Scenarios</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {historicalScenarios.map((event, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const scenario = event.description;
                        setStressTestScenario(scenario);
                        handleStressTest(scenario);
                      }}
                      disabled={stressTestLoading}
                      className="btn-ripple group relative overflow-hidden rounded-lg border border-white/20 bg-gradient-to-br from-[#1C1F26]/90 to-[#171A1F]/90 p-3 text-left shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9B59B6]/50 hover:bg-[#9B59B6]/10 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-1 text-xs font-bold text-[#9B59B6]">{event.year}</div>
                      <div className="mb-0.5 text-xs font-semibold text-gray-200 transition-colors duration-300 group-hover:text-white">{event.name}</div>
                      <div className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-400">{event.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Scenario Input */}
              <div className="group">
                <label htmlFor="stress-scenario" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400 transition-colors duration-300 group-focus-within:text-[#00FF99]">
                  Custom Scenario
                </label>
                <div className="flex gap-2">
                  <input
                    id="stress-scenario"
                    type="text"
                    value={stressTestScenario}
                    onChange={(e) => setStressTestScenario(e.target.value)}
                    placeholder="Enter custom scenario..."
                    className="flex-1 rounded-lg border border-gray-600 bg-[#171A1F]/80 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 shadow-sm outline-none backdrop-blur-sm transition-all duration-300 hover:border-gray-500 focus:border-[#00FF99] focus:bg-[#171A1F] focus:ring-1 focus:ring-[#00FF99]/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !stressTestLoading) {
                        handleStressTest(stressTestScenario);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleStressTest(stressTestScenario)}
                    disabled={stressTestLoading || !stressTestScenario.trim()}
                    className="btn-ripple rounded-lg bg-gradient-to-r from-[#00FF99] to-[#00E689] px-5 py-2 text-sm font-semibold text-[#171A1F] shadow-md shadow-[#00FF99]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {stressTestLoading ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      "Run"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Controls (45%) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Time Horizon Slider */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Time Horizon</p>
                <div className="rounded-lg border border-white/10 bg-gradient-to-br from-[#1C1F26]/80 to-[#171A1F]/80 p-4 shadow-md backdrop-blur-sm">
                  <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <span className="text-[#00FF99]">{stressTestTimeHorizon}mo</span>
                  </div>
                <input
                  type="range"
                  min="6"
                  max="24"
                  step="6"
                  value={stressTestTimeHorizon}
                  onChange={(e) => setStressTestTimeHorizon(parseInt(e.target.value))}
                  className="w-full accent-[#00FF99]"
                />
                  <div className="mt-1.5 flex justify-between text-xs text-gray-500">
                    <span>6</span>
                    <span>12</span>
                    <span>18</span>
                    <span>24</span>
                  </div>
                </div>
              </div>

              {/* Scenario Builder Toggle */}
              <div className="rounded-lg border border-white/10 bg-gradient-to-br from-[#1C1F26]/80 to-[#171A1F]/80 p-4 shadow-md backdrop-blur-sm">
                <button
                  onClick={() => setShowScenarioBuilder(!showScenarioBuilder)}
                  className="mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:text-[#00FF99]"
                >
                  <span>Advanced Builder</span>
                  <svg
                    className={`h-4 w-4 transition-transform duration-300 ${showScenarioBuilder ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Scenario Builder */}
                <div className={`overflow-hidden transition-all duration-300 ${showScenarioBuilder ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 pt-2">
                    {/* Market Movement */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">
                        Market: <span className="text-[#00FF99]">{scenarioBuilderParams.marketMovement > 0 ? '+' : ''}{scenarioBuilderParams.marketMovement}%</span>
                      </label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="5"
                        value={scenarioBuilderParams.marketMovement}
                        onChange={(e) => setScenarioBuilderParams(prev => ({ ...prev, marketMovement: parseInt(e.target.value) }))}
                        className="w-full accent-[#00FF99]"
                      />
                    </div>

                    {/* Inflation */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">
                        Inflation: <span className="text-[#FFB84D]">{scenarioBuilderParams.inflation}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.5"
                        value={scenarioBuilderParams.inflation}
                        onChange={(e) => setScenarioBuilderParams(prev => ({ ...prev, inflation: parseFloat(e.target.value) }))}
                        className="w-full accent-[#FFB84D]"
                      />
                    </div>

                    {/* Volatility */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">
                        Volatility: <span className="text-[#9B59B6]">{scenarioBuilderParams.volatility}/10</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={scenarioBuilderParams.volatility}
                        onChange={(e) => setScenarioBuilderParams(prev => ({ ...prev, volatility: parseInt(e.target.value) }))}
                        className="w-full accent-[#9B59B6]"
                      />
                    </div>

                    {/* Run Custom Scenario */}
                    <button
                      onClick={() => {
                        const scenario = generateScenarioFromSliders();
                        setStressTestScenario(scenario);
                        handleStressTest(scenario);
                      }}
                      disabled={stressTestLoading}
                      className="btn-ripple w-full rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#B47FD5] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#9B59B6]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Run Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {stressTestResult && (
            <>
              {/* Scenario History Pills */}
              {stressTestHistory.length > 1 && (
                <div className="mb-4 overflow-x-auto pb-2">
                  <div className="flex gap-2">
                    {stressTestHistory.map((test, index) => (
                      <button
                        key={test.timestamp}
                        onClick={() => loadHistoricalTest(index)}
                        className={`btn-ripple flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-300 hover:scale-105 ${
                          index === activeHistoryIndex
                            ? 'border border-[#00FF99] bg-[#00FF99]/20 text-[#00FF99]'
                            : 'border border-white/20 bg-[#1C1F26]/80 text-gray-400 hover:border-[#00FF99]/50 hover:bg-[#00FF99]/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{test.scenarioName?.slice(0, 25)}{test.scenarioName?.length > 25 ? '...' : ''}</span>
                          <span className={`font-bold ${test.percentageChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {test.percentageChange > 0 ? '+' : ''}{test.percentageChange.toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Results - 2 Column Layout */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* LEFT COLUMN - Chart (60%) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Analysis Card */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                    <p className="rounded-lg border border-[#00FF99]/20 bg-[#00FF99]/5 p-3 text-xs leading-relaxed text-gray-300 backdrop-blur-sm">
                      {stressTestResult.analysis}
                    </p>
                  </div>

                  {/* Portfolio Value Chart */}
                  {stressTestResult.portfolioValue && stressTestResult.portfolioValue.length > 0 && (
                    <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Timeline</h4>
                        <div className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                          stressTestResult.riskLevel === 'Severe' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                          stressTestResult.riskLevel === 'High' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                          stressTestResult.riskLevel === 'Moderate' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900' :
                          'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        }`}>
                          {stressTestResult.riskLevel}
                        </div>
                      </div>
                      
                      <div className="h-72 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={stressTestResult.portfolioValue.map((value: number, index: number) => ({
                              month: index,
                              value: value,
                              recoveryValue: recoveryPath ? calculateRecoveryPath(stressTestResult.portfolioValue, recoveryPath)[index] : null,
                              percentChange: ((value - stressTestResult.portfolioValue[0]) / stressTestResult.portfolioValue[0] * 100).toFixed(1),
                            }))}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fill: '#9ca3af', fontSize: 11 }}
                              label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis 
                              tick={{ fill: '#9ca3af', fontSize: 11 }}
                              width={60}
                              domain={[(dataMin: number) => dataMin * 0.90, (dataMax: number) => dataMax * 1.10]}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="rounded-lg border border-[#00FF99]/30 bg-[#171A1F]/95 p-3 shadow-xl backdrop-blur-sm">
                                      <p className="mb-2 text-xs font-semibold text-[#00FF99]">Month {data.month}</p>
                                      <p className="mb-1 text-sm font-bold text-gray-100">${data.value.toLocaleString()}</p>
                                      <p className={`text-xs font-medium ${parseFloat(data.percentChange) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {parseFloat(data.percentChange) > 0 ? '+' : ''}{data.percentChange}% from start
                                      </p>
                                      {recoveryPath && data.recoveryValue && (
                                        <p className="mt-2 text-xs text-[#9B59B6]">Recovery: ${data.recoveryValue.toLocaleString()}</p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#00FF99" 
                              strokeWidth={3}
                              dot={false}
                              activeDot={{ r: 6, fill: '#00FF99', stroke: '#00FF99', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(0, 255, 153, 0.8))' }}
                              animationBegin={0}
                              animationDuration={600}
                            />
                            {recoveryPath && (
                              <Line 
                                type="monotone" 
                                dataKey="recoveryValue" 
                                stroke="#9B59B6" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                opacity={0.7}
                                animationBegin={0}
                                animationDuration={600}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Recovery Path Selector */}
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recovery Path</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { type: 'v' as const, label: 'V', desc: 'Fast' },
                            { type: 'u' as const, label: 'U', desc: 'Gradual' },
                            { type: 'l' as const, label: 'L', desc: 'Slow' },
                            { type: 'w' as const, label: 'W', desc: 'Double' }
                          ].map((path) => (
                            <button
                              key={path.type}
                              onClick={() => setRecoveryPath(recoveryPath === path.type ? null : path.type)}
                              className={`btn-ripple rounded border px-2 py-1.5 text-xs font-semibold transition-all duration-300 ${
                                recoveryPath === path.type
                                  ? 'border-[#9B59B6] bg-[#9B59B6]/20 text-[#9B59B6] shadow-sm'
                                  : 'border-white/20 bg-[#1C1F26]/50 text-gray-400 hover:border-[#9B59B6]/50 hover:bg-[#9B59B6]/10'
                              }`}
                            >
                              <div className="font-bold">{path.label}</div>
                              <div className="text-[10px] opacity-70">{path.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN - Metrics & Controls (40%) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Key Metrics Card */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Metrics</h4>
                    <div className={`mb-3 rounded-lg border p-3 text-center ${
                      stressTestResult.percentageChange < 0 
                        ? 'border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10' 
                        : 'border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-600/10'
                    }`}>
                      <div className={`text-2xl font-bold ${stressTestResult.percentageChange < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stressTestResult.percentageChange > 0 ? '+' : ''}{stressTestResult.percentageChange.toFixed(1)}%
                      </div>
                      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">Change</div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Initial:</span>
                        <span className="font-semibold text-gray-200">${(stressTestResult.portfolioValue[0] / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Final:</span>
                        <span className="font-semibold text-gray-200">${(stressTestResult.finalValue / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-semibold text-gray-200">{stressTestResult.portfolioValue.length - 1}mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Asset Impact with Filtering */}
                  <div className="rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Asset Impact</h4>
                      <button
                        onClick={() => {
                          if (stressTestResult.impact) {
                            const allAssets = Object.keys(stressTestResult.impact);
                            setVisibleAssetClasses(
                              visibleAssetClasses.length === allAssets.length ? [] : allAssets
                            );
                          }
                        }}
                        className="text-[10px] text-[#00FF99] hover:underline"
                      >
                        {visibleAssetClasses.length === Object.keys(stressTestResult.impact || {}).length ? 'Hide' : 'All'}
                      </button>
                    </div>
                    
                    {/* Filter Toggles */}
                    <div className="mb-2 flex flex-wrap gap-1">
                      {stressTestResult.impact && Object.keys(stressTestResult.impact).map((asset) => (
                        <button
                          key={asset}
                          onClick={() => {
                            setVisibleAssetClasses(prev =>
                              prev.includes(asset)
                                ? prev.filter(a => a !== asset)
                                : [...prev, asset]
                            );
                          }}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-300 ${
                            visibleAssetClasses.includes(asset)
                              ? 'bg-[#00FF99]/20 text-[#00FF99] border border-[#00FF99]/50'
                              : 'bg-gray-700/50 text-gray-500 border border-gray-600'
                          }`}
                        >
                          {asset}
                        </button>
                      ))}
                    </div>

                    {/* Asset Cards */}
                    <div className="space-y-1.5">
                      {stressTestResult.impact && Object.entries(stressTestResult.impact)
                        .filter(([asset]) => visibleAssetClasses.includes(asset))
                        .map(([asset, impact]: [string, any]) => (
                        <div 
                          key={asset} 
                          className="rounded border border-white/10 bg-gradient-to-br from-[#1C1F26]/60 to-[#171A1F]/60 p-2 transition-all duration-300 hover:border-[#00FF99]/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium capitalize text-gray-400">{asset}</span>
                            <span className={`text-sm font-bold ${impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {impact > 0 ? '+' : ''}{impact.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Portfolio Rebalancing - Full Width */}
              <div className="mt-4 rounded-sm border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Rebalance Portfolio</h4>
                <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {tempPortfolioAllocation.map((item, index) => (
                    <div key={item.name}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-500">{item.name}</span>
                        <span className="font-semibold text-[#00FF99]">{item.value}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={item.value}
                        onChange={(e) => updateTempAllocation(index, parseInt(e.target.value))}
                        className="w-full accent-[#00FF99]"
                        style={{ height: '3px' }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="rounded border border-white/20 bg-[#1C1F26]/50 px-4 py-1.5 text-center">
                    <span className={`text-xs font-bold ${Math.abs(getTotalAllocation() - 100) < 0.1 ? 'text-[#00FF99]' : 'text-red-400'}`}>
                      Total: {getTotalAllocation().toFixed(0)}%
                    </span>
                  </div>
                  
                  <button
                    onClick={testRebalancedPortfolio}
                    disabled={stressTestLoading || Math.abs(getTotalAllocation() - 100) > 0.1}
                    className="btn-ripple rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#00B4E6] px-6 py-2 text-sm font-semibold text-white shadow-md shadow-[#00D4FF]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
        )}
        </>
      )}

      {/* Saved Portfolios Modal - Outside main views */}
      {showSavedPortfolios && savedPortfolios.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 p-4">
          <div className="mx-auto max-w-4xl animate-fade-in">
            <div className="mb-8 rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-6">
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
          <div className="w-full max-w-md animate-fade-in rounded-sm border border-[#2A2A2A] bg-[#1A1A1A] p-8">
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
