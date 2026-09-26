import { NextResponse } from 'next/server';
import { updateTimeline, deleteTimeline } from '@/lib/timeline-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateTimeline(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update timeline:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTimeline(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete timeline:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
