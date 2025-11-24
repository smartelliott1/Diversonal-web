// Sector mapping logic - extracts sectors from portfolio and maps to file names

import { fundamentalsConfig, SectorName } from './fundamentalsConfig';

interface PortfolioItem {
  name: string;
  value: number;
  breakdown?: string;
}

/**
 * Extracts sector names from portfolio breakdown strings
 * Example: "S&P 500: 25%, Tech stocks: 10%" -> ["Technology"]
 */
export function extractSectorsFromPortfolio(portfolio: PortfolioItem[]): string[] {
  const sectors = new Set<string>();

  for (const item of portfolio) {
    // Check if this is an Equities allocation with breakdown
    if (item.name === 'Equities' && item.breakdown) {
      // Parse breakdown string for sector mentions
      const breakdown = item.breakdown.toLowerCase();
      
      // Check each sector from config
      for (const sectorName of Object.keys(fundamentalsConfig.sectorMapping)) {
        const lowerSectorName = sectorName.toLowerCase();
        
        // Check for exact matches or common variations
        if (breakdown.includes(lowerSectorName) ||
            breakdown.includes(sectorName.toLowerCase().replace(' ', '-')) ||
            // Special mappings
            (sectorName === 'Technology' && (breakdown.includes('tech') || breakdown.includes('technology'))) ||
            (sectorName === 'Healthcare' && breakdown.includes('health')) ||
            (sectorName === 'Finance' && (breakdown.includes('finance') || breakdown.includes('financial'))) ||
            (sectorName === 'Quantum Computing' && breakdown.includes('quantum')) ||
            (sectorName === 'Blockchain Integration' && breakdown.includes('blockchain')) ||
            (sectorName === 'Cryptocurrency' && (breakdown.includes('crypto') || breakdown.includes('cryptocurrency'))) ||
            (sectorName === 'Precious Metals' && (breakdown.includes('precious') || breakdown.includes('metal') || breakdown.includes('gold'))) ||
            (sectorName === 'Real Estate' && (breakdown.includes('real estate') || breakdown.includes('reit'))) ||
            (sectorName === 'Aerospace' && (breakdown.includes('aerospace') || breakdown.includes('space'))) ||
            (sectorName === 'AI' && (breakdown.includes('ai') || breakdown.includes('artificial intelligence'))) ||
            (sectorName === 'Biotech' && (breakdown.includes('biotech') || breakdown.includes('biotechnology'))) ||
            (sectorName === 'Robotics' && (breakdown.includes('robotics') || breakdown.includes('automation') || breakdown.includes('robot'))) ||
            (sectorName === 'Consumer/Retail' && (breakdown.includes('consumer') || breakdown.includes('retail') || breakdown.includes('restaurant') || breakdown.includes('apparel')))
        ) {
          sectors.add(sectorName);
        }
      }
    }
    
    // Also check top-level asset class names that match sectors
    const itemNameLower = item.name.toLowerCase();
    for (const sectorName of Object.keys(fundamentalsConfig.sectorMapping)) {
      if (itemNameLower === sectorName.toLowerCase()) {
        sectors.add(sectorName);
      }
    }
  }

  return Array.from(sectors);
}

/**
 * Maps sector names to file names
 */
export function mapSectorsToFileNames(sectorNames: string[]): string[] {
  const fileNames: string[] = [];
  
  for (const sectorName of sectorNames) {
    const fileName = fundamentalsConfig.sectorMapping[sectorName as SectorName];
    if (fileName) {
      fileNames.push(fileName);
    } else {
      console.warn(`[SectorMapper] Unknown sector: ${sectorName}`);
    }
  }
  
  return fileNames;
}

/**
 * Gets default sectors to load (fallback when no sectors found in portfolio)
 */
export function getDefaultSectors(): string[] {
  // Return top 3 sectors by stock count: Technology, Healthcare, Finance
  return ['technology', 'healthcare', 'finance'];
}

/**
 * Main function: Extract sectors from portfolio and return file names to load
 */
