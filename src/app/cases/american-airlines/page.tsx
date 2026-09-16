'use client';

import CaseSimulator from '@/components/CaseSimulator';
import { americanAirlinesCase } from '@/data/cases/american-airlines';

export default function AmericanAirlinesCasePage() {
  return <CaseSimulator caseStudy={americanAirlinesCase} />;
}
