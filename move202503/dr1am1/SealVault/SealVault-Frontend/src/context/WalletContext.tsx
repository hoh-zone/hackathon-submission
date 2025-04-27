import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

type WalletContextType = {
  isConnected: boolean;
  account: string | null;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

type WalletProviderProps = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const account = useCurrentAccount();

  // 从 localStorage 读取上次连接的钱包信息
  useEffect(() => {
    const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
    if (lastConnectedWallet) {
      try {
        // 尝试重新连接上次使用的钱包
        window.dispatchEvent(new CustomEvent('wallet-connect', { 
          detail: { walletName: lastConnectedWallet } 
        }));
      } catch (error) {
        console.error('重新连接钱包失败:', error);
      }
    }
  }, []);

  // 监听钱包连接状态
  useEffect(() => {
    if (account?.address) {
      localStorage.setItem('lastConnectedWallet', 'sui');
    }
  }, [account?.address]);

  const value = {
    isConnected: !!account,
    account: account?.address || null,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};