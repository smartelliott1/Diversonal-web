"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PortfolioItem {
  name: string;
  value: number;
  color: string;
  breakdown?: string;
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
  portfolioRef?: React.RefObject<HTMLDivElement | null>;
  onSaveSuccess?: () => void;
}

export default function SavePortfolioModal({
  isOpen,
  onClose,
  portfolioData,
  formData,
  detailedRecommendations,
  portfolioRef,
  onSaveSuccess,
}: SavePortfolioModalProps) {
  const { data: session } = useSession();
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeOption, setActiveOption] = useState<'save' | 'pdf'>('save');

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
    if (!portfolioRef?.current) {
      toast.error("Unable to export - portfolio view not found");
      return;
    }

    setExporting(true);
    const loadingToast = toast.loading("Generating PDF...");

    try {
      // Capture the portfolio section
      const canvas = await html2canvas(portfolioRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0F0F0F',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Add header
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      pdf.setTextColor(0, 255, 153);
      pdf.setFontSize(24);
      pdf.text('DIVERSONAL', 14, 15);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('AI-Powered Portfolio Allocation', 14, 22);
      
      pdf.setTextColor(128, 128, 128);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      // Add the captured image
      pdf.addImage(imgData, 'PNG', imgX, 35, imgWidth * ratio * 0.9, imgHeight * ratio * 0.9);

      // Add footer
      pdf.setTextColor(128, 128, 128);
      pdf.setFontSize(8);
      pdf.text('This report is for informational purposes only and does not constitute financial advice.', 14, pdfHeight - 10);

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
      <div className="relative w-full max-w-lg mx-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
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
          <div className="flex gap-2 p-1 bg-[#1A1A1A] rounded-xl mb-6">
            <button
              onClick={() => setActiveOption('save')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-[#666] focus:border-[#00FF99] focus:outline-none transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !saving) handleSaveToAccount();
                      }}
                    />
                  </div>
                  
                  {/* Portfolio Preview */}
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
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
                    className="w-full py-3 bg-[#00FF99] text-black rounded-xl font-semibold hover:bg-[#00FF99]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-[#666] focus:border-[#00FF99] focus:outline-none transition-colors"
                />
              </div>

              <div className="p-4 bg-[#1A1A1A] rounded-xl">
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
                className="w-full py-3 bg-[#00FF99] text-black rounded-xl font-semibold hover:bg-[#00FF99]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

