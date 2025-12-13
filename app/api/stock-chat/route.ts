import { NextRequest, NextResponse } from "next/server";

// Stock Chat API - Continue conversation about a specific stock
// Streams responses from Grok with full portfolio context

const XAI_API_KEY = process.env.XAI_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StockChatRequest {
  ticker: string;
  name: string;
  message: string;
  chatHistory: ChatMessage[];
  matchScores?: {
    overallMatch: number;
    criteria: {
      riskTolerance: { score: number };
      timeHorizon: { score: number };
      investmentGoal: { score: number };
      age: { score: number };
    };
  };
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
  let body: StockChatRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { ticker, name, message, chatHistory, matchScores, allocationPercent, assetClass, formData } = body;

  if (!ticker || !message || !formData) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!XAI_API_KEY) {
    return NextResponse.json(
      { error: "API configuration missing" },
      { status: 503 }
    );
  }

  try {
    // Build context about the stock and portfolio
    const matchContext = matchScores ? `
Current Match Analysis for ${ticker}:
- Overall Match: ${matchScores.overallMatch}%
- Risk Tolerance Match: ${matchScores.criteria.riskTolerance.score}%
- Time Horizon Match: ${matchScores.criteria.timeHorizon.score}%
- Investment Goal Match: ${matchScores.criteria.investmentGoal.score}%
- Age Alignment: ${matchScores.criteria.age.score}%
` : '';

    const allocationContext = allocationPercent !== undefined && assetClass ? `
Position in Portfolio:
- Asset Class: ${assetClass}
- Allocation: ${allocationPercent}% of portfolio
` : '';

    const systemPrompt = `You are a helpful financial advisor assistant having a conversation about ${ticker} (${name}) and how it fits into the user's portfolio.

USER'S PORTFOLIO PROFILE:
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}
${matchContext}${allocationContext}
CONVERSATION RULES:
1. Only answer questions relevant to ${ticker}, the user's portfolio, or investing in general
2. If asked something completely off-topic, politely redirect to portfolio-related topics
3. Be conversational and friendly - use "you" and "your"
4. Keep responses concise (2-4 sentences unless more detail is needed)
5. Reference the user's specific profile when relevant (their risk tolerance, goals, etc.)
6. Don't give specific financial advice or price predictions
7. You can discuss: stock fundamentals, how it fits their portfolio, risks, comparisons to alternatives, sector trends`;

    // Build messages array with history
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ];

    console.log(`[Stock Chat] Sending message about ${ticker}: "${message.substring(0, 50)}..."`);

    // Call Grok with streaming
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-fast",
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Grok API returned ${response.status}`);
    }

    // Stream the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const grokReader = response.body.getReader();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
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
                  // Skip invalid JSON
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
    console.error("Error in stock chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
