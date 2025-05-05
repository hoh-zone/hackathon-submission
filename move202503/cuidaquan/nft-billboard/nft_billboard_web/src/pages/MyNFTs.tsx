import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Empty, Spin, Alert, Button, Badge } from 'antd';
import { PlusOutlined, InboxOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { BillboardNFT, UserRole } from '../types';
import NFTCard from '../components/nft/NFTCard';
import { getUserNFTs } from '../utils/contract';
import './MyNFTs.scss';

const { Title, Paragraph } = Typography;

const MyNFTsPage: React.FC = () => {
  const { t } = useTranslation();
  const [nfts, setNfts] = useState<BillboardNFT[]>([]);
  const [activeNfts, setActiveNfts] = useState<BillboardNFT[]>([]);
  const [expiredNfts, setExpiredNfts] = useState<BillboardNFT[]>([]);
  const [pendingNfts, setPendingNfts] = useState<BillboardNFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);

  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  // 检查用户角色
  useEffect(() => {
    const checkRole = async () => {
      if (!account) return;

      try {
        // 导入auth.ts中的checkUserRole函数
        const { checkUserRole } = await import('../utils/auth');

        // 使用SuiClient和用户地址检查用户角色
        const role = await checkUserRole(account.address, suiClient);
        console.log('当前用户角色:', role);
        setUserRole(role);
      } catch (err) {
        console.error('检查用户角色失败:', err);
      }
    };

    checkRole();
  }, [account, suiClient]);

  // 加载用户的NFT
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!account || userRole === UserRole.ADMIN) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userNfts = await getUserNFTs(account.address);
        setNfts(userNfts);

        // 当前时间
        const now = new Date();

        // 分离活跃、待展示和过期的NFT
        const active: BillboardNFT[] = [];
        const pending: BillboardNFT[] = [];
        const expired: BillboardNFT[] = [];

        userNfts.forEach(nft => {
          const leaseStart = new Date(nft.leaseStart);
          const leaseEnd = new Date(nft.leaseEnd);

          if (now < leaseStart) {
            // 当前时间早于开始时间的为待展示
            pending.push(nft);
          } else if (now > leaseEnd || !nft.isActive) {
            // 当前时间晚于结束时间或状态为非活跃的为过期
            expired.push(nft);
          } else {
            // 当前时间在租期内且状态为活跃的为活跃
            active.push(nft);
          }
        });

        setActiveNfts(active);
        setPendingNfts(pending);
        setExpiredNfts(expired);
      } catch (err) {
        console.error('获取NFT失败:', err);
        setError('获取NFT数据失败，请稍后再试。');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [account, userRole, suiClient]);

  // 创建标签页内容
  const getTabItems = () => {
    return [
      {
        key: 'active',
        label: (
          <span className="tab-label">
            <CheckCircleOutlined />
            {t('myNFTs.tabs.active')} <Badge count={activeNfts.length} style={{ backgroundColor: 'var(--primary)' }} />
          </span>
        ),
        children: activeNfts.length === 0 ? (
          <Empty
            description={t('myNFTs.empty.active')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="empty-tab-content"
          />
        ) : (
          <div className="grid fade-in">
            {activeNfts.map(nft => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        )
      },
      {
        key: 'pending',
        label: (
          <span className="tab-label">
            <ClockCircleOutlined />
            {t('myNFTs.tabs.pending')} <Badge count={pendingNfts.length} style={{ backgroundColor: 'var(--secondary)' }} />
          </span>
        ),
        children: pendingNfts.length === 0 ? (
          <Empty
            description={t('myNFTs.empty.pending')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="empty-tab-content"
          />
        ) : (
          <div className="grid fade-in">
            {pendingNfts.map(nft => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        )
      },
      {
        key: 'expired',
        label: (
          <span className="tab-label">
            <InboxOutlined />
            {t('myNFTs.tabs.expired')} <Badge count={expiredNfts.length} style={{ backgroundColor: '#999' }} />
          </span>
        ),
        children: expiredNfts.length === 0 ? (
          <Empty
            description={t('myNFTs.empty.expired')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="empty-tab-content"
          />
        ) : (
          <div className="grid fade-in">
            {expiredNfts.map(nft => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        )
      }
    ];
  };

  // 如果用户未连接钱包
  if (!account) {
    return (
      <div className="my-nfts-page">
        <div className="section-title">
          <Title level={2}>{t('myNFTs.title')}</Title>
          <Paragraph>{t('myNFTs.subtitle')}</Paragraph>
        </div>

        <div className="connect-wallet-prompt">
          <Alert
            message={t('myNFTs.connectWallet.title')}
            description={t('myNFTs.connectWallet.description')}
            type="info"
            showIcon
          />
        </div>
      </div>
    );
  }

  // 如果用户是管理员，显示无权限提示
  if (userRole === UserRole.ADMIN) {
    return (
      <div className="my-nfts-page">
        <div className="section-title">
          <Title level={2}>{t('myNFTs.title')}</Title>
          <Paragraph>{t('myNFTs.subtitle')}</Paragraph>
        </div>

        <div className="connect-wallet-prompt">
          <Alert
            message={t('myNFTs.admin.title')}
            description={t('myNFTs.admin.description')}
            type="warning"
            showIcon
          />
        </div>
      </div>
    );
  }

  return (
    <div className="my-nfts-page">
      <div className="section-title">
        <Title level={2}>{t('myNFTs.title')}</Title>
        <Paragraph>{t('myNFTs.subtitle')}</Paragraph>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>{t('myNFTs.loading')}</p>
        </div>
      ) : error ? (
        <Alert
          message={t('myNFTs.error')}
          description={error}
          type="error"
          showIcon
          className="error-alert"
        />
      ) : nfts.length === 0 ? (
        <div className="empty-state">
          <Empty
            description={
              <span>
                {t('myNFTs.empty.title')}<br/>
                <small style={{ color: 'var(--text-light)' }}>{t('myNFTs.empty.subtitle')}</small>
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <div className="empty-actions">
            <Button type="primary" size="large" icon={<PlusOutlined />} className="ant-btn-gradient">
              <Link to="/ad-spaces">{t('myNFTs.empty.browseButton')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <Tabs
          defaultActiveKey="active"
          className="nft-tabs"
          items={getTabItems()}
          animated={{ inkBar: true, tabPane: true }}
        />
      )}
    </div>
  );
};

export default MyNFTsPage;