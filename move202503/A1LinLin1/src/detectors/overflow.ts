// src/detectors/overflow.ts

import type { Finding } from '../types';

/**
 * 检测算术运算（+、-、*）是否可能溢出，
 * 且未使用安全检查（checked_add/sub/mul 或 assert!）。
 */
export function detectOverflow(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  // 匹配基本算术表达式，如 a + b、(a+1)*b
  const opRe = /([A-Za-z0-9_()]+)\s*([+\-\*])\s*([A-Za-z0-9_()]+)/;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = opRe.exec(ln);
    if (m) {
      // 检查当前行及前一行是否有安全方法或 assert
      const ctx = lines.slice(Math.max(0, i - 1), i + 1).join(' ');
      if (
        !/checked_(add|sub|mul)/.test(ctx) &&
        !/assert!/.test(ctx) &&
        !/^\s*public fun/.test(ln)
      ) {
        issues.push({
          line:     i + 1,
          col:      (m.index ?? 0) + 1,
          message:  `算术操作 "${m[1].trim()} ${m[2]} ${m[3].trim()}" 存在溢出风险，缺少安全检查。`,
          category: 'Overflow',
        });
      }
    }
  }

  return issues;
}
