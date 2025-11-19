import { NextRequest, NextResponse } from 'next/server';
import { fundamentalsConfig } from '@/app/lib/fundamentalsConfig';
import { fetchAllStocks } from '@/app/lib/fetchStockFundamentals';
import { saveFundamentals } from '@/app/lib/fundamentalsStorage';
import curatedStocks from '@/app/lib/curatedStocks.json';

export const maxDuration = 300; // 5 minutes (Vercel Hobby with Fluid Compute)

export async function GET(request: NextRequest) {
  console.log('[Cron] Fundamentals fetch job started');
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = fundamentalsConfig.cronSecret;

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Invalid authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify FMP API key is configured
    if (!fundamentalsConfig.fmpApiKey) {
      console.error('[Cron] FMP_API_KEY not configured');
      return NextResponse.json(
        { error: 'FMP API key not configured' },
        { status: 500 }
      );
    }

    console.log(`[Cron] Loading ${curatedStocks.length} curated stocks...`);

    // Fetch fundamentals for all stocks
    const fundamentals = await fetchAllStocks(curatedStocks);

    // Count successes and failures
    const successCount = fundamentals.filter(f => !f.error).length;
    const errorCount = fundamentals.filter(f => f.error).length;

    console.log(`[Cron] Fetch complete - Success: ${successCount}, Errors: ${errorCount}`);

    // Save to storage (organized by sector)
    await saveFundamentals(fundamentals);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Cron] Job completed in ${duration}s`);

    return NextResponse.json({
      success: true,
      stocksProcessed: fundamentals.length,
      successCount,
      errorCount,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('[Cron] Job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

