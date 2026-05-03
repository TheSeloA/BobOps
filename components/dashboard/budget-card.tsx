import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AnalysisResult } from "@/lib/mock-data";

interface BudgetCardProps {
  costEstimate: AnalysisResult["costEstimate"];
}

export function BudgetCard({ costEstimate }: BudgetCardProps) {
  const { cost, lineItems } = costEstimate;
  const [showItemized, setShowItemized] = useState(false);

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
            <p className="text-xs text-slate-400 mt-1">Expected total cost</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Low</p>
              <p className="text-sm font-medium text-[#3b82f6]">${cost.low.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">High</p>
              <p className="text-sm font-medium text-[#9f1239]">${cost.high.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-xs text-slate-400">
              {costEstimate.riskBufferPercent}% risk buffer included
            </span>
          </div>

          {lineItems && lineItems.length > 0 && (
            <div>
              <button
                onClick={() => setShowItemized((v) => !v)}
                className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-blue-400 transition-colors"
              >
                {showItemized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showItemized ? "Hide" : "Show"} itemized breakdown
              </button>

              {showItemized && (
                <div className="mt-3 rounded-lg border border-[#3b4f6b] overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-400">
                        <th className="text-left px-3 py-2 font-medium">Item</th>
                        <th className="text-right px-3 py-2 font-medium">Hrs (exp.)</th>
                        <th className="text-right px-3 py-2 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, i) => (
                        <tr
                          key={item.key}
                          className={
                            item.key === "risk_buffer"
                              ? "bg-[#1e293b] border-t border-[#3b4f6b] text-slate-400 italic"
                              : i % 2 === 0
                              ? "bg-[#0f172a]/50 text-slate-300"
                              : "bg-[#1e293b] text-slate-300"
                          }
                        >
                          <td className="px-3 py-2">{item.label}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {item.expectedHours != null ? `${item.expectedHours}h` : "—"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">
                            ${item.expectedCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#0f172a] border-t border-[#3b4f6b] text-white font-semibold">
                        <td className="px-3 py-2">Total (expected)</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {costEstimate.hours.expected}h
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-[#3b82f6]">
                          ${cost.expected.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
