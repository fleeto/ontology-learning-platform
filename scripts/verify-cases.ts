// Validates every case data package against boundary parameters.
// Run: npm run verify:cases

import { caseStudies } from '../src/data/cases';
import type { CaseParams, CaseParameter, CaseStudy } from '../src/data/cases/types';

interface Problem {
  caseSlug: string;
  message: string;
}

function boundaryValues(param: CaseParameter): (number | string | boolean)[] {
  if (param.kind === 'range') {
    const values: number[] = [];
    if (typeof param.min === 'number') values.push(param.min);
    if (typeof param.max === 'number') values.push(param.max);
    values.push(0);
    return values;
  }
  if (param.kind === 'select') {
    return (param.options ?? []).map(o => o.value);
  }
  return [true, false];
}

function combinations(params: CaseParameter[]): CaseParams[] {
  if (params.length === 0) return [{}];
  const [first, ...rest] = params;
  const restCombos = combinations(rest);
  const out: CaseParams[] = [];
  for (const value of boundaryValues(first)) {
    for (const restCombo of restCombos) {
      out.push({ [first.id]: value, ...restCombo });
    }
  }
  return out;
}

function check(caseStudy: CaseStudy, problems: Problem[]) {
  const fail = (message: string) => problems.push({ caseSlug: caseStudy.slug, message });

  if (caseStudy.stages.length === 0) fail('没有阶段');
  if (caseStudy.objects.length === 0) fail('没有对象');
  if (caseStudy.links.length === 0) fail('没有关系');

  const objectIds = new Set(caseStudy.objects.map(o => o.id));
  for (const link of caseStudy.links) {
    if (!objectIds.has(link.source)) fail(`关系 ${link.name} 的 source「${link.source}」不存在`);
    if (!objectIds.has(link.target)) fail(`关系 ${link.name} 的 target「${link.target}」不存在`);
  }
  for (const action of caseStudy.actions) {
    if (!objectIds.has(action.target)) fail(`动作 ${action.name} 的 target「${action.target}」不存在`);
  }
  for (const [id] of Object.entries(caseStudy.layout)) {
    if (!objectIds.has(id)) fail(`布局包含未知对象「${id}」`);
  }
  for (const stage of caseStudy.stages) {
    for (const id of stage.nodes) {
      if (!objectIds.has(id)) fail(`阶段「${stage.title}」引用了未知对象「${id}」`);
    }
  }

  const params = caseStudy.parameters ?? [];
  const combos = combinations(params);
  const compute = caseStudy.compute;
  for (let i = 0; i < combos.length; i++) {
    const combo = combos[i];
    try {
      for (const stage of caseStudy.stages) {
        const input = stage.input(combo, compute ? compute(combo) : {});
        const output = stage.output(combo, compute ? compute(combo) : {});
        if (input === undefined || output === undefined) fail(`阶段「${stage.title}」返回 undefined`);
      }
      if (compute) {
        const result = compute(combo);
        if (result === null || typeof result !== 'object') fail('compute 未返回对象');
      }
    } catch (err) {
      fail(`参数组合 #${i} ${JSON.stringify(combo)} 抛错：${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

function main() {
  const problems: Problem[] = [];
  for (const caseStudy of caseStudies) check(caseStudy, problems);

  if (problems.length === 0) {
    console.log(`✓ 全部 ${caseStudies.length} 个案例通过校验`);
    return;
  }
  for (const p of problems) console.error(`✗ [${p.caseSlug}] ${p.message}`);
  console.error(`\n${problems.length} 个问题`);
  process.exitCode = 1;
}

main();
