// src/components/SubmitReportButton.tsx
import React, { useState } from 'react';
import { useWallet } from '@suiet/wallet-kit';                 // :contentReference[oaicite:1]{index=1}
import { TransactionBlock, tx } from '@mysten/sui/transactions';
import { PACKAGE_ID, client } from '../suiClient';             // 你的 SuiClient 实例

export function SubmitReportButton({ onSuccess }: { onSuccess?: () => void }) {
  const wallet = useWallet();
  const [status, setStatus] = useState<string>('');

  const handleSubmit = async () => {
    // 1. 确保已连接
    if (wallet.status !== 'connected' || !wallet.account?.address) {
      return setStatus('请先连接钱包');
    }
    const address = wallet.account.address;

    // 2. 构造交易
    setStatus('提交中…');
    const txBlock = new TransactionBlock().moveCall({
      target: `${PACKAGE_ID}::ReportStore::submit`,
      arguments: [
        // …你的 codeHash 和 summary
      ],
    });

    // 3. 签名并执行，一定要把 account.address 传进去
    try {
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txBlock,
        account: address,          // ← 这里不能是 undefined
        gasBudget: 10000,
      });
      setStatus('提交成功，tx=' + result.digest);
      onSuccess?.();
    } catch (e: any) {
      setStatus('提交失败：' + e.message);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit}>提交审计报告</button>
      {status && <p>{status}</p>}
    </div>
  );
}

