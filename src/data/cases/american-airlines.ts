// Case: American Airlines network operations recovery.
// Facts from the Palantir blog "Connecting Agents to Decisions" (2026).
// All simulation data is invented and labelled as such.

import type { CaseStudy } from './types';
import { num, str } from './types';

const HUBS: Record<string, { name: string; flights: number; crews: number; passengers: number; spare: number }> = {
  DFW: { name: '达拉斯沃斯堡', flights: 180, crews: 64, passengers: 12400, spare: 9 },
  ORD: { name: '芝加哥奥黑尔', flights: 140, crews: 52, passengers: 9800, spare: 6 },
  PHX: { name: '菲尼克斯', flights: 96, crews: 34, passengers: 6100, spare: 4 },
};

export const americanAirlinesCase: CaseStudy = {
  id: 'aa-network-recovery',
  slug: 'american-airlines',
  name: 'American Airlines',
  industry: '航空运输',
  scenario: '一次天气事件触发航网恢复',
  narrative:
    '美国航空用 Ontology 驱动 AI 支持的网络规划与运营优化。本演示模拟一场雷暴天气事件：系统沿关系把一个机场的中断传播到后续航班、机组与旅客行程，再生成恢复方案。客户与场景为官方博客披露的事实；演示中的所有对象、记录数与计算结果均为模拟数据。',
  source: {
    venue: 'Palantir 官方博客《Connecting Agents to Decisions》(2026) 真实世界案例',
    date: '2026',
    fidelity: [
      { kind: 'fact', text: '客户名称、所属行业、以及「用 Ontology 驱动 AI 支持的网络规划与运营优化」这一应用场景出自 Palantir 官方博客' },
      { kind: 'official-claim', text: '公开材料未给出本案例的量化成效指标' },
      { kind: 'simulated', text: '机场、航班、机组、旅客数量，以及延误传播与恢复的计算结果全部为演示模拟数据' },
    ],
  },
  objects: [
    { id: 'weather-event', name: 'WeatherEvent', description: '天气事件（雷暴、大雪、台风）', icon: '🌩️', color: '#0ea5e9', recordCount: 412 },
    { id: 'airport', name: 'Airport', description: '机场，航网中的枢纽节点', icon: '🏙️', color: '#3b82f6', recordCount: 350 },
    { id: 'flight', name: 'Flight', description: '航班实例（含计划与实际起降时间）', icon: '✈️', color: '#8b5cf6', recordCount: 6400 },
    { id: 'aircraft', name: 'Aircraft', description: '航空器与适航状态', icon: '🛩️', color: '#14b8a6', recordCount: 960 },
    { id: 'crew', name: 'Crew', description: '机组排班与值勤状态', icon: '👷', color: '#f59e0b', recordCount: 5200 },
    { id: 'route', name: 'Route', description: '航线（场对场计划航段）', icon: '📏', color: '#64748b', recordCount: 1100 },
    { id: 'itinerary', name: 'PassengerItinerary', description: '旅客行程（可含多段航班）', icon: '🧳', color: '#ec4899', recordCount: 148000 },
    { id: 'delay-event', name: 'DelayEvent', description: '延误事件，由系统自动检测', icon: '⏱️', color: '#f97316', recordCount: 2310 },
    { id: 'recovery', name: 'RecoveryDecision', description: '恢复决策记录（改签、换机、取消）', icon: '🧭', color: '#22c55e', recordCount: 860 },
  ],
  links: [
    { id: 'impacts-airport', name: 'impactsAirport', description: '天气事件影响机场', source: 'weather-event', target: 'airport', cardinality: 'one-to-many' },
    { id: 'departs-from', name: 'departsFrom', description: '航班从机场起飞', source: 'flight', target: 'airport', cardinality: 'many-to-one' },
    { id: 'arrives-at', name: 'arrivesAt', description: '航班到达机场', source: 'flight', target: 'airport', cardinality: 'many-to-one' },
    { id: 'operates-on', name: 'operatesOn', description: '航班执飞航线', source: 'flight', target: 'route', cardinality: 'many-to-one' },
    { id: 'uses-aircraft', name: 'usesAircraft', description: '航班使用航空器', source: 'flight', target: 'aircraft', cardinality: 'many-to-one' },
    { id: 'crew-assigned', name: 'crewAssignedTo', description: '机组被指派到航班', source: 'crew', target: 'flight', cardinality: 'many-to-many' },
    { id: 'includes-flight', name: 'includesFlight', description: '旅客行程包含航班', source: 'itinerary', target: 'flight', cardinality: 'many-to-many' },
    { id: 'affects-flight', name: 'affects', description: '延误事件影响航班', source: 'delay-event', target: 'flight', cardinality: 'one-to-many' },
    { id: 'causes-delay', name: 'causesDelay', description: '天气事件引发延误事件', source: 'weather-event', target: 'delay-event', cardinality: 'one-to-many' },
    { id: 'decides-for', name: 'decidesFor', description: '恢复决策针对延误事件', source: 'recovery', target: 'delay-event', cardinality: 'many-to-one' },
  ],
  actions: [
    {
      id: 'issue-ground-stop',
      name: 'Issue Ground Stop',
      description: '对受影响机场发布地面停留指令',
      target: 'airport',
      requireReview: true,
      parameters: [
        { name: 'airportCode', type: 'String', description: '机场代码' },
        { name: 'durationMin', type: 'Integer', description: '持续分钟数' },
      ],
      effects: ['更新 Airport 状态', '通知签派与塔台', '生成 DelayEvent 集合'],
    },
    {
      id: 'rebook-passengers',
      name: 'Rebook Passengers',
      description: '批量改签受影响旅客到后续航班',
      target: 'itinerary',
      requireReview: true,
      parameters: [
        { name: 'flightIds', type: 'String[]', description: '取消的航班列表' },
        { name: 'maxWaitHours', type: 'Double', description: '可接受最长等待小时' },
      ],
      effects: ['更新 PassengerItinerary', '释放原航班座位', '发送旅客通知'],
    },
    {
      id: 'swap-aircraft',
      name: 'Swap Aircraft',
      description: '为延误航班调换备用航空器',
      target: 'aircraft',
      requireReview: false,
      parameters: [
        { name: 'flightId', type: 'String', description: '航班号' },
        { name: 'tailNumber', type: 'String', description: '备用机尾号' },
      ],
      effects: ['更新 Flight.usesAircraft', '校验备用机适航与位置', '通知机组'],
    },
    {
      id: 'close-recovery', name: 'Close Recovery', description: '关闭恢复决策并归档', target: 'recovery',
      requireReview: false,
      parameters: [{ name: 'decisionId', type: 'String', description: '决策 ID' }],
      effects: ['更新 RecoveryDecision 状态', '写入审计记录', '恢复常规放行'],
    },
  ],
  layout: {
    'weather-event': { x: 130, y: 110 },
    'airport': { x: 320, y: 110 },
    'route': { x: 560, y: 70 },
    'delay-event': { x: 320, y: 300 },
    'flight': { x: 560, y: 210 },
    'aircraft': { x: 800, y: 110 },
    'crew': { x: 800, y: 330 },
    'itinerary': { x: 560, y: 410 },
    'recovery': { x: 130, y: 420 },
  },
  parameters: [
    {
      id: 'hub',
      label: '受影响枢纽',
      kind: 'select',
      options: [
        { label: 'DFW 达拉斯沃斯堡', value: 'DFW' },
        { label: 'ORD 芝加哥奥黑尔', value: 'ORD' },
        { label: 'PHX 菲尼克斯', value: 'PHX' },
      ],
      default: 'DFW',
    },
    { id: 'hours', label: '天气持续小时', kind: 'range', min: 1, max: 12, step: 1, default: 4 },
  ],
  compute: (params) => {
    const hubCode = String(params.hub ?? 'DFW');
    const hub = HUBS[hubCode] ?? HUBS.DFW;
    const hours = Number(params.hours ?? 4);
    const ratio = Math.min(1, hours / 8);
    const cancelled = Math.round(hub.flights * 0.18 * ratio);
    const delayed = Math.round(hub.flights * 0.42 * ratio);
    const affectedCrews = Math.round(hub.crews * 0.5 * ratio);
    const affectedPassengers = Math.round(hub.passengers * (0.1 + 0.3 * ratio));
    const spareNeeded = Math.max(1, Math.round(cancelled / 7));
    const spareShort = Math.max(0, spareNeeded - hub.spare);
    return {
      hubCode,
      hubName: hub.name,
      cancelled,
      delayed,
      affectedCrews,
      affectedPassengers,
      spareAvailable: hub.spare,
      spareNeeded,
      spareShort,
      coverageScore: Math.max(0, Math.round(100 - ratio * 55)),
    };
  },
  stages: [
    {
      title: '事件感知',
      subtitle: '天气事件进入本体',
      role: '数据工程师 + 签派',
      skills: '气象数据接入 · 事件标准化 · 优先级分级',
      production: '对接气象源、配置延迟阈值与告警通道。',
      nodes: ['weather-event', 'airport'],
      input: (p, _r) => ({ source: '航空气象数据流（模拟）', airport: p.hub, type: '雷暴', durationHours: p.hours, severity: Number(p.hours) >= 6 ? 'High' : 'Medium' }),
      output: (p, r) => ({ weatherEventId: 'WX-DEMO-001', airport: r.hubCode, status: '已发布地面停留', linkedFlights: '待计算' }),
    },
    {
      title: '影响传播',
      subtitle: '沿关系找到受影响范围',
      role: '后端工程师 + 运行控制',
      skills: '关系查询 · 传播计算 · 可解释依据',
      production: '验证多跳查询性能；传播路径必须可追溯、可复核。',
      nodes: ['airport', 'flight', 'route', 'delay-event'],
      input: (p, r) => ({ airport: r.hubCode, expandLinks: ['departsFrom', 'arrivesAt', 'crewAssignedTo', 'includesFlight'] }),
      output: (p, r) => ({ cancelled: r.cancelled, delayed: r.delayed, affectedCrews: r.affectedCrews, affectedPassengers: r.affectedPassengers, note: '沿 link types 逐跳展开' }),
      narrativeNote: (_p, r) => `${r.hubName}（${r.hubCode}）一个事件牵连 ${r.cancelled} 个取消航班与 ${r.delayed} 个延误航班，波及 ${r.affectedPassengers} 名旅客——这是关系查询，不是单表筛选。`,
    },
    {
      title: '恢复方案生成',
      subtitle: 'AI 辅助生成候选方案',
      role: '运行控制 + AI 平台工程师',
      skills: 'AIP 上下文注入 · 方案排序 · 约束校验',
      production: 'Agent 只生成候选；方案必须标注依据与不确定性。',
      nodes: ['flight', 'aircraft', 'crew', 'itinerary', 'recovery'],
      input: (p, r) => ({ cancelledFlights: r.cancelled, spareAircraft: r.spareAvailable, crewsAvailable: r.affectedCrews }),
      output: (p, r) => ({ options: ['批量改签', '调换备用机', '合并航班'], spareShort: r.spareShort, coverageScore: r.coverageScore }),
      narrativeNote: (_p, r) =>
        num(r.spareShort) > 0
          ? `备用机需 ${r.spareNeeded} 架、现余 ${r.spareAvailable} 架，缺口 ${r.spareShort} 架，部分航班只能取消或改签。`
          : `备用机充足（需 ${r.spareNeeded} 架，余 ${r.spareAvailable} 架），可优先换机保住时刻。`,
    },
    {
      title: '人工审批',
      subtitle: '受控操作的边界',
      role: '运行控制值班经理',
      skills: '权限校验 · 审批工作流 · 操作留痕',
      production: '服务端校验权限与额度，幂等键防止重复放行。',
      nodes: ['recovery', 'delay-event'],
      requiresApproval: true,
      input: (p, r) => ({ action: 'Rebook Passengers + Swap Aircraft', affectedPassengers: r.affectedPassengers }),
      output: (p, r) => ({ status: '等待人工审批', estimatedImpact: `${r.affectedPassengers} 名旅客` }),
      narrativeNote: () => 'Agent 可以起草方案，但改签与换机这类改变运行状态的 Action 必须人工放行。',
    },
    {
      title: '执行恢复',
      subtitle: '方案写回运行系统',
      role: '集成工程师 + 签派',
      skills: 'Action 执行 · 状态同步 · 失败重试',
      production: '处理执行失败与对账；改签完成不等于旅客已成行。',
      nodes: ['aircraft', 'flight', 'itinerary'],
      input: (p, r) => ({ approved: true, actions: ['rebook-passengers', 'swap-aircraft'] }),
      output: (p, r) => ({ status: '已执行（模拟）', rebooked: r.affectedPassengers, swapped: Math.min(num(r.spareAvailable), num(r.spareNeeded)) }),
    },
    {
      title: '审计与归档',
      subtitle: '决策可追溯',
      role: '平台工程师 + 合规',
      skills: '审计日志 · 决策血缘 · 事后复盘',
      production: '保留决策输入、依据与执行结果，支撑事后复盘。',
      nodes: ['recovery', 'delay-event', 'weather-event'],
      input: (p, r) => ({ decisionId: 'RC-DEMO-001' }),
      output: () => ({ decisionLog: 'LOG-AA-001', status: '已归档（模拟）' }),
      narrativeNote: (_p, r) => `本次恢复的输入、传播路径与执行结果全部归档为 ${num(r.cancelled) + num(r.delayed)} 个关联对象的决策血缘。`,
    },
  ],
};
