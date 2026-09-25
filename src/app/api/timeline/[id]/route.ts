import { NextResponse } from 'next/server';
import { updateTimeline, deleteTimeline } from '@/lib/timeline-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    updateTimeline(id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update timeline:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteTimeline(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete timeline:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
