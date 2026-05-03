import { listAnalyses } from '@/lib/storage';

export async function GET() {
  const analyses = await listAnalyses();
  return Response.json({ analyses });
}
