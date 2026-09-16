// Case: U.S. Army Software Factory + Agentik.
// Official claim from the Palantir blog "Connecting Agents to Decisions" (2026):
// delivery cycle reduced from months to days. All simulation data is invented.

import type { CaseStudy } from './types';
import { num } from './types';

const COMPLEXITY: Record<string, { traditionalDays: number; agentDays: number; changes: number }> = {
  simple: { traditionalDays: 21, agentDays: 3, changes: 4 },
  medium: { traditionalDays: 68, agentDays: 9, changes: 11 },
  complex: { traditionalDays: 142, agentDays: 21, changes: 27 },
};

export const armySoftwareFactoryCase: CaseStudy = {
  id: 'army-software-factory',
  slug: 'army-software-factory',
  name: 'U.S. Army Software Factory',
  industry: '国防 / 软件交付',
  scenario: '一个任务需求经 Agent 辅助到部署',
  narrative:
    '美国陆军软件工厂借助 Ontology / Agentik，把软件交付周期从「数月」缩短到「数天」。本演示模拟一个任务需求从录入到部署的全流程：Agent 在本体上下文中起草变更，测试与审批守住人机边界。客户与「数月→数天」进展为官方披露；演示中的对象、天数与通过率均为模拟数据。',
  source: {
    venue: 'Palantir 官方博客《Connecting Agents to Decisions》(2026) 真实世界案例',
    date: '2026',
    fidelity: [
      { kind: 'fact', text: '客户名称（U.S. Army Software Factory）与「借助 Ontology / Agentik」的部署关系出自 Palantir 官方博客' },
      { kind: 'official-claim', text: '「交付周期从数月缩短到数天」为官方描述性进展，非量化百分比' },
      { kind: 'simulated', text: '需求复杂度对应的天数、变更数、测试通过率与本演示的计算结果全部为模拟数据' },
    ],
  },
  objects: [
    { id: 'mission-need', name: 'MissionNeed', description: '任务侧能力需求', icon: '🎯', color: '#3b82f6', recordCount: 340 },
    { id: 'capability', name: 'SoftwareCapability', description: '可交付的软件能力', icon: '🧩', color: '#8b5cf6', recordCount: 180 },
    { id: 'repo', name: 'SourceRepository', description: '代码仓库与分支', icon: '🗂️', color: '#64748b', recordCount: 96 },
    { id: 'agent-run', name: 'AgentRun', description: 'Agent 辅助生成的一次运行记录', icon: '🤖', color: '#0ea5e9', recordCount: 1240 },
    { id: 'change-request', name: 'ChangeRequest', description: '变更请求', icon: '📝', color: '#f59e0b', recordCount: 860 },
    { id: 'approval-gate', name: 'ApprovalGate', description: '人工审批门（人机边界）', icon: '🛡️', color: '#ef4444', recordCount: 420 },
    { id: 'test-suite', name: 'TestSuite', description: '自动化测试集合', icon: '🧪', color: '#14b8a6', recordCount: 520 },
    { id: 'deployment', name: 'Deployment', description: '部署实例', icon: '🚀', color: '#22c55e', recordCount: 640 },
    { id: 'audit-record', name: 'AuditRecord', description: '审计记录', icon: '📜', color: '#ec4899', recordCount: 5300 },
  ],
  links: [
    { id: 'requests', name: 'requests', description: '任务需求请求软件能力', source: 'mission-need', target: 'capability', cardinality: 'one-to-many' },
    { id: 'implemented-by', name: 'implementedBy', description: '能力由仓库实现', source: 'capability', target: 'repo', cardinality: 'many-to-one' },
    { id: 'generates', name: 'generates', description: 'Agent 运行生成变更请求', source: 'agent-run', target: 'change-request', cardinality: 'one-to-many' },
    { id: 'reviewed-by', name: 'reviewedBy', description: '变更请求经审批门评审', source: 'change-request', target: 'approval-gate', cardinality: 'many-to-one' },
    { id: 'validated-by', name: 'validatedBy', description: '变更请求由测试集验证', source: 'change-request', target: 'test-suite', cardinality: 'many-to-one' },
    { id: 'includes-change', name: 'includesChange', description: '部署包含变更请求', source: 'deployment', target: 'change-request', cardinality: 'one-to-many' },
    { id: 'triggered-by', name: 'triggeredBy', description: 'Agent 运行由能力触发', source: 'agent-run', target: 'capability', cardinality: 'many-to-one' },
    { id: 'audits', name: 'audits', description: '审计记录记载部署', source: 'audit-record', target: 'deployment', cardinality: 'many-to-one' },
  ],
  actions: [
    {
      id: 'draft-change', name: 'Draft Change Request', description: 'Agent 起草变更请求（不直接落库）', target: 'change-request',
      requireReview: false,
      parameters: [
        { name: 'capabilityId', type: 'String', description: '能力 ID' },
        { name: 'instructions', type: 'String', description: '自然语言指令' },
      ],
      effects: ['生成 ChangeRequest 草稿', '标注依据与不确定性', '不修改生产对象'],
    },
    {
      id: 'approve-gate', name: 'Approve at Gate', description: '审批门人工放行变更', target: 'approval-gate',
      requireReview: true,
      parameters: [{ name: 'changeRequestId', type: 'String', description: '变更请求 ID' }],
      effects: ['更新 ApprovalGate 状态', '解锁部署流程', '写入审计记录'],
    },
    {
      id: 'run-tests', name: 'Run Test Suite', description: '对变更运行自动化测试', target: 'test-suite',
      requireReview: false,
      parameters: [{ name: 'changeRequestId', type: 'String', description: '变更请求 ID' }],
      effects: ['执行测试集', '回写通过率', '失败用例挂到变更请求'],
    },
    {
      id: 'deploy', name: 'Deploy', description: '将已通过审批与测试的变更部署', target: 'deployment',
      requireReview: true,
      parameters: [{ name: 'deploymentId', type: 'String', description: '部署 ID' }, { name: 'environment', type: 'String', description: '目标环境' }],
      effects: ['创建 Deployment 对象', '关联全部 ChangeRequest', '生成 AuditRecord'],
    },
  ],
  layout: {
    'mission-need': { x: 120, y: 110 },
    'capability': { x: 330, y: 110 },
    'repo': { x: 560, y: 60 },
    'agent-run': { x: 330, y: 300 },
    'change-request': { x: 560, y: 210 },
    'test-suite': { x: 800, y: 120 },
    'approval-gate': { x: 800, y: 320 },
    'deployment': { x: 560, y: 420 },
    'audit-record': { x: 800, y: 460 },
  },
  parameters: [
    {
      id: 'complexity',
      label: '需求复杂度',
      kind: 'select',
      options: [
        { label: '简单：一个界面调整', value: 'simple' },
        { label: '中等：一个数据接口', value: 'medium' },
        { label: '复杂：一个新能力模块', value: 'complex' },
      ],
      default: 'medium',
    },
    { id: 'agentAssist', label: '启用 Agent 辅助', kind: 'toggle', default: true },
  ],
  compute: (params) => {
    const level = String(params.complexity ?? 'medium');
    const c = COMPLEXITY[level] ?? COMPLEXITY.medium;
    const agentOn = params.agentAssist !== false;
    const days = agentOn ? c.agentDays : c.traditionalDays;
    const changes = agentOn ? c.changes : Math.max(1, Math.round(c.changes * 0.7));
    const passRate = agentOn ? 0.86 : 0.93;
    const rounds = agentOn ? 2 : 4;
    return {
      level,
      agentOn,
      days,
      traditionalDays: c.traditionalDays,
      speedup: Math.round((1 - days / c.traditionalDays) * 100),
      changes,
      passRate: Math.round(passRate * 100),
      rounds,
      gates: 2,
    };
  },
  stages: [
    {
      title: '需求输入',
      subtitle: '任务需求进入本体',
      role: '任务负责人 + 领域建模师',
      skills: '需求结构化 · 能力建模 · 语义对齐',
      production: '需求字段必须映射到 SoftwareCapability 的稳定标识。',
      nodes: ['mission-need', 'capability'],
      input: (p) => ({ needId: 'NEED-DEMO-001', complexity: p.complexity, description: '任务侧提出的能力诉求（模拟）' }),
      output: (p, r) => ({ capabilityId: 'CAP-DEMO-001', linkedRepo: 'repo-field-artillery-001', complexity: r.level }),
    },
    {
      title: 'Agent 起草变更',
      subtitle: '本体作为上下文层',
      role: 'AI 平台工程师',
      skills: 'AIP 上下文注入 · 工具调用 · 起草而非执行',
      production: 'Agent 只读本体与工具返回，不持有数据库凭证，不直接写生产对象。',
      nodes: ['capability', 'repo', 'agent-run', 'change-request'],
      input: (p, r) => ({ capabilityId: 'CAP-DEMO-001', agentAssist: r.agentOn, context: ['SoftwareCapability', 'SourceRepository'] }),
      output: (p, r) => r.agentOn
        ? { draftChanges: r.changes, generatedBy: 'AgentRun-DEMO', status: '草稿待评审' }
        : { draftChanges: r.changes, generatedBy: '人工编写', status: '草稿待评审' },
      narrativeNote: (_p, r) =>
        r.agentOn
          ? `Agent 在本体上下文中起草 ${r.changes} 个变更，但不落库——起草自动化，执行受控。`
          : '未启用 Agent 辅助：变更全部人工编写，速度回到传统流程。',
    },
    {
      title: '自动化测试',
      subtitle: '把质量检查前置',
      role: '平台工程师 + 测试',
      skills: '测试编排 · 结果回写 · 失败关联',
      production: '测试结果回写到 ChangeRequest，失败用例阻塞审批。',
      nodes: ['change-request', 'test-suite'],
      input: (p, r) => ({ changeRequests: r.changes, suiteId: 'SUITE-DEMO-001' }),
      output: (p, r) => ({ rounds: r.rounds, passRate: `${r.passRate}%`, status: num(r.passRate) >= 80 ? '通过' : '需修复' }),
    },
    {
      title: '人工审批门',
      subtitle: '人机边界',
      role: '授权审批人',
      skills: '权限校验 · 变更评审 · 操作留痕',
      production: '服务端校验审批权限；幂等键防止重复放行。',
      nodes: ['approval-gate', 'change-request'],
      requiresApproval: true,
      input: (p, r) => ({ changeRequests: r.changes, passRate: `${r.passRate}%` }),
      output: () => ({ gate: 'APPROVAL-GATE-DEMO', status: '等待人工放行' }),
      narrativeNote: () => 'Agent 起草、测试验证、人工放行——三者分离，任何一方都不能单独把变更推到生产。',
    },
    {
      title: '部署',
      subtitle: '变更进入目标环境',
      role: '平台工程师 + 运维',
      skills: '部署编排 · 环境隔离 · 回滚预案',
      production: '部署前核对审批与测试证据；保留回滚能力。',
      nodes: ['deployment', 'change-request', 'approval-gate'],
      input: (p, r) => ({ approved: true, changes: r.changes, environment: 'staging（模拟）' }),
      output: (p, r) => ({ deploymentId: 'DEP-DEMO-001', includedChanges: r.changes, status: '已部署（模拟）' }),
    },
    {
      title: '审计与复盘',
      subtitle: '决策可追溯',
      role: '合规 + 平台工程师',
      skills: '审计日志 · 血缘追踪 · 复盘改进',
      production: '保留需求、Agent 运行、测试、审批与部署的完整链条。',
      nodes: ['audit-record', 'deployment', 'agent-run'],
      input: (p, r) => ({ deploymentId: 'DEP-DEMO-001' }),
      output: (p, r) => ({ auditId: 'AUD-DEMO-001', totalDays: r.days, speedup: `${r.speedup}%` }),
      narrativeNote: (_p, r) =>
        r.agentOn
          ? `本需求从录入到部署耗时 ${r.days} 天（传统流程约 ${r.traditionalDays} 天，缩短 ${r.speedup}%）。官方对外表述为「数月→数天」。`
          : `未启用 Agent 辅助，本需求耗时 ${r.days} 天。启用 Agent 辅助可回到 ${num(r.traditionalDays) - num(r.days) > 0 ? '更快' : '相同'}节奏。`,
    },
  ],
};
