import { notFound } from 'next/navigation';
import { loadAnalysis } from '@/lib/storage';
import { Dashboard } from '@/components/dashboard/dashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params;
  const saved = await loadAnalysis(id);
  if (!saved) notFound();

  const { id: _id, idea: _idea, createdAt: _createdAt, ...analysisResult } = saved;

  return <Dashboard data={analysisResult} showBack />;
}
