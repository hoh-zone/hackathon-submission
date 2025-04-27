// src/detectors/randomnessMisuse.ts

import type { Finding } from '../types';

/**
 * 检测随机数安全误用：直接使用 Random::random() 或伪随机函数。
 */
export function detectRandomnessMisuse(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  const randRe = /Random::random\(\)/;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = ln.match(randRe);
    if (m) {
      issues.push({
        line:     i + 1,
        col:      (m.index ?? 0) + 1,
        message:  `直接使用 Random::random() 生成伪随机，易被操控，应使用可信预言机或链下随机源。`,
        category: 'RandomnessMisuse',
      });
    }
  }

  return issues;
}
