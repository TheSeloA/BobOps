import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface KeywordsPanelProps {
  keywords: string[];
}

export function KeywordsPanel({ keywords }: KeywordsPanelProps) {
  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          Detected Signals
        </CardTitle>
        <Sparkles className="w-4 h-4 text-[#3b82f6]" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1e3a5f] text-[#3b82f6] border border-[#3b82f6]/30"
            >
              {keyword}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
