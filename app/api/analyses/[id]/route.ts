import { NextRequest } from 'next/server';
import { loadAnalysis } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const analysis = await loadAnalysis(id);
  if (!analysis) {
    return new Response(JSON.stringify({ error: 'Analysis not found' }), { status: 404 });
  }
  return Response.json(analysis);
}
