const BOB_API_URL = 'https://api.us-east.bob.ibm.com/inference/v1/chat/completions';

export interface BobMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callBobStream(
  messages: BobMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = process.env.BOBSHELL_API_KEY;
  const instanceId = process.env.BOB_INSTANCE_ID;
  const teamId = process.env.BOB_TEAM_ID;

  if (!apiKey || !instanceId || !teamId) {
    throw new Error('Missing Bob API credentials. Check BOBSHELL_API_KEY, BOB_INSTANCE_ID, BOB_TEAM_ID in .env.local');
  }

  const response = await fetch(BOB_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Apikey ${apiKey}`,
      'x-instance-id': instanceId,
      'x-team-id': teamId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'premium', stream: true, messages }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bob API error ${response.status}: ${body}`);
  }

  let fullText = '';
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        const chunk: string = parsed?.choices?.[0]?.delta?.content ?? '';
        if (chunk) {
          onChunk(chunk);
          fullText += chunk;
        }
      } catch { /* skip malformed chunks */ }
    }
  }

  if (!fullText.trim()) {
    throw new Error('Bob returned an empty response');
  }

  return fullText;
}

export function hasMissingCredentials(): boolean {
  return !process.env.BOBSHELL_API_KEY || !process.env.BOB_INSTANCE_ID || !process.env.BOB_TEAM_ID;
}
