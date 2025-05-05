import React from 'react';
import { 
  ConnectButton, 
  useCurrentAccount, 
  useSuiClientQuery 
} from '@mysten/dapp-kit';
import { formatAddress } from '@mysten/sui/utils';

const Wallet: React.FC = () => {
  const currentAccount = useCurrentAccount();
  
  // 获取钱包余额
  const { data: balance, isPending } = useSuiClientQuery(
    'getBalance',
    {
      owner: currentAccount?.address || '',
    },
    {
      enabled: !!currentAccount,
    }
  );

  return (
    <div className="wallet-page">
      <h1>我的钱包</h1>
      
      <div className="wallet-connect-section">
        <h2>钱包连接</h2>
        <ConnectButton connectText="连接钱包" />
      </div>

      {currentAccount ? (
        <div className="wallet-info">
          <h2>钱包信息</h2>
          <p><strong>地址:</strong> {formatAddress(currentAccount.address)}</p>
          <p><strong>余额:</strong> {isPending ? '加载中...' : `${balance?.totalBalance || 0} SUI`}</p>
        </div>
      ) : (
        <div className="wallet-not-connected">
          <p>请连接您的钱包以查看详细信息</p>
        </div>
      )}

      <div className="wallet-info-section">
        <h2>使用说明</h2>
        <p>1. 点击"连接钱包"按钮连接您的Sui钱包</p>
        <p>2. 连接成功后，将显示您的钱包地址和SUI余额</p>
        <p>3. 您可以在Sui钱包中查看更多详细信息和执行交易</p>
      </div>
    </div>
  );
};

export default Wallet; 