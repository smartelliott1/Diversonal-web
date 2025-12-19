// TTL-based cache with sessionStorage persistence
// Used for caching API responses and form state across page navigations

interface CacheItem<T> {
  data: T;
  expiry: number | null;
}

export const sessionCache = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      
      const { data, expiry } = JSON.parse(item) as CacheItem<T>;
      
      // Check if expired
      if (expiry && Date.now() > expiry) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`[SessionCache] Error reading key "${key}":`, error);
      return null;
    }
  },

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      const expiry = ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null;
      const item: CacheItem<T> = { data, expiry };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`[SessionCache] Error writing key "${key}":`, error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },

  // Clear all diversonal cache keys
  clearAll(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('diversonal-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  },

  // Check if a key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }
};

// Cache keys used across the app
export const CACHE_KEYS = {
  MARKET_CONTEXT: 'diversonal-market-context',
  STOCK_RECOMMENDATIONS: 'diversonal-stock-recommendations',
  STOCK_DATA: 'diversonal-stock-data',
  STOCK_PRICES: 'diversonal-stock-prices',
  FORM_STATE: 'diversonal-form-state',
  PORTFOLIO_STATE: 'diversonal-portfolio-state',
  MY_PORTFOLIOS: 'diversonal-my-portfolios',
  PORTFOLIO_HISTORY: 'diversonal-portfolio-history',
  // Full state restoration keys
  STOCK_MODAL_CACHE: 'diversonal-stock-modal-cache',
  ALLOCATION_CHAT: 'diversonal-allocation-chat',
  LOADED_PORTFOLIO_ID: 'diversonal-loaded-portfolio-id',
} as const;

// TTL values in minutes
export const CACHE_TTL = {
  MARKET_CONTEXT: 2,           // Market data refreshes frequently
  STOCK_DATA: 10,              // Key metrics/Fear Greed - 10 minutes site-wide
  STOCK_PRICES: 1,             // Prices - 1 minute, auto-refetch when user is active
  RECOMMENDATIONS: undefined,  // INDEFINITE - never expire stock picks
  FORM_STATE: undefined,       // No expiry - persist until cleared
  PORTFOLIO_STATE: undefined,  // No expiry - persist until cleared
  MY_PORTFOLIOS: undefined,    // INDEFINITE - portfolio names/list persist until manually invalidated
  PORTFOLIO_HISTORY: undefined, // INDEFINITE - history persists until manually invalidated
  ALLOCATION_CHAT: undefined,  // INDEFINITE - never re-fetch allocation reasoning
} as const;

