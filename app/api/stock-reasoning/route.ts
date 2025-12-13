import { NextRequest, NextResponse } from "next/server";

// On-demand stock reasoning API
// Two-phase approach:
// 1. Get scores JSON (non-streaming) - fast
// 2. Stream reasoning text (real Grok streaming) - smooth typing effect

const XAI_API_KEY = process.env.XAI_API_KEY;

interface StockReasoningRequest {
  ticker: string;
  name: string;
  allocationPercent?: number;
  assetClass?: string;
  formData: {
    age: string;
    risk: number;
    horizon: string;
    capital: string;
    goal: string;
    sectors: string[];
  };
}

export async function POST(request: NextRequest) {
  let body: StockReasoningRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { ticker, name, allocationPercent, assetClass, formData } = body;

  if (!ticker || !name || !formData) {
    return NextResponse.json(
      { error: "Missing required fields: ticker, name, and formData" },
      { status: 400 }
    );
  }

  if (!XAI_API_KEY) {
    console.warn("XAI_API_KEY not set");
    return NextResponse.json(
      { error: "API configuration missing. Please contact support." },
      { status: 503 }
    );
  }

  try {
    // Build allocation context if provided
    const allocationContext = allocationPercent !== undefined && assetClass ? `
**Position Context:**
- Asset Class: ${assetClass}
- Portfolio Allocation: ${allocationPercent}% of total portfolio
- This is a ${allocationPercent < 10 ? 'small strategic' : allocationPercent < 25 ? 'moderate' : 'major'} position

IMPORTANT: A ${allocationPercent}% allocation in ${assetClass} is intentional portfolio design.
${allocationPercent < 10 ? `For small allocations like this ${allocationPercent}%, this represents strategic diversification or a safety buffer, NOT a primary growth driver. Do NOT suggest the client should look elsewhere or that this is a poor choice. Instead, explain why having a small ${assetClass.toLowerCase()} position makes sense for risk management and portfolio balance.` : ''}
` : '';

    // ========== PHASE 1: Get scores (non-streaming, fast) ==========
    const scoresPrompt = `You are a financial advisor analyzing how well an investment matches a client's portfolio strategy. Return ONLY scores as JSON.

**Client Profile:**
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}
${allocationContext}
**Investment to Analyze:** ${ticker} (${name})

Return ONLY valid JSON in this exact format (no reasoning, just scores):

{
  "overallMatch": <number 0-100>,
  "criteria": {
    "riskTolerance": { "score": <number 0-100>, "note": "<10 words max>" },
    "timeHorizon": { "score": <number 0-100>, "note": "<10 words max>" },
    "investmentGoal": { "score": <number 0-100>, "note": "<10 words max>" },
    "age": { "score": <number 0-100>, "note": "<10 words max>" }
  },
  "sectors": [
    { "name": "<relevant sector>", "score": <number 0-100> }
  ]
}

Guidelines:
- riskTolerance: Compare investment volatility to client's risk level (${formData.risk}/100).
- timeHorizon: ${formData.horizon} affects score.
- investmentGoal: How well does this support "${formData.goal}"?
- age: Client is ${formData.age}.
- sectors: Only include sectors relevant to ${ticker}.
- overallMatch: Weighted average of all criteria.

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no extra text.`;

    console.log(`[Stock Reasoning] Phase 1: Getting scores for ${ticker}...`);

    const scoresResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          { role: "system", content: "You are a financial analysis AI. Always respond with valid JSON only." },
          { role: "user", content: scoresPrompt }
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!scoresResponse.ok) {
      throw new Error(`Grok API returned ${scoresResponse.status}`);
    }

    const scoresData = await scoresResponse.json();
    let scoresContent = scoresData.choices?.[0]?.message?.content || "";
    
    // Clean up potential markdown
    scoresContent = scoresContent.trim();
    if (scoresContent.startsWith("```json")) scoresContent = scoresContent.slice(7);
    else if (scoresContent.startsWith("```")) scoresContent = scoresContent.slice(3);
    if (scoresContent.endsWith("```")) scoresContent = scoresContent.slice(0, -3);
    scoresContent = scoresContent.trim();

    let scores;
    try {
      scores = JSON.parse(scoresContent);
    } catch {
      scores = {
        overallMatch: 75,
        criteria: {
          riskTolerance: { score: 75, note: "Matches your risk profile" },
          timeHorizon: { score: 80, note: "Suitable for your timeline" },
          investmentGoal: { score: 75, note: "Aligns with your goals" },
          age: { score: 70, note: "Appropriate for your age" }
        },
        sectors: []
      };
    }

    console.log(`[Stock Reasoning] Phase 1 complete: ${scores.overallMatch}% overall match`);

    // ========== PHASE 2: Stream reasoning (real Grok streaming) ==========
    const reasoningPrompt = `You are a friendly financial advisor explaining to a client why ${ticker} (${name}) fits their portfolio.

**Client Profile:**
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100 (${formData.risk >= 70 ? 'aggressive' : formData.risk >= 40 ? 'moderate' : 'conservative'})
- Time Horizon: ${formData.horizon}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}
${allocationContext}
Write a conversational 3-4 sentence explanation using "you" and "your". Be friendly and personal. ${allocationPercent && allocationPercent < 10 ? `Emphasize why a small ${allocationPercent}% ${assetClass?.toLowerCase() || 'position'} is a smart strategic choice for portfolio balance.` : ''}

Start speaking directly - no JSON, no formatting, no prefixes.`;

    console.log(`[Stock Reasoning] Phase 2: Streaming reasoning for ${ticker}...`);

    const reasoningResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages: [
          { role: "system", content: "You are a friendly financial advisor. Speak directly and conversationally." },
          { role: "user", content: reasoningPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
      }),
    });

    if (!reasoningResponse.ok || !reasoningResponse.body) {
      throw new Error(`Grok streaming API returned ${reasoningResponse.status}`);
    }

    // Create combined stream: scores JSON first, then delimiter, then streamed reasoning
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const grokReader = reasoningResponse.body.getReader();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send scores JSON immediately
          controller.enqueue(encoder.encode(JSON.stringify(scores)));
          controller.enqueue(encoder.encode("\n---REASONING---\n"));

          // Stream reasoning from Grok
          let buffer = '';
          while (true) {
            const { done, value } = await grokReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.choices?.[0]?.delta?.content;
                  if (text) {
                    controller.enqueue(encoder.encode(text));
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Error generating stock reasoning:", error);
    
    return NextResponse.json(
      { error: "Failed to generate reasoning. Please try again." },
      { status: 500 }
    );
  }
}
