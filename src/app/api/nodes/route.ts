import { NextResponse } from 'next/server';
import { createNode } from '@/lib/timeline-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.timelineId || !body.title || !body.startDate) {
      return NextResponse.json({ error: 'timelineId, title, and startDate are required' }, { status: 400 });
    }
    const node = createNode({
      timelineId: body.timelineId,
      title: body.title,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      priority: body.priority,
      tags: body.tags,
      autoShiftSubsequentDays: body.autoShiftSubsequentDays
    });
    return NextResponse.json(node);
  } catch (error: any) {
    console.error('Failed to create node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
