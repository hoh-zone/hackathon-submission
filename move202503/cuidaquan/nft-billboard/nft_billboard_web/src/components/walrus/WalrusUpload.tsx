import React, { useState } from 'react';
import { Button, Upload, message, Radio, Spin, Form, Input, Progress, Tooltip, Card } from 'antd';
import { UploadOutlined, CheckCircleOutlined, InfoCircleOutlined, InboxOutlined, FileOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/lib/upload';
import { walrusService, CustomSigner } from '../../utils/walrus';
import './WalrusUpload.scss';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { DEFAULT_NETWORK } from '../../config/config';
import { WALRUS_CONFIG } from '../../config/walrusConfig';
import { useTranslation } from 'react-i18next';
import { useWalletTransaction } from '../../hooks/useWalletTransaction';

const { Dragger } = Upload;

// 允许的文件类型
const ALLOWED_FILE_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // 视频
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime' // .mov 文件
];

// 文件大小限制 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface WalrusUploadProps {
  onSuccess?: (url: string, blobId?: string, storageSource?: string) => void;
  onError?: (error: Error) => void;
  leaseDays?: number;
  customStartTime?: number; // 自定义开始时间（Unix时间戳，秒）
  onChange?: (data: { url: string; blobId?: string; storageSource: string }) => void;
  hideStorageSelector?: boolean; // 是否隐藏存储模式选择器
  aspectRatio?: string; // 新增：广告位比例，如 "16:9"
  walletBalance?: string; // 钱包SUI余额
  walBalance?: string; // 钱包WAL余额
  insufficientBalance?: boolean; // SUI余额是否不足
}

// 上传阶段枚举
type UploadStage = 'preparing' | 'signing' | 'uploading' | 'finalizing' | 'completed' | 'idle';

/**
 * Walrus文件上传组件
 * 支持外部URL和Walrus上传两种模式
 * 可以通过hideStorageSelector属性控制是否显示存储模式选择器
 */
