import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";

interface FullReportProps {
  report: string;
  parsedFromDocument: boolean;
  taskCount: number;
}

export function FullReport({
  report,
  parsedFromDocument,
  taskCount,
}: FullReportProps) {
  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#3b82f6]" />
          Full Analysis Report
        </CardTitle>
        <div className="flex items-center gap-3">
          {parsedFromDocument && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30">
              <CheckCircle className="w-3 h-3" />
              Parsed from Bob document
            </span>
          )}
          <span className="text-xs text-slate-400">
            {taskCount} tasks identified
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="p-4 rounded-lg bg-[#0f172a] border border-[#3b4f6b]">
            <pre className="whitespace-pre-wrap text-sm text-slate-200 font-mono">
              {report}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
