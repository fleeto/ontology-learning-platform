// Schema for real-world case studies. A case is a data package consumed by the
// CaseSimulator engine; the engine contains no domain-specific logic.

export type Cardinality =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export type FidelityKind = 'fact' | 'official-claim' | 'simulated';

export type ParameterValue = number | string | boolean;

export interface CaseFidelity {
  kind: FidelityKind;
  text: string;
}

export interface CaseSource {
  /** Where the case was published, e.g. "Palantir 官方博客《Connecting Agents to Decisions》(2026)". */
  venue: string;
  /** Optional event date, ISO format. */
  date?: string;
  /** Optional link to the primary source. */
  url?: string;
  fidelity: CaseFidelity[];
}

export interface CaseObject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  recordCount: number;
}

export interface CaseLink {
  id: string;
  name: string;
  description: string;
  source: string;
  target: string;
  cardinality: Cardinality;
}

export interface CaseActionParameter {
  name: string;
  type: string;
  description: string;
}

export interface CaseAction {
  id: string;
  name: string;
  description: string;
  target: string;
  requireReview: boolean;
  parameters: CaseActionParameter[];
  effects: string[];
}

export type CaseParameterKind = 'range' | 'select' | 'toggle';

export interface CaseParameter {
  id: string;
  label: string;
  kind: CaseParameterKind;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: ParameterValue }[];
  default: ParameterValue;
}

export interface CaseResult {
  [key: string]: ParameterValue | undefined;
}

/** Narrow a result field to a number for arithmetic. Throws if misconfigured. */
export function num(value: ParameterValue | undefined): number {
  if (typeof value !== 'number') throw new Error('case result field is not a number');
  return value;
}

/** Narrow a result field to a string. Throws if misconfigured. */
export function str(value: ParameterValue | undefined): string {
  if (typeof value !== 'string') throw new Error('case result field is not a string');
  return value;
}

export type CaseParams = Record<string, ParameterValue>;

export interface CaseStage {
  title: string;
  subtitle?: string;
  role: string;
  skills: string;
  production?: string;
  /** Object ids highlighted in the graph during this stage. */
  nodes: string[];
  /** Pause auto-play and require explicit human confirmation. */
  requiresApproval?: boolean;
  input: (params: CaseParams, result: CaseResult) => unknown;
  output: (params: CaseParams, result: CaseResult) => unknown;
  /** Optional conclusion sentence that reacts to the current parameters. */
  narrativeNote?: (params: CaseParams, result: CaseResult) => string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  name: string;
  industry: string;
  scenario: string;
  narrative: string;
  source: CaseSource;
  objects: CaseObject[];
  links: CaseLink[];
  actions: CaseAction[];
  layout: Record<string, { x: number; y: number }>;
  stages: CaseStage[];
  parameters?: CaseParameter[];
  /** Pure function: parameters -> computed result. Absent means single-step playback. */
  compute?: (params: CaseParams) => CaseResult;
}

export interface LibraryEntry {
  id: string;
  customer: string;
  industry: string;
  scenario: string;
  source: string;
  sourceDate?: string;
  /** Group key used by the case library filters. */
  group: 'aipcon-11' | 'aipcon-10' | 'blog-2026' | 'partnership' | 'ongoing';
  fidelity: FidelityKind;
  /** Links to the interactive simulation when one exists. */
  interactiveSlug?: string;
  note?: string;
}
