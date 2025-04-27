// src/pages/AuditPage.tsx
import React, { useEffect, useState } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { client, PACKAGE_ID } from '../suiClient';
import { SubmitReportButton } from '../components/SubmitReportButton';
import { MIST_PER_SUI } from '@mysten/sui/utils';

interface Report {
  id:       string;
  version:  number;
  codeHash: string;
  summary:  string;
}

export function AuditPage() {
  const wallet = useWallet();
  const [balance, setBalance] = useState('0');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  // 拉取 SUI 余额
  const fetchBalance = async () => {
    if (wallet.status !== 'connected') {
      setBalance('0');
      return;
    }
    try {
      const coin = await client.getBalance({ owner: wallet.account.address });
      setBalance((Number(coin.totalBalance) / Number(MIST_PER_SUI)).toFixed(4));
    } catch {
      setBalance('0');
    }
  };

  // 拉取审计报告列表
  const fetchReports = async () => {
    if (wallet.status !== 'connected') {
      setReports([]);
      return;
    }
    setLoading(true);
    try {
      const owned = await client.getOwnedObjects({
        owner: wallet.account.address,
        filter: { StructType: `${PACKAGE_ID}::ReportStore::AuditReport` },
      });
      const objs = Array.isArray(owned.data) ? owned.data : [];
      if (!objs.length) {
        setReports([]);
      } else {
        const resp = await client.multiGetObjects({
          ids: objs.map((o) => o.objectId),
          options: { showContent: true },
        });
        const list = resp
          .map((r) => {
            const d = r.data;
            if (d?.content && 'fields' in d.content && d.content.fields) {
              const f = d.content.fields!;
              return {
                id:       d.objectId,
                version:  d.version,
                codeHash: f.code_hash,
                summary:  f.result_summary,
              };
            }
            return null;
          })
          .filter((x): x is Report => x !== null);
        setReports(list);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // 提交成功后刷新余额和列表
  const handleSuccess = () => {
    fetchBalance();
    fetchReports();
    setTimeout(fetchReports, 5000);
  };

  useEffect(() => {
    fetchBalance();
    fetchReports();
  }, [wallet.status]);

  return (
    <div className="space-y-4">
      {/* SUI 余额 */}
      <div>
        当前 SUI 余额：{balance} SUI
        <button
          onClick={fetchBalance}
          className="ml-2 text-sm text-blue-600 hover:underline"
        >
          刷新
        </button>
      </div>

      {/* 提交审计报告 */}
      <SubmitReportButton onSuccess={handleSuccess} />

      {/* 报告列表头 & 刷新 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">我的审计报告</h2>
        <button
          onClick={fetchReports}
          className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          刷新列表
        </button>
      </div>

      {/* 报告列表或加载 */}
      {loading ? (
        <p>加载中…</p>
      ) : reports.length === 0 ? (
        <p>暂无报告</p>
      ) : (
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Object ID</th>
              <th className="px-4 py-2">Version</th>
              <th className="px-4 py-2">Code Hash</th>
              <th className="px-4 py-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2">{r.version}</td>
                <td className="px-4 py-2">{r.codeHash}</td>
                <td className="px-4 py-2">{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
