import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Rocket, Star } from "lucide-react";

interface FeatureListProps {
  title: string;
  features: string[];
  variant: "mvp" | "full";
}

export function FeatureList({ title, features, variant }: FeatureListProps) {
  const Icon = variant === "mvp" ? Rocket : Star;

  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#3b82f6]" />
          {title}
        </CardTitle>
        <span className="text-xs text-slate-400">
          {features.length} items
        </span>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              {variant === "mvp" ? (
                <CheckCircle2 className="w-4 h-4 text-[#3b82f6] mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              )}
              <span className="text-sm text-slate-200">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
