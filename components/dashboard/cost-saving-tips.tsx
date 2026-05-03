import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface CostSavingTipsProps {
  tips: string[];
}

export function CostSavingTips({ tips }: CostSavingTipsProps) {
  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#3b82f6]" />
          Cost-Saving Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <span className="text-sm text-slate-200 pt-0.5">{tip}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
