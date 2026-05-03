import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, DollarSign } from "lucide-react";

interface ExpensiveFeaturesProps {
  features: string[];
}

export function ExpensiveFeatures({ features }: ExpensiveFeaturesProps) {
  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#9f1239]" />
          High-Cost Features
        </CardTitle>
        <DollarSign className="w-4 h-4 text-[#9f1239]" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#9f1239]/10 border border-[#9f1239]/30"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#9f1239]/30 text-[#9f1239] text-xs font-bold shrink-0">
                $
              </span>
              <span className="text-sm text-slate-200">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
