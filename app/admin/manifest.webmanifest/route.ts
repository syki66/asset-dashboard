import { adminManifest } from '@/lib/pwa-manifests';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(adminManifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
