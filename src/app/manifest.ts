import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Timeline Studio — Multi-Track Chrono Planner',
    short_name: 'Timeline Studio',
    description: 'Monochrome, high-precision multi-track timeline comparison, branch visualization, and interactive historical chronology planner.',
    start_url: '/',
    display: 'standalone',
    background_color: '#101114',
    theme_color: '#101114',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon'
      }
    ]
  };
}
