import { NextRequest, NextResponse } from "next/server";
import { callGrokXPosts } from "@/app/lib/grokClient";

// Stage 3: X Posts API
// Fetches trending X posts for recommended stock tickers

interface XPostsRequest {
  tickers: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: XPostsRequest = await request.json();
    const { tickers } = body;
    
    if (!tickers || tickers.length === 0) {
      return NextResponse.json(
        { error: "No tickers provided" },
        { status: 400 }
      );
    }
    
    console.log(`[X Posts] Fetching X posts for ${tickers.length} tickers:`, tickers);
    
    // Call Grok to get X posts
    const xPosts = await callGrokXPosts(tickers);
    
    console.log(`[X Posts] Retrieved X posts for ${Object.keys(xPosts).length} tickers`);
    
    return NextResponse.json(xPosts);
    
  } catch (error: any) {
    console.error("[X Posts] Error:", error);
    
    // X posts are nice-to-have, so we return empty object instead of error
    // This allows the frontend to continue functioning without social data
    console.log("[X Posts] Returning empty response due to error");
    
    return NextResponse.json({});
  }
}