export function getSectorFilesToLoad(portfolio: PortfolioItem[]): string[] {
  // Extract sectors from portfolio
  const extractedSectors = extractSectorsFromPortfolio(portfolio);
  
  // If we found sectors, map them to file names
  if (extractedSectors.length > 0) {
    const fileNames = mapSectorsToFileNames(extractedSectors);
    console.log(`[SectorMapper] Found ${extractedSectors.length} sectors:`, extractedSectors);
    console.log(`[SectorMapper] Loading files:`, fileNames);
    return fileNames;
  }
  
  // Fallback to default sectors
  console.log('[SectorMapper] No sectors found in portfolio, using defaults');
  return getDefaultSectors();
}

/**
 * Formats sector data for Claude's prompt
 */
export function formatSectorDataForClaude(sectorsData: Record<string, any>): string {
  let prompt = '**AVAILABLE STOCKS WITH REAL FUNDAMENTALS:**\n\n';
  prompt += 'Use ONLY these stocks when making recommendations. All data is current and verified.\n\n';

  // Track seen tickers to avoid duplicates
  const seenTickers = new Set<string>();

  for (const [fileName, sectorData] of Object.entries(sectorsData)) {
    if (!sectorData || !sectorData.stocks) continue;

    prompt += `**${sectorData.sector.toUpperCase()} (${sectorData.stockCount} stocks):**\n`;
    
    // Sort stocks by market cap (if available)
    const stocks = Object.entries(sectorData.stocks);
    
    for (const [ticker, data] of stocks) {
      // Skip if we've already included this ticker
      if (seenTickers.has(ticker)) continue;
      seenTickers.add(ticker);
      const profile = (data as any).profile;
      const ratios = (data as any).ratios;
      const keyMetrics = (data as any).keyMetrics;
      
      if (!profile) continue;

      // Format market cap
      const marketCap = profile.marketCap;
      const marketCapFormatted = marketCap >= 1e12 ? `$${(marketCap / 1e12).toFixed(2)}T` :
                                  marketCap >= 1e9 ? `$${(marketCap / 1e9).toFixed(1)}B` :
                                  marketCap >= 1e6 ? `$${(marketCap / 1e6).toFixed(0)}M` : `$${marketCap}`;

      // Beta - volatility relative to market
      const beta = profile.beta ? profile.beta.toFixed(2) : 'N/A';

      // Key metrics - Calculate P/E in real-time for accuracy
      const incomeStatement = (data as any).incomeStatement;
      const incomeStatementHistory = (data as any).incomeStatementHistory || [];
      const currentPrice = profile.price;
      const eps = incomeStatement?.eps;
      
      // Calculate real-time P/E = Current Price / Trailing 12-month EPS
      const pe = (eps && eps > 0) 
        ? (currentPrice / eps).toFixed(1) 
        : (ratios?.priceToEarningsRatio?.toFixed(1) || 'N/A');
      
      // Revenue Growth - YoY percentage calculated from historical data
      let revenueGrowth = 'N/A';
      if (incomeStatementHistory.length >= 2) {
        const currentRevenue = incomeStatementHistory[0]?.revenue;
        const previousRevenue = incomeStatementHistory[1]?.revenue;
        
        if (currentRevenue && previousRevenue && previousRevenue > 0) {
          const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
          revenueGrowth = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
        }
      }
      
      const roe = ratios?.returnOnEquity ? `${(ratios.returnOnEquity * 100).toFixed(1)}%` : 'N/A';
      const debtToEquity = ratios?.debtToEquityRatio?.toFixed(2) || 'N/A';
      const profitMargin = ratios?.netProfitMargin ? `${(ratios.netProfitMargin * 100).toFixed(1)}%` : 'N/A';

      prompt += `- ${ticker} (${profile.companyName}): Market Cap ${marketCapFormatted} | Beta ${beta} | P/E ${pe} | Revenue Growth ${revenueGrowth} | ROE ${roe} | Debt/Equity ${debtToEquity} | Profit Margin ${profitMargin}\n`;
    }
    
    prompt += '\n';
  }

  prompt += '\n**INSTRUCTIONS:**\n';
  prompt += '- Pick the best 3-5 stocks from relevant sectors based on fundamentals\n';
  prompt += '- Explain WHY each stock is a good fit (cite specific metrics above)\n';
  prompt += '- Consider valuation, growth, profitability, and risk\n';
  prompt += '- Do NOT recommend stocks not in this list\n';

  return prompt;
}

