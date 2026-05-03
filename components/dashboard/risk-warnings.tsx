import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskWarning } from "@/lib/mock-data";

interface RiskWarningsProps {
  warnings: RiskWarning[];
}

const riskConfig = {
  HIGH: {
    icon: AlertOctagon,
    className: "border-l-[#9f1239] bg-[#9f1239]/10",
    iconClassName: "text-[#9f1239]",
    label: "High Risk",
  },
  MEDIUM: {
    icon: AlertTriangle,
    className: "border-l-amber-500 bg-amber-500/10",
    iconClassName: "text-amber-500",
    label: "Medium Risk",
  },
  LOW: {
    icon: Info,
    className: "border-l-[#3b82f6] bg-[#3b82f6]/10",
    iconClassName: "text-[#3b82f6]",
    label: "Low Risk",
  },
};

export function RiskWarnings({ warnings }: RiskWarningsProps) {
  const sortedWarnings = [...warnings].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.level] - order[b.level];
  });

  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white">
          Risk Warnings
        </CardTitle>
        <span className="text-xs text-slate-400">
          {warnings.length} identified
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedWarnings.map((warning, index) => {
            const config = riskConfig[warning.level];
            const Icon = config.icon;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-l-4",
                  config.className
                )}
              >
                <Icon
                  className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconClassName)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    {config.label}
                  </p>
                  <p className="text-sm text-white">{warning.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
