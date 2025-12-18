// User settings stored in localStorage
// These settings affect AI responses, form defaults, and data handling

export interface UserSettings {
  // AI Preferences
  aiResponseStyle: 'concise' | 'balanced' | 'detailed';
  
  // Portfolio Defaults
  defaultRiskTolerance: number;  // 0-100
  defaultTimeHorizon: string;    // '1-3 years', '3-5 years', '5-10 years', '10+ years'
  
  // Data & Privacy
  autoSaveEnabled: boolean;
}

const SETTINGS_KEY = 'diversonal-user-settings';

const DEFAULT_SETTINGS: UserSettings = {
  aiResponseStyle: 'balanced',
  defaultRiskTolerance: 50,
  defaultTimeHorizon: '3-5 years',
  autoSaveEnabled: true,
};

export function getUserSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all keys exist
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('[Settings] Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    console.log('[Settings] Saved:', updated);
    return updated;
  } catch (error) {
    console.error('[Settings] Error saving settings:', error);
    return getUserSettings();
  }
}

export function resetUserSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[Settings] Error resetting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Get AI prompt modifiers based on response style
export function getAIStyleModifiers(style: UserSettings['aiResponseStyle']): {
  maxTokens: number;
  promptSuffix: string;
} {
  switch (style) {
    case 'concise':
      return {
        maxTokens: 150,
        promptSuffix: 'Be very brief and direct. 2-3 sentences max.',
      };
    case 'detailed':
      return {
        maxTokens: 500,
        promptSuffix: 'Provide comprehensive analysis with specific details and examples.',
      };
    case 'balanced':
    default:
      return {
        maxTokens: 300,
        promptSuffix: 'Be conversational and informative.',
      };
  }
}

