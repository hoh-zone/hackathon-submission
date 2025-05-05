import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Radio, Alert, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { BillboardNFT } from '../../types';
import { walrusService } from '../../utils/walrus';
import MediaContent from './MediaContent';
import WalrusUpload from '../walrus/WalrusUpload';
import './UpdateAdContent.scss';
import { formatSuiAmount } from '../../utils/contract';
import { getWalCoinType } from '../../config/walrusConfig';
import { useWalletTransaction } from '../../hooks/useWalletTransaction';

const { Title, Text } = Typography;

interface UpdateAdContentProps {
  nft: BillboardNFT;
  onSuccess: () => void;
  onCancel: () => void;
}

const UpdateAdContent: React.FC<UpdateAdContentProps> = ({ nft, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { executeTransaction } = useWalletTransaction();

  // 添加钱包余额相关状态
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [insufficientBalance, setInsufficientBalance] = useState<boolean>(false);
  const [walBalance, setWalBalance] = useState<string>('0');

  // 状态管理
  const [storageMode, setStorageMode] = useState<'external' | 'walrus'>(
    nft.storageSource === 'walrus' ? 'walrus' : 'external'
  );
  const [externalUrl, setExternalUrl] = useState(
    nft.storageSource === 'external' ? nft.contentUrl : ''
  );
  const [newContentUrl, setNewContentUrl] = useState('');
  const [newBlobId, setNewBlobId] = useState('');
  const [newStorageSource, setNewStorageSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  // 获取钱包余额
  useEffect(() => {
    const fetchBalances = async () => {
      if (account && suiClient) {
        try {
          // 获取SUI代币余额
          const { totalBalance } = await suiClient.getBalance({
            owner: account.address,
            coinType: '0x2::sui::SUI'
          });

          // 保存钱包余额到状态
          const formattedBalance = formatSuiAmount(totalBalance);
          setWalletBalance(formattedBalance);
          console.log('钱包余额:', formattedBalance, 'SUI');

          // 更新内容只需要支付少量gas费用，不需要检查SUI余额是否足够
          // 只需要检查WAL余额是否为0（如果选择上传到Walrus）
          setInsufficientBalance(false); // 更新内容不消耗SUI，所以不会出现SUI余额不足的情况

          // 获取WAL代币余额
          try {
            // 从配置文件获取当前环境的WAL代币类型
            const walCoinType = getWalCoinType();
            console.log('使用WAL代币类型:', walCoinType);

            const { totalBalance: walTotalBalance } = await suiClient.getBalance({
              owner: account.address,
              coinType: walCoinType
            });

            // 保存WAL余额到状态
            const formattedWalBalance = formatSuiAmount(walTotalBalance);
            setWalBalance(formattedWalBalance);
            console.log('WAL余额:', formattedWalBalance, 'WAL');
          } catch (walError) {
            console.error('获取WAL余额失败:', walError);
            // 如果获取WAL余额失败，设置为0
            setWalBalance('0');
          }
        } catch (error) {
          console.error('获取余额失败:', error);
        }
      }
    };

    fetchBalances();
  }, [account, suiClient]);

  // 处理存储模式变更
  useEffect(() => {
    // 当从Walrus切换到外部URL时，显示删除警告
    if (nft.storageSource === 'walrus' && storageMode === 'external') {
      setShowDeleteWarning(true);
    } else {
      setShowDeleteWarning(false);
    }
  }, [storageMode, nft.storageSource]);

  // 判断是否是从外部URL切换到Walrus上传
  const isExternalToWalrus = nft.storageSource === 'external' && storageMode === 'walrus';

  // 处理Walrus上传成功
  const handleWalrusSuccess = (url: string, blobId?: string, storageSource?: string) => {
    setNewContentUrl(url);
    setNewBlobId(blobId || '');
    setNewStorageSource('walrus');
    setPreviewUrl(url);
  };

  // 处理外部URL变更
  const handleExternalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setExternalUrl(url);
    setNewContentUrl(url);
    setNewBlobId('');
    setNewStorageSource('external');
    setPreviewUrl(url);
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

  // 计算NFT剩余租期天数
  const calculateRemainingLeaseDays = (nft: BillboardNFT): number => {
    const now = new Date();
    const leaseEnd = new Date(nft.leaseEnd);
    const diffTime = leaseEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1); // 至少返回1天
  };

  // 创建Signer对象
  const createSigner = () => {
    if (!account?.address) {
      throw new Error('钱包未连接');
    }

    // 从配置获取当前网络
    const networkConfig = 'testnet'; // 可以从配置中获取
    // 构建链ID
    const chainId: `${string}:${string}` = `sui:${networkConfig}`;

    return {
      // 签名交易方法
      signTransaction: async (tx: any) => {
        console.log('准备签名交易，交易对象:', tx);

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
            const Transaction = (await import('@mysten/sui/transactions')).Transaction;
            const transactionBlock = Transaction.from(tx);
            console.log('成功将Uint8Array转换为Transaction对象', transactionBlock);

            // 确保设置发送者
            if ('setSender' in transactionBlock && typeof transactionBlock.setSender === 'function') {
              transactionBlock.setSender(account.address);
            }

            // 使用新的executeTransaction函数
            const { success, result } = await executeTransaction(transactionBlock, {
              loadingMessage: t('walrusUpload.progress.signing'),
              successMessage: t('walrusUpload.progress.signSuccess'),
              loadingKey: 'signTransaction',
              successKey: 'signTransaction',
              userRejectedMessage: t('common.messages.userRejected')
            });

            // 如果交易被用户拒绝或失败，直接返回
            if (!success) {
              throw new Error(t('common.messages.userRejected'));
            }

            const response = result;

            if (!response) {
              throw new Error('交易签名未返回结果');
            }

            return response;
          } catch (err: any) {
            console.error('无法处理Uint8Array类型的交易:', err);
            throw new Error(`无法处理Uint8Array类型的交易: ${err.message || '未知错误'}`);
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
          const { success, result } = await executeTransaction(transactionToSign, {
            loadingMessage: t('walrusUpload.progress.signing'),
            successMessage: t('walrusUpload.progress.signSuccess'),
            loadingKey: 'signTransaction',
            successKey: 'signTransaction',
            userRejectedMessage: t('common.messages.userRejected')
          });

          // 如果交易被用户拒绝或失败，直接返回
          if (!success) {
            throw new Error(t('common.messages.userRejected'));
          }

          const response = result;

          if (!response) {
            throw new Error('交易签名未返回结果');
          }

          return response;
        } catch (err) {
          console.error('交易签名最终失败:', err);
          throw err;
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

  // 删除原Walrus内容
  const deleteOriginalWalrusContent = async () => {
    if (nft.storageSource === 'walrus' && nft.blobId) {
      try {
        // 先显示提示，告知用户这是可选操作
        message.info({
          content: t('walrusUpload.deleteWalrus.notice'),
          key: 'deleteWalrusNotice',
          duration: 3
        });

        // 等待用户阅读提示
        await new Promise(resolve => setTimeout(resolve, 1000));

        message.loading({
          content: t('walrusUpload.deleteWalrus.deleting'),
          key: 'deleteWalrus',
          duration: 0
        });

        // 调用删除Walrus内容的函数
        await walrusService.deleteBlob(nft.contentUrl, createSigner());

        message.success({
          content: t('walrusUpload.deleteWalrus.success'),
          key: 'deleteWalrus',
          duration: 2
        });

        console.log('原Walrus内容已删除');
      } catch (error) {
        console.error('删除原Walrus内容失败:', error);

        // 检查是否是用户拒绝交易
        const err = error instanceof Error ? error : new Error(String(error));
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
            content: t('walrusUpload.deleteWalrus.userRejected'),
            key: 'deleteWalrus',
            duration: 3
          });
        } else {
          // 其他错误
          message.error({
            content: t('walrusUpload.deleteWalrus.error'),
            key: 'deleteWalrus',
            duration: 3
          });
        }
        // 不阻止更新流程，只记录错误
      }
    }
  };

  // 提交更新
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // 验证输入
      if (storageMode === 'external' && !isValidUrl(externalUrl)) {
        message.error(t('walrusUpload.validation.invalidUrl'));
        setSubmitting(false);
        return;
      }

      if (storageMode === 'walrus' && !newContentUrl) {
        message.error(t('walrusUpload.validation.uploadFirst'));
        setSubmitting(false);
        return;
      }

      // 准备更新参数
      const updateParams = {
        nftId: nft.id,
        contentUrl: storageMode === 'external' ? externalUrl : newContentUrl,
        blobId: storageMode === 'walrus' ? newBlobId : '',
        storageSource: storageMode
      };

      // 显示交易执行中状态
      message.loading({
        content: t('walrusUpload.transaction.updating'),
        key: 'updateContent',
        duration: 0
      });

      // 导入创建更新广告内容交易的函数
      const { createUpdateAdContentTx } = await import('../../utils/contract');

      // 创建交易
      const txb = createUpdateAdContentTx(updateParams);

      // 执行交易
      const { success } = await executeTransaction(txb, {
        loadingMessage: t('walrusUpload.transaction.updating'),
        successMessage: t('walrusUpload.transaction.submitted'),
        loadingKey: 'updateContent',
        successKey: 'updateContent',
        userRejectedMessage: t('common.messages.userRejected')
      });

      // 如果交易被用户拒绝或失败，直接返回
      if (!success) {
        return;
      }

      // 交易已提交，显示等待确认消息
      message.loading({
        content: t('walrusUpload.transaction.waiting'),
        key: 'confirmUpdate',
        duration: 0
      });

      // 使用轮询方式检查交易结果，最多尝试5次
      let attempts = 0;
      const maxAttempts = 5;
      let confirmSuccess = false;

      while (attempts < maxAttempts && !confirmSuccess) {
        attempts++;
        // 增加等待时间
        const delay = 2000 * attempts;
        console.log(`等待更新确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

        // 等待一段时间再检查
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          // 从链上获取最新的NFT数据
          const { getNFTDetails } = await import('../../utils/contract');
          const updatedNft = await getNFTDetails(nft.id);

          // 检查内容是否已更新
          if (updatedNft && updatedNft.contentUrl === updateParams.contentUrl) {
            confirmSuccess = true;
            console.log('成功确认广告内容更新');

            // 如果原内容是Walrus存储，需要删除原Walrus内容
            if (nft.storageSource === 'walrus') {
              // 对于Walrus → 外部URL的情况，直接删除原内容
              // 对于Walrus → Walrus的情况，只有当新旧内容不同时才删除原内容
              if (storageMode === 'external' || (storageMode === 'walrus' && nft.contentUrl !== newContentUrl)) {
                console.log('检测到需要删除原Walrus内容：', {
                  原因: storageMode === 'external' ? 'Walrus切换到外部URL' : 'Walrus内容已更新',
                  原内容URL: nft.contentUrl,
                  新内容URL: newContentUrl
                });
                await deleteOriginalWalrusContent();
              } else {
                console.log('无需删除原Walrus内容，内容未变更');
              }
            }

            // 显示成功确认消息
            message.success({
              content: t('walrusUpload.transaction.success'),
              key: 'confirmUpdate',
              duration: 2
            });

            // 通知父组件更新成功
            onSuccess();
          } else {
            console.log('尚未检测到内容更新，将继续重试');
          }
        } catch (err) {
          console.warn(`检查交易结果时出错 (尝试 ${attempts}): `, err);
        }
      }

      // 如果无法确认成功，但交易已提交，仍视为部分成功
      if (!confirmSuccess) {
        message.info({
          content: t('walrusUpload.transaction.partialSuccess'),
          key: 'confirmUpdate',
          duration: 5
        });

        // 通知父组件更新成功（即使我们无法立即确认）
        onSuccess();
      }
    } catch (error) {
      console.error('更新广告内容失败:', error);
      message.error('更新广告内容失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="update-ad-content">
      {/* 内容来源选择器 */}
      <div className="storage-mode-selector">
        <Title level={5}>{t('nftDetail.modals.updateContent.storageMode')}</Title>
        <Radio.Group value={storageMode} onChange={e => setStorageMode(e.target.value)}>
          <Radio.Button value="external">{t('nftDetail.modals.updateContent.externalUrl')}</Radio.Button>
          <Radio.Button value="walrus">{t('nftDetail.modals.updateContent.walrusUpload')}</Radio.Button>
        </Radio.Group>
      </div>

      {/* 当前内容显示 */}
      <div className="current-content">
        <Title level={5}>{t('nftDetail.modals.updateContent.currentContent')}</Title>
        <div className="content-preview">
          <MediaContent contentUrl={nft.contentUrl} brandName={nft.brandName} />
        </div>
        <Text type="secondary">
          {t('nftDetail.modals.updateContent.source')}: {nft.storageSource === 'walrus' ? t('nftDetail.modals.updateContent.walrusStorage') : t('nftDetail.modals.updateContent.externalStorage')}
        </Text>
      </div>

      {/* 删除警告 */}
      {showDeleteWarning && (
        <Alert
          message={t('nftDetail.modals.updateContent.deleteWarning.title')}
          description={t('nftDetail.modals.updateContent.deleteWarning.description')}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Walrus存储提示 */}
      {storageMode === 'walrus' && (
        <Alert
          message={t('walrusUpload.noticeTitle')}
          description={isExternalToWalrus
            ? t('walrusUpload.externalToWalrusWarning')
            : t('walrusUpload.walrusUpdateWarning')}
          type="warning"
          showIcon
          style={{ marginBottom: '16px', backgroundColor: '#fff7e6', border: '1px solid #ffe58f' }}
        />
      )}

      {/* 外部URL提示 */}
      {storageMode === 'external' && !showDeleteWarning && (
        <Alert
          message={t('walrusUpload.noticeTitle')}
          description={t('walrusUpload.externalUrlWarning')}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 内容输入区域 */}
      <div className="content-input">
        <Title level={5}>{t('nftDetail.modals.updateContent.newContent')}</Title>
        {storageMode === 'external' ? (
          <Form.Item
            label={t('nftDetail.modals.updateContent.externalUrlLabel')}
            required
            help={t('nftDetail.modals.updateContent.externalUrlHelp')}
          >
            <Input
              placeholder={t('nftDetail.modals.updateContent.placeholder')}
              value={externalUrl}
              onChange={handleExternalUrlChange}
            />
          </Form.Item>
        ) : (
          <WalrusUpload
            onSuccess={handleWalrusSuccess}
            leaseDays={calculateRemainingLeaseDays(nft)}
            hideStorageSelector={true} // 隐藏存储模式选择器，因为已经在上方选择了
            walletBalance={walletBalance}
            walBalance={walBalance}
            insufficientBalance={insufficientBalance}
          />
        )}
      </div>

      {/* 内容预览 */}
      {previewUrl && (
        <div className="new-content-preview">
          <Title level={5}>{t('nftDetail.modals.updateContent.preview')}</Title>
          <div className="content-preview">
            <MediaContent contentUrl={previewUrl} brandName={nft.brandName} />
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="actions">
        <Button onClick={onCancel}>{t('common.buttons.cancel')}</Button>
        <Button
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
          disabled={
            (storageMode === 'external' && !externalUrl) ||
            (storageMode === 'walrus' && !newContentUrl) ||
            (storageMode === 'walrus' && walBalance === '0')
          }
          title={storageMode === 'walrus' && walBalance === '0' ? t('walrusUpload.upload.noWalBalance') : ''}
        >
          {t('common.buttons.update')}
        </Button>
      </div>
    </div>
  );
};

export default UpdateAdContent;
