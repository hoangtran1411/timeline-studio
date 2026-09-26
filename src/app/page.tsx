import { getProjects, getFullTimelineData } from '@/lib/timeline-service';
import { TimelineStudioClient } from '@/components/TimelineStudioClient';
import { Project, FullTimelineData } from '@/types/timeline';

// Ensure fresh dynamic server-rendering on every request without stale build-time lock
export const dynamic = 'force-dynamic';

export default async function TimelineStudioPage() {
  let projects: Project[] = [];
  let initialData: FullTimelineData = { timelines: [], dependencies: [] };

  try {
    // Parallel server-side fetch with direct DB execution — eliminates client-side network waterfalls
    const [fetchedProjects, fetchedData] = await Promise.all([
      getProjects(),
      getFullTimelineData('proj-historical')
    ]);
    projects = fetchedProjects;
    initialData = fetchedData;
  } catch (err) {
    console.error('Failed to pre-render initial timeline data on server:', err);
  }

  return (
    <TimelineStudioClient
      initialProjects={projects}
      initialData={initialData}
    />
  );
}
