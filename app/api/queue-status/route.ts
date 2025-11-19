import { NextRequest, NextResponse } from 'next/server';
import { requestQueue } from '@/app/lib/requestQueue';

export async function GET(request: NextRequest) {
  try {
    const status = requestQueue.getQueueStatus();
    
    return NextResponse.json({
      processing: status.processing,
      queued: status.queued,
      capacity: status.capacity,
      availableSlots: status.capacity - status.processing,
    });
  } catch (error: any) {
    console.error('[Queue Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}

