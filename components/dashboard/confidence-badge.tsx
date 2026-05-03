import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/lib/mock-data";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

const confidenceConfig = {
  high: {
    icon: ShieldCheck,
    label: "High Confidence",
    description: "Estimate is well-supported by analysis",
    className: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30",
    iconClassName: "text-[#3b82f6]",
  },
  medium: {
    icon: ShieldAlert,
    label: "Medium Confidence",
    description: "Some assumptions require validation",
    className: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    iconClassName: "text-amber-500",
  },
  low: {
    icon: ShieldQuestion,
    label: "Low Confidence",
    description: "High uncertainty in estimates",
    className: "text-[#9f1239] bg-[#9f1239]/10 border-[#9f1239]/30",
    iconClassName: "text-[#9f1239]",
  },
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          Confidence Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            config.className
          )}
        >
          <Icon className={cn("w-8 h-8", config.iconClassName)} />
          <div>
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs opacity-80">{config.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
