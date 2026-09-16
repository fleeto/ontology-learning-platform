// Case: large-scale document-to-knowledge-graph pipeline.
// Official claim (product demo, no named customer, from the same 2026 blog):
// 40M documents -> 929M edges in 10.8 minutes; 83.2% accuracy on 600 retention questions.
// All other figures in this simulation are invented and labelled as such.

import type { CaseStudy, CaseParams } from './types';
import { num } from './types';

const BATCH: Record<string, { docs: number; label: string }> = {
  small: { docs: 50_000, label: '5 万份' },
  medium: { docs: 500_000, label: '50 万份' },
  large: { docs: 40_000_000, label: '4000 万份' },
};

const STRICTNESS: Record<string, { clusterRatio: number; edgePerDoc: number; accuracy: number }> = {
  loose: { clusterRatio: 0.22, edgePerDoc: 16, accuracy: 0.79 },
  standard: { clusterRatio: 0.34, edgePerDoc: 23.2, accuracy: 0.832 },
  strict: { clusterRatio: 0.44, edgePerDoc: 31, accuracy: 0.86 },
};

export const documentKnowledgeGraphCase: CaseStudy = {
  id: 'document-knowledge-graph',
  slug: 'document-graph',
  name: '大规模文档知识图谱',
  industry: '非结构化数据 / AI',
  scenario: '非结构化文档结构化为可问答的语义资产',
  narrative:
    'Palantir 在 2026 年官方博客中演示了把 4000 万份文档结构化为代理式知识图谱：9.29 亿条边、10.8 分钟完成，600 道保留问题答对率 83.2%。该演示未指明客户，属于产品能力证明。本模拟复现这条流水线：从文档接入到实体消歧、图谱构建与保留问题验证。官方指标为产品演示数据；其余对象与计算结果为模拟数据。',
  source: {
    venue: 'Palantir 官方博客《Connecting Agents to Decisions》(2026) 产品能力演示',
    date: '2026',
    fidelity: [
      { kind: 'official-claim', text: '「4000 万份文档、9.29 亿条边、10.8 分钟完成、600 道保留问题答对率 83.2%」为官方产品演示指标' },
      { kind: 'fact', text: '该演示未指明具体客户名称，属于产品能力证明而非客户案例' },
      { kind: 'simulated', text: '小批量下的实体数、消歧比例、耗时与准确率为按官方指标趋势外推的模拟数据' },
    ],
  },
  objects: [
    { id: 'document', name: 'Document', description: '非结构化文档（合同、报告、手册）', icon: '📄', color: '#3b82f6', recordCount: 40_000_000 },
    { id: 'ingestion-batch', name: 'IngestionBatch', description: '接入批次', icon: '📥', color: '#0ea5e9', recordCount: 1280 },
    { id: 'extracted-entity', name: 'ExtractedEntity', description: '抽取出的原始实体指称', icon: '🏷️', color: '#f59e0b', recordCount: 512_000_000 },
    { id: 'entity-cluster', name: 'EntityCluster', description: '消歧后的实体簇（唯一实体）', icon: '🧬', color: '#8b5cf6', recordCount: 168_000_000 },
    { id: 'graph-edge', name: 'GraphEdge', description: '图谱边（实体间关系）', icon: '🔗', color: '#22c55e', recordCount: 929_000_000 },
    { id: 'retention-question', name: 'RetentionQuestion', description: '保留问题（已知标准答案）', icon: '❓', color: '#ec4899', recordCount: 600 },
    { id: 'answer-attempt', name: 'AnswerAttempt', description: 'Agent 的作答记录', icon: '💬', color: '#14b8a6', recordCount: 600 },
  ],
  links: [
    { id: 'part-of-batch', name: 'partOf', description: '文档属于接入批次', source: 'document', target: 'ingestion-batch', cardinality: 'many-to-one' },
    { id: 'mentions', name: 'mentions', description: '文档提及实体指称', source: 'document', target: 'extracted-entity', cardinality: 'one-to-many' },
    { id: 'resolves-to', name: 'resolvesTo', description: '实体指称消歧到实体簇', source: 'extracted-entity', target: 'entity-cluster', cardinality: 'many-to-one' },
    { id: 'edge-source', name: 'edgeFrom', description: '边的起点实体簇', source: 'graph-edge', target: 'entity-cluster', cardinality: 'many-to-one' },
    { id: 'edge-target', name: 'edgeTo', description: '边的终点实体簇', source: 'graph-edge', target: 'entity-cluster', cardinality: 'many-to-one' },
    { id: 'question-about', name: 'questionAbout', description: '保留问题关于文档', source: 'retention-question', target: 'document', cardinality: 'many-to-one' },
    { id: 'answered-by', name: 'answeredBy', description: '保留问题由作答记录回答', source: 'retention-question', target: 'answer-attempt', cardinality: 'one-to-many' },
  ],
  actions: [
    {
      id: 'ingest-documents', name: 'Ingest Documents', description: '接入新一批文档', target: 'ingestion-batch',
      requireReview: false,
      parameters: [{ name: 'batchId', type: 'String', description: '批次 ID' }, { name: 'source', type: 'String', description: '文档来源' }],
      effects: ['创建 IngestionBatch', '文档对象化并打标', '跳过已去重文档'],
    },
    {
      id: 'recluster-entities', name: 'Re-cluster Entities', description: '按新严格度重新消歧聚类', target: 'entity-cluster',
      requireReview: true,
      parameters: [{ name: 'strictness', type: 'String', description: '消歧严格度' }],
      effects: ['重算 EntityCluster', '更新 resolvesTo 关系', '触发图谱增量重建'],
    },
    {
      id: 'run-retention-qa', name: 'Run Retention QA', description: '用保留问题集验证图谱质量', target: 'retention-question',
      requireReview: false,
      parameters: [{ name: 'questionCount', type: 'Integer', description: '问题数' }],
      effects: ['生成 AnswerAttempt', '比对标准答案', '输出准确率'],
    },
  ],
  layout: {
    'ingestion-batch': { x: 120, y: 90 },
    'document': { x: 330, y: 90 },
    'extracted-entity': { x: 560, y: 90 },
    'entity-cluster': { x: 560, y: 290 },
    'graph-edge': { x: 800, y: 190 },
    'retention-question': { x: 330, y: 420 },
    'answer-attempt': { x: 560, y: 450 },
  },
  parameters: [
    {
      id: 'batchSize',
      label: '文档批次规模',
      kind: 'select',
      options: [
        { label: '5 万份', value: 'small' },
        { label: '50 万份', value: 'medium' },
        { label: '4000 万份（官方演示规模）', value: 'large' },
      ],
      default: 'large',
    },
    {
      id: 'strictness',
      label: '实体消歧严格度',
      kind: 'select',
      options: [
        { label: '宽松', value: 'loose' },
        { label: '标准', value: 'standard' },
        { label: '严格', value: 'strict' },
      ],
      default: 'standard',
    },
  ],
  compute: (params) => {
    const sizeKey = String(params.batchSize ?? 'large');
    const stKey = String(params.strictness ?? 'standard');
    const size = BATCH[sizeKey] ?? BATCH.large;
    const st = STRICTNESS[stKey] ?? STRICTNESS.standard;
    const docs = size.docs;
    const mentions = Math.round(docs * 12.8);
    const clusters = Math.round(mentions * st.clusterRatio);
    const edges = Math.round(docs * st.edgePerDoc);
    const minutes = Math.round((docs / 40_000_000) * 10.8 * 1000) / 1000;
    const questions = 600;
    const accuracy = Math.round(st.accuracy * 1000) / 10;
    const correct = Math.round((st.accuracy * questions) * 10) / 10;
    return {
      docsLabel: size.label,
      docs,
      mentions,
      clusters,
      edges,
      minutes,
      questions,
      accuracy,
      correct,
    };
  },
  stages: [
    {
      title: '文档接入',
      subtitle: '非结构化数据进入本体',
      role: '数据工程师',
      skills: '批量接入 · 文档解析 · 去重与溯源',
      production: '配置批次水位、失败重跑与来源标记。',
      nodes: ['ingestion-batch', 'document'],
      input: (p, r) => ({ batchId: 'BATCH-DEMO-001', docs: r.docsLabel, source: '企业文档库（模拟）' }),
      output: (p, r) => ({ ingestedDocs: r.docs, dedupSkipped: '已按内容哈希去重', status: '已接入（模拟）' }),
    },
    {
      title: '解析抽取',
      subtitle: '文档里挖出实体指称',
      role: 'AI 平台工程师',
      skills: '实体抽取 · 版式解析 · 置信度标注',
      production: '抽取模型版本与提示词纳入审计；低置信指称单独隔离。',
      nodes: ['document', 'extracted-entity'],
      input: (p, r) => ({ docs: r.docs, model: '抽取模型 v2（模拟）' }),
      output: (p, r) => ({ mentions: r.mentions, avgPerDoc: Math.round((num(r.mentions) / num(r.docs)) * 10) / 10 }),
    },
    {
      title: '实体消歧',
      subtitle: '把同一个实体合并到一处',
      role: '数据工程师 + 领域专家',
      skills: '实体解析 · 聚类策略 · 人工确认队列',
      production: '严格度可调；关键实体走人工确认，消歧结果可回滚。',
      nodes: ['extracted-entity', 'entity-cluster'],
      input: (p, r) => ({ mentions: r.mentions, strictness: paramsStrictness(p) }),
      output: (p, r) => ({ clusters: r.clusters, mergeRatio: `${Math.round((1 - num(r.clusters) / num(r.mentions)) * 100)}%` }),
      narrativeNote: (p, r) => `严格度 ${paramsStrictness(p)} 下，${r.mentions} 个指称合并为 ${r.clusters} 个唯一实体——同一供应商在合同、报告、邮件里不同写法都归并到同一个实体簇。`,
    },
    {
      title: '图谱构建',
      subtitle: '实体簇之间连边',
      role: '平台工程师',
      skills: '关系建模 · 批量构边 · 图索引',
      production: '构边过程可重放；索引重建需度量耗时与资源。',
      nodes: ['entity-cluster', 'graph-edge'],
      input: (p, r) => ({ clusters: r.clusters }),
      output: (p, r) => ({ edges: num(r.edges), buildMinutes: r.minutes }),
      narrativeNote: (_p, r) =>
        num(r.docs) >= 40_000_000
          ? `本批次构建 ${num(r.edges).toLocaleString()} 条边，耗时 ${r.minutes} 分钟——对应官方演示的「9.29 亿条边、10.8 分钟」。`
          : `${r.docsLabel} 的批次构建 ${num(r.edges).toLocaleString()} 条边，耗时 ${r.minutes} 分钟（按官方指标趋势外推）。`,
    },
    {
      title: '索引',
      subtitle: '让图谱可查询',
      role: '平台工程师',
      skills: '图索引 · 查询优化 · 缓存策略',
      production: '索引覆盖常用查询模式；慢查询纳入监控。',
      nodes: ['graph-edge', 'entity-cluster'],
      input: (p, r) => ({ edges: r.edges, indexType: '混合索引（模拟）' }),
      output: (p, r) => ({ status: '已索引', queryable: true, edges: num(r.edges) }),
    },
    {
      title: '保留问题验证',
      subtitle: '把 AI 输出钉在锚点上',
      role: '领域专家 + AI 平台工程师',
      skills: '评测集设计 · 答案比对 · 质量门禁',
      production: '保留问题集随业务演进持续更新；准确率下降触发告警。',
      nodes: ['retention-question', 'answer-attempt', 'document'],
      requiresApproval: true,
      input: (p, r) => ({ questions: r.questions, source: '业务专家预置的保留问题集（模拟）' }),
      output: (p, r) => ({ questions: r.questions, correct: r.correct, accuracy: `${r.accuracy}%` }),
      narrativeNote: (_p, r) => `${r.questions} 道保留问题答对 ${r.accuracy}%——图谱质量不靠感觉，靠已知答案的问题集持续验证。`,
    },
  ],
};

function paramsStrictness(params: CaseParams): string {
  const v = params.strictness;
  if (v === 'loose') return '宽松';
  if (v === 'strict') return '严格';
  return '标准';
}
