// Ensures the sidebar never enables an internal vertical scrollbar.
// Run: npx tsx scripts/verify-sidebar-scroll.ts

import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/Layout.tsx', 'utf8');
const navClass = source.match(/<nav className="([^"]+)"/)?.[1];

if (!navClass) {
  console.error('✗ 未找到 Sidebar 的 nav 元素');
  process.exitCode = 1;
}

const classes = navClass!.split(' ');
const failures: string[] = [];
if (classes.includes('overflow-y-auto')) failures.push('nav 仍启用了 overflow-y-auto');
if (!classes.includes('overflow-hidden')) failures.push('nav 未启用 overflow-hidden');

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log('✓ Sidebar 不会启用内部纵向滚动条');
}
