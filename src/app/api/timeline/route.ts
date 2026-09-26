import { NextResponse } from 'next/server';
import { getFullTimelineData, createTimeline } from '@/lib/timeline-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const data = await getFullTimelineData(projectId);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    });
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
    const timeline = await createTimeline({
      projectId: body.projectId,
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
