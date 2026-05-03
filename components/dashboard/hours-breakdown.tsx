import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import type { AnalysisResult } from "@/lib/mock-data";

interface HoursBreakdownProps {
  hours: AnalysisResult["costEstimate"]["hours"];
  hourlyRate: number;
}

export function HoursBreakdown({ hours, hourlyRate }: HoursBreakdownProps) {
  const expectedWeeks = Math.ceil(hours.expected / 40);

  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          Hours Breakdown
        </CardTitle>
        <Clock className="w-4 h-4 text-[#3b82f6]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-[#0f172a]">
              <p className="text-xs text-slate-400 mb-1">Optimistic</p>
              <p className="text-lg font-bold text-[#3b82f6]">{hours.optimistic}</p>
              <p className="text-xs text-slate-400">hours</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#0f172a] border border-[#3b82f6]/30">
              <p className="text-xs text-slate-400 mb-1">Expected</p>
              <p className="text-lg font-bold text-[#3b82f6]">{hours.expected}</p>
              <p className="text-xs text-slate-400">hours</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#0f172a]">
              <p className="text-xs text-slate-400 mb-1">Pessimistic</p>
              <p className="text-lg font-bold text-[#9f1239]">{hours.pessimistic}</p>
              <p className="text-xs text-slate-400">hours</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#3b4f6b]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                ~{expectedWeeks} weeks (full-time)
              </span>
            </div>
            <span className="text-sm text-slate-400">
              ${hourlyRate}/hr
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
