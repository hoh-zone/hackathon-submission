import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Typography, Space, Tag, Spin, Tooltip } from 'antd';
import { EnvironmentOutlined, ColumnWidthOutlined, DollarOutlined, QuestionCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdSpace, UserRole, BillboardNFT } from '../../types';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { getNFTDetails } from '../../utils/contract';
import MediaContent from '../nft/MediaContent';
import './AdSpaceCard.scss';

const { Title, Text } = Typography;

interface AdSpaceCardProps {
  adSpace: AdSpace;
  userRole?: UserRole;
  creatorAddress?: string;
}

const AdSpaceCard: React.FC<AdSpaceCardProps> = ({ adSpace, userRole, creatorAddress }) => {
  const { t } = useTranslation();
  const account = useCurrentAccount();
  const [activeNfts, setActiveNfts] = useState<BillboardNFT[]>([]);
  const [currentNftIndex, setCurrentNftIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [userOwnedNfts, setUserOwnedNfts] = useState<BillboardNFT[]>([]);

  // 获取活跃NFT内容和用户拥有的NFT
  useEffect(() => {
    const fetchNftData = async () => {
      // 如果广告位有NFT ID列表且不为空
      if (adSpace.nft_ids && adSpace.nft_ids.length > 0) {
        try {
          setLoading(true);
          console.log(`开始获取广告位[${adSpace.id}]的NFT信息，NFT IDs:`, adSpace.nft_ids);

          const now = new Date();
          const userAddress = account ? account.address.toLowerCase() : null;
          const userNfts: BillboardNFT[] = [];
          const activeNftsFound: BillboardNFT[] = [];

          // 遍历所有NFT
          for (const nftId of adSpace.nft_ids) {
            console.log(`正在检查NFT[${nftId}]`);
            const nftDetails = await getNFTDetails(nftId);

            if (nftDetails) {
              console.log(`获取到NFT[${nftId}]详情:`, {
                brandName: nftDetails.brandName,
                contentUrl: nftDetails.contentUrl,
                leaseEnd: nftDetails.leaseEnd,
                isActive: nftDetails.isActive,
                owner: nftDetails.owner
              });

              const leaseStart = new Date(nftDetails.leaseStart);
              const leaseEnd = new Date(nftDetails.leaseEnd);

              console.log(`NFT[${nftId}]租期: 开始=${leaseStart.toLocaleString()}, 结束=${leaseEnd.toLocaleString()}, 当前时间=${now.toLocaleString()}`);

              // 检查NFT是否属于当前用户
              if (userAddress && nftDetails.owner.toLowerCase() === userAddress) {
                console.log(`NFT[${nftId}]属于当前用户`);
                userNfts.push(nftDetails);
              }

              // 只有当前时间在租期内的NFT才被视为活跃
              if (now >= leaseStart && now <= leaseEnd && nftDetails.isActive) {
                console.log(`找到活跃NFT[${nftId}]，将显示在卡片中, 内容URL:`, nftDetails.contentUrl);

                // 检查contentUrl是否有效
                if (!nftDetails.contentUrl) {
                  console.warn(`NFT[${nftId}]的contentUrl为空，可能导致图片无法显示`);
                } else {
                  // 尝试预加载图片
                  const img = new Image();
                  img.onload = () => console.log(`NFT[${nftId}]图片加载成功`, img.width, img.height);
                  img.onerror = (err) => console.error(`NFT[${nftId}]图片加载失败`, err);
                  img.src = nftDetails.contentUrl;
                }

                // 收集所有活跃的NFT，而不是只保留第一个
                activeNftsFound.push(nftDetails);
              } else if (now < leaseStart) {
                console.log(`NFT[${nftId}]尚未开始展示，租期开始时间:`, leaseStart.toLocaleString());
              } else {
                console.log(`NFT[${nftId}]已过期，租期结束时间:`, leaseEnd.toLocaleString());
              }
            } else {
              console.log(`未能获取NFT[${nftId}]详情`);
            }
          }

          // 保存用户拥有的NFT列表
          setUserOwnedNfts(userNfts);

          // 保存所有活跃NFT
          setActiveNfts(activeNftsFound);
          setCurrentNftIndex(0); // 重置轮播索引

        } catch (err) {
          console.error(`获取广告位[${adSpace.id}]的NFT失败:`, err);
        } finally {
          setLoading(false);
        }
      } else {
        console.log(`广告位[${adSpace.id}]没有关联的NFT ID`);
      }
    };

    fetchNftData();
  }, [adSpace.id, adSpace.nft_ids, account]);

  // 轮播效果 - 每30秒切换一次活跃NFT
  useEffect(() => {
    // 如果有多个活跃NFT，启动轮播
    if (activeNfts.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentNftIndex(prevIndex => (prevIndex + 1) % activeNfts.length);
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [activeNfts]);

  // 手动切换轮播
  const handleSwitchNft = useCallback(() => {
    if (activeNfts.length > 1) {
      setCurrentNftIndex(prevIndex => (prevIndex + 1) % activeNfts.length);
    }
  }, [activeNfts]);

  // 当前展示的NFT
  const currentNft = activeNfts.length > 0 ? activeNfts[currentNftIndex] : null;

  // 判断是否应该显示购买按钮
  const shouldShowPurchase = useMemo(() => {
    // 如果是管理员，不显示购买按钮
    if (userRole === UserRole.ADMIN) {
      console.log('用户是管理员，不显示购买按钮');
      return false;
    }

    // 标准化地址格式用于比较
    const normalizedCreator = creatorAddress ? creatorAddress.toLowerCase() : null;
    const normalizedUser = account ? account.address.toLowerCase() : null;

    console.log(`广告位[${adSpace.id}]创建者信息:`, {
      name: adSpace.name,
      creatorAddress: normalizedCreator,
      userAddress: normalizedUser,
      isMatch: normalizedCreator === normalizedUser,
      userRole
    });

    // 如果是游戏开发者，且是自己创建的广告位，不显示购买按钮
    if (userRole === UserRole.GAME_DEV &&
        normalizedCreator &&
        normalizedUser &&
        normalizedCreator === normalizedUser) {
      console.log(`广告位[${adSpace.id}]是当前开发者创建的，隐藏购买按钮`);
      return false;
    }

    // 如果用户拥有该广告位的活跃或待展示NFT，不显示购买按钮
    if (userOwnedNfts.length > 0) {
      // 检查用户拥有的NFT是否有活跃或待展示的
      const now = new Date();
      const hasActiveOrFutureNft = userOwnedNfts.some(nft => {
        const leaseEnd = new Date(nft.leaseEnd);
        // 如果NFT还未过期，则不显示购买按钮
        return now <= leaseEnd;
      });

      if (hasActiveOrFutureNft) {
        console.log(`用户拥有广告位[${adSpace.id}]的活跃或待展示NFT，隐藏购买按钮`);
        return false;
      }
    }

    // 其他情况显示购买按钮
    return true;
  }, [userRole, creatorAddress, account, adSpace.id, adSpace.name, userOwnedNfts]);

  // 判断是否应该显示"我的NFT"标记
  const shouldShowMyNftTag = useMemo(() => {
    if (userOwnedNfts.length === 0) return false;

    // 检查用户拥有的NFT是否有活跃或待展示的
    const now = new Date();
    return userOwnedNfts.some(nft => {
      const leaseEnd = new Date(nft.leaseEnd);
      // 如果NFT还未过期，则显示"我的NFT"标记
      return now <= leaseEnd;
    });
  }, [userOwnedNfts]);

  return (
    <Card
      className="ad-space-card"
      hoverable
      cover={
        <div className="card-cover">
          {loading ? (
            <div className="loading-container">
              <Spin />
            </div>
          ) : currentNft && currentNft.contentUrl ? (
            <div className="active-nft-cover">
              <MediaContent
                contentUrl={currentNft.contentUrl}
                brandName={currentNft.brandName || '广告内容'}
              />
              {activeNfts.length > 1 && (
                <div className="carousel-controls" onClick={handleSwitchNft}>
                  <Tag className="switch-tag" icon={<SwapOutlined />} color="blue">
                    {currentNftIndex + 1}/{activeNfts.length}
                  </Tag>
                </div>
              )}
              <Tag className="active-tag" color="green">{t('adSpaces.status.active')}</Tag>
            </div>
          ) : (
            <div className="empty-ad-space-placeholder">
              <ColumnWidthOutlined />
              <Text>{adSpace.aspectRatio || '16:9'}</Text>
              <Text className="empty-text">{t('adSpaces.status.waiting')}</Text>
            </div>
          )}
        </div>
      }
      actions={[
        <Button type="primary" key="view">
          <Link to={`/ad-spaces/${adSpace.id}`}>{t('adSpaces.buttons.viewDetails')}</Link>
        </Button>,
        shouldShowPurchase ? (
          <Button type="default" key="purchase">
            <Link to={`/ad-spaces/${adSpace.id}/purchase`}>{t('adSpaces.buttons.buyNow')}</Link>
          </Button>
        ) : null
      ].filter(Boolean)}
    >
      <Title level={4} className="ad-title">{adSpace.name}</Title>

      <Space direction="vertical" className="ad-info">
        <div className="info-item">
          <EnvironmentOutlined />
          <Text>{t('manage.createAdSpace.form.location')}: {adSpace.location}</Text>
        </div>

        <div className="info-item">
          <ColumnWidthOutlined />
          <Text>
            {`${t('manage.createAdSpace.form.dimension')}: ${adSpace.aspectRatio || '16:9'}`}
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
      </Space>

      <div className="ad-tags">
        <Tag color="blue">{adSpace.location}</Tag>
        {creatorAddress && account && creatorAddress.toLowerCase() === account.address.toLowerCase() && (
          <Tag color="purple">{t('adSpaces.status.myAdSpace')}</Tag>
        )}
        {shouldShowMyNftTag && (
          <Tag color="green">{t('adSpaces.status.myNFT')}</Tag>
        )}
      </div>
    </Card>
  );
};

export default AdSpaceCard;