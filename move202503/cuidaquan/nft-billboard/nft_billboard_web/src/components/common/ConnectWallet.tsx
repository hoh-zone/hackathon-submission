import React, { useState } from 'react';
import { Button, Dropdown, Avatar, Space, Typography, message } from 'antd';
import { WalletOutlined, DownOutlined, DisconnectOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useCurrentAccount,
  useCurrentWallet,
  useConnectWallet,
  useWallets,
  useDisconnectWallet,
  type WalletWithFeatures
} from '@mysten/dapp-kit';
import './ConnectWallet.scss';

const { Text } = Typography;

type WalletMenuItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
};

type WalletMenuDivider = {
  type: 'divider';
  key?: string;
};

type WalletMenuItemType = WalletMenuItem | WalletMenuDivider;

/**
 * 钱包连接组件
 * 提供连接钱包、切换钱包、断开连接等功能
 */
const ConnectWallet: React.FC = () => {
  const { t } = useTranslation();
  const [walletMenuVisible, setWalletMenuVisible] = useState(false);
  const currentAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const availableWallets = useWallets();
  const { mutate: connectWallet, isPending: isConnecting } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  // 格式化地址显示
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 复制地址到剪贴板
  const copyAddress = () => {
    if (!currentAccount?.address) return;

    navigator.clipboard.writeText(currentAccount.address)
      .then(() => {
        message.success(t('common.messages.success'));
      })
      .catch(err => {
        console.error('复制地址失败:', err);
        message.error(t('common.messages.error'));
      });
  };

  // 切换钱包
  const handleWalletSelect = (wallet: any) => {
    connectWallet({ wallet });
  };

  // 已连接钱包状态
  if (currentAccount && currentWallet) {
    const walletMenuItems: WalletMenuItemType[] = [
      {
        key: 'address',
        label: (
          <div className="wallet-address">
            <Text ellipsis>{currentAccount.address}</Text>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={copyAddress}
            />
          </div>
        ),
      },
      {
        type: 'divider',
        key: 'divider-1'
      },
      {
        key: 'disconnect',
        icon: <DisconnectOutlined />,
        label: t('common.buttons.cancel'),
        onClick: () => disconnectWallet(),
      },
    ];

    return (
      <Dropdown
        menu={{ items: walletMenuItems }}
        trigger={['click']}
        onOpenChange={setWalletMenuVisible}
        open={walletMenuVisible}
      >
        <Button type="primary">
          <Space>
            {currentWallet && (
              <Avatar
                size="small"
                src={currentWallet.icon}
                alt={currentWallet.name || 'wallet'}
              />
            )}
            {formatAddress(currentAccount.address)}
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
    );
  }

  // 点击连接钱包
  const handleConnectClick = () => {
    if (availableWallets.length === 1) {
      // 只有一个钱包可用，直接连接
      connectWallet({ wallet: availableWallets[0] });
    } else if (availableWallets.length > 1) {
      // 显示钱包列表
      setWalletMenuVisible(true);
    } else {
      // 没有可用钱包
      message.error(t('common.messages.error'));
    }
  };

  // 未连接钱包状态
  const walletItems = availableWallets.map(wallet => ({
    key: wallet.name,
    label: (
      <div className="wallet-item">
        <img src={wallet.icon} alt={wallet.name} className="wallet-icon" />
        <span>{wallet.name}</span>
      </div>
    ),
    onClick: () => handleWalletSelect(wallet),
  }));

  return (
    <Dropdown
      menu={{ items: walletItems }}
      trigger={['click']}
      onOpenChange={setWalletMenuVisible}
      open={walletMenuVisible && availableWallets.length > 1}
      disabled={isConnecting}
    >
      <Button
        type="primary"
        icon={<WalletOutlined />}
        onClick={handleConnectClick}
        loading={isConnecting}
      >
        {t('myNFTs.connectWallet.title')}
      </Button>
    </Dropdown>
  );
};

export default ConnectWallet;