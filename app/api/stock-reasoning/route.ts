import { NextRequest, NextResponse } from "next/server";
import { callGrokStreaming } from "@/app/lib/grokClient";

// On-demand stock reasoning API
// Generates personalized reasoning for why a specific stock fits the user's goals

const XAI_API_KEY = process.env.XAI_API_KEY;

interface StockReasoningRequest {
  ticker: string;
  name: string;
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

  const { ticker, name, formData } = body;

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
    const prompt = `You are a friendly financial advisor explaining to a client why a specific investment fits their unique situation.

**Client Profile:**
- Age: ${formData.age}
- Risk Tolerance: ${formData.risk}/100
- Time Horizon: ${formData.horizon}
- Investment Capital: $${formData.capital}
- Investment Goal: ${formData.goal}
- Sector Preferences: ${formData.sectors.join(", ") || "None specified"}

**Stock to Explain:** ${ticker} (${name})

Write a personalized explanation (3-4 sentences) for why ${ticker} fits this client's goals. Be conversational and friendly - speak directly to them using "you" and "your".

Include:
- How it matches their risk tolerance (${formData.risk}/100)
- How it fits their time horizon (${formData.horizon})
- How it aligns with their investment goal (${formData.goal})
- If applicable, mention sector preference alignment (${formData.sectors.join(", ")})

DO NOT include:
- Technical jargon or complex financial terms
- Stock prices or specific numbers (those are shown elsewhere)
- Generic disclaimers

Just write the explanation directly - no JSON, no formatting, no prefixes. Start speaking to the client immediately.`;

    console.log(`[Stock Reasoning] Generating reasoning for ${ticker}...`);

    // Call Grok with streaming
    const grokStream = await callGrokStreaming(prompt);
    
    // Process Grok's SSE stream and convert to text stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = grokStream.getReader();
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const text = parsed.choices[0].delta.content;
                    controller.enqueue(encoder.encode(text));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    console.log("[Stock Reasoning] Streaming response started");

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Error generating stock reasoning:", error);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to generate reasoning: ${error?.message || 'Unknown error'}`
      : "Failed to generate reasoning. Please try again.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
