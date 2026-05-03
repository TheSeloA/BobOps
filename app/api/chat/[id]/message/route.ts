import { NextRequest } from 'next/server';
import { loadConversation, saveConversation } from '@/lib/storage';
import { callBobStream } from '@/lib/bob-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await req.json() as { content: string };

  const conv = await loadConversation(id);
  if (!conv) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  conv.messages.push({ role: 'user', content: content.trim() });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        let fullText = '';
        fullText = await callBobStream(conv.messages, (chunk) => send({ type: 'chunk', content: chunk }));

        conv.messages.push({ role: 'assistant', content: fullText });
        await saveConversation(conv);

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
