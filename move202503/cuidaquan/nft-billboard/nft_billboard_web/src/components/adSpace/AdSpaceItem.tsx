import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Typography, Tag, Spin, Popconfirm, Col } from 'antd';
import { ColumnWidthOutlined, DollarOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AdSpace, BillboardNFT } from '../../types';
import { getNFTDetails } from '../../utils/contract';
import MediaContent from '../nft/MediaContent';
import './AdSpaceItem.scss';

const { Text } = Typography;

interface AdSpaceItemProps {
  adSpace: AdSpace;
  onUpdatePrice: (adSpace: AdSpace) => void;
  onDeleteAdSpace: (adSpaceId: string) => void;
  deleteLoading: boolean;
}

const AdSpaceItem: React.FC<AdSpaceItemProps> = ({
  adSpace,
  onUpdatePrice,
  onDeleteAdSpace,
  deleteLoading
}) => {
  const { t } = useTranslation();
  const [loadingNft, setLoadingNft] = useState(false);
  const [activeNfts, setActiveNfts] = useState<BillboardNFT[]>([]);
  const [currentNftIndex, setCurrentNftIndex] = useState(0);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});

  // useEffect需要在组件顶层调用
  useEffect(() => {
    // 只有当不是示例数据且有NFT IDs时才执行
    if (adSpace.isExample || !adSpace.nft_ids?.length) {
      return;
    }

    const getActiveNfts = async () => {
      try {
        setLoadingNft(true);

        // 确保nft_ids存在
        const nftIds = adSpace.nft_ids || [];
        const activeNftsFound: BillboardNFT[] = [];

        // 尝试获取每个NFT详情，收集所有活跃的NFT
        for (const nftId of nftIds) {
          const nft = await getNFTDetails(nftId);
          if (nft && nft.isActive) {
            activeNftsFound.push(nft);
          }
        }

        // 保存所有活跃的NFT
        setActiveNfts(activeNftsFound);
        // 重置轮播索引
        setCurrentNftIndex(0);
        console.log(`广告位[${adSpace.id}]找到${activeNftsFound.length}个活跃NFT`);
      } catch (error) {
        console.error('获取活跃NFT失败:', error);
      } finally {
        setLoadingNft(false);
      }
    };

    getActiveNfts();
  }, [adSpace.nft_ids, adSpace.isExample]);

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

  // 手动切换轮播
  const handleSwitchNft = useCallback(() => {
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

  // 如果这是示例数据，不要显示完整卡片
  if (adSpace.isExample) {
    return (
      <Col xs={24}>
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <ColumnWidthOutlined style={{ fontSize: '48px', color: '#4e63ff', marginBottom: '16px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{adSpace.name}</div>
          <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: '24px' }}>{adSpace.description}</div>
        </div>
      </Col>
    );
  }

  return (
    <Col xs={24} sm={12} md={8}>
      <Card className="ad-space-card">
        <div className="card-cover">
          {loadingNft ? (
            <div className="loading-container">
              <Spin />
            </div>
          ) : activeNfts.length > 0 ? (
            <div className="active-nft-cover">
              <MediaContent
                contentUrl={activeNfts[currentNftIndex].contentUrl}
                brandName={activeNfts[currentNftIndex].brandName || '广告内容'}
                className="ad-space-image"
                onError={() => {
                  setMediaErrors(prev => ({
                    ...prev,
                    [activeNfts[currentNftIndex].contentUrl]: true
                  }));
                  // 自动切换到下一个媒体
                  handleSwitchNft();
                }}
              />
              {activeNfts.length > 1 && (
                <div className="carousel-controls" onClick={handleSwitchNft}>
                  <Tag className="switch-tag" icon={<SwapOutlined spin />} color="blue">
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
              <Text>{t('adSpaces.status.waiting')}</Text>
            </div>
          )}
          <div className="availability-badge">
            <span className={adSpace.available ? "available" : "unavailable"}>
              {adSpace.available ? t('adSpaces.status.available') : t('adSpaces.status.occupied')}
            </span>
          </div>
        </div>
        <Card.Meta
          title={adSpace.name}
          className="ad-space-meta"
        />
        <div className="ad-space-info">
          <div className="info-item">
            <span className="label">{t('manage.createAdSpace.form.location')}:</span>
            <span className="value">{adSpace.location}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('manage.createAdSpace.form.dimension')}:</span>
            <span className="value">
              {adSpace.aspectRatio || '16:9'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">{t('manage.createAdSpace.form.price')}:</span>
            <span className="value price">
              {parseFloat((Number(adSpace.price) / 1000000000).toFixed(9))} SUI/{t('common.time.day')}
            </span>
          </div>
        </div>
        <div className="action-buttons">
          <Button
            className="edit-button"
            onClick={() => onUpdatePrice(adSpace)}
            icon={<DollarOutlined />}
          >
            {t('manage.buttons.changePrice')}
          </Button>
          <Popconfirm
            title={t('manage.confirmDelete.title')}
            description={t('manage.confirmDelete.description')}
            onConfirm={() => onDeleteAdSpace(adSpace.id)}
            okText={t('common.buttons.confirm')}
            cancelText={t('common.buttons.cancel')}
            okButtonProps={{ loading: deleteLoading }}
          >
            <Button
              className="delete-button"
              icon={<DeleteOutlined />}
            >
              {t('common.buttons.delete')}
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </Col>
  );
};

export default AdSpaceItem;