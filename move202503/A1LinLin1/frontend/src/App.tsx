// src/App.tsx
import React from 'react';
import { useWallet, ConnectButton } from '@suiet/wallet-kit';
import { AuditPage } from './components/AuditPage';

export default function App() {
  const { account } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* 右上角全局钱包按钮：自动切换“连接/断开”与地址预览】 */}
      <div className="flex justify-end mb-6">
        <ConnectButton />  {/* Suiet Wallet Kit 官方组件，自动管理连接生命周期 :contentReference[oaicite:0]{index=0} */}
      </div>
      
      {/* 未连接时提示 */}
      {!account ? (
        <p className="text-center text-gray-500">请先连接钱包以查看审计报告</p>
      ) : (
        <AuditPage />
      )}
    </div>
  );
}
