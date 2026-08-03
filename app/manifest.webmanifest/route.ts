import { mainManifest } from '@/lib/pwa-manifests';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(mainManifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
