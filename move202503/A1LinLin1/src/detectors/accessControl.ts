// src/detectors/accessControl.ts
import type { Finding } from '../types';

export function detectAccessControl(source: string): Finding[] {
  const issues: Finding[] = [];
  const lines = source.split(/\r?\n/);
  const fnRe = /public fun\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/;
  const resourceOps = /(move_from|burn|mint|withdraw|deposit)(?:<[^>]+>)?\s*\(/;

  let inFunction = false;
  let hasSignerParam = false;
  let fnStartLine = 0;
  let fnName = '';

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const fnMatch = ln.match(fnRe);
    if (fnMatch) {
      inFunction     = true;
      fnStartLine    = i;
      fnName         = fnMatch[1];
      hasSignerParam = fnMatch[2].includes('&signer');
      continue;
    }

    if (inFunction) {
      const opMatch = ln.match(resourceOps);
      if (opMatch) {
        const ctx = lines.slice(fnStartLine, i + 1).join(' ');
        if (!hasSignerParam || !/signer\.address\(\)\s*==/.test(ctx)) {
          issues.push({
            line:     i + 1,
            col:      (opMatch.index || 0) + 1,
            message:  `函数 "${fnName}" 中的资源操作 "${opMatch[1]}" 缺少访问控制（&signer 参数或地址校验）。`,
            category: 'AccessControl',
          });
        }
      }
      if (ln.trim() === '}') {
        inFunction     = false;
        hasSignerParam = false;
        fnName         = '';
      }
    }
  }

  return issues;
}

