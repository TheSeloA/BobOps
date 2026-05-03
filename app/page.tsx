import { Suspense } from 'react';
import { PlannerHome } from '@/components/planner/planner-home';
import { listAnalyses } from '@/lib/storage';
import { hasMissingCredentials } from '@/lib/bob-client';

export default async function Page() {
  const [analyses, missingCreds] = await Promise.all([
    listAnalyses(),
    Promise.resolve(hasMissingCredentials()),
  ]);

  return (
    <Suspense>
      <PlannerHome analyses={analyses} missingCredentials={missingCreds} />
    </Suspense>
  );
}
