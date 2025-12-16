import { NextRequest, NextResponse } from "next/server";

// Allocation Chat API - Continue conversation about portfolio allocation
// Streams responses from Grok with full portfolio context

const XAI_API_KEY = process.env.XAI_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PortfolioItem {
  name: string;
  value: number;
  color: string;
  breakdown?: string;
}

interface AllocationChatRequest {
  message: string;
  chatHistory: ChatMessage[];
  portfolioData: PortfolioItem[];
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
  let body: AllocationChatRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { message, chatHistory, portfolioData, formData } = body;

  if (!message || !portfolioData || !formData) {
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
    // Build allocation summary
    const allocationSummary = portfolioData
      .map(item => `- ${item.name}: ${item.value}%${item.breakdown ? ` (${item.breakdown})` : ''}`)
      .join('\n');

    const systemPrompt = `You are a helpful financial advisor assistant having a conversation about the user's portfolio allocation.

USER'S PROFILE:
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100 (${formData.risk <= 30 ? 'Conservative' : formData.risk <= 60 ? 'Moderate' : 'Aggressive'})
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}

CURRENT ALLOCATION:
${allocationSummary}

CONVERSATION RULES:
1. NEVER start with greetings like "Hey there", "Hi", "Hello", etc. - jump straight into the answer
2. Only answer questions about portfolio allocation, asset classes, or investment strategy
3. If asked something off-topic, briefly redirect to allocation-related topics
4. Be conversational - use "you" and "your"
5. Reference the user's specific profile when relevant

RESPONSE FORMAT:
1. Start with a direct 1-sentence answer to their question
2. Then optionally use **bold subtitle** with 2-3 bullet points if explaining multiple aspects
3. Keep bullet points concise (one sentence each, prefix with "• ")
4. Total response should be 3-6 sentences max
5. Don't give specific financial advice or make guarantees

EXAMPLE RESPONSE:
Your higher equity allocation reflects your longer time horizon and moderate-to-high risk tolerance.

**Why This Works**
• With 15+ years to invest, short-term volatility matters less
• Equities historically outperform over long periods
• Your risk score suggests comfort with market swings`;

    // Build messages array with history
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ];

    console.log(`[Allocation Chat] Sending message: "${message.substring(0, 50)}..."`);

    // Call Grok with streaming
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
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
    console.error("Error in allocation chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

