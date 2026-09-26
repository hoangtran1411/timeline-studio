import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/timeline-service';

export async function GET() {
  try {
    const projects = getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to get projects:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    const project = createProject({
      name: body.name,
      description: body.description,
      color: body.color,
      icon: body.icon
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
