import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import type { AnalysisResult } from "@/lib/mock-data";

interface BudgetCardProps {
  costEstimate: AnalysisResult["costEstimate"];
}

export function BudgetCard({ costEstimate }: BudgetCardProps) {
  const { cost } = costEstimate;

  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          Budget Estimate
        </CardTitle>
        <DollarSign className="w-4 h-4 text-[#3b82f6]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-white">
              ${cost.expected.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Expected total cost
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Low</p>
              <p className="text-sm font-medium text-[#3b82f6]">
                ${cost.low.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">High</p>
              <p className="text-sm font-medium text-[#9f1239]">
                ${cost.high.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-xs text-slate-400">
              {costEstimate.riskBufferPercent}% risk buffer included
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
