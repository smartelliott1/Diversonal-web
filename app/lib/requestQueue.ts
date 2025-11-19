// Request queue manager for concurrent users

import { fundamentalsConfig } from './fundamentalsConfig';

export interface QueueRequest {
  id: string;
  timestamp: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  resolve?: (value: any) => void;
  reject?: (error: any) => void;
}

export interface QueueResponse {
  status: 'queued' | 'processing';
  position?: number;
  estimatedWait?: number;
  message?: string;
}

class RequestQueue {
  private queue: QueueRequest[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.maxConcurrent = fundamentalsConfig.queue.maxConcurrent;
    
    // Start cleanup interval to remove stale requests
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean up old requests every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleRequests();
    }, 30000);
  }

  private cleanupStaleRequests(): void {
    const now = Date.now();
    const timeoutMs = fundamentalsConfig.queue.timeoutMinutes * 60 * 1000;
    
    // Remove requests older than timeout
    this.queue = this.queue.filter(req => {
      const age = now - req.timestamp;
      if (age > timeoutMs) {
        console.log(`[Queue] Removing stale request ${req.id}`);
        if (req.reject) {
          req.reject(new Error('Request timeout'));
        }
        return false;
      }
      return true;
    });

    // Remove from processing set if timed out
    for (const reqId of this.processing) {
      const req = this.queue.find(r => r.id === reqId);
      if (!req || (now - req.timestamp) > timeoutMs) {
        this.processing.delete(reqId);
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async addToQueue(): Promise<QueueResponse> {
    // Check if we can process immediately
    if (this.processing.size < this.maxConcurrent) {
      const request: QueueRequest = {
        id: this.generateId(),
        timestamp: Date.now(),
        status: 'processing',
      };
      
      this.processing.add(request.id);
      console.log(`[Queue] Processing immediately (${this.processing.size}/${this.maxConcurrent})`);
      
      return {
        status: 'processing',
      };
    }

    // Add to queue
    const request: QueueRequest = {
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'queued',
    };

    this.queue.push(request);
    const position = this.queue.length;
    const estimatedWait = position * fundamentalsConfig.queue.estimatedSecondsPerRequest;

    console.log(`[Queue] Added request ${request.id} to queue (position ${position})`);

    return {
      status: 'queued',
      position,
      estimatedWait,
      message: `You're in position ${position}. Estimated wait: ${this.formatTime(estimatedWait)}`,
    };
  }

  releaseSlot(requestId?: string): void {
    if (requestId) {
      this.processing.delete(requestId);
      console.log(`[Queue] Released slot for ${requestId} (${this.processing.size}/${this.maxConcurrent})`);
    }

    // Try to process next in queue
    this.processNext();
  }

  private processNext(): void {
    if (this.processing.size >= this.maxConcurrent) {
      return; // Already at capacity
    }

    // Find next queued request
    const nextRequest = this.queue.find(req => req.status === 'queued');
    if (!nextRequest) {
      return; // No queued requests
    }

    // Move to processing
    nextRequest.status = 'processing';
    this.processing.add(nextRequest.id);
    
    console.log(`[Queue] Processing request ${nextRequest.id} from queue`);
    
    // Resolve the promise if it exists
    if (nextRequest.resolve) {
      nextRequest.resolve({ status: 'processing' });
    }
  }

  getQueueStatus(): {
    processing: number;
    queued: number;
    capacity: number;
  } {
    const queuedCount = this.queue.filter(req => req.status === 'queued').length;
    
    return {
      processing: this.processing.size,
      queued: queuedCount,
      capacity: this.maxConcurrent,
    };
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();

