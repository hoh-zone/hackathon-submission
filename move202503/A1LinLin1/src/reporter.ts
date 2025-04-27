// src/reporter.ts
import type { Finding } from './types';

/**
 * Turn an array of findings into a readable text report.
 */
export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) {
    return '未发现漏洞';
  }
  return findings
    .map(f => `[${f.line}:${f.col}] ${f.message}`)
    .join('\n');
}

