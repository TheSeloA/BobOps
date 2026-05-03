export interface ThreePointHours {
  optimistic: number;
  expected: number;
  pessimistic: number;
}

export interface CostEstimate {
  keywordsFound: string[];
  confidence: 'high' | 'medium' | 'low';
  hours: ThreePointHours;
  cost: { low: number; expected: number; high: number };
  hourlyRate: number;
  riskBufferPercent: number;
}

export interface RiskWarning {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export interface Scope {
  mvpFeatures: string[];
  fullVersionFeatures: string[];
  expensiveFeatures: string[];
  riskWarnings: RiskWarning[];
  suggestedBuildOrder: string[];
  costSavingTips: string[];
  taskCount: number;
  parsedFromDocument: boolean;
}

export interface AnalysisResult {
  finalPlan: string;
  parsedFromJson: boolean;
  parsedFromDocument: boolean;
  jsonBlock: object | null;
  keywords: string[];
  costEstimate: CostEstimate;
  scope: Scope;
  openQuestions: string[];
  taskCount: number;
  report: string;
}

export interface TranscriptMessage {
  role: string;
  content: string;
  created_at: string;
  initial?: boolean;
}

export interface AnalysisPayload {
  source: string;
  transcript: TranscriptMessage[];
}

export function extractFinalPlan(transcript: TranscriptMessage[]): string;
export function analyzePlan(payload: AnalysisPayload): AnalysisResult;
