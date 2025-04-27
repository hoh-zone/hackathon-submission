// src/detectors/reentrancy.ts

import type { Finding } from '../types';

/**
 * 检测重入攻击：调用 borrow_global_mut 或 Module::transfer 后
 * 如果同函数块后续没有 move_to 或 move_from，则视为未更新状态。
 */
export function detectReentrancy(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  // 捕获 borrow_global_mut 或 任意 Module::transfer 调用
  const callRe = /(borrow_global_mut|[A-Za-z0-9_]+::transfer)\s*\(/;

  let fnStart = -1;
  for (let i = 0; i < lines.length; i++) {
    // 函数开始
    if (lines[i].includes('fun ')) {
      fnStart = i;
    }
    // 函数结束
    if (fnStart >= 0 && lines[i].trim() === '}') {
      const block = lines.slice(fnStart, i + 1);
      block.forEach((ln, idx) => {
        const m = ln.match(callRe);
        if (m) {
          // 函数块内剩余部分
          const rest = block.slice(idx + 1).join(' ');
          if (!/move_to|move_from/.test(rest)) {
            issues.push({
              line:     fnStart + idx + 1,
              col:      (m.index ?? 0) + 1,
              message:  `可能存在重入：调用 "${m[1]}" 后未更新状态。`,
              category: 'Reentrancy',
            });
          }
        }
      });
      fnStart = -1;
    }
  }

  return issues;
}
