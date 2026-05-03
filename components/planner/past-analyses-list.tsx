'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisMeta {
  id: string;
  idea: string;
  createdAt: string;
  confidence: 'high' | 'medium' | 'low';
}

interface PastAnalysesListProps {
  analyses: AnalysisMeta[];
}

const confidenceColors = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export function PastAnalysesList({ analyses }: PastAnalysesListProps) {
  const router = useRouter();

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No past analyses yet. Start one above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        Past Analyses
      </h2>
      {analyses.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(`/analysis/${item.id}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1e293b] border border-[#3b4f6b] hover:border-[#3b82f6] transition-colors text-left group"
        >
          <BarChart3 className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{item.idea}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0',
              confidenceColors[item.confidence]
            )}
          >
            {item.confidence.toUpperCase()}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
        </button>
      ))}
    </div>
  );
}
