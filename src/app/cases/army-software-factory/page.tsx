'use client';

import CaseSimulator from '@/components/CaseSimulator';
import { armySoftwareFactoryCase } from '@/data/cases/army-software-factory';

export default function ArmySoftwareFactoryCasePage() {
  return <CaseSimulator caseStudy={armySoftwareFactoryCase} />;
}
