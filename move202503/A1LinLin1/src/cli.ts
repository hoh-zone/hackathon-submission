// src/cli.ts
import { readFileSync } from 'fs';
import { auditMoveSource } from './parser';
import { formatFindings   } from './reporter';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npm run cli <file.move>');
    process.exit(1);
  }
  const source = readFileSync(filePath, 'utf8');
  const findings = auditMoveSource(source);
  console.log(formatFindings(findings));
}

main();

