import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

interface BuildOrderProps {
  phases: string[];
}

export function BuildOrder({ phases }: BuildOrderProps) {
  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#3b82f6]" />
          Suggested Build Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#3b4f6b]" />
          <ul className="space-y-4">
            {phases.map((phase, index) => (
              <li key={index} className="flex items-start gap-4 relative">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0f172a] border-2 border-[#3b82f6] text-[#3b82f6] text-xs font-bold shrink-0 z-10">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-200 pt-0.5">{phase}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
