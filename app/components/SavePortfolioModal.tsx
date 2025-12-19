"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface PortfolioItem {
  name: string;
  value: number;
  color: string;
  breakdown?: string;
}

interface StockPrice {
  price: number;
  change: number;
  changePercentage: number;
  exchange: string | null;
}

interface SavePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioItem[];
  formData: {
    age: string;
    risk: number;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  } | null;
  detailedRecommendations: any;
  stockPrices?: Record<string, StockPrice>;
  onSaveSuccess?: () => void;
  // For standalone export (from My Portfolios page)
  exportOnly?: boolean;
  portfolioName?: string;
}

export default function SavePortfolioModal({
  isOpen,
  onClose,
  portfolioData,
  formData,
  detailedRecommendations,
  stockPrices,
  onSaveSuccess,
  exportOnly = false,
  portfolioName = '',
}: SavePortfolioModalProps) {
  const { data: session } = useSession();
  const [saveName, setSaveName] = useState(portfolioName);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeOption, setActiveOption] = useState<'save' | 'pdf'>(exportOnly ? 'pdf' : 'save');

  // Update saveName when portfolioName changes
  useEffect(() => {
    if (portfolioName) {
      setSaveName(portfolioName);
    }
  }, [portfolioName]);

  // Set to PDF tab when exportOnly mode
  useEffect(() => {
    if (exportOnly) {
      setActiveOption('pdf');
    }
  }, [exportOnly]);

  const handleSaveToAccount = async () => {
    if (!session) {
      toast.error("Please sign in to save portfolios");
      return;
    }

    if (!saveName.trim()) {
      toast.error("Please enter a name for your portfolio");
      return;
    }

    if (!formData) {
      toast.error("No portfolio data to save");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          age: formData.age,
          risk: formData.risk,
          horizon: formData.horizon,
          capital: formData.capital,
          goal: formData.goal,
          sectors: formData.sectors,
          portfolioData: portfolioData,
          detailedRecommendations: detailedRecommendations,
          isManuallySaved: true, // This marks it as manually saved
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save portfolio");
      }

      toast.success("Portfolio saved successfully!");
      setSaveName("");
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving portfolio:", error);
      toast.error("Failed to save portfolio");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!portfolioData || portfolioData.length === 0) {
      toast.error("No portfolio data to export");
      return;
    }

    setExporting(true);
    const loadingToast = toast.loading("Generating PDF...");

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Helper function to convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 };
      };

      // Background
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // ===== HEADER =====
      pdf.setTextColor(0, 255, 153);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DIVERSONAL', margin, yPos + 8);
      
      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI-Powered Portfolio Allocation', margin, yPos + 16);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })}`, margin, yPos + 23);

      yPos += 35;

      // Divider line
      pdf.setDrawColor(40, 40, 40);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // ===== INVESTOR PROFILE =====
      if (formData) {
        pdf.setTextColor(0, 255, 153);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INVESTOR PROFILE', margin, yPos);
        yPos += 8;

        const profileItems = [
          { label: 'Age', value: formData.age },
          { label: 'Risk Tolerance', value: `${formData.risk}/100 (${formData.risk >= 70 ? 'Aggressive' : formData.risk >= 40 ? 'Moderate' : 'Conservative'})` },
          { label: 'Time Horizon', value: formData.horizon },
          { label: 'Capital', value: `$${parseFloat(formData.capital.replace(/[^0-9.]/g, '')).toLocaleString()}` },
          { label: 'Goal', value: formData.goal.length > 60 ? formData.goal.substring(0, 60) + '...' : formData.goal },
        ];

        pdf.setFontSize(10);
        profileItems.forEach((item) => {
          pdf.setTextColor(100, 100, 100);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${item.label}:`, margin, yPos);
          pdf.setTextColor(220, 220, 220);
          pdf.text(item.value, margin + 35, yPos);
          yPos += 6;
        });

        if (formData.sectors.length > 0) {
          pdf.setTextColor(100, 100, 100);
          pdf.text('Sectors:', margin, yPos);
          pdf.setTextColor(220, 220, 220);
          pdf.text(formData.sectors.slice(0, 4).join(', ') + (formData.sectors.length > 4 ? '...' : ''), margin + 35, yPos);
          yPos += 6;
        }

        yPos += 8;
      }

      // ===== PORTFOLIO ALLOCATION =====
      pdf.setTextColor(0, 255, 153);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PORTFOLIO ALLOCATION', margin, yPos);
      yPos += 10;

      // Draw horizontal bar chart for allocation
      const barHeight = 12;
      const barWidth = pageWidth - (margin * 2);
      
      // Background bar
      pdf.setFillColor(30, 30, 30);
      pdf.roundedRect(margin, yPos, barWidth, barHeight, 2, 2, 'F');

      // Colored segments
      let xOffset = margin;
      portfolioData.forEach((item) => {
        const segmentWidth = (item.value / 100) * barWidth;
        if (segmentWidth > 0) {
          const rgb = hexToRgb(item.color);
          pdf.setFillColor(rgb.r, rgb.g, rgb.b);
          pdf.rect(xOffset, yPos, segmentWidth, barHeight, 'F');
          xOffset += segmentWidth;
        }
      });

      yPos += barHeight + 10;

      // Asset class breakdown table
      pdf.setFontSize(10);
      portfolioData.forEach((item) => {
        // Color dot
        const rgb = hexToRgb(item.color);
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.circle(margin + 3, yPos - 1.5, 2.5, 'F');

        // Asset class name
        pdf.setTextColor(220, 220, 220);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.name, margin + 10, yPos);

        // Percentage
        pdf.setTextColor(0, 255, 153);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.value}%`, pageWidth - margin - 15, yPos);

        // Dollar amount if we have capital
        if (formData?.capital) {
          const capital = parseFloat(formData.capital.replace(/[^0-9.]/g, ''));
          const amount = (item.value / 100) * capital;
          pdf.setTextColor(150, 150, 150);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, pageWidth - margin - 45, yPos);
        }

        yPos += 8;
      });

      yPos += 5;

      // ===== STOCK RECOMMENDATIONS =====
      if (detailedRecommendations && Object.keys(detailedRecommendations).length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 80) {
          pdf.addPage();
          pdf.setFillColor(10, 10, 10);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          yPos = margin;
        }

        pdf.setTextColor(0, 255, 153);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECOMMENDED HOLDINGS', margin, yPos);
        yPos += 10;

        // Calculate total capital
        const totalCapital = formData?.capital 
          ? parseFloat(formData.capital.replace(/[^0-9.]/g, '')) 
          : 0;

        Object.entries(detailedRecommendations).forEach(([assetClass, data]: [string, any]) => {
          if (!data?.recommendations || data.recommendations.length === 0) return;

          // Get asset class allocation percentage
          const assetClassAllocation = portfolioData.find(p => p.name === assetClass)?.value || 0;
          const assetClassDollars = (assetClassAllocation / 100) * totalCapital;
          const numRecs = data.recommendations.length;

          // Calculate weights for each ticker based on position size
          let totalWeight = 0;
          const tickerWeights: Record<string, number> = {};
          data.recommendations.forEach((rec: any) => {
            const weight = rec.positionSize === 'Large' ? 3 : rec.positionSize === 'Medium' ? 2 : 1;
            tickerWeights[rec.ticker] = weight;
            totalWeight += weight;
          });

          // Check if we need a new page
          if (yPos > pageHeight - 50) {
            pdf.addPage();
            pdf.setFillColor(10, 10, 10);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            yPos = margin;
          }

          // Asset class header with total
          pdf.setTextColor(180, 180, 180);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(assetClass.toUpperCase(), margin, yPos);
          if (totalCapital > 0) {
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`$${assetClassDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })} total`, margin + 50, yPos);
          }
          yPos += 8;

          // Tickers
          const isCrypto = assetClass === 'Cryptocurrencies';
          
          data.recommendations.slice(0, 8).forEach((rec: any) => {
            if (yPos > pageHeight - 15) {
              pdf.addPage();
              pdf.setFillColor(10, 10, 10);
              pdf.rect(0, 0, pageWidth, pageHeight, 'F');
              yPos = margin;
            }

            // Calculate this ticker's allocation
            const tickerWeight = tickerWeights[rec.ticker] || 1;
            const tickerShare = totalWeight > 0 ? tickerWeight / totalWeight : 1 / numRecs;
            const tickerDollars = tickerShare * assetClassDollars;

            // Ticker symbol
            pdf.setTextColor(0, 255, 153);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(rec.ticker, margin + 5, yPos);

            // Company name (truncated)
            pdf.setTextColor(150, 150, 150);
            pdf.setFont('helvetica', 'normal');
            const maxNameLength = stockPrices ? 25 : 35;
            const name = rec.name.length > maxNameLength ? rec.name.substring(0, maxNameLength) + '...' : rec.name;
            pdf.text(name, margin + 22, yPos);

            // Dollar allocation
            if (totalCapital > 0) {
              pdf.setTextColor(220, 220, 220);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`$${tickerDollars.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, margin + 95, yPos);
            }

            // Share/unit count if we have price data
            if (stockPrices && stockPrices[rec.ticker] && totalCapital > 0) {
              const price = stockPrices[rec.ticker].price;
              if (price > 0) {
                const units = tickerDollars / price;
                pdf.setTextColor(0, 255, 153);
                pdf.setFont('helvetica', 'normal');
                const unitText = isCrypto 
                  ? `${units < 1 ? units.toFixed(6) : units.toFixed(4)} ${rec.ticker}`
                  : `${units.toFixed(2)} shares`;
                pdf.text(unitText, margin + 125, yPos);
              }
            }

            // Position size badge
            const sizeColor = rec.positionSize === 'Large' ? { r: 0, g: 255, b: 153 } : 
                             rec.positionSize === 'Medium' ? { r: 234, g: 179, b: 8 } : 
                             { r: 59, g: 130, b: 246 };
            pdf.setTextColor(sizeColor.r, sizeColor.g, sizeColor.b);
            pdf.text(rec.positionSize || 'Medium', pageWidth - margin - 15, yPos);

            yPos += 6;
          });

          yPos += 6;
        });
      }

      // ===== FOOTER =====
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'This report is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results.',
        margin, 
        pageHeight - 10
      );
      pdf.text('Generated by Diversonal • diversonal.com', margin, pageHeight - 6);

      // Download
      const fileName = saveName.trim() 
        ? `${saveName.trim().replace(/[^a-z0-9]/gi, '_')}_portfolio.pdf`
        : `diversonal_portfolio_${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success("PDF exported successfully!");
      onClose();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-sm shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-semibold text-white">Save Portfolio</h2>
          <button
            onClick={onClose}
            className="text-[#808080] hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Option Tabs */}
          <div className="flex gap-2 p-1 bg-[#1A1A1A] rounded-sm mb-6">
            <button
              onClick={() => setActiveOption('save')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-sm font-medium transition-all ${
                activeOption === 'save'
                  ? 'bg-[#00FF99] text-black'
                  : 'text-[#808080] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save to Account
            </button>
            <button
              onClick={() => setActiveOption('pdf')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-sm font-medium transition-all ${
                activeOption === 'pdf'
                  ? 'bg-[#00FF99] text-black'
                  : 'text-[#808080] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as PDF
            </button>
          </div>

          {/* Save to Account Option */}
          {activeOption === 'save' && (
            <div className="space-y-4">
              {!session ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#808080]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-[#808080] mb-2">Sign in required</p>
                  <p className="text-sm text-[#666]">Sign in to save portfolios to your account</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#B4B4B4] mb-2">
                      Portfolio Name
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="e.g., My Growth Portfolio"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm text-white placeholder-[#666] focus:border-[#00FF99] focus:outline-none transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !saving) handleSaveToAccount();
                      }}
                    />
                  </div>
                  
                  {/* Portfolio Preview */}
                  <div className="p-4 bg-[#1A1A1A] rounded-sm">
                    <p className="text-xs text-[#808080] uppercase tracking-wider mb-3">Preview</p>
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-[#0A0A0A]">
                      {portfolioData.map((item, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${item.value}%`, backgroundColor: item.color }}
                          title={`${item.name}: ${item.value}%`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {portfolioData.slice(0, 4).map((item, idx) => (
                        <span key={idx} className="text-xs text-[#808080]">
                          {item.name}: {item.value}%
                        </span>
                      ))}
                      {portfolioData.length > 4 && (
                        <span className="text-xs text-[#666]">+{portfolioData.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveToAccount}
                    disabled={saving || !saveName.trim()}
                    className="w-full py-3 bg-[#00FF99] text-black rounded-sm font-semibold hover:bg-[#00FF99]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Portfolio
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Export PDF Option */}
          {activeOption === 'pdf' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#B4B4B4] mb-2">
                  File Name (optional)
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="diversonal_portfolio"
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm text-white placeholder-[#666] focus:border-[#00FF99] focus:outline-none transition-colors"
                />
              </div>

              <div className="p-4 bg-[#1A1A1A] rounded-sm">
                <p className="text-xs text-[#808080] uppercase tracking-wider mb-2">Export includes</p>
                <ul className="space-y-2 text-sm text-[#B4B4B4]">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Portfolio allocation chart
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Asset class breakdown
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Investment profile summary
                  </li>
                </ul>
              </div>

              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full py-3 bg-[#00FF99] text-black rounded-sm font-semibold hover:bg-[#00FF99]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

