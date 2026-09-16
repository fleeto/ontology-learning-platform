import type { CaseStudy } from './types';
import { americanAirlinesCase } from './american-airlines';
import { armySoftwareFactoryCase } from './army-software-factory';
import { documentKnowledgeGraphCase } from './document-knowledge-graph';

export const caseStudies: CaseStudy[] = [
  americanAirlinesCase,
  armySoftwareFactoryCase,
  documentKnowledgeGraphCase,
];

export const caseBySlug: Record<string, CaseStudy> = Object.fromEntries(
  caseStudies.map(c => [c.slug, c]),
);

export type { CaseStudy } from './types';
