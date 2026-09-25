import { NextResponse } from 'next/server';
import { getFullTimelineData, createTimeline } from '@/lib/timeline-service';

export async function GET() {
  try {
    const data = getFullTimelineData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get timeline data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const timeline = createTimeline({
      title: body.title,
      description: body.description,
      parentTimelineId: body.parentTimelineId,
      branchPointNodeId: body.branchPointNodeId
    });
    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Failed to create timeline:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
