import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { loadConversation, saveAnalysis } from '@/lib/storage';
import { callBobStream } from '@/lib/bob-client';
import { analyzePlan } from '@/lib/planning-analysis';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conv = await loadConversation(id);
  if (!conv) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  const finalMessages = [
    ...conv.messages,
    {
      role: 'user' as const,
      content: 'Please generate the complete implementation and design plan now based on everything we have discussed.',
    },
  ];

  const encoder = new TextEncoder();
  const analysisId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        let planText = '';
        planText = await callBobStream(finalMessages, (chunk) => send({ type: 'chunk', content: chunk }));

        const result = analyzePlan({
          source: 'web',
          transcript: [{ role: 'bob', content: planText, created_at: new Date().toISOString() }],
        });

        await saveAnalysis({
          id: analysisId,
          idea: conv.idea,
          createdAt: new Date().toISOString(),
          ...result,
        });

        send({ type: 'analysisId', value: analysisId });
        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
