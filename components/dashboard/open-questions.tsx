import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface OpenQuestionsProps {
  questions: string[];
}

export function OpenQuestions({ questions }: OpenQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <Card className="bg-[#1e293b] border-[#3b4f6b] border-l-4 border-l-amber-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          Open Questions
        </CardTitle>
        <span className="text-xs text-slate-400">
          {questions.length} pending
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400 mb-3">
          These questions should be answered before development begins:
        </p>
        <ul className="space-y-3">
          {questions.map((question, index) => (
            <li
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/30 text-amber-500 text-xs font-bold shrink-0">
                ?
              </span>
              <span className="text-sm text-slate-200">{question}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
