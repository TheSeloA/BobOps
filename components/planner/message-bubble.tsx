import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming = false }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-[#9f1239] flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
        ) : (
          <Image src="/bob-mascot.png" alt="Bob" width={32} height={32} className="rounded-lg" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[#9f1239] text-white rounded-tr-sm'
            : 'bg-[#1e293b] text-slate-200 border border-[#3b4f6b] rounded-tl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse align-text-bottom" />
        )}
      </div>
    </div>
  );
}
