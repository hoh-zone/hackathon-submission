// src/detectors/freezeBypass.ts
import type { Finding } from '../types';

/**
 * 检测冻结绕过漏洞：转账/取款前未做 frozen 标志检查。
 */
export function detectFreezeBypass(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  // 匹配带地址前缀的 transfer 或 withdraw 调用
  const transferRe = /(0x[0-9A-Fa-f]+::[A-Za-z_][A-Za-z0-9_]*::(?:transfer|withdraw))\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(transferRe);
    if (m) {
      // 前两行必须出现 frozen 检查
      const ctx = lines.slice(Math.max(0, i - 2), i).join(' ');
      if (!/frozen/.test(ctx)) {
        issues.push({
          line:     i + 1,
          col:      (m.index ?? 0) + 1,
          message:  `调用 ${m[1]} 前未检查冻结状态，可能存在冻结绕过漏洞。`,
          category: 'FreezeBypass',
        });
      }
    }
  }

  return issues;
}
