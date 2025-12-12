// Grok API Client
// xAI's Grok API is OpenAI-compatible, so we use similar patterns

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = "https://api.x.ai/v1";
const MODEL = "grok-4-1-fast-non-reasoning";

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Grok API with a simple prompt (non-streaming)
 */
export async function callGrok(
  prompt: string,
  systemMessage?: string
): Promise<string> {
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  const messages: GrokMessage[] = [];
  
  if (systemMessage) {
    messages.push({ role: "system", content: systemMessage });
  }
  
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Grok] API Error:", errorText);
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data: GrokResponse = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Grok API with streaming support
 */
export async function callGrokStreaming(
  prompt: string,
  systemMessage?: string
): Promise<ReadableStream> {
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  const messages: GrokMessage[] = [];
  
  if (systemMessage) {
    messages.push({ role: "system", content: systemMessage });
  }
  
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Grok] API Error:", errorText);
    throw new Error(`Grok API error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  return response.body;
}

/**
 * Stage 1: Market Context
 * Ask Grok for a concise market summary (Fear & Greed now calculated separately)
 */
export async function callGrokMarketContext(): Promise<{
  marketContext: string;
}> {
  const prompt = `You have access to real-time market data and X (Twitter). Provide a concise 2-3 sentence market context summary for today describing:

- Current S&P 500 level and today's movement
- Overall market sentiment and key drivers
- Notable sector movements or trending themes

Response format (JSON only):
{
  "marketContext": "Markets showing cautious optimism with S&P 500 at 6,602.99 (+0.98%) as tech sector leads gains. Balanced sentiment prevails despite inverted yield curve signaling recession concerns. Consumer cyclicals lag significantly (-3.9%), indicating defensive sector rotation."
}`;

  const response = await callGrok(prompt);
  
  // Parse JSON response
  try {
    const parsed = JSON.parse(response);
    return {
      marketContext: parsed.marketContext,
    };
  } catch (error) {
    console.error("[Grok] Failed to parse market context response:", error);
    throw new Error("Invalid response format from Grok");
  }
}

