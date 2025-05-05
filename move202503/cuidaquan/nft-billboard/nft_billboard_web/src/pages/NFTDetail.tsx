import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Typography, Alert, Spin, Button, Descriptions, Space, Tag, Modal, Form, message, Divider, InputNumber } from 'antd';
import {
  EditOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  BlockOutlined,
  UserOutlined,
  GlobalOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { BillboardNFT, RenewNFTParams } from '../types';
import { getNFTDetails, calculateLeasePrice, formatSuiAmount, createRenewLeaseTx } from '../utils/contract';
import { truncateAddress, formatLeasePeriod } from '../utils/format';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useWalletTransaction } from '../hooks/useWalletTransaction';
import { getWalCoinType } from '../config/walrusConfig';
import './NFTDetail.scss';
import { Link } from 'react-router-dom';
import MediaContent from '../components/nft/MediaContent';
import UpdateAdContent from '../components/nft/UpdateAdContent';
import { walrusService } from '../utils/walrus';
import '../styles/NFTDetailFix.css';

const { Title, Paragraph, Text } = Typography;

const NFTDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [nft, setNft] = useState<BillboardNFT | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 获取钱包和交易执行能力
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { executeTransaction } = useWalletTransaction();

  // 模态框状态
  const [updateContentVisible, setUpdateContentVisible] = useState<boolean>(false);
  const [renewLeaseVisible, setRenewLeaseVisible] = useState<boolean>(false);
  const [renewDays, setRenewDays] = useState<number>(30);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [calculatingPrice, setCalculatingPrice] = useState<boolean>(false);
  const [renewPrice, setRenewPrice] = useState<string>('0');
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [insufficientBalance, setInsufficientBalance] = useState<boolean>(false);
  const [walBalance, setWalBalance] = useState<string>('0');
  const [needWalBalance, setNeedWalBalance] = useState<boolean>(false);



  // 检查是否是续期路径
  useEffect(() => {
    if (location.pathname.includes('/renew')) {
      setRenewLeaseVisible(true);
    }
  }, [location.pathname]);

  // 获取NFT详情
  useEffect(() => {
    const fetchNFTDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const nftDetails = await getNFTDetails(id);
        setNft(nftDetails);

        if (!nftDetails) {
          setError('未找到NFT详情');
        }
      } catch (err) {
        console.error('获取NFT详情失败:', err);
        setError('获取NFT详情失败，请稍后再试。');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetails();
  }, [id]);

  // 计算续租价格
  useEffect(() => {
    if (!nft || !renewLeaseVisible) return;

    const fetchPrice = async () => {
      setCalculatingPrice(true);
      try {
        const price = await calculateLeasePrice(nft.adSpaceId, renewDays);
        setRenewPrice(formatSuiAmount(price));

        // 如果有账户，检查余额是否足够
        if (account && suiClient && nft) {
          try {
            // 获取用户余额
            const { totalBalance } = await suiClient.getBalance({
              owner: account.address,
              coinType: '0x2::sui::SUI'
            });

            const priceValue = BigInt(price);
            const balanceValue = BigInt(totalBalance);

            // 保存钱包余额到状态
            const formattedBalance = formatSuiAmount(totalBalance);
            setWalletBalance(formattedBalance);

            // 显示余额信息
            console.log('钱包余额:', formattedBalance, 'SUI');
            console.log('续租价格:', formatSuiAmount(price), 'SUI');

            // 判断余额是否足够
            const isBalanceInsufficient = balanceValue < priceValue;
            setInsufficientBalance(isBalanceInsufficient);

            // 如果余额不足，显示警告
            if (isBalanceInsufficient) {
              // 先使用 t() 函数处理占位符替换，然后将结果传递给 message.warning
              const warningMsg = t('nftDetail.transaction.insufficientBalance', {
                price: formatSuiAmount(price),
                balance: formattedBalance
              });
              message.warning({
                content: warningMsg,
                duration: 5
              });
            }

            // 检查是否需要WAL余额（如果NFT内容类型是walrus）
            const isWalrusStorage = nft.storageSource === 'walrus';
            setNeedWalBalance(isWalrusStorage);

            if (isWalrusStorage) {
              try {
                // 获取WAL代币余额
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

                // 如果WAL余额为0，显示警告
                if (walTotalBalance === '0') {
                  message.warning({
                    content: t('walrusUpload.upload.noWalBalance'),
                    duration: 5
                  });
                }
              } catch (walError) {
                console.error('获取WAL余额失败:', walError);
                setWalBalance('0');
              }
            }
          } catch (balanceError) {
            console.error('检查余额失败:', balanceError);
          }
        }
      } catch (error) {
        console.error('获取续租价格失败:', error);
        // 默认价格计算方式 (仅作为备用)
        setRenewPrice((0.1 * renewDays).toFixed(6));
      } finally {
        setCalculatingPrice(false);
      }
    };

    fetchPrice();
  }, [nft, renewDays, renewLeaseVisible, account, suiClient]);

  // 处理更新广告内容成功
  const handleUpdateContentSuccess = async () => {
    try {
      // 关闭对话框
      setUpdateContentVisible(false);

      // 重新获取NFT详情
      if (id) {
        setLoading(true);
        const updatedNft = await getNFTDetails(id);
        setNft(updatedNft);
        setLoading(false);

        // 显示成功消息
        message.success(t('nftDetail.messages.contentUpdateSuccess'));
      }
    } catch (error) {
      console.error('重新获取NFT详情失败:', error);
      message.info(t('nftDetail.messages.contentUpdatePartialSuccess'));
    }
  };

  // 处理关闭续期对话框
  const closeRenewModal = () => {
    setRenewLeaseVisible(false);

    // 如果当前路径是续期路径，则返回到NFT详情页
    if (location.pathname.includes('/renew')) {
      window.history.pushState({}, '', `/my-nfts/${id}`);
    }
  };

  // 续租NFT
  const handleRenewLease = async () => {
    if (!nft || !account) return;

    // 检查NFT是否已过期
    if (isExpired) {
      message.error(t('nftDetail.transaction.expiredNft'));
      return;
    }

    try {
      setSubmitting(true);

      // 验证续租条件
      if (!renewDays || renewDays <= 0) {
        message.error(t('nftDetail.transaction.invalidDays'));
        return;
      }

      if (!renewPrice || Number(renewPrice) <= 0) {
        message.error(t('nftDetail.transaction.invalidPrice'));
        return;
      }

      // 构建续租参数 - 价格单位直接使用原始单位，由createRenewLeaseTx处理单位转换
      const params: RenewNFTParams = {
        nftId: nft.id,
        adSpaceId: nft.adSpaceId,
        leaseDays: renewDays,
        price: (Number(renewPrice) * 1000000000).toString()
      };

      console.log('续租参数:', JSON.stringify(params, null, 2));

      // 先从链上获取最新的NFT详细信息，确保我们有完整的数据
      message.loading({
        content: t('nftDetail.transaction.fetchingDetails'),
        key: 'fetchNftDetails',
        duration: 0
      });

      try {
        // 从链上获取最新的NFT数据
        const latestNft = await getNFTDetails(nft.id);

        if (!latestNft) {
          throw new Error(t('nftDetail.transaction.fetchFailed'));
        }

        message.success({
          content: t('nftDetail.transaction.fetchSuccess'),
          key: 'fetchNftDetails',
          duration: 1
        });

        console.log('从链上获取的NFT详细信息:', JSON.stringify(latestNft, null, 2));

        // 检查是否需要先延长Walrus存储期限
        const isWalrusStorage = latestNft.storageSource === 'walrus';

        // 如果是Walrus存储，先延长存储期限
        if (isWalrusStorage && latestNft.contentUrl) {
          console.log('检测到Walrus存储，先延长存储期限再执行续租', {
            contentUrl: latestNft.contentUrl,
            blobId: latestNft.blobId,
            storageSource: latestNft.storageSource
          });

          try {
            // 更新本地nft数据为最新的链上数据
            setNft(latestNft);

            // 先延长Walrus存储期限
            const storageExtended = await extendWalrusStorageDuration(latestNft.contentUrl, renewDays);

            // 如果延长存储期限失败，立即中止续租操作
            if (!storageExtended) {
              message.error({
                content: t('nftDetail.transaction.extendWalrusFailed'),
                key: 'extendWalrus',
                duration: 5
              });
              setSubmitting(false);
              return;
            }
          } catch (walrusError) {
            // 捕获延长存储期限过程中的任何错误
            console.error('延长Walrus存储期限时发生错误:', walrusError);
            message.error({
              content: t('nftDetail.transaction.extendWalrusFailed'),
              key: 'extendWalrus',
              duration: 5
            });
            setSubmitting(false);
            return;
          }
        } else {
          console.log('非Walrus存储或无内容URL，跳过延长存储期限', {
            storageSource: latestNft.storageSource,
            contentUrl: latestNft.contentUrl,
            blobId: latestNft.blobId
          });
        }
      } catch (error) {
        console.error('获取NFT详细信息失败:', error);
        message.error({
          content: t('nftDetail.transaction.fetchFailed'),
          key: 'fetchNftDetails',
          duration: 3
        });
      }

      // 显示交易执行中状态
      message.loading({
        content: t('nftDetail.transaction.renewingNft'),
        key: 'renewNft',
        duration: 0
      });

      // 创建交易
      const txb = createRenewLeaseTx(params);

      // 执行交易
      try {
        const { success } = await executeTransaction(txb, {
          loadingMessage: t('nftDetail.transaction.renewingNft'),
          successMessage: t('nftDetail.transaction.renewSubmitted'),
          loadingKey: 'renewNft',
          successKey: 'renewNft',
          userRejectedMessage: t('nftDetail.transaction.renewFailedUserCancelled')
        });

        // 如果交易被用户拒绝或失败，直接返回
        if (!success) {
          return;
        }

        console.log('续租交易已提交');

        // 等待交易确认
        await waitForTransactionConfirmation(nft);
      } catch (txError) {
        console.error('交易执行失败:', txError);
        throw new Error(`交易执行失败: ${txError instanceof Error ? txError.message : '未知错误'}`);
      }
    } catch (err) {
      console.error('续租失败:', err);

      // 解析错误消息
      let errorMsg = t('nftDetail.transaction.renewFailed');

      // 尝试从错误对象中提取更详细的信息
      if (err instanceof Error) {
        if (err.message.includes('余额不足') || err.message.includes('budget')) {
          errorMsg = t('nftDetail.transaction.renewFailedInsufficientBalance');
        } else if (err.message.includes('MoveAbort') && err.message.includes('renew_lease')) {
          if (err.message.includes('6)')) {
            errorMsg = t('nftDetail.transaction.renewFailedInsufficientBalance');
          } else if (err.message.includes('2)')) {
            errorMsg = t('nftDetail.transaction.renewFailedContractError');
          } else {
            errorMsg = `${t('nftDetail.transaction.renewFailedContractError')} (${err.message})`;
          }
        } else {
          // 提取错误消息的关键部分
          errorMsg = `${t('nftDetail.transaction.renewFailed')}: ${err.message.slice(0, 100)}${err.message.length > 100 ? '...' : ''}`;
        }
      }

      message.error({
        content: errorMsg,
        key: 'renewNft',
        duration: 6
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 延长Walrus存储期限的函数
  const extendWalrusStorageDuration = async (contentUrl: string, renewDays: number) => {
    if (!account || !nft) return;

    try {
      message.loading({
        content: t('nftDetail.transaction.extendingWalrus'),
        key: 'extendWalrus',
        duration: 0
      });

      console.log(`尝试延长Walrus存储期限，内容URL: ${contentUrl}, 天数: ${renewDays}`);

      // 创建Signer对象
      const createSigner = () => {
        if (!account?.address) {
          throw new Error('钱包未连接');
        }

        // 从配置获取当前网络
        // 注意：networkConfig和chainId在当前实现中未使用，但保留以便将来可能的扩展
        // const networkConfig = 'testnet';
        // const chainId: `${string}:${string}` = `sui:${networkConfig}`;

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
                  loadingMessage: t('nftDetail.transaction.extendingWalrus'),
                  successMessage: t('nftDetail.transaction.extendWalrusSuccess'),
                  loadingKey: 'extendWalrus',
                  successKey: 'extendWalrus',
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
          },

          // 获取 Sui 地址
          toSuiAddress: () => {
            return account.address;
          },

          // 地址属性
          address: account.address
        };
      };

      // 计算存储时长（秒）
      const duration = renewDays * 24 * 60 * 60;

      // 计算NFT的结束时间（Unix时间戳，秒）
      // 使用当前NFT的到期时间加上续期时间
      const leaseEndTime = new Date(nft.leaseEnd).getTime() / 1000; // 转换为秒
      console.log(`NFT当前结束时间: ${new Date(leaseEndTime * 1000).toLocaleString()}`);

      // 调用Walrus服务延长存储期限，传入contentUrl而不是blobId
      // 使用epochs模式延长存储期限
      await walrusService.extendStorageDuration(
        contentUrl,
        duration,
        createSigner(),
        leaseEndTime
        );

      message.success({
        content: t('nftDetail.transaction.extendWalrusSuccess'),
        key: 'extendWalrus',
        duration: 2
      });

      return true;
    } catch (error) {
      console.error('延长Walrus存储期限失败:', error);

      // 检查是否是SDK不兼容错误
      if (error instanceof Error) {
        if (error.message.includes('toJSON is not a function') ||
            error.message.includes('当前版本的Walrus SDK与应用不兼容') ||
            error.message.includes('当前版本不支持此操作')) {
          console.log('检测到SDK不兼容错误，显示友好错误消息');
        } else if (error.message.includes('Cannot destructure property')) {
          console.log('检测到签名错误，显示友好错误消息');
        }
      }

      // 不再显示错误消息，因为调用方会处理
      console.log('返回false，由调用方处理错误消息');
      return false;
    }
  };

  // 等待交易确认的辅助函数
  const waitForTransactionConfirmation = async (originalNft: BillboardNFT) => {
    message.loading({
      content: t('walrusUpload.transaction.waiting'),
      key: 'confirmRenew',
      duration: 0
    });

    // 使用轮询方式检查交易结果，最多尝试5次
    let attempts = 0;
    const maxAttempts = 5;
    let success = false;

    while (attempts < maxAttempts && !success) {
      attempts++;
      // 增加等待时间
      const delay = 2000 * attempts;
      console.log(`等待续租确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

      // 等待一段时间再检查
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        // 从链上获取最新的NFT数据
        const updatedNft = await getNFTDetails(originalNft.id);

        // 检查是否已续期成功 - 比较租期结束时间
        const oldEndTime = new Date(originalNft.leaseEnd).getTime();
        const newEndTime = updatedNft ? new Date(updatedNft.leaseEnd).getTime() : 0;

        console.log('原租期结束时间:', new Date(originalNft.leaseEnd).toLocaleString());
        console.log('新租期结束时间:', updatedNft ? new Date(updatedNft.leaseEnd).toLocaleString() : '未获取');

        if (updatedNft && newEndTime > oldEndTime) {
          success = true;
          console.log('成功确认NFT续期，租期延长了:', Math.round((newEndTime - oldEndTime) / (24 * 60 * 60 * 1000)), '天');

          // 更新本地数据
          setNft(updatedNft);

          // 显示成功确认消息
          message.success({
            content: t('nftDetail.transaction.renewSuccess'),
            key: 'confirmRenew',
            duration: 2
          });

          // 不再需要在这里延长Walrus存储期限，因为已经在交易前完成了
          console.log('续租交易确认成功，NFT租期已延长');

          // 关闭续租对话框
          closeRenewModal();
        } else {
          console.log('尚未检测到续租结果，将继续重试');
        }
      } catch (err) {
        console.warn(`检查交易结果时出错 (尝试 ${attempts}): `, err);
      }
    }

    // 如果无法确认成功，但交易已提交，仍视为部分成功
    if (!success) {
      message.info({
        content: t('nftDetail.transaction.renewPartialSuccess'),
        key: 'confirmRenew',
        duration: 5
      });

      // 关闭续租对话框
      closeRenewModal();
    }
  };

  // 判断NFT是否已过期
  const isExpired = nft ? new Date(nft.leaseEnd) < new Date() : false;

  // 判断NFT状态：待展示、活跃中或已过期
  const getNftStatus = () => {
    if (!nft) return { status: 'unknown', color: 'default', text: t('common.messages.unknown') };

    const now = new Date();
    const leaseStart = new Date(nft.leaseStart);
    const leaseEnd = new Date(nft.leaseEnd);

    if (now < leaseStart) {
      return { status: 'pending', color: 'blue', text: t('nftDetail.status.pending') };
    } else if (now > leaseEnd || !nft.isActive) {
      return { status: 'expired', color: 'red', text: t('nftDetail.status.expired') };
    } else {
      return { status: 'active', color: 'green', text: t('nftDetail.status.active') };
    }
  };

  // 检查当前用户是否为NFT所有者
  const isOwner = () => {
    if (!nft || !account) return false;
    return nft.owner.toLowerCase() === account.address.toLowerCase();
  };

  const nftStatus = getNftStatus();

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>{t('nftDetail.loading')}</p>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <Alert
        message={t('nftDetail.error')}
        description={error || t('nftDetail.notFound')}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="nft-detail-page">
      <div className="nft-header">
        <Title level={2}>
          <BlockOutlined style={{ marginRight: '10px' }} />
          {nft.brandName}
        </Title>
      </div>

      <div className="nft-content">
        <div className="nft-image">
          <MediaContent
            contentUrl={nft.contentUrl}
            brandName={nft.brandName}
            className="nft-media"
            status={nftStatus}
          />
        </div>

        <div className="nft-details">
          <Card>
            <Descriptions title={t('nftDetail.details')} bordered={false} column={1}>

              <Descriptions.Item
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <BlockOutlined style={{ marginRight: '8px', color: '#4e63ff' }} />
                    <span>{t('nftDetail.fields.adSpaceId')}</span>
                  </div>
                }
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text>{truncateAddress(nft.adSpaceId)}</Text>
                  <Link to={`/ad-spaces/${nft.adSpaceId}`} style={{ marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
                    <LinkOutlined style={{ fontSize: '14px' }} />
                  </Link>
                </div>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: '8px', color: '#4e63ff' }} />
                    <span>{t('nftDetail.fields.owner')}</span>
                  </div>
                }
              >
                <Text>{truncateAddress(nft.owner)}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TagOutlined style={{ marginRight: '8px', color: '#4e63ff' }} />
                    <span>{t('nftDetail.fields.brandName')}</span>
                  </div>
                }
              >
                <Text>{nft.brandName}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <GlobalOutlined style={{ marginRight: '8px', color: '#4e63ff' }} />
                    <span>{t('nftDetail.fields.projectUrl')}</span>
                  </div>
                }
              >
                <a href={nft.projectUrl} target="_blank" rel="noopener noreferrer">
                  {nft.projectUrl}
                </a>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ClockCircleOutlined style={{ marginRight: '8px', color: '#4e63ff' }} />
                    <span>{t('nftDetail.fields.leasePeriod')}</span>
                  </div>
                }
              >
                <Text>
                  {formatLeasePeriod(nft.leaseStart)} ~ {formatLeasePeriod(nft.leaseEnd)}
                </Text>
              </Descriptions.Item>

            </Descriptions>

            <Divider />

            <div className="nft-actions">
              <Space size="middle">
                {isOwner() && (
                  <>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setUpdateContentVisible(true)}
                      disabled={nftStatus.status === 'expired'}
                      size="large"
                    >
                      {t('nftDetail.buttons.updateContent')}
                    </Button>
                    <Button
                      type="default"
                      icon={<ClockCircleOutlined />}
                      onClick={() => {
                        // 检查NFT是否已过期，由于合约限制，暂时只允许未过期的NFT续租
                        if (nftStatus.status === 'expired') {
                          message.warning({
                            content: t('nftDetail.transaction.expiredNftWarning'),
                            duration: 5
                          });
                          return;
                        }
                        setRenewLeaseVisible(true);
                      }}
                      danger={nftStatus.status === 'expired'}
                      size="large"
                    >
                      {nftStatus.status === 'expired' ? t('nftDetail.status.expired') : t('nftDetail.buttons.renewLease')}
                    </Button>
                  </>
                )}
              </Space>
              {!isOwner() && (
                <Alert
                  message={t('nftDetail.buttons.updateContent') + ' / ' + t('nftDetail.buttons.renewLease')}
                  description={t('nftDetail.notOwner')}
                  type="info"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 更新广告内容模态框 */}
      <Modal
        title={t('nftDetail.modals.updateContent.title')}
        open={updateContentVisible}
        onCancel={() => setUpdateContentVisible(false)}
        footer={null}
        width={800}
      >
        {nft && (
          <UpdateAdContent
            nft={nft}
            onSuccess={handleUpdateContentSuccess}
            onCancel={() => setUpdateContentVisible(false)}
          />
        )}
      </Modal>

      {/* 续租NFT模态框 */}
      <Modal
        title={t('nftDetail.modals.renewLease.title')}
        open={renewLeaseVisible}
        onCancel={closeRenewModal}
        footer={[
          <Button key="cancel" onClick={closeRenewModal}>
            {t('common.buttons.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting || calculatingPrice}
            disabled={calculatingPrice || insufficientBalance || (needWalBalance && walBalance === '0')}
            onClick={handleRenewLease}
            title={
              insufficientBalance
                ? t('nftDetail.transaction.insufficientBalance', { price: renewPrice, balance: walletBalance })
                : (needWalBalance && walBalance === '0')
                  ? t('walrusUpload.upload.noWalBalance')
                  : ''
            }
          >
            {t('nftDetail.buttons.renewLease')}
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item
            label={t('nftDetail.modals.renewLease.daysLabel')}
            required
            extra={t('nftDetail.modals.renewLease.daysExtra')}
          >
            <InputNumber
              placeholder={t('nftDetail.modals.renewLease.daysPlaceholder')}
              min={1}
              max={365}
              precision={0}
              value={renewDays}
              onChange={(value) => value && setRenewDays(Number(value))}
              style={{ width: '100%' }}
              addonAfter={t('common.time.days')}
            />
          </Form.Item>

          <div className="price-summary" style={{ marginBottom: '20px' }}>
            {calculatingPrice ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Spin size="small" style={{ marginRight: '10px' }} />
                <Text>{t('nftDetail.modals.renewLease.calculatingPrice')}</Text>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>{t('nftDetail.modals.renewLease.priceLabel')}</Text>
                  <Text>{renewPrice} SUI</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('nftDetail.modals.renewLease.walletBalance')}</Text>
                  <Text type={insufficientBalance ? 'danger' : 'secondary'} strong={insufficientBalance}>
                    {walletBalance} SUI {insufficientBalance && <span style={{ color: '#ff4d4f' }}>{t('nftDetail.modals.renewLease.insufficientBalanceHint')}</span>}
                  </Text>
                </div>

                {/* 如果需要WAL余额，显示WAL余额 */}
                {needWalBalance && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <Text type="secondary">{t('nftDetail.modals.renewLease.walBalance')}</Text>
                    <Text type={walBalance === '0' ? 'danger' : 'secondary'} strong={walBalance === '0'}>
                      {walBalance} WAL {walBalance === '0' && <span style={{ color: '#ff4d4f' }}>{t('nftDetail.modals.renewLease.insufficientBalanceHint')}</span>}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>

          <Paragraph type="secondary">
            {t('nftDetail.modals.renewLease.description')}
          </Paragraph>
        </Form>
      </Modal>
    </div>
  );
};

export default NFTDetailPage;