// src/detectors/callSafety.ts

import type { Finding } from '../types';

/**
 * 只针对带地址前缀（0x...）的外部模块调用做访问控制检测。
 */
export function detectCallSafety(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  // 匹配 0x…::Module::function(
  const callRe = /(0x[0-9A-Fa-f]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(callRe);
    if (m) {
      const fnCall = m[1];
      // 检查前两行到当前行是否含有签名者或角色检查
      const ctx = lines.slice(Math.max(0, i - 2), i + 1).join(' ');
      if (!/if\s*\(.*signer/.test(ctx) && !/has_role/.test(ctx)) {
        issues.push({
          line:     i + 1,
          col:      (m.index ?? 0) + 1,
          message:  `调用 ${fnCall} 前缺少访问控制检查。`,
          category: 'CallSafety',
        });
      }
    }
  }

  return issues;
}
