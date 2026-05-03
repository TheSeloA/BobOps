"use client";

import Image from "next/image";
import { BudgetCard } from "./budget-card";
import { ConfidenceBadge } from "./confidence-badge";
import { HoursBreakdown } from "./hours-breakdown";
import { KeywordsPanel } from "./keywords-panel";
import { FeatureList } from "./feature-list";
import { RiskWarnings } from "./risk-warnings";
import { ExpensiveFeatures } from "./expensive-features";
import { CostSavingTips } from "./cost-saving-tips";
import { BuildOrder } from "./build-order";
import { OpenQuestions } from "./open-questions";
import { FullReport } from "./full-report";
import type { AnalysisResult } from "@/lib/mock-data";

interface DashboardContentProps {
  activeSection: string;
  data: AnalysisResult;
}

export function DashboardContent({ activeSection, data }: DashboardContentProps) {
  return (
    <div className="flex-1 overflow-auto p-8 relative">
      {/* Background watermark - large centered Bob face */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <Image
          src="/bob-mascot.png"
          alt=""
          width={800}
          height={800}
          className="select-none opacity-[0.03]"
        />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {activeSection === "overview" && (
          <OverviewSection data={data} />
        )}
        {activeSection === "features" && (
          <FeaturesSection data={data} />
        )}
        {activeSection === "risks" && (
          <RisksSection data={data} />
        )}
        {activeSection === "recommendations" && (
          <RecommendationsSection data={data} />
        )}
        {activeSection === "report" && (
          <ReportSection data={data} />
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-slate-400 mt-1">{description}</p>
    </div>
  );
}

function OverviewSection({ data }: { data: AnalysisResult }) {
  return (
    <>
      <SectionHeader
        title="Overview"
        description="Project analysis summary and key metrics"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetCard costEstimate={data.costEstimate} />
        <ConfidenceBadge confidence={data.costEstimate.confidence} />
        <HoursBreakdown
          hours={data.costEstimate.hours}
          hourlyRate={data.costEstimate.hourlyRate}
        />
        <KeywordsPanel keywords={data.costEstimate.keywordsFound} />
      </div>
    </>
  );
}

function FeaturesSection({ data }: { data: AnalysisResult }) {
  return (
    <>
      <SectionHeader
        title="Features"
        description="MVP and full version feature breakdown"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeatureList
          title="Phase 1 — MVP Features"
          features={data.scope.mvpFeatures}
          variant="mvp"
        />
        <FeatureList
          title="Phase 2 — Full Version"
          features={data.scope.fullVersionFeatures}
          variant="full"
        />
        <div className="lg:col-span-2">
          <ExpensiveFeatures features={data.scope.expensiveFeatures} />
        </div>
      </div>
    </>
  );
}

function RisksSection({ data }: { data: AnalysisResult }) {
  return (
    <>
      <SectionHeader
        title="Risks"
        description="Identified risk warnings and concerns"
      />
      <div className="grid grid-cols-1 gap-6">
        <RiskWarnings warnings={data.scope.riskWarnings} />
        {data.openQuestions.length > 0 && (
          <OpenQuestions questions={data.openQuestions} />
        )}
      </div>
    </>
  );
}

function RecommendationsSection({ data }: { data: AnalysisResult }) {
  return (
    <>
      <SectionHeader
        title="Recommendations"
        description="Cost-saving tips and suggested build order"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostSavingTips tips={data.scope.costSavingTips} />
        <BuildOrder phases={data.scope.suggestedBuildOrder} />
      </div>
    </>
  );
}

function ReportSection({ data }: { data: AnalysisResult }) {
  return (
    <>
      <SectionHeader
        title="Full Report"
        description="Complete analysis documentation"
      />
      <FullReport
        report={data.report}
        parsedFromDocument={data.parsedFromDocument}
        taskCount={data.taskCount}
      />
    </>
  );
}
