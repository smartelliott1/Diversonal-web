// Storage manager for fundamentals data organized by sector

import fs from 'fs';
import path from 'path';
import { StockFundamentals } from './fetchStockFundamentals';
import { fundamentalsConfig } from './fundamentalsConfig';

export interface SectorData {
  sector: string;
  stockCount: number;
  lastUpdated: string;
  stocks: Record<string, Omit<StockFundamentals, 'ticker' | 'sector'>>;
}

export interface IndexMetadata {
  lastUpdated: string;
  totalStocks: number;
  sectors: Record<string, number>; // sector name -> stock count
}

/**
 * Groups stocks by sector
 */
export function groupBySector(stocks: StockFundamentals[]): Map<string, StockFundamentals[]> {
  const grouped = new Map<string, StockFundamentals[]>();
  
  for (const stock of stocks) {
    if (!grouped.has(stock.sector)) {
      grouped.set(stock.sector, []);
    }
    grouped.get(stock.sector)!.push(stock);
  }
  
  return grouped;
}

/**
 * Saves fundamentals data organized by sector
 */
export async function saveFundamentals(stocks: StockFundamentals[]): Promise<void> {
  console.log('[Storage] Saving fundamentals data...');
  
  // Ensure storage directory exists
  const storageDir = path.join(process.cwd(), 'public', 'data', 'fundamentals', 'latest');
  
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
      console.log(`[Storage] Created directory: ${storageDir}`);
    }
  } catch (error) {
    console.error('[Storage] Error creating directory:', error);
    throw error;
  }

  // Group stocks by sector
  const groupedStocks = groupBySector(stocks);
  const timestamp = new Date().toISOString();
  const sectorCounts: Record<string, number> = {};

  // Save each sector to its own file
  for (const [sector, sectorStocks] of groupedStocks.entries()) {
    // Convert sector name to filename (e.g., "Technology" -> "technology")
    const filename = sector.toLowerCase().replace(/\s+/g, '-');
    
    // Build sector data object
    const sectorData: SectorData = {
      sector,
      stockCount: sectorStocks.length,
      lastUpdated: timestamp,
      stocks: {},
    };

    // Add each stock's data
    for (const stock of sectorStocks) {
      sectorData.stocks[stock.ticker] = {
        profile: stock.profile,
        ratios: stock.ratios,
        keyMetrics: stock.keyMetrics,
        incomeStatement: stock.incomeStatement,
        analystEstimates: stock.analystEstimates,
        lastUpdated: stock.lastUpdated,
        error: stock.error,
      };
    }

    // Write sector file
    const filepath = path.join(storageDir, `${filename}.json`);
    try {
      fs.writeFileSync(filepath, JSON.stringify(sectorData, null, 2), 'utf-8');
      console.log(`[Storage] ✓ Saved ${filename}.json (${sectorStocks.length} stocks)`);
      sectorCounts[sector] = sectorStocks.length;
    } catch (error) {
      console.error(`[Storage] ✗ Error saving ${filename}.json:`, error);
    }
  }

  // Create index metadata file
  const indexData: IndexMetadata = {
    lastUpdated: timestamp,
    totalStocks: stocks.length,
    sectors: sectorCounts,
  };

  const indexPath = path.join(storageDir, 'index.json');
  try {
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log('[Storage] ✓ Saved index.json');
  } catch (error) {
    console.error('[Storage] ✗ Error saving index.json:', error);
  }

  console.log('[Storage] All data saved successfully!');
}

/**
 * Loads sector data from JSON file
 */
export function loadSectorData(sectorFileName: string): SectorData | null {
  const filepath = path.join(process.cwd(), 'public', 'data', 'fundamentals', 'latest', `${sectorFileName}.json`);
  
  try {
    if (!fs.existsSync(filepath)) {
      console.warn(`[Storage] Sector file not found: ${sectorFileName}.json`);
      return null;
    }

    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const data: SectorData = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error(`[Storage] Error loading ${sectorFileName}.json:`, error);
    return null;
  }
}

/**
 * Loads multiple sector files
 */
export function loadMultipleSectors(sectorFileNames: string[]): Record<string, SectorData> {
  const result: Record<string, SectorData> = {};
  
  for (const fileName of sectorFileNames) {
    const data = loadSectorData(fileName);
    if (data) {
      result[fileName] = data;
    }
  }
  
  return result;
}

/**
 * Loads index metadata
 */
export function loadIndex(): IndexMetadata | null {
  const filepath = path.join(process.cwd(), 'public', 'data', 'fundamentals', 'latest', 'index.json');
  
  try {
    if (!fs.existsSync(filepath)) {
      console.warn('[Storage] Index file not found');
      return null;
    }

    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const data: IndexMetadata = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error('[Storage] Error loading index.json:', error);
    return null;
  }
}

