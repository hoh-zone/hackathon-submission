// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createRequire } from 'module';
import { submitMoveScript } from './submit.js';
import { hexToBytes, utf8ToBytes } from './utils.js';

dotenv.config();

// 1. 先初始化 __filename 和 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 2. 再创建 require，并加载 dist 下的 CJS 模块
const require = createRequire(import.meta.url);
const parserModule   = require(path.join(__dirname, '../dist/parser.js'));
const reporterModule = require(path.join(__dirname, '../dist/reporter.js'));

const { auditMoveSource } = parserModule;
const { formatFindings  } = reporterModule;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/audit', (req, res) => {
  const { source } = req.body;
  const findings = auditMoveSource(source);
  const summary  = findings.map(f => f.message).join('\n') || '未发现漏洞';
  const codeHash = crypto.createHash('sha256').update(source).digest('hex');
  res.json({ findings, codeHash, summary });
});

app.post('/api/submit-report', async (req, res) => {
  try {
    const { codeHash, summary } = req.body;
    const { digest } = await submitMoveScript({
      codeHashBytes: hexToBytes(codeHash),
      summaryBytes: utf8ToBytes(summary),
    });
    res.json({ digest });
  } catch (e) {
    console.error('Error submitting report:', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on http://0.0.0.0:${PORT}`);
});