const WalrusUpload: React.FC<WalrusUploadProps> = ({
  onSuccess,
  onError,
  leaseDays = WALRUS_CONFIG.DEFAULT_LEASE_DAYS,
  customStartTime,
  onChange,
  hideStorageSelector = false, // 默认显示存储模式选择器
  aspectRatio, // 广告位比例
  walletBalance = '0', // 钱包SUI余额
  walBalance = '0', // 钱包WAL余额
  insufficientBalance = false // SUI余额是否不足
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [storageMode, setStorageMode] = useState<'walrus' | 'external'>('walrus');
  const [externalUrl, setExternalUrl] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isImage, setIsImage] = useState(true);
  // 上传进度状态
  const [uploadProgress, setUploadProgress] = useState(0);
  // 上传阶段状态
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  // 上传文件名称
  const [uploadingFileName, setUploadingFileName] = useState('');

  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { executeTransaction } = useWalletTransaction();

  // 从配置获取当前网络
  const networkConfig = DEFAULT_NETWORK;

  // 根据网络配置构建链ID
  let chainId: `${string}:${string}` = `sui:${networkConfig}`;

  console.log(`使用网络配置: ${chainId}`);

  // 创建符合CustomSigner接口的对象
  const createSigner = (): CustomSigner => {
    if (!account?.address) {
      throw new Error('钱包未连接');
    }

    return {
      // 签名交易方法
      signTransaction: async (tx: any) => {
        console.log('准备签名交易，交易对象:', tx);

        // 更新上传阶段为签名中
        setUploadStage('signing');
        setUploadProgress(30);

        // 确保交易对象包含 sender 信息
        if (tx && typeof tx === 'object' && 'setSender' in tx && typeof tx.setSender === 'function') {
          console.log('设置交易发送者为:', account.address);
          tx.setSender(account.address);
        }

        // 特殊处理Uint8Array类型的交易数据
        if (tx instanceof Uint8Array) {
          console.log('检测到交易对象是Uint8Array类型，尝试转换为Transaction对象');

          try {
            // 使用Transaction.from将二进制数据转换为Transaction对象
            const transactionBlock = Transaction.from(tx);
            console.log('成功将Uint8Array转换为Transaction对象', transactionBlock);

            // 确保设置发送者
            if ('setSender' in transactionBlock && typeof transactionBlock.setSender === 'function') {
              transactionBlock.setSender(account.address);
            }

            // 使用新的executeTransaction函数
            message.loading({
              content: t('walrusUpload.progress.signing'),
              key: 'walrusUpload',
              duration: 0
            });

            const { success, result } = await executeTransaction(transactionBlock, {
              loadingMessage: t('walrusUpload.progress.signing'),
              successMessage: t('walrusUpload.progress.signSuccess'),
              loadingKey: 'walrusUpload',
              successKey: 'walrusUpload',
              userRejectedMessage: t('common.messages.userRejected')
            });

            // 如果交易被用户拒绝或失败，直接返回
            if (!success) {
              throw new Error(t('common.messages.userRejected'));
            }

            const response = result;

            // 签名完成后更新进度
            setUploadProgress(50);
            setUploadStage('uploading');

            if (!response) {
              throw new Error('交易签名未返回结果');
            }

            return response;
          } catch (err: any) {
            console.error('无法处理Uint8Array类型的交易:', err);

            // 检查是否是用户拒绝交易
            if (err.message && (
              err.message.includes('User rejected') ||
              err.message.includes('User cancelled') ||
              err.message.includes('User denied') ||
              err.message.includes('用户拒绝') ||
              err.message.includes('用户取消') ||
              err.message.includes(t('common.messages.userRejected'))
            )) {
              // 用户拒绝交易，显示友好提示
              message.info({
                content: t('common.messages.userRejected'),
                key: 'walrusUpload',
                duration: 2
              });
              throw new Error(t('common.messages.userRejected'));
            } else {
              // 其他错误
              throw new Error(`${t('walrusUpload.upload.blobUploadFailed')}: ${err.message || t('common.messages.unknown')}`);
            }
          }
        }

        // 将交易对象转换为兼容格式
        let transactionToSign = tx;

        // 确保交易对象具有toJSON方法
        if (tx && typeof tx === 'object' && !('toJSON' in tx)) {
          console.log('为交易对象添加toJSON方法');

          // 创建一个包装对象，提供所需的方法
          transactionToSign = {
            ...tx,
            toJSON: function() {
              if (this.serialize && typeof this.serialize === 'function') {
                return this.serialize();
              }
              return this;
            }
          };
        }

        // 使用 Promise 包装 signAndExecute 调用，确保它返回结果
        try {
          // 使用新的executeTransaction函数
          message.loading({
            content: t('walrusUpload.progress.signing'),
            key: 'walrusUpload',
            duration: 0
          });

          const { success, result } = await executeTransaction(transactionToSign, {
            loadingMessage: t('walrusUpload.progress.signing'),
            successMessage: t('walrusUpload.progress.signSuccess'),
            loadingKey: 'walrusUpload',
            successKey: 'walrusUpload',
            userRejectedMessage: t('common.messages.userRejected')
          });

          // 如果交易被用户拒绝或失败，直接返回
          if (!success) {
            throw new Error(t('common.messages.userRejected'));
          }

          const response = result;

          // 签名完成后更新进度
          setUploadProgress(50);
          setUploadStage('uploading');

          if (!response) {
            throw new Error('交易签名未返回结果');
          }

          return response;
        } catch (err: any) {
          console.error('交易签名最终失败:', err);

          // 检查是否是用户拒绝交易
          if (err.message && (
            err.message.includes('User rejected') ||
            err.message.includes('User cancelled') ||
            err.message.includes('User denied') ||
            err.message.includes('用户拒绝') ||
            err.message.includes('用户取消') ||
            err.message.includes(t('common.messages.userRejected'))
          )) {
            // 用户拒绝交易，显示友好提示
            message.info({
              content: t('common.messages.userRejected'),
              key: 'walrusUpload',
              duration: 2
            });
            throw new Error(t('common.messages.userRejected'));
          } else {
            // 其他错误
            throw new Error(`${t('walrusUpload.upload.blobUploadFailed')}: ${err.message || t('common.messages.unknown')}`);
          }
        }
      },

      // 获取 Sui 地址
      toSuiAddress: () => {
        return account.address;
      },

      // 地址属性
      address: account.address
    };
  };

  // 检查URL是否为图片或视频
  const checkMediaType = (url: string) => {
    const lowerCaseUrl = url.toLowerCase();
    // 检查图片扩展名
    if (lowerCaseUrl.endsWith('.jpg') || lowerCaseUrl.endsWith('.jpeg') ||
        lowerCaseUrl.endsWith('.png') || lowerCaseUrl.endsWith('.gif') ||
        lowerCaseUrl.endsWith('.webp') || lowerCaseUrl.endsWith('.bmp')) {
      return 'image';
    }
    // 检查视频扩展名
    if (lowerCaseUrl.endsWith('.mp4') || lowerCaseUrl.endsWith('.webm') ||
        lowerCaseUrl.endsWith('.ogg') || lowerCaseUrl.endsWith('.mov')) {
      return 'video';
    }
    // 默认当作图片处理
    return 'image';
  };

  // 验证URL是否有效
  const isValidUrl = (url: string): boolean => {
    try {
      // 检查URL是否包含协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }

      // 检查URL是否至少包含域名部分
      const urlObj = new URL(url);
      return !!urlObj.hostname;
    } catch (e) {
      return false;
    }
  };

  const handleUpload = async (file: RcFile) => {
    if (!account?.address) {
      message.error(t('walrusUpload.upload.connectWalletError'));
      return false;
    }

    // 检查SUI余额是否不足
    if (insufficientBalance) {
      // 使用"购买广告位"作为价格描述，而不是具体数值
      message.error(t('nftDetail.transaction.insufficientBalanceGeneric', {
        balance: walletBalance
      }));
      return false;
    }

    // 检查WAL余额是否为0（仅在Walrus模式下）
    if (storageMode === 'walrus' && walBalance === '0') {
      message.error(t('walrusUpload.upload.noWalBalance'));
      return false;
    }

    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      message.error(t('walrusUpload.upload.unsupportedType'));
      return false;
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      // 先使用 t() 函数处理占位符替换，然后将结果传递给 message.error
      const errorMsg = t('walrusUpload.upload.fileTooLarge', { size: fileSizeMB });
      message.error(errorMsg);
      return false;
    }

    setUploading(true);
    // 重置上传状态并设置为准备中
    setUploadProgress(10);
    setUploadStage('preparing');
    setUploadingFileName(file.name);

    try {
      // 计算存储时长，考虑自定义开始时间
      let duration = leaseDays * 24 * 60 * 60; // 基础租期（秒）

      // 如果设置了自定义开始时间，计算额外的存储时间
      if (customStartTime) {
        const now = Math.floor(Date.now() / 1000); // 当前时间（秒）
        if (customStartTime > now) {
          // 如果自定义时间在未来，增加额外的存储时间
          const extraTime = customStartTime - now;
          duration += extraTime;
          console.log(`检测到自定义开始时间，增加额外存储时间: ${Math.floor(extraTime / 86400)} 天`);
        }
      }

      // 创建Signer对象
      const signer = createSigner();

      // 在uploadFile调用前更新进度为上传中
      setUploadProgress(60);
      setUploadStage('uploading');

      // 使用新的接口调用uploadFile
      const result = await walrusService.uploadFile(
        file,
        duration,
        account.address,
        signer,
        leaseDays // 传递租赁天数，用于日志记录
      );

      // 上传完成，更新进度为完成阶段
      setUploadProgress(90);
      setUploadStage('finalizing');

      setTimeout(() => {
        // 最终完成
        setUploadProgress(100);
        setUploadStage('completed');

        // 设置上传成功状态和URL
        setUploadSuccess(true);
        setUploadedUrl(result.url);
        // 根据文件扩展名判断是图片还是视频
        setIsImage(checkMediaType(file.name) === 'image');

        message.success(t('walrusUpload.upload.uploadSuccess'));
        onSuccess?.(result.url, result.blobId, 'walrus');

        // 通知父组件内容变更
        onChange?.({
          url: result.url,
          blobId: result.blobId,
          storageSource: 'walrus'
        });
      }, 500);

    } catch (error) {
      console.error('文件上传失败:', error);
      const err = error instanceof Error ? error : new Error(String(error));

      // 检查是否是用户拒绝交易
      if (err.message && (
        err.message.includes('User rejected') ||
        err.message.includes('User cancelled') ||
        err.message.includes('User denied') ||
        err.message.includes('用户拒绝') ||
        err.message.includes('用户取消') ||
        err.message.includes(t('common.messages.userRejected'))
      )) {
        // 用户拒绝交易，显示友好提示
        message.info({
          content: t('common.messages.userRejected'),
          key: 'walrusUpload',
          duration: 2
        });
      } else {
        // 其他错误
        message.error({
          content: `${t('walrusUpload.upload.uploadFailed')}: ${err.message}`,
          key: 'walrusUpload',
          duration: 3
        });
      }

      onError?.(err);
      // 重置上传状态
      setUploadStage('idle');
      setUploadProgress(0);
    } finally {
      // 不要在这里马上设置uploading为false，而是在setUploadStage('completed')后延迟设置
      if (uploadStage !== 'completed') {
        setUploading(false);
      } else {
        // 给用户一个短暂的时间看到100%完成状态
        setTimeout(() => {
          setUploading(false);
        }, 1000);
      }
    }
    return false;
  };

  // 构建accept属性，用于文件选择对话框中筛选文件类型
  const acceptFileTypes = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.mp4,.webm,.mov,.ogg';

  const uploadProps = {
    name: 'file',
    multiple: false,
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: uploading || !account?.address || insufficientBalance || (storageMode === 'walrus' && walBalance === '0'),
    accept: acceptFileTypes, // 添加accept属性，限制文件选择对话框中显示的文件类型
  };

  const handleExternalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setExternalUrl(url);
    setPreviewError(false);

    // 始终通知父组件URL变化，但不设置为成功状态
    onChange?.({
      url: url,
      storageSource: 'external'
    });

    if (url) {
      // 检查URL是否有效
      const isValid = isValidUrl(url);

      // 显示预览（即使URL不完全有效，也可以尝试预览）
      setPreviewVisible(true);

      // 不自动设置成功状态，需要用户点击确认按钮
      setUploadSuccess(false);
    } else {
      // URL为空
      setPreviewVisible(false);
      setUploadSuccess(false);
    }
  };

  const handleImageError = () => {
    setPreviewError(true);
    message.error(t('walrusUpload.external.loadError'));
  };

  const handleModeChange = (e: any) => {
    const mode = e.target.value;
    setStorageMode(mode);

    // 清空另一种模式的数据
    if (mode === 'external') {
      // 切换到外部URL模式时，只通知父组件模式变更
      // 不自动设置成功状态，需要用户点击确认按钮
      if (externalUrl) {
        onChange?.({
          url: externalUrl,
          storageSource: 'external'
        });
      }
      // 重置成功状态，等待用户确认
      setUploadSuccess(false);
    } else {
      // 切换到Walrus模式时，清空外部URL
      setExternalUrl('');
      setPreviewVisible(false);
      setPreviewError(false);
      // 如果之前没有上传过文件，重置上传成功状态
      if (!uploadedUrl || uploadedUrl === externalUrl) {
        setUploadSuccess(false);
        setUploadedUrl('');
      }
    }
  };

  // 获取上传阶段的描述文本
  const getUploadStageText = () => {
    switch (uploadStage) {
      case 'preparing':
        return t('walrusUpload.progress.preparing');
      case 'signing':
        return t('walrusUpload.progress.signing');
      case 'uploading':
        return t('walrusUpload.progress.uploading');
      case 'finalizing':
        return t('walrusUpload.progress.finalizing');
      case 'completed':
        return t('walrusUpload.progress.completed');
      default:
        return '';
    }
  };

  // 如果上传成功，直接显示媒体内容和URL
  if (uploadSuccess && uploadedUrl) {
    return (
      <div className="walrus-upload-success">
        <Card
          title={
            storageMode === 'external'
              ? t('purchase.form.externalUrlAlert')
              : t('walrusUpload.success.title')
          }
          className="uploaded-content-card"
        >
          <div className="uploaded-content-preview">
            {isImage ? (
              <img
                src={uploadedUrl}
                alt={t('walrusUpload.success.uploadedImage')}
                style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '0 auto' }}
                onError={handleImageError}
              />
            ) : (
              <video
                src={uploadedUrl}
                controls
                style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '0 auto' }}
              />
            )}
          </div>
          <div className="content-url">
            <p><LinkOutlined /> {t('walrusUpload.success.contentUrl')}</p>
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">{uploadedUrl}</a>
          </div>
        </Card>
      </div>
    );
  }

  // 根据比例计算预览宽度
  const getRatioPreviewWidth = (ratio: string): string => {
    if (!ratio || !ratio.includes(':')) return '100%';

    const [w, h] = ratio.split(':').map(Number);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return '100%';

    if (w >= h) {
      return '100%';
    } else {
      // 对于竖向比例，按高度计算宽度
      return `${(w / h) * 100}%`;
    }
  };

  // 根据比例计算预览高度
  const getRatioPreviewHeight = (ratio: string): string => {
    if (!ratio || !ratio.includes(':')) return '100%';

    const [w, h] = ratio.split(':').map(Number);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return '100%';

    if (w >= h) {
      // 对于横向比例，按宽度计算高度
      return `${(h / w) * 100}%`;
    } else {
      return '100%';
    }
  };

  return (
    <div className="walrus-upload-container">
      {/* 只有在hideStorageSelector为false时才显示存储模式选择器 */}
      {!hideStorageSelector && (
        <div className="storage-selector">
          <Radio.Group onChange={handleModeChange} value={storageMode}>
            <Radio value="walrus">{t('walrusUpload.storage.walrus')}</Radio>
            <Radio value="external">{t('walrusUpload.storage.external')}</Radio>
          </Radio.Group>
        </div>
      )}

      {/* 显示比例指南 */}
      {aspectRatio && (
        <div className="ratio-guidance" style={{
          backgroundColor: '#f0f8ff',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #e6f0ff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InfoCircleOutlined style={{ color: '#1677ff', marginRight: '8px' }} />
            <span>{t('walrusUpload.upload.ratioGuidance', { ratio: aspectRatio })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <div className="ratio-preview" style={{
              position: 'relative',
              width: '60px',
              height: '60px',
              margin: '0 16px 0 0',
              background: 'white',
              overflow: 'hidden',
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: getRatioPreviewWidth(aspectRatio),
                height: getRatioPreviewHeight(aspectRatio),
                background: '#e6f7ff',
                border: '1px solid #1677ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1677ff'
              }}>
                {aspectRatio}
              </div>
            </div>
          </div>
        </div>
      )}

      {storageMode === 'walrus' ? (
        <>
          {uploading ? (
            <div className="upload-progress-container">
              <Card>
                <div className="upload-progress-header">
                  <LoadingOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
                  <h3>{t('walrusUpload.progress.uploading')}: {uploadingFileName}</h3>
                </div>
                <Progress
                  percent={uploadProgress}
                  status={uploadProgress < 100 ? "active" : "success"}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div className="upload-stage-info">
                  <p>{getUploadStageText()}</p>
                  {uploadStage === 'signing' && (
                    <p className="upload-stage-hint">{t('walrusUpload.progress.signingHint')}</p>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {!account?.address
                  ? t('walrusUpload.upload.connectWalletFirst')
                  : insufficientBalance
                    ? t('nftDetail.transaction.insufficientBalanceGeneric', { balance: walletBalance })
                    : storageMode === 'walrus' && walBalance === '0'
                      ? t('walrusUpload.upload.noWalBalance')
                      : t('walrusUpload.upload.dragText')
                }
              </p>
              <p className="ant-upload-hint">
                {t('walrusUpload.upload.hint')}
              </p>
              <div className="upload-requirements">
                <p>{t('walrusUpload.upload.requirements')}</p>
                <p>{t('walrusUpload.upload.maxSize')}</p>
              </div>
            </Dragger>
          )}
        </>
      ) : (
        <div>
          <Form.Item>
            <div style={{ display: 'flex' }}>
              <Input
                placeholder={t('walrusUpload.external.placeholder')}
                value={externalUrl}
                onChange={handleExternalUrlChange}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                disabled={!externalUrl || !isValidUrl(externalUrl) || insufficientBalance}
                style={{
                  marginLeft: '8px',
                  height: '32px',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #4e63ff, #6e56cf)',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(78, 99, 255, 0.2)'
                }}
                title={insufficientBalance ? t('nftDetail.transaction.insufficientBalanceGeneric', { balance: walletBalance }) : ''}
                onClick={() => {
                  if (externalUrl && isValidUrl(externalUrl) && !insufficientBalance) {
                    // 通知父组件URL已确认
                    onSuccess?.(externalUrl, undefined, 'external');
                    // 设置上传成功状态
                    setUploadSuccess(true);
                    setUploadedUrl(externalUrl);
                    // 根据URL扩展名判断是图片还是视频
                    setIsImage(checkMediaType(externalUrl) === 'image');
                    // 显示成功消息
                    message.success(t('purchase.form.externalUrlSuccess'));
                  } else if (insufficientBalance) {
                    // 显示余额不足警告
                    message.error(t('nftDetail.transaction.insufficientBalanceGeneric', {
                      balance: walletBalance
                    }));
                  }
                }}
              >
                {t('walrusUpload.external.confirmUrl')}
              </Button>
            </div>
            <div className="upload-note">
              {t('walrusUpload.external.note')}
            </div>
          </Form.Item>

          {previewVisible && externalUrl && (
            <div className="external-url-preview">
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <span>{t('walrusUpload.external.preview')}</span>
              </div>

              {previewError ? (
                <div className="preview-error">
                  <p>{t('walrusUpload.external.checkUrl')}</p>
                  <p>{t('walrusUpload.external.ensureImageUrl')}</p>
                  <Button
                    type="link"
                    onClick={() => window.open(externalUrl, '_blank')}
                  >
                    {t('walrusUpload.external.openInNewTab')}
                  </Button>
                </div>
              ) : (
                <div style={{ border: '1px dashed #d9d9d9', padding: '8px', borderRadius: '4px' }}>
                  <img
                    src={externalUrl}
                    alt={t('walrusUpload.success.uploadedImage')}
                    style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', margin: '0 auto' }}
                    onError={handleImageError}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalrusUpload;