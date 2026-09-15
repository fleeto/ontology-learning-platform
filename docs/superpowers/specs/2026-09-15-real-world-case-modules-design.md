# 真实案例与行业模拟 · 设计文档

> **文档版本**：v1.0
> **创建日期**：2026-09-15
> **状态**：设计稿，已与用户逐节确认
> **关联项目**：palantir-ontology-research（本体智能教学平台）

---

## 1. 目标

为现有教学平台增加「真实案例」维度：

1. **案例库页**：结构化收录 2026 年 Palantir 本体相关企业案例（AIPCon 10/11 客户、官方博客真实案例、Method Security Cardinal 项目），附来源与可信度标注。
2. **三个深度交互模拟**：American Airlines 航网运营、美国陆军软件工厂 + Agentik、4000 万文档知识图谱，复用平台已有的图谱/粒子交互范式。
3. **重写损坏的 `textbook/案例库.md`**：从同一份结构化事实数据生成，消除现有文件的截断与错乱。

### 设计原则（沿用平台既有口径）

- **事实真实 + 演示模拟**：客户名、行业、场景出处、官方声称指标为事实；模拟中的具体对象、记录数、运行结果全部标注为模拟数据。
- **纯前端、无后端**：所有计算为浏览器内纯函数，不连接真实系统。
- **单一事实源**：案例事实数据只有一份，markdown 教材与案例库页均为其下游产物。

---

## 2. 架构

```
src/
├── data/
│   ├── ontology-model.ts              # 既有医疗供应链模型（保持不动）
│   └── cases/                         # 新增：案例数据包
│       ├── types.ts                   # CaseSchema
│       ├── library.ts                 # 案例库事实源（AIPCon10/11、博客、合作项目）
│       ├── american-airlines.ts
│       ├── army-software-factory.ts
│       └── document-knowledge-graph.ts
├── components/
│   └── CaseSimulator.tsx              # 新增：通用模拟引擎
├── lib/
│   └── graph-geometry.ts              # 新增：从 app/page.tsx 提取的图谱几何/粒子/BFS
└── app/
    └── cases/                         # 新增路由
        ├── page.tsx                   # 案例库
        ├── american-airlines/page.tsx
        ├── army-software-factory/page.tsx
        └── document-graph/page.tsx
scripts/
├── gen-case-library.ts                # library.ts → textbook/案例库.md
└── verify-cases.ts                    # 数据包合法性校验
textbook/
└── 案例库.md                           # 重写（生成产物）
```

### 边界

- **`CaseSchema` 是唯一接口**。`CaseSimulator` 只认 schema，不含任何航空/军队/文档领域词汇。新增第 4 个案例 = 加一个数据文件 + 一行路由 + 一条 library 记录。
- **不改动既有 `ontology-model.ts`**。案例数据自带对象/关系/动作，与教学模型隔离。
- **三个深模拟页是薄壳**：`<CaseSimulator case={aaCase} />`，约 30 行，不含交互逻辑。

### 路由

案例置于独立的 `/cases` 路由，不并入既有「本体建模 / 数据集成 / 应用构建」分组。侧边栏新增第四个分组「真实案例」：案例库 + 三个模拟入口。

---

## 3. CaseSchema 数据模型

