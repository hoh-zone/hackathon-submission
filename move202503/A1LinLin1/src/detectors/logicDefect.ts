// src/detectors/logicDefect.ts

import type { Finding } from '../types';

/**
 * 检测 if 语句缺少 else 分支，提示可能遗漏边界条件。
 */
export function detectLogicDefect(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  // 匹配以 if(...) { 开头的行
  const ifRe = /^\s*if\s*\(.*\)\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    if (ifRe.test(lines[i])) {
      // 下一个非空行若不是以 else 开头，就视为缺少 else
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') {
        j++;
      }
      if (j < lines.length && !lines[j].trim().startsWith('else')) {
        const col = (lines[i].indexOf('if') ?? 0) + 1;
        issues.push({
          line:     i + 1,
          col:      col,
          message:  'if 语句缺少 else 分支，可能遗漏边界条件分支。',
          category: 'LogicDefect',
        });
      }
    }
  }

  return issues;
}
