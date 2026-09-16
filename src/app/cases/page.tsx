'use client';

import { useState } from 'react';
import Link from 'next/link';
import { caseLibrary, groupLabels, fidelityLabels, interactiveCases, productDemos, fictionalExamples } from '@/data/cases/library';
import type { LibraryEntry } from '@/data/cases/types';

type Filter = 'all' | 'interactive' | LibraryEntry['group'];

const fidelityClassName: Record<LibraryEntry['fidelity'], string> = {
  fact: 'bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/50',
  'official-claim': 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-700/50',
  simulated: 'bg-gray-800 text-gray-400 ring-1 ring-gray-700',
};

const groupOrder: LibraryEntry['group'][] = ['aipcon-11', 'aipcon-10', 'blog-2026', 'partnership', 'ongoing'];

const timeline = [
  { date: '2026-06-04', label: 'AIPCon 10', desc: '客户首次公开分享生产用例（7 家点名 + 其他）' },
  { date: '2026（全年）', label: '官方博客真实案例', desc: 'American Airlines、陆军软件工厂、Novartis、Andretti Global' },
  { date: '2026-09-10', label: 'AIPCon 11', desc: '10+ 客户登台展示 Ontology 生产部署' },
  { date: '2026-09-10', label: 'Method Security Cardinal', desc: 'Ontology for Cybersecurity 合作项目启动' },
];

export default function CaseLibraryPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const entries = caseLibrary.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'interactive') return Boolean(e.interactiveSlug);
    return e.group === filter;
  });

  const interactiveBySlug = Object.fromEntries(interactiveCases.map(c => [c.slug, c]));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">真实案例库</h1>
        <p className="mt-1 text-sm text-gray-400">
          2026 年 Palantir 本体（Ontology）相关的企业案例：AIPCon 10/11 登台客户、官方博客披露的真实部署与产品能力演示。共 {caseLibrary.length} 条记录，其中 {interactiveCases.length} 个提供交互式模拟。
        </p>
      </div>

      {/* Timeline */}
      <section className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">2026 年事件时间线</h2>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {timeline.map(t => (
            <li key={t.label + t.date} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
              <p className="text-xs text-blue-300">{t.date}</p>
              <p className="mt-1 text-sm font-medium text-white">{t.label}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{t.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Interactive cases */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-white">可交互模拟</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {interactiveCases.map(c => (
            <Link
              key={c.slug}
              href={`/cases/${c.slug}`}
              className="card-hover group border-blue-900/70"
            >
              <div className="flex items-center justify-between">
                <span className="badge bg-blue-950 text-blue-200">可交互</span>
                <span className="text-xs text-gray-600">{c.industry}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-white group-hover:text-blue-300">{c.name}</h3>
              <p className="mt-1 text-xs leading-6 text-gray-500">{c.scenario}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">筛选：</span>
        {([
          ['all', '全部'],
          ['interactive', '仅可交互'],
          ...groupOrder.map(g => [g, groupLabels[g]] as const),
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(e => (
          <div key={e.id} className="card-hover flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{e.customer}</h3>
              <span className={`badge shrink-0 ${fidelityClassName[e.fidelity]}`}>{fidelityLabels[e.fidelity]}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{e.industry}</p>
            <p className="mt-2 text-xs leading-6 text-gray-400">{e.scenario}</p>
            {e.note && <p className="mt-2 text-xs leading-5 text-amber-500/80">{e.note}</p>}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-800 pt-2">
              <span className="truncate text-xs text-gray-600" title={e.source}>{e.sourceDate ?? e.source}</span>
              {e.interactiveSlug && interactiveBySlug[e.interactiveSlug] && (
                <Link
                  href={`/cases/${e.interactiveSlug}`}
                  className="shrink-0 text-xs text-blue-400 hover:text-blue-200"
                >
                  打开模拟 ↗
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Product demos */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-white">产品能力演示（非客户案例）</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {productDemos.map(d => (
            <div key={d.id} className="card-hover">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                {d.interactiveSlug && (
                  <Link href={`/cases/${d.interactiveSlug}`} className="text-xs text-blue-400 hover:text-blue-200">
                    打开模拟 ↗
                  </Link>
                )}
              </div>
              <p className="mt-2 text-xs leading-6 text-gray-400">{d.metrics}</p>
              <p className="mt-1 text-xs text-gray-600">{d.note}</p>
              <p className="mt-2 text-xs text-gray-600">来源：{d.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Credibility notes */}
      <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">来源与可信度说明</h2>
        <ul className="space-y-2 text-xs leading-6 text-gray-400">
          <li>
            <span className="badge bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/50">官方事实</span>
            <span className="ml-1.5">客户名称、行业与应用场景来自 Palantir 官方新闻室与官方博客，属可核实的一手信源。</span>
          </li>
          <li>
            <span className="badge bg-amber-900/50 text-amber-300 ring-1 ring-amber-700/50">官方声称</span>
            <span className="ml-1.5">官方描述性进展（如「数月→数天」）与产品演示指标（如 9.29 亿条边），无独立量化披露。</span>
          </li>
          <li>
            <span className="badge bg-gray-800 text-gray-400 ring-1 ring-gray-700">模拟数据</span>
            <span className="ml-1.5">各交互模拟中的对象、记录数、运行结果全部为浏览器内模拟，用于教学演示，不代表真实系统。</span>
          </li>
          <li>大多数客户的量化成效（ROI、百分比提升）在公开新闻稿中未逐一披露。</li>
          <li>Walmart 与 General Motors 的 AIP 官宣发生在 2025 年，2026 年仍在深化扩展，列为延续性参考。</li>
          <li>官方博客中的 {fictionalExamples.join('、')} 为虚构示例，未收录在本案例库中。</li>
          <li>严格意义上 2026 年新发布且明确围绕本体的高能见度事件为 AIPCon 10/11 客户登台与 Ontology for Cybersecurity（Cardinal Program）。</li>
        </ul>
      </section>
    </div>
  );
}