```ts
// src/data/cases/types.ts

interface CaseStudy {
  id: string;
  slug: string;                      // URL 路径段
  name: string;                      // 'American Airlines'
  industry: string;
  source: CaseSource;                // 事实来源与可信度标注
  scenario: string;                  // 一句话场景
  narrative: string;                 // 背景叙述（事实部分）

  objects: CaseObject[];
  links: CaseLink[];
  actions: CaseAction[];
  layout: Record<string, { x: number; y: number }>;
  stages: CaseStage[];
  parameters?: CaseParameter[];      // 可选：无则不渲染参数面板
  compute?: (params: Record<string, number | string | boolean>) => CaseResult;
}

interface CaseSource {
  venue: string;                     // 'Palantir 官方博客《Connecting Agents to Decisions》(2026)'
  fidelity: CaseFidelity[];          // 三级标注，逐条列出
}

type CaseFidelity =
  | { kind: 'fact'; text: string }           // 客户名/行业/场景出处
  | { kind: 'official-claim'; text: string } // 官方声称指标（如「数月→数天」）
  | { kind: 'simulated'; text: string };     // 演示中的具体数据

interface CaseObject {
  id: string; name: string; description: string;
  icon: string; color: string; recordCount: number;
}

interface CaseLink {
  id: string; name: string; description: string;
  source: string; target: string;                     // 引用 object id
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

interface CaseAction {
  id: string; name: string; description: string;
  target: string; requireReview: boolean;
  parameters: { name: string; type: string; description: string }[];
  effects: string[];
}

interface CaseParameter {
  id: string; label: string;
  kind: 'range' | 'select' | 'toggle';
  min?: number; max?: number; step?: number;
  options?: { label: string; value: string | number }[];
  default: number | string | boolean;
}

interface CaseResult {                 // compute 的返回，由各案例自定义字段
  [key: string]: number | string | boolean | undefined;
}

interface CaseStage {
  title: string;
  subtitle?: string;
  role: string;                       // 负责角色
  skills: string;                     // 能力拆解
  production?: string;                // 生产落地要求
  nodes: string[];                    // 本阶段高亮的图谱 object id
  requiresApproval?: boolean;         // 到达此阶段时暂停播放，等待人工确认
  input: (params, result) => unknown;  // 输入面板 JSON
  output: (params, result) => unknown; // 输出面板 JSON
  narrativeNote?: (params, result) => string;  // 结论句（可随参数变化）
}
```

### 两个关键设计决定

1. **`compute` 是纯函数**：参数 → 结果（受影响航班数、缺口文档数等）。演示中的所有数字由它实时算出，与现有首页 `shortage = days * 100 - 300` 同构。用户调参数 → 数字变 → 结论变，而非固定播放。
2. **`parameters` / `compute` 可选**：按案例配置。引擎按存在性决定是否渲染参数面板；无参数的案例为纯单步播放。

### 引擎与案例的分工

引擎只提供机制（图谱、粒子、阶段、面板），案例数据提供内容。三个案例的差异全部体现在数据文件里：图谱形状、阶段数、参数、compute 逻辑。「决策阶段」与「流水线步骤」的语义差异由阶段标题与措辞体现，引擎不做模式区分。

---

## 4. CaseSimulator 交互引擎

### 布局（与首页同构）

```
┌─ 案例头部：名称 / 行业 / 来源标注（fidelity 三色标签）──────────────┐
├─ 阶段进度条（横向排列，当前高亮，已完成置绿，审批卡点标记）         │
├──────────────────────┬───────────────────────────────────────────────┤
│ 参数面板（可选）      │  阶段说明 + 输入/输出 JSON 双面板              │
│ · 滑杆/选项/开关     │  + 角色与能力拆解 aside                        │
│ · 实时影响结果        │                                              │
├──────────────────────┴───────────────────────────────────────────────┤
│            SVG 图谱（节点随阶段高亮、粒子流动）                      │
├───────────────────────────────────────────────────────────────────-─┤
│ 操作栏：▶ 自动演示 / 下一步 / 重新开始 + 审计足迹区                  │
└────────────────────────────────────────────────────────────────────-┘
```

### 交互特效清单

| 特效 | 行为 | 触发 |
|---|---|---|
| 阶段联动高亮 | 当前阶段 `nodes` 在图谱蓝色高亮，其余节点降透明度 | 播放 / 单步 |
| 数据流粒子 | 沿激活关系流动的小圆点 | 自动演示开启 |
| 路径追踪 | 点选 A/B 节点 → BFS 最短路径绿色高亮 + 逐节点脉冲 | 手动点击 |
| 参数实时回填 | 参数变化 → 输入/输出 JSON 即时重算 | 参数面板操作 |
| 决策卡点 | 阶段 `requiresApproval` 时暂停播放，显示确认按钮 | 到达该阶段 |
| 审计足迹 | 每次执行 Action 在底部追加日志（序号 + 动作 + 参数摘要 + 依据） | 执行动作 / 审批 |

### 状态

引擎内部 `useState`：`step`、`params`、`playing`、`approved`、`started`、`auditLog`。案例间无共享状态，刷新即重置。

### 代码复用

粒子动画、贝塞尔路径、点采样、BFS 从 `app/page.tsx` 提取为 `src/lib/graph-geometry.ts`，首页改为引用，避免两处重复实现。提取时保持函数签名不变，提取后必须人工回归首页图谱。

---

