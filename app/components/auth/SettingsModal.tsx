"use client";

import { useState, useEffect } from "react";
import { getUserSettings, saveUserSettings, UserSettings } from "@/app/lib/userSettings";
import { sessionCache } from "@/app/lib/sessionCache";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({
    aiResponseStyle: 'balanced',
    defaultRiskTolerance: 50,
    defaultTimeHorizon: '3-5 years',
    autoSaveEnabled: true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const currentSettings = getUserSettings();
      setSettings(currentSettings);
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveUserSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const handleClearData = () => {
    sessionCache.clearAll();
    setShowClearConfirm(false);
    onClose();
    // Reload to clear any in-memory state
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-black border border-[#2A2A2A] rounded-lg shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00FF99]/10">
              <svg className="w-5 h-5 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Settings</h3>
              <p className="text-xs text-gray-400">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
          
          {/* AI Preferences Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">AI Preferences</h4>
            </div>
            
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-400 mb-2 block">Response Style</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['concise', 'balanced', 'detailed'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => handleChange('aiResponseStyle', style)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        settings.aiResponseStyle === style
                          ? 'bg-[#00FF99] text-black'
                          : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white border border-[#2A2A2A]'
                      }`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {settings.aiResponseStyle === 'concise' && 'Brief, to-the-point responses (2-3 sentences)'}
                  {settings.aiResponseStyle === 'balanced' && 'Conversational responses with key details'}
                  {settings.aiResponseStyle === 'detailed' && 'Comprehensive analysis with examples'}
                </p>
              </label>
            </div>
          </div>

          {/* Portfolio Defaults Section */}
          <div className="pt-4 border-t border-[#2A2A2A]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Portfolio Defaults</h4>
            </div>
            
            <div className="space-y-4">
              {/* Default Risk Tolerance */}
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Default Risk Tolerance</span>
                  <span className="text-sm font-semibold text-[#00FF99]">{settings.defaultRiskTolerance}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.defaultRiskTolerance}
                  onChange={(e) => handleChange('defaultRiskTolerance', parseInt(e.target.value))}
                  className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#00FF99]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </label>

              {/* Default Time Horizon */}
              <label className="block">
                <span className="text-sm text-gray-400 mb-2 block">Default Time Horizon</span>
                <select
                  value={settings.defaultTimeHorizon}
                  onChange={(e) => handleChange('defaultTimeHorizon', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm focus:outline-none focus:border-[#00FF99]/50"
                >
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </label>
            </div>
          </div>

          {/* Data & Privacy Section */}
          <div className="pt-4 border-t border-[#2A2A2A]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#00FF99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Data & Privacy</h4>
            </div>
            
            <div className="space-y-4">
              {/* Auto-save Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-white">Auto-save Portfolios</span>
                  <p className="text-xs text-gray-500">Automatically save portfolios to your account</p>
                </div>
                <button
                  onClick={() => handleChange('autoSaveEnabled', !settings.autoSaveEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoSaveEnabled ? 'bg-[#00FF99]' : 'bg-[#2A2A2A]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.autoSaveEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Clear Data Button */}
              <div className="pt-2">
                {showClearConfirm ? (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-400 mb-3">This will clear all cached data including recommendations and form state. Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearData}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Yes, Clear All
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] text-gray-400 text-sm font-medium hover:bg-[#3A3A3A] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 text-sm hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Cached Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2A2A2A]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-[#00FF99] text-black hover:bg-[#00E689]'
                : 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

