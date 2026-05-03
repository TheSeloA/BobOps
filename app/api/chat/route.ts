import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { buildSystemPrompt } from '@/lib/skill-loader';
import { saveConversation } from '@/lib/storage';
import { callBobStream, hasMissingCredentials } from '@/lib/bob-client';
import type { BobMessage } from '@/lib/bob-client';

export async function POST(req: NextRequest) {
  if (hasMissingCredentials()) {
    return new Response(
      JSON.stringify({ error: 'Bob API credentials not configured. Add them to .env.local' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { idea } = await req.json() as { idea: string };
  if (!idea?.trim()) {
    return new Response(JSON.stringify({ error: 'idea is required' }), { status: 400 });
  }

  const id = randomUUID();
  const systemPrompt = await buildSystemPrompt();

  const messages: BobMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Idea: ${idea.trim()}` },
  ];

  await saveConversation({ id, idea: idea.trim(), createdAt: new Date().toISOString(), messages });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: 'id', value: id });

      try {
        let fullText = '';
        fullText = await callBobStream(messages, (chunk) => send({ type: 'chunk', content: chunk }));

        const conv = { id, idea: idea.trim(), createdAt: new Date().toISOString(), messages: [...messages, { role: 'assistant' as const, content: fullText }] };
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
