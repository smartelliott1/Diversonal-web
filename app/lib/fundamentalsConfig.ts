// Configuration for fundamentals fetching system

export const fundamentalsConfig = {
  // FMP API settings
  fmpApiKey: process.env.FMP_API_KEY || '',
  fmpBaseUrl: 'https://financialmodelingprep.com',
  
  // Rate limiting (250 calls/min with safety buffer)
  rateLimit: {
    callsPerMinute: 250,
    burstSize: 50, // Allow bursts up to 50 calls
  },
  
  // Cron job settings
  cronSecret: process.env.CRON_SECRET || '',
  
  // Storage paths
  storagePath: '/public/data/fundamentals/latest',
  
  // FMP endpoints to fetch per stock (5 total)
  endpoints: [
    '/stable/profile',
    '/stable/ratios',
    '/stable/key-metrics',
    '/stable/income-statement',
    '/stable/analyst-estimates',
  ],
  
  // Sector mapping (frontend names to file names)
  sectorMapping: {
    'Technology': 'technology',
    'Healthcare': 'healthcare',
    'Finance': 'finance',
    'Quantum Computing': 'quantum-computing',
    'Energy': 'energy',
    'Blockchain Integration': 'blockchain',
    'Cryptocurrency': 'cryptocurrency',
    'Precious Metals': 'precious-metals',
    'Real Estate': 'real-estate',
    'Aerospace': 'aerospace',
    'AI': 'ai',
    'Biotech': 'biotech',
    'Robotics': 'robotics',
    'Consumer/Retail': 'consumer-retail',
  } as const,
  
  // Request queue settings
  queue: {
    maxConcurrent: 3, // Claude API limit
    estimatedSecondsPerRequest: 30,
    timeoutMinutes: 2,
  },
};

export type SectorName = keyof typeof fundamentalsConfig.sectorMapping;
export type SectorFileName = typeof fundamentalsConfig.sectorMapping[SectorName];

