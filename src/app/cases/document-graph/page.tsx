'use client';

import CaseSimulator from '@/components/CaseSimulator';
import { documentKnowledgeGraphCase } from '@/data/cases/document-knowledge-graph';

export default function DocumentGraphCasePage() {
  return <CaseSimulator caseStudy={documentKnowledgeGraphCase} />;
}
