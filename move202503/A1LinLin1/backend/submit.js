// backend/submit.js

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction }               from '@mysten/sui/transactions';
import { Ed25519Keypair }            from '@mysten/sui/keypairs/ed25519';
import { fromB64 }                   from '@mysten/bcs';       // 只为私钥做 B64 decode
import dotenv                        from 'dotenv';
import { hexToBytes, utf8ToBytes }   from './utils.js';

dotenv.config();

// —— 私钥 Base64 → 标准 Base64 → Uint8Array seed —— 
function normalizeBase64(str) {
  let s = str.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
}

if (!process.env.SUI_PRIVATE_KEY) {
  throw new Error('Missing SUI_PRIVATE_KEY in .env');
}
const seedBytes = fromB64(normalizeBase64(process.env.SUI_PRIVATE_KEY));
// 校验一下
if (seedBytes.length !== 32) {
  throw new Error(`Invalid private-key length, expected 32 bytes, got ${seedBytes.length}`);
}
const keypair = Ed25519Keypair.fromSecretKey(seedBytes);

const client  = new SuiClient({ url: getFullnodeUrl('testnet') });
const PACKAGE_ID = process.env.PACKAGE_ID;

// LEB128 编码
function encodeULEB128(n) { /* ... 同前 ... */ }
function bcsEncodeVectorU8(bytes) { /* ... 同前 ... */ }

/**
 * 提交审计报告
 */
export async function submitMoveScript({ codeHashBytes, summaryBytes }) {
  // codeHashBytes 是 hexToBytes 生成的
  const codeHashBcs = bcsEncodeVectorU8(codeHashBytes);
  const summaryBcs  = bcsEncodeVectorU8(summaryBytes);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::ReportStore::submit`,
    arguments: [ tx.pure(codeHashBcs), tx.pure(summaryBcs) ],
  });

  const result = await client.signAndExecuteTransaction({
    signer:      keypair,
    transaction: tx,
    options:     { showEffects: true },
  });

  return { digest: result.digest };
}
