import { NextResponse } from 'next/server';
import { updateNode, deleteNode } from '@/lib/timeline-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateNode(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update node:', error);
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
    await deleteNode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
