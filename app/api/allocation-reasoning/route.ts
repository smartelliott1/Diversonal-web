import { NextRequest, NextResponse } from "next/server";

// Allocation Reasoning API - Explains why the AI chose these allocations
// Streams responses from Grok with portfolio and user profile context

const XAI_API_KEY = process.env.XAI_API_KEY;

interface PortfolioItem {
  name: string;
  value: number;
  color: string;
  breakdown?: string;
}

interface AllocationReasoningRequest {
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
  let body: AllocationReasoningRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  const { portfolioData, formData } = body;

  if (!portfolioData || !formData) {
    return NextResponse.json(
      { error: "Missing required fields: portfolioData and formData" },
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
    // Build allocation summary
    const allocationSummary = portfolioData
      .map(item => `- ${item.name}: ${item.value}%${item.breakdown ? ` (${item.breakdown})` : ''}`)
      .join('\n');

    const systemPrompt = `You are a friendly financial advisor explaining portfolio allocation decisions. Use a modern, clean response style.

USER'S PROFILE:
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100 (${formData.risk <= 30 ? 'Conservative' : formData.risk <= 60 ? 'Moderate' : 'Aggressive'})
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}

RECOMMENDED ALLOCATION:
${allocationSummary}

TASK: Explain why this allocation makes sense for this user.

STRICT FORMATTING RULES:
1. Start with a brief 1-2 sentence intro connecting to their profile
2. Then use **bold subtitle headers** followed by 2-3 bullet points each
3. Use exactly 2-3 sections with subtitles like: **Risk Balance**, **Growth Strategy**, **Time Alignment**
4. Each bullet should be one concise sentence
5. Use "you" and "your" - be conversational
6. Don't repeat the exact percentages - they can see those
7. Format bullets with "• " prefix

EXAMPLE FORMAT:
Given your profile, here's why this allocation works for you.

**Growth Potential**
• Your longer time horizon lets us lean into equities for growth
• Higher equity exposure matches your risk comfort level

**Stability Layer**
• Fixed income provides a cushion against market swings
• This balance protects while still pursuing gains`;

    console.log(`[Allocation Reasoning] Generating explanation for user profile...`);

    // Call Grok with streaming
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please explain why you've recommended this allocation for my portfolio." }
        ],
        temperature: 0.7,
        max_tokens: 300,
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
    console.error("Error in allocation reasoning:", error);
    return NextResponse.json(
      { error: "Failed to generate allocation reasoning" },
      { status: 500 }
    );
  }
}