## 5. 三个深模拟的内容设计

### 案例 1 · American Airlines 航网运营

- **事实**：Palantir 官方博客《Connecting Agents to Decisions》(2026) —— AA 用 Ontology 驱动 AI 支持的网络规划与运营优化。公开材料未给出量化成效。
- **模拟**：一次天气事件触发航网恢复。
- **对象**：Airport、Flight、Aircraft、Crew、Route、PassengerItinerary、WeatherEvent、DelayEvent、RecoveryDecision
- **关系**：`departsFrom` / `arrivesAt`（Flight→Airport）、`usesAircraft`、`crewAssignedTo`、`affects`（DelayEvent→Flight）、`impactsAirport`（WeatherEvent→Airport）、`includesFlight`（PassengerItinerary→Flight）
- **参数**：受影响机场（DFW / ORD / PHX）、天气持续小时数（滑杆）
- **compute**：沿关系传播 → 受影响后续航班数、牵连机组数、受影响旅客数、可用备用机数
- **阶段**：事件感知 → 影响传播 → 恢复方案生成 → 审批 → 执行改签/换机 → 审计回写
- **教学点**：一个事件沿 link types 扩散到航班/机组/旅客——「影响传播」是本体的核心价值，而非单表查询。

### 案例 2 · 美国陆军软件工厂 + Agentik

- **官方声称**：交付周期从「数月」缩短到「数天」（同博客）。
- **模拟**：一个任务需求经 Agent 辅助到部署。
- **对象**：MissionNeed、SoftwareCapability、SourceRepository、AgentRun、ChangeRequest、ApprovalGate、TestSuite、Deployment、AuditRecord
- **关系**：`requests`、`implementedBy`、`generates`（AgentRun→ChangeRequest）、`requiresApproval`、`validatedBy`（ChangeRequest→TestSuite）、`includesChange`（Deployment→ChangeRequest）
- **参数**：需求复杂度（简单/中等/复杂）、是否启用 Agent 辅助（开关）
- **compute**：传统流程天数 vs Agent 辅助天数对比、审批门数
- **阶段**：需求输入 → Agent 草拟变更 → 自动化测试 → 人工审批门 → 部署 → 审计
- **教学点**：本体是 Agent 的上下文层；Agent 只能起草，`ApprovalGate` 是人机边界——起草自动化、执行受控。

### 案例 3 · 4000 万文档知识图谱

- **官方声称**（同博客，产品演示、无具名客户）：4000 万文档 → 9.29 亿边，10.8 分钟完成；600 道保留问题答对率 83.2%。
- **模拟**：非结构化文档到可问答的语义资产。
- **对象**：Document、ExtractedEntity、EntityCluster、GraphEdge、IngestionBatch、RetentionQuestion、AnswerAttempt
- **关系**：`mentions`（Document→ExtractedEntity）、`resolvesTo`（ExtractedEntity→EntityCluster）、`connects`（GraphEdge 两端）、`questionAbout`（RetentionQuestion→Document）
- **参数**：文档批次规模（5 万 / 50 万 / 5000 万）、实体消歧严格度（宽松/标准/严格）
- **compute**：抽取实体数、构建边数、耗时分钟数、保留问题准确率
- **阶段**：文档接入 → 解析抽取 → 实体消歧聚类 → 图谱构建 → 索引 → 保留问题问答验证
- **教学点**：非结构化 → 结构化语义资产；「保留问题」是把 AI 输出钉在可验证锚点上的做法。

---

## 6. `/cases` 案例库页

### 数据源

`src/data/cases/library.ts` 为唯一事实源，收录：

- **AIPCon 11（2026-09-10）**：Acrisure、Cisco、Eaton、FAA、Hexion、L3Harris、NVIDIA、Ondas Sentinel、USA TODAY、Zeta Global（10 家）
- **AIPCon 10（2026-06-04）**：Kirkland & Ellis、McCarthy Building Companies、U.S. Department of Agriculture、Hertz、Nscale、Accenture、Parts Town（7 家）
- **官方博客《Connecting Agents to Decisions》(2026) 真实案例**：American Airlines、U.S. Army Software Factory、Novartis、Andretti Global（4 家）
- **合作项目**：Method Security × Palantir Cardinal Program（2026-09-10/11，Ontology for Cybersecurity）
- **延续性参考**：Walmart、General Motors（2025 年官宣 AIP，2026 年仍在深化，标注为「非 2026 年新发布」）

