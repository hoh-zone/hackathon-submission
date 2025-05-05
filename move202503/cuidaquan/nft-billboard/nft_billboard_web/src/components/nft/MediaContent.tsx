import React, { useState, useEffect } from 'react';
import { Spin, Button, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './MediaContent.scss';

interface MediaContentProps {
  contentUrl: string;
  brandName?: string;
  className?: string;
  onError?: () => void;
  status?: {
    status: string;
    text?: string;
    color: string;
  };
}

const MediaContent: React.FC<MediaContentProps> = ({ contentUrl, brandName = '', className = '', status }) => {
  const { t } = useTranslation();
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!contentUrl) {
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    // 通过URL扩展名检查
    const lowerCaseUrl = contentUrl.toLowerCase();
    const hasVideoExt = lowerCaseUrl.endsWith('.mp4') ||
                      lowerCaseUrl.endsWith('.webm') ||
                      lowerCaseUrl.endsWith('.ogg') ||
                      lowerCaseUrl.endsWith('.mov');

    if (hasVideoExt) {
      setIsVideo(true);
      setIsLoading(false);
      return;
    }

    // 检查是否为图片扩展名
    const hasImageExt = lowerCaseUrl.endsWith('.jpg') ||
                      lowerCaseUrl.endsWith('.jpeg') ||
                      lowerCaseUrl.endsWith('.png') ||
                      lowerCaseUrl.endsWith('.gif') ||
                      lowerCaseUrl.endsWith('.webp') ||
                      lowerCaseUrl.endsWith('.svg');

    if (hasImageExt) {
      setIsVideo(false);
      // 预加载图片以检查是否可以正常加载
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      img.src = contentUrl;
      return;
    }

    // 如果没有明确的扩展名，尝试加载为视频
    const videoTest = document.createElement('video');
    videoTest.style.display = 'none';
    videoTest.preload = 'metadata';

    videoTest.onloadedmetadata = () => {
      setIsVideo(true);
      setIsLoading(false);
      setHasError(false);
    };

    videoTest.onerror = () => {
      // 视频加载失败，尝试作为图片加载
      setIsVideo(false);

      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      img.src = contentUrl;
    };

    videoTest.src = contentUrl;
    document.body.appendChild(videoTest);

    return () => {
      if (document.body.contains(videoTest)) {
        document.body.removeChild(videoTest);
      }
    };
  }, [contentUrl]);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // 重新加载媒体
    if (isVideo) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setIsLoading(false);
      };
      video.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      video.src = contentUrl;
      video.load();
    } else {
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      img.src = contentUrl;
    }
  };

  if (isLoading) {
    return (
      <div className={`media-container loading-media ${className}`}>
        <Spin size="large" />
        <p>{t('common.messages.loading')}...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`media-container error-media ${className}`}>
        <div className="error-content">
          <div className="error-icon">!</div>
          <p>{t('nftDetail.mediaLoadError')}</p>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
          >
            {t('common.buttons.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`media-container ${className}`}>
        {status && (
          <div className="status-tag">
            <Tag className={`status ${status.status}`} color={status.color}>
              {status.text || status.status}
            </Tag>
          </div>
        )}
        <video
          src={contentUrl}
          controls
          preload="metadata"
          onError={() => setHasError(true)}
          className="media-content"
        />
      </div>
    );
  }

  return (
    <div className={`media-container ${className}`}>
      {status && (
        <div className="status-tag">
          <Tag className={`status ${status.status}`} color={status.color}>
            {status.text || status.status}
          </Tag>
        </div>
      )}
      <img
        src={contentUrl}
        alt={brandName}
        onError={() => setHasError(true)}
        className="media-content"
      />
    </div>
  );
};

export default MediaContent;