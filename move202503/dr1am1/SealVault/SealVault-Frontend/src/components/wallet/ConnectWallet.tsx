import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { Wallet } from 'lucide-react';

type ConnectWalletProps = {
  size?: 'small' | 'medium' | 'large';
};

const ConnectWallet: React.FC<ConnectWalletProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <ConnectButton>
      {({ connecting, connected, connect }) => (
        <button
          onClick={connect}
          disabled={connecting || connected}
          className={`${sizeClasses[size]} bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
          <Wallet size={size === 'large' ? 20 : 16} />
          {connecting ? '连接中...' : connected ? '已连接' : '连接钱包'}
        </button>
      )}
    </ConnectButton>
  );
};

export default ConnectWallet;