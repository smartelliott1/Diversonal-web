// Token bucket rate limiter for FMP API calls

import { fundamentalsConfig } from './fundamentalsConfig';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per millisecond
}

class RateLimiter {
  private bucket: TokenBucket;
  private queue: Array<() => void> = [];
  private processing = false;

  constructor() {
    const { callsPerMinute, burstSize } = fundamentalsConfig.rateLimit;
    
    this.bucket = {
      tokens: burstSize,
      lastRefill: Date.now(),
      capacity: burstSize,
      refillRate: callsPerMinute / 60000, // convert calls/min to calls/ms
    };
  }

  private refillBucket(): void {
    const now = Date.now();
    const timePassed = now - this.bucket.lastRefill;
    const tokensToAdd = timePassed * this.bucket.refillRate;
    
    this.bucket.tokens = Math.min(
      this.bucket.capacity,
      this.bucket.tokens + tokensToAdd
    );
    this.bucket.lastRefill = now;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async acquireToken(): Promise<void> {
    this.refillBucket();

    // If we have tokens available, use one immediately
    if (this.bucket.tokens >= 1) {
      this.bucket.tokens -= 1;
      return;
    }

    // Otherwise, calculate how long to wait
    const tokensNeeded = 1 - this.bucket.tokens;
    const waitTime = tokensNeeded / this.bucket.refillRate;
    
    await this.wait(waitTime);
    
    // Refill and try again
    this.refillBucket();
    this.bucket.tokens -= 1;
  }

  async executeWithRateLimit<T>(
    fn: () => Promise<T>,
    retries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Acquire token before making request
        await this.acquireToken();
        
        // Execute the function
        const result = await fn();
        return result;
      } catch (error: any) {
        lastError = error;
        
        // If it's a rate limit error (429), wait and retry
        if (error.status === 429 || error.message?.includes('rate limit')) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`Rate limit hit, backing off for ${backoffTime}ms (attempt ${attempt + 1}/${retries})`);
          await this.wait(backoffTime);
          continue;
        }
        
        // For other errors, don't retry
        throw error;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  getStatus(): { tokens: number; capacity: number; queueLength: number } {
    this.refillBucket();
    return {
      tokens: Math.floor(this.bucket.tokens),
      capacity: this.bucket.capacity,
      queueLength: this.queue.length,
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

