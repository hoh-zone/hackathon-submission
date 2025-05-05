import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Card, Alert, Divider, Row, Col, List, Tag, Collapse, Space, Tooltip } from 'antd';
import {
  ShoppingCartOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  SwapOutlined,
  LeftOutlined,
  RightOutlined,
  EnvironmentOutlined,
  ColumnWidthOutlined,
  DollarOutlined,
  QuestionCircleOutlined,
  BlockOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AdSpace, UserRole, BillboardNFT } from '../types';
import { getAdSpaceDetails, formatSuiAmount, getNFTDetails } from '../utils/contract';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { truncateAddress } from '../utils/format';
import MediaContent from '../components/nft/MediaContent';
import './AdSpaceDetail.scss';
import '../styles/AdSpaceDetailFix.css';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const AdSpaceDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const [adSpace, setAdSpace] = useState<AdSpace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [activeNfts, setActiveNfts] = useState<BillboardNFT[]>([]);
  const [currentNftIndex, setCurrentNftIndex] = useState<number>(0);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});
  const [allNfts, setAllNfts] = useState<BillboardNFT[]>([]);
  const [loadingNfts, setLoadingNfts] = useState<boolean>(false);

  // 检查用户角色
  useEffect(() => {
    const checkUserRole = async () => {
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

    checkUserRole();
  }, [account, suiClient]);

  // 获取广告位详情和NFT信息
  const fetchAdSpace = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('正在获取广告位详情, ID:', id);
      const space = await getAdSpaceDetails(id);
      console.log('获取广告位结果:', space);

      // 如果存在creator字段，输出详细信息
      if (space && (space as any).creator) {
        console.log('广告位创建者信息:', {
          id: space.id,
          name: space.name,
          creator: (space as any).creator,
          creatorType: typeof (space as any).creator,
        });
      } else {
        console.log('广告位没有creator字段:', space?.id);
      }

      setAdSpace(space);

      if (!space) {
        setError('未找到广告位或广告位不可用。如果您刚刚创建此广告位，请稍后再试。');
      } else {
        // 获取广告位下的所有NFT信息
        await fetchNFTsForAdSpace(space);
      }
    } catch (err) {
      console.error('获取广告位详情失败:', err);
      setError('获取广告位详情失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  // 获取广告位下的所有NFT信息
  const fetchNFTsForAdSpace = async (space: AdSpace) => {
    if (!space.nft_ids || space.nft_ids.length === 0) {
      console.log('广告位没有关联的NFT');
      return;
    }

    try {
      setLoadingNfts(true);
      console.log('正在获取广告位的NFT信息, NFT IDs:', space.nft_ids);

      const nftPromises = space.nft_ids.map(nftId => getNFTDetails(nftId));
      const nftResults = await Promise.all(nftPromises);

      // 过滤出有效的NFT结果
      const validNfts = nftResults.filter(Boolean) as BillboardNFT[];
      console.log('获取到NFT信息:', validNfts.length);

      setAllNfts(validNfts);

      // 找出所有活跃中的NFT，而不是只找出一个
      const now = new Date();
      const activeNftsFound = validNfts.filter(nft => {
        const leaseEnd = new Date(nft.leaseEnd);
        const leaseStart = new Date(nft.leaseStart);
        // 当前时间在租期之间且状态为活跃的
        return now >= leaseStart && now <= leaseEnd && nft.isActive;
      });

      console.log('活跃NFT数量:', activeNftsFound.length);

      if (activeNftsFound.length > 0) {
        // 将所有活跃的NFT都保存起来
        setActiveNfts(activeNftsFound);
        // 重置轮播索引
        setCurrentNftIndex(0);
        console.log('设置活跃NFTs:', activeNftsFound);
      } else {
        setActiveNfts([]);
      }
    } catch (err) {
      console.error('获取NFT信息失败:', err);
    } finally {
      setLoadingNfts(false);
    }
  };

  useEffect(() => {
    fetchAdSpace();
  }, [id]);

  // 轮播效果 - 每30秒切换一次活跃NFT
  useEffect(() => {
    // 如果有多个活跃NFT，启动轮播
    if (activeNfts.length > 1) {
      const intervalId = setInterval(() => {
        // 查找下一个未出错的媒体
let nextIndex = (currentNftIndex + 1) % activeNfts.length;
let attempts = 0;
while (mediaErrors[activeNfts[nextIndex]?.contentUrl] && attempts < activeNfts.length) {
  nextIndex = (nextIndex + 1) % activeNfts.length;
  attempts++;
}
setCurrentNftIndex(nextIndex);
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [activeNfts, currentNftIndex, mediaErrors]);

  // 手动切换到下一个NFT
  const handleNextNft = useCallback(() => {
    if (activeNfts.length > 1) {
      // 查找下一个未出错的媒体
let nextIndex = (currentNftIndex + 1) % activeNfts.length;
let attempts = 0;
while (mediaErrors[activeNfts[nextIndex]?.contentUrl] && attempts < activeNfts.length) {
  nextIndex = (nextIndex + 1) % activeNfts.length;
  attempts++;
}
setCurrentNftIndex(nextIndex);
    }
  }, [activeNfts, currentNftIndex, mediaErrors]);

  // 手动切换到上一个NFT
  const handlePrevNft = useCallback(() => {
    if (activeNfts.length > 1) {
      // 查找上一个未出错的媒体
let prevIndex = (currentNftIndex - 1 + activeNfts.length) % activeNfts.length;
let attempts = 0;
while (mediaErrors[activeNfts[prevIndex]?.contentUrl] && attempts < activeNfts.length) {
  prevIndex = (prevIndex - 1 + activeNfts.length) % activeNfts.length;
  attempts++;
}
setCurrentNftIndex(prevIndex);
    }
  }, [activeNfts, currentNftIndex, mediaErrors]);

  const handleRefresh = () => {
    fetchAdSpace();
  };

  const handleBack = () => {
    navigate('/ad-spaces');
  };

  // 获取当前活跃的NFT
  const currentActiveNft = activeNfts.length > 0 && !mediaErrors[activeNfts[currentNftIndex]?.contentUrl] ? activeNfts[currentNftIndex] : null;

  // 判断是否应该显示购买按钮
  const shouldShowPurchase = () => {
    if (!adSpace || !adSpace.available) {
      return false;
    }

    // 如果是管理员，不显示购买按钮
    if (userRole === UserRole.ADMIN) {
      console.log('用户是管理员，不显示购买按钮');
      return false;
    }

    // 获取creator信息并转换为小写
    const creator = (adSpace as any).creator || null;
    const creatorAddress = creator ? creator.toLowerCase() : null;
    const userAddress = account ? account.address.toLowerCase() : null;

    console.log('广告位创建者信息:', {
      creator: creatorAddress,
      userAddress: userAddress,
      isMatch: creatorAddress === userAddress
    });

    // 如果是游戏开发者，且是自己创建的广告位，不显示购买按钮
    if (userRole === UserRole.GAME_DEV &&
        creatorAddress &&
        userAddress &&
        creatorAddress === userAddress) {
      console.log('当前用户是开发者且是广告位创建者，不显示购买按钮');
      return false;
    }

    // 如果用户拥有该广告位的NFT（不论是活跃的还是待展示的），不显示购买按钮
    if (userAddress && allNfts.length > 0) {
      const userOwnedNfts = allNfts.filter(nft => {
        const now = new Date();
        const leaseEnd = new Date(nft.leaseEnd);
        const leaseStart = new Date(nft.leaseStart);

        // 检查NFT所有者是否为当前用户，且NFT状态为活跃或待展示
        return nft.owner.toLowerCase() === userAddress &&
               ((now >= leaseStart && now <= leaseEnd) || // 活跃中
                (now < leaseStart)); // 待展示
      });

      if (userOwnedNfts.length > 0) {
        console.log('用户拥有该广告位的活跃或待展示NFT，不显示购买按钮', userOwnedNfts);
        return false;
      }
    }

    return true;
  };

  // 格式化租期时间
  const formatLeaseTime = (date: string) => {
    try {
      return new Date(date).toLocaleString();
    } catch (e) {
      return '无效日期';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>{t('adSpaces.loading')}</p>
      </div>
    );
  }

  if (error || !adSpace) {
    return (
      <div className="error-container">
        <Alert
          message={t('nftDetail.error')}
          description={error || t('nftDetail.notFound')}
          type="error"
          showIcon
        />
        <div className="error-actions">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            style={{ marginRight: '10px' }}
          >
            {t('common.buttons.refresh')}
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            {t('adSpaces.title')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-space-detail-page">
      <div className="ad-space-header">
        <Title level={2}>
          <BlockOutlined style={{ marginRight: '10px' }} />
          {adSpace.name}
        </Title>
      </div>

      <Card>
        <div className="ad-space-content">
          <div className="ad-space-image">
            {loadingNfts ? (
              <div className="ad-space-detail-placeholder loading">
                <Spin tip={t('nftDetail.loading')} />
              </div>
            ) : currentActiveNft ? (
              <div className="active-nft-display">
                <MediaContent
                  contentUrl={currentActiveNft.contentUrl}
                  brandName={currentActiveNft.brandName}
                  className="ad-space-media"
                  onError={() => {
                    setMediaErrors(prev => ({
                      ...prev,
                      [currentActiveNft.contentUrl]: true
                    }));
                    // 自动切换到下一个媒体
                    handleNextNft();
                  }}
                />
                <div className="active-badge animate-pulse">
                  <Tag color="green">{t('nftDetail.status.active')}</Tag>
                </div>

                {activeNfts.length > 1 && (
                  <div className="carousel-controls">
                    <div className="carousel-info">
                      <Tag color="blue">
                        <SwapOutlined spin /> {t('adSpaces.filters.sortOptions.popular')} {currentNftIndex + 1}/{activeNfts.length}
                      </Tag>
                    </div>
                    <div className="carousel-nav">
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<LeftOutlined />}
                        onClick={handlePrevNft}
                        className="nav-button prev"
                      />
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<RightOutlined />}
                        onClick={handleNextNft}
                        className="nav-button next"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ad-space-detail-placeholder">
                <div className="placeholder-content">
                  <Title level={3}>
                    <BlockOutlined style={{ marginRight: '10px' }} />
                    {adSpace.name}
                  </Title>
                  <Paragraph>
                    <ColumnWidthOutlined style={{ marginRight: '10px' }} />
                    {adSpace.aspectRatio || '16:9'}
                  </Paragraph>
                  <Paragraph type="secondary">
                    <InfoCircleOutlined style={{ marginRight: '10px' }} />
                    {t('manage.myAdSpaces.waitingContent')}
                  </Paragraph>
                </div>
              </div>
            )}
          </div>
          <div className="ad-space-info">
            <Title level={4}>
              <BlockOutlined style={{ marginRight: '10px' }} />
              {adSpace.name}
            </Title>
            <Paragraph>
              <InfoCircleOutlined style={{ marginRight: '10px' }} />
              {adSpace.description}
            </Paragraph>

            <Space direction="vertical" className="ad-info">
              <div className="info-item">
                <EnvironmentOutlined />
                <Text>{t('manage.createAdSpace.form.location')}: {adSpace.location}</Text>
              </div>

              <div className="info-item">
                <ColumnWidthOutlined />
                <Text>
                  {t('manage.createAdSpace.form.dimension')}: {adSpace.aspectRatio || '16:9'}
                </Text>
              </div>

              <div className="info-item">
                <DollarOutlined />
                <Text className="price-text">
                  {parseFloat((Number(adSpace.price) / 1000000000).toFixed(9))} SUI/{t('common.time.day')}
                  <Tooltip title={t('common.price.discount')}>
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </Text>
              </div>

              {adSpace.price_description && (
                <div className="info-item">
                  <InfoCircleOutlined />
                  <Text className="price-description">{adSpace.price_description}</Text>
                </div>
              )}
            </Space>

            <Divider />

            {adSpace.available ? (
              shouldShowPurchase() ? (
                <div className="purchase-section">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Link to={`/ad-spaces/${adSpace.id}/purchase`}>
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          size="large"
                          block
                          className="purchase-button"
                        >
                          {t('adSpaces.buttons.buyNow')}
                        </Button>
                      </Link>

                    </Col>
                  </Row>
                </div>
              ) : (
                <Alert
                  message={
                    userRole === UserRole.GAME_DEV ? t('adSpaces.alerts.devOwned') :
                    userRole === UserRole.ADMIN ? t('adSpaces.alerts.adminCantBuy') :
                    t('adSpaces.alerts.alreadyOwned')
                  }
                  description={
                    userRole === UserRole.GAME_DEV ? t('adSpaces.alerts.devOwnedDesc') :
                    userRole === UserRole.ADMIN ? t('adSpaces.alerts.adminCantBuyDesc') :
                    t('adSpaces.alerts.alreadyOwnedDesc')
                  }
                  type="info"
                  showIcon
                />
              )
            ) : (
              <Alert
                message={t('manage.myAdSpaces.activeNFT')}
                description={t('adSpaces.empty.subtitle')}
                type="info"
                showIcon
              />
            )}
          </div>
        </div>
      </Card>

      {/* 广告位下所有NFT列表 */}
      <Card className="nft-list-card" style={{ marginTop: '24px' }}>
        <Title level={4}>
          <ClockCircleOutlined style={{ marginRight: '10px' }} />
          {t('adSpaces.nftHistory')}
        </Title>
        {loadingNfts ? (
          <div className="loading-nfts">
            <Spin />
            <Text style={{ marginLeft: '12px' }}>{t('myNFTs.loading')}</Text>
          </div>
        ) : allNfts.length > 0 ? (
          <Row gutter={[16, 16]} className="fade-in">
            {allNfts.map(nft => {
              const now = new Date();
              const leaseEnd = new Date(nft.leaseEnd);
              const leaseStart = new Date(nft.leaseStart);

              // 修正状态判断逻辑
              let statusTag;
              let statusColor;

              if (now >= leaseStart && now <= leaseEnd && nft.isActive) {
                // 当前时间在租期之间且状态为活跃的
                statusTag = t('nftDetail.status.active');
                statusColor = 'green';
              } else if (now < leaseStart) {
                // 租期开始时间在当前时间之后的
                statusTag = t('nftDetail.status.pending');
                statusColor = 'blue';
              } else {
                // 租期到期时间在当前时间之前的
                statusTag = t('nftDetail.status.expired');
                statusColor = 'grey';
              }

              return (
                <Col xs={24} sm={12} md={8} key={nft.id}>
                  <Card
                    className="nft-card"
                    cover={
                      <div className="nft-card-image-container">
                        <MediaContent
                          contentUrl={nft.contentUrl}
                          brandName={nft.brandName}
                          className="nft-card-media"
                        />
                        <div className="nft-card-tag">
                          <Tag color={statusColor}>{statusTag}</Tag>
                          {account && nft.owner.toLowerCase() === account.address.toLowerCase() && (
                            <Tag color="purple">{t('adSpaces.status.myNFT')}</Tag>
                          )}
                        </div>
                      </div>
                    }
                    actions={[
                      <Button type="primary" key="view">
                        <Link to={`/my-nfts/${nft.id}`}>{t('adSpaces.buttons.viewDetails')}</Link>
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={nft.brandName}
                      description={
                        <div className="nft-card-description">
                          <div className="nft-lease-time">
                            <ClockCircleOutlined /> {t('nftDetail.leasePeriod')}: {formatLeaseTime(nft.leaseStart)} ~ {formatLeaseTime(nft.leaseEnd)}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Alert
            message={t('adSpaces.noNftRecords')}
            description={t('adSpaces.noNftRecordsDesc')}
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default AdSpaceDetailPage;