每条记录包含：客户名、行业、应用场景摘要、来源（含日期）、fidelity 标签、是否「可交互」（仅三个深模拟为 true）。

### 页面能力

- **卡片**：客户、行业、场景摘要、来源与日期、fidelity 标签、可交互徽标（链接到模拟页）。
- **筛选**：按行业 / 按来源（AIPCon 10、AIPCon 11、官方博客、合作项目、延续性参考）/ 只要「可交互」。
- **时间线**：AIPCon 10（2026-06-04）→ Method Security Cardinal 与 AIPCon 11（2026-09-10）。
- **可信度说明**（页面底部固定）：官方一手信源（新闻稿）vs 产品侧披露（博客）vs 未公开量化成效的边界；说明 Onyx Incorporated 为虚构示例、4000 万文档演示为产品能力证明而非客户案例。

---

## 7. 单一事实源与教材生成

`textbook/案例库.md` 当前为截断、内容错乱重复的损坏文件。重写为生成产物：

```
library.ts（事实源）
   ├─→ scripts/gen-case-library.ts → textbook/案例库.md（教材长文）
   └─→ app/cases/page.tsx（案例库页）
```

- **生成方式**：构建期脚本 `scripts/gen-case-library.ts` 读取 `library.ts` 渲染 markdown，覆盖 `textbook/案例库.md`，npm script `gen:cases`。改动案例后跑一次。
- **生成物风格**：保留教材长文形态——按来源分组的小节叙述 + 完整来源表，而非卡片列表。
- **约束**：两处消费同一份数据，不允许出现第三个手写副本。`library.ts` 是唯一的编辑入口。

---

## 8. 测试与验证

现有项目无测试框架，保持轻量：

1. **类型系统作为主测试**：`CaseSchema` 约束 `links` 的 source/target 必须引用存在的 object id，`stages.nodes` 同理。编译期兜底。
2. **`scripts/verify-cases.ts`**（`npm run verify:cases`）：对每个案例跑边界参数（参数取最小 / 最大 / 0），断言 compute 不抛错、output 字段类型正确、阶段数 > 0、layout 覆盖所有 object id。
3. **人工验证清单**：三个案例各跑一遍——自动播放走完、参数调到边界不崩、路径追踪能选中、审批卡点会停、审计足迹有记录；首页回归确认提取 `graph-geometry` 未破坏现有图谱与粒子。

**验证方式**：`npm run dev`（使用 `.next-dev/`，与生产构建隔离，README 已约定）→ 浏览器逐页过四个案例页 + 首页回归。

---

## 9. 交付物清单

- `src/data/cases/types.ts`、`library.ts`、3 份数据包
- `src/components/CaseSimulator.tsx`
- `src/lib/graph-geometry.ts`（从首页提取，首页改为引用）
- `app/cases/page.tsx` + 3 个薄壳页
- `scripts/gen-case-library.ts`、`scripts/verify-cases.ts`
- `textbook/案例库.md` 重写（生成产物）
- `src/components/Layout.tsx` 侧边栏新增「真实案例」分组
- `package.json` 增加 `gen:cases`、`verify:cases` 脚本
- `README.md` 更新（平台模块表 + 案例数）

### 明确不做（YAGNI）

- 不引入测试框架
- 不做案例搜索框（筛选足够）
- 不做案例间状态共享
- 不做 Walmart / GM 深模拟（2025 年官宣，仅收录）
- 不做后端、不需要环境变量
- 不把 Method Security Cardinal 做成深模拟（仅收录）

---

## 10. 风险

| 风险 | 缓解 |
|---|---|
| 从首页提取 `graph-geometry` 改坏现有粒子动画 | 保持函数签名不变；提取后首页必须人工回归确认图谱 / 粒子 / 路径追踪正常 |
| 案例事实标注失真（事实与模拟混淆） | fidelity 三级标注逐条列出；案例页顶部与案例库页底部双重提示 |
| `compute` 在边界参数下崩溃 | `verify-cases.ts` 覆盖最小 / 最大 / 0 三类边界 |
| 生成脚本与页面数据漂移 | `library.ts` 为唯一编辑入口，md 为生成产物 |

---

## 11. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-09-15 | 初始设计稿，与用户逐节确认后落盘 |
