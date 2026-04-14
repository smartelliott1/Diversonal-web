// Agent Opti - AI Trading Assistant API with Streaming
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql, generateId } from "@/app/lib/db";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = "https://api.x.ai/v1";
const MODEL = "grok-3";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Core rules shared by all modes
const CORE_RULES = `You speak like a sharp analyst on a trading desk - conversational, direct, human.

CRITICAL RULES:
- USE specific numbers from the data to ground your analysis. "RSI at 72 is getting stretched" is better than "momentum looks high".
- INTERPRET what the numbers mean, don't just list them. One number with context beats five numbers in a row.
- If a specific data point is not present in the market data provided, say you don't have that data. Never invent numbers or reference events not in this context.
- NO formatting: no asterisks, bold, headers, bullets, or markdown.
- 3-5 sentences. Sound like you're talking to a colleague on a trade, not writing a report.
- Be direct about the setup. What's actually happening and what does it mean for the trade?`;

// Mode-specific system prompts
const SYSTEM_PROMPTS = {
  technical: `You are Agent Opti (Technical mode) - a chart-focused swing trader.

${CORE_RULES}

FOCUS: Price relative to key MAs, trend structure, momentum (RSI, ADX), 52-week range context. What is the setup and what would you do?

Good example: "Price is sitting right on the 50-day SMA at $182, which has been clean support for months. RSI is cooling off from overbought at 58 now - that's a healthy reset. ADX above 25 says the trend still has legs. I'd treat any dip into the $178-182 zone as a potential add, with a stop below the 200-day."`,

  fundamental: `You are Agent Opti (Fundamental mode) - a value-focused equity analyst.

${CORE_RULES}

FOCUS: Valuation vs growth (P/E, EPS growth, revenue growth), analyst consensus and price target upside, balance sheet health. Is this worth owning at the current price?

Good example: "Trading at 28x with EPS growing 22% year-over-year - that's a reasonable multiple for the growth rate. Analysts have a consensus target of $195, about 12% above here, and the recent quarterly beat suggests estimates may be too low. Main risk is multiple compression if macro turns ugly, but the business fundamentals are solid."`,

  hybrid: `You are Agent Opti (Hybrid mode) - combining technicals and fundamentals for the full picture.

${CORE_RULES}

FOCUS: Do the chart and fundamentals agree or diverge? Lead with whichever tells the more important story, then tie them together.

Good example: "Fundamentally this is cheap - P/E of 18x with 15% revenue growth and analysts 20% above current price. The chart is the problem: it's been grinding below the 200-day SMA for two months, RSI stuck in the 40s. That kind of technical weakness with strong fundamentals usually means the market knows something, so I'd want to see the 200-day reclaimed before sizing up even if the valuation case is there."`
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!XAI_API_KEY) {
      return NextResponse.json({ error: "API not configured" }, { status: 500 });
    }

    const { chatId, message, messages: clientMessages, marketContext, mode = 'hybrid' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Get user ID from email
    const users = await sql`
      SELECT id FROM "User" WHERE email = ${session.user.email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;
    let currentChatId = chatId;

    // If no chatId provided, create a new chat
    if (!currentChatId) {
      currentChatId = generateId();
      const now = new Date();
      
      // Generate title from first message (truncate if too long)
      const title = message.length > 50 ? message.substring(0, 47) + "..." : message;
      
      await sql`
        INSERT INTO "Chat" (id, "userId", title, "createdAt", "updatedAt")
        VALUES (${currentChatId}, ${userId}, ${title}, ${now}, ${now})
      `;
    } else {
      // Verify chat belongs to user
      const chat = await sql`
        SELECT id FROM "Chat" WHERE id = ${currentChatId} AND "userId" = ${userId}
      `;

      if (chat.length === 0) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
    }

    // Save user message to database
    const userMessageId = generateId();
    const now = new Date();
    
    await sql`
      INSERT INTO "ChatMessage" (id, "chatId", role, content, "createdAt")
      VALUES (${userMessageId}, ${currentChatId}, 'user', ${message}, ${now})
    `;

    // Build conversation history for API call
    let conversationHistory: Message[] = [];
    
    if (Array.isArray(clientMessages)) {
      // Use client-provided messages — empty array means clean context (e.g. after ticker switch)
      conversationHistory = clientMessages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));
    } else {
      // No messages provided — fetch from database
      const dbMessages = await sql`
        SELECT role, content FROM "ChatMessage"
        WHERE "chatId" = ${currentChatId}
        ORDER BY "createdAt" ASC
      `;
      
      conversationHistory = dbMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));
    }

    // Add the new user message if not already in history
    if (!conversationHistory.some(m => m.content === message && m.role === "user")) {
      conversationHistory.push({ role: "user", content: message });
    }

    // Build system prompt with mode-specific instructions and market context
    const validMode: keyof typeof SYSTEM_PROMPTS = (mode === 'technical' || mode === 'fundamental' || mode === 'hybrid') ? mode : 'hybrid';
    let systemPrompt = SYSTEM_PROMPTS[validMode];
    
    if (marketContext) {
      systemPrompt += `\n\n---\n\nLIVE MARKET DATA (as of now):\n\n${marketContext}`;
    } else {
      systemPrompt += `\n\n---\n\nNote: No specific ticker data has been loaded. Encourage the user to select a ticker using the search bar to get real-time analysis.`;
    }

    // Call Grok API with streaming
    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: 0.4,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Agent Opti] API Error:", errorText);
      return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
    }

    if (!response.body) {
      return NextResponse.json({ error: "No response body" }, { status: 500 });
    }

    // Create a transform stream to process the SSE events
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    const finalChatId = currentChatId;

    const stream = new ReadableStream({
      async start(controller) {
        // First, send the chatId so the client knows which chat this belongs to
        controller.enqueue(new TextEncoder().encode(`__CHAT_ID__:${finalChatId}\n`));
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch {
                  // Ignore parse errors for incomplete JSON
                }
              }
            }
          }
          
          // Save the complete assistant response to database
          if (fullResponse) {
            const assistantMessageId = generateId();
            const assistantNow = new Date();
            
            await sql`
              INSERT INTO "ChatMessage" (id, "chatId", role, content, "createdAt")
              VALUES (${assistantMessageId}, ${finalChatId}, 'assistant', ${fullResponse}, ${assistantNow})
            `;

            // Update chat's updatedAt timestamp
            await sql`
              UPDATE "Chat" SET "updatedAt" = ${assistantNow} WHERE id = ${finalChatId}
            `;
          }
          
          controller.close();
        } catch (error) {
          console.error("[Agent Opti] Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[Agent Opti] Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
