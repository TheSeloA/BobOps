'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Send, AlertTriangle } from 'lucide-react';
import { PastAnalysesList } from './past-analyses-list';
import { ChatScreen } from './chat-screen';

interface AnalysisMeta {
  id: string;
  idea: string;
  createdAt: string;
  confidence: 'high' | 'medium' | 'low';
}

interface PlannerHomeProps {
  analyses: AnalysisMeta[];
  missingCredentials: boolean;
}

export function PlannerHome({ analyses, missingCredentials }: PlannerHomeProps) {
  const [activeIdea, setActiveIdea] = useState<string | null>(null);
  const [activeRepoUrl, setActiveRepoUrl] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  function startPlanning() {
    if (!inputValue.trim()) return;
    setActiveIdea(inputValue.trim());
    setActiveRepoUrl(repoUrl.trim() || null);
  }

  if (activeIdea) {
    return <div className="h-screen"><ChatScreen idea={activeIdea} repoUrl={activeRepoUrl} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-start px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-10">
          <Image src="/bob-mascot.png" alt="BobOps" width={64} height={64} className="rounded-2xl mb-4" />
          <h1 className="text-3xl font-bold text-white">BobOps</h1>
          <p className="text-slate-400 mt-2 text-center">
            Describe your app idea and Bob will plan it with you
          </p>
        </div>

        {missingCredentials && (
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Bob API credentials not configured — add them to <code className="font-mono">.env.local</code>
          </div>
        )}

        <div className="space-y-3 mb-10">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') startPlanning(); }}
              placeholder="e.g. A room booking app for co-working spaces..."
              disabled={missingCredentials}
              className="flex-1 bg-[#1e293b] border border-[#3b4f6b] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 text-sm"
            />
            <button
              onClick={startPlanning}
              disabled={missingCredentials || !inputValue.trim()}
              className="px-4 py-3 bg-[#3b82f6] rounded-xl text-white disabled:opacity-50 hover:bg-[#2563eb] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="GitHub repo URL (optional — for adding a feature to an existing app)"
            disabled={missingCredentials}
            className="w-full bg-[#1e293b] border border-[#3b4f6b] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 text-sm"
          />
        </div>

        <PastAnalysesList analyses={analyses} />
      </div>
    </div>
  );
}
