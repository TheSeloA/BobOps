'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatScreenProps {
  idea: string;
  repoUrl?: string | null;
}

async function readSSEStream(
  response: Response,
  onChunk: (chunk: string) => void,
  onId?: (id: string) => void,
  onAnalysisId?: (id: string) => void
): Promise<void> {
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
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk') onChunk(data.content);
        if (data.type === 'id' && onId) onId(data.value);
        if (data.type === 'analysisId' && onAnalysisId) onAnalysisId(data.value);
        if (data.type === 'error') throw new Error(data.message);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

export function ChatScreen({ idea, repoUrl }: ChatScreenProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const appendChunk = useCallback((chunk: string) => {
    setStreamingText((prev) => prev + chunk);
  }, []);

  const commitStreamingMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    setStreamingText('');
  }, []);

  const finalize = useCallback(async (id: string) => {
    if (isFinalizing) return;
    setIsFinalizing(true);
    setIsStreaming(true);
    setStreamingText('');
    let planText = '';
    let analysisId = '';

    try {
      const res = await fetch(`/api/chat/${id}/finalize`, { method: 'POST' });
      await readSSEStream(
        res,
        (chunk) => { appendChunk(chunk); planText += chunk; },
        undefined,
        (aId) => { analysisId = aId; }
      );
      commitStreamingMessage(planText);
      if (analysisId) router.push(`/analysis/${analysisId}`);
    } catch (err) {
      commitStreamingMessage(`Error: ${err instanceof Error ? err.message : 'Failed to generate plan'}`);
    } finally {
      setIsStreaming(false);
      setIsFinalizing(false);
    }
  }, [isFinalizing, appendChunk, commitStreamingMessage, router]);

  useEffect(() => {
    let cancelled = false;
    async function startConversation() {
      setIsStreaming(true);
      let bobText = '';
      let convId = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea, repoUrl: repoUrl || undefined }),
        });
        await readSSEStream(
          res,
          (chunk) => { if (!cancelled) { appendChunk(chunk); bobText += chunk; } },
          (id) => { convId = id; conversationIdRef.current = id; }
        );
        if (!cancelled) {
          commitStreamingMessage(bobText);
          const looksLikePlan = bobText.length > 800 && /#{1,3}\s+\w/.test(bobText);
          if (looksLikePlan && convId) finalize(convId);
        }
      } catch (err) {
        if (!cancelled) commitStreamingMessage(`Error: ${err instanceof Error ? err.message : 'Failed to connect to Bob'}`);
      } finally {
        if (!cancelled) setIsStreaming(false);
      }
    }
    startConversation();
    return () => { cancelled = true; };
  }, [idea, appendChunk, commitStreamingMessage, finalize]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming || !conversationIdRef.current) return;
    const id = conversationIdRef.current;
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInputValue('');
    setIsStreaming(true);
    let bobText = '';
    try {
      const res = await fetch(`/api/chat/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      await readSSEStream(res, (chunk) => { appendChunk(chunk); bobText += chunk; });
      commitStreamingMessage(bobText);
      const looksLikePlan = bobText.length > 800 && /#{1,3}\s+\w/.test(bobText);
      if (looksLikePlan) finalize(id);
    } catch (err) {
      commitStreamingMessage(`Error: ${err instanceof Error ? err.message : 'Failed to send message'}`);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      <div className="px-4 py-3 border-b border-[#3b4f6b] bg-[#1e293b]">
        <p className="text-sm text-slate-400">Planning: <span className="text-white font-medium">{idea}</span></p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {streamingText && (
          <MessageBubble role="assistant" content={streamingText} isStreaming />
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-[#3b4f6b] bg-[#1e293b]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); } }}
            placeholder={isStreaming ? 'Bob is thinking...' : 'Type your answer...'}
            disabled={isStreaming}
            className="flex-1 bg-[#0f172a] border border-[#3b4f6b] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={isStreaming || !inputValue.trim()}
            className="p-2.5 bg-[#3b82f6] rounded-xl text-white disabled:opacity-50 hover:bg-[#2563eb] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={() => conversationIdRef.current && finalize(conversationIdRef.current)}
            disabled={isStreaming || isFinalizing || !conversationIdRef.current}
            title="Generate plan now"
            className={cn(
              'p-2.5 rounded-xl text-white transition-colors',
              isFinalizing ? 'bg-[#9f1239] opacity-50' : 'bg-[#9f1239] hover:bg-[#be123c] disabled:opacity-50'
            )}
          >
            {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
