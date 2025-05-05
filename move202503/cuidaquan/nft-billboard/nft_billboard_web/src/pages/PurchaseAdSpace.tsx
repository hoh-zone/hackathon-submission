 import React, { useState, useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { Typography, Spin, Alert, message, Button } from 'antd';
 import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
 import { useTranslation } from 'react-i18next';
 import { AdSpace, PurchaseAdSpaceParams, UserRole } from '../types';
 import AdSpaceForm from '../components/adSpace/AdSpaceForm';
 import { getAdSpaceDetails, createPurchaseAdSpaceTx, getUserNFTs, getNFTDetails } from '../utils/contract';
 import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
 import './PurchaseAdSpace.scss';
 import { useWalletTransaction } from '../hooks/useWalletTransaction';

 const { Title, Paragraph } = Typography;

 const PurchaseAdSpacePage: React.FC = () => {
   const { t } = useTranslation();
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const account = useCurrentAccount();
   const suiClient = useSuiClient();
   const { executeTransaction } = useWalletTransaction();

   const [adSpace, setAdSpace] = useState<AdSpace | null>(null);
   const [loading, setLoading] = useState<boolean>(true);
   const [submitting, setSubmitting] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);
   const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
   const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

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

   // 获取广告位详情
   const fetchAdSpace = async () => {
     if (!id) return;

     try {
       setLoading(true);
       setError(null);

       console.log('正在获取广告位详情, ID:', id);
       const space = await getAdSpaceDetails(id);
       console.log('获取广告位结果:', space);

       setAdSpace(space);

       if (!space) {
         setError(t('adSpaces.errors.notFound'));
         return;
       }

       if (!space.available) {
         setError(t('adSpaces.errors.alreadyPurchased'));
         return;
       }

       // 检查用户是否有权限购买
       if (userRole === UserRole.ADMIN) {
         setError(t('adSpaces.alerts.adminCantBuyDesc'));
         setIsAuthorized(false);
         return;
       }

       // 获取creator信息并转换为小写
       const creator = (space as any).creator || null;
       const creatorAddress = creator ? creator.toLowerCase() : null;
       const userAddress = account ? account.address.toLowerCase() : null;

       console.log('广告位创建者信息:', {
         adSpaceId: space.id,
         creator: creatorAddress,
         userAddress: userAddress,
         isMatch: creatorAddress === userAddress,
         userRole
       });

       // 如果是游戏开发者，检查是否是自己创建的广告位
       if (userRole === UserRole.GAME_DEV &&
           creatorAddress &&
           userAddress &&
           creatorAddress === userAddress) {
         console.log('当前用户是开发者且是广告位创建者，不允许购买');
         setError(t('adSpaces.alerts.devOwnedDesc'));
         setIsAuthorized(false);
         return;
       }

       // 检查用户是否已经拥有该广告位的NFT
       if (userAddress && space.nft_ids && space.nft_ids.length > 0) {
         console.log('检查用户是否已拥有此广告位的NFT');

         let hasActiveOrPendingNFT = false;
         const now = new Date();

         // 获取该广告位下所有NFT的详情
         for (const nftId of space.nft_ids) {
           const nftDetails = await getNFTDetails(nftId);

           if (nftDetails && nftDetails.owner.toLowerCase() === userAddress) {
             const leaseStart = new Date(nftDetails.leaseStart);
             const leaseEnd = new Date(nftDetails.leaseEnd);

             // 检查NFT是否是活跃的或待展示的
             if ((now >= leaseStart && now <= leaseEnd) || // 活跃中
                 (now < leaseStart)) { // 待展示
               console.log(`用户已拥有广告位[${space.id}]的NFT[${nftId}]，不允许再次购买`);
               hasActiveOrPendingNFT = true;
               break;
             }
           }
         }

         if (hasActiveOrPendingNFT) {
           setError(t('adSpaces.alerts.alreadyOwnedDesc'));
           setIsAuthorized(false);
           return;
         }
       }
     } catch (err) {
       console.error('获取广告位详情失败:', err);
       setError(t('adSpaces.errors.loadFailed'));
     } finally {
       setLoading(false);
     }
   };

   // 当用户角色或广告位ID变化时重新获取数据
   useEffect(() => {
     fetchAdSpace();
   }, [id, userRole, account]);

   const handleRefresh = () => {
     fetchAdSpace();
   };

   const handleBack = () => {
     navigate('/ad-spaces');
   };

   // 处理表单提交
   const handleSubmit = async (values: PurchaseAdSpaceParams) => {
     if (!account || !adSpace) return;

     try {
       setSubmitting(true);
       setError(null);

       // 创建交易
       const txb = createPurchaseAdSpaceTx(values);

       // 执行交易
       const { success } = await executeTransaction(txb, {
         loadingMessage: t('purchase.transaction.purchasing'),
         successMessage: t('purchase.transaction.submitted'),
         loadingKey: 'purchaseAdSpace',
         successKey: 'purchaseAdSpace',
         userRejectedMessage: t('common.messages.userRejected')
       });

       // 如果交易被用户拒绝或失败，直接返回
       if (!success) {
         return;
       }

       // 交易已提交，显示等待确认消息
       message.loading({ content: t('purchase.transaction.waitingConfirmation'), key: 'confirmPurchase', duration: 0 });

       // 使用轮询方式检查交易结果，最多尝试5次
       let attempts = 0;
       const maxAttempts = 5;
       let confirmSuccess = false;

       while (attempts < maxAttempts && !confirmSuccess) {
         attempts++;
         // 增加等待时间
         const delay = 2000 * attempts;
         console.log(`等待购买确认，尝试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);

         // 等待一段时间再检查
         await new Promise(resolve => setTimeout(resolve, delay));

         try {
           // 从链上获取最新的NFT数据
           const userNfts = await getUserNFTs(account.address);

           // 检查是否已包含新购买的NFT
           const foundNewNFT = userNfts.some(nft =>
             nft.adSpaceId === adSpace.id && nft.isActive);

           if (foundNewNFT) {
             confirmSuccess = true;
             console.log('成功确认广告位购买');

             // 显示成功确认消息
             message.success({
               content: t('purchase.transaction.success'),
               key: 'confirmPurchase',
               duration: 2
             });
           } else {
             console.log('尚未检测到新购买的NFT，将继续重试');
           }
         } catch (err) {
           console.warn(`检查交易结果时出错 (尝试 ${attempts}): `, err);
         }
       }

       // 无论是否成功确认，都导航到我的NFT页面
       navigate('/my-nfts');
     } catch (err) {
       console.error('购买广告位失败:', err);
       setError(t('purchase.transaction.error'));
       message.error({ content: t('purchase.transaction.failed'), key: 'purchaseAdSpace', duration: 2 });
     } finally {
       setSubmitting(false);
     }
   };

   // 检查用户是否已连接钱包
   if (!account) {
     return (
       <div className="purchase-page">
         <div className="section-title">
           <Title level={2}>{t('purchase.title')}</Title>
           <Paragraph>{t('purchase.connectWallet')}</Paragraph>
         </div>

         <Alert
           message={t('myNFTs.connectWallet.title')}
           description={t('myNFTs.connectWallet.description')}
           type="info"
           showIcon
         />

         <div className="error-actions">
           <Button
             icon={<ArrowLeftOutlined />}
             onClick={handleBack}
           >
             {t('adSpaces.buttons.backToList')}
           </Button>
         </div>
       </div>
     );
   }

   return (
     <div className="purchase-page">
       <div className="section-title">
         <Title level={2}>{t('purchase.title')}</Title>
         <Paragraph>{t('purchase.form.fillAdInfo')}</Paragraph>
       </div>

       {/* 添加装饰元素 */}
       <div className="decoration-element top-right"></div>
       <div className="decoration-element bottom-left"></div>

       {loading ? (
         <div className="loading-container">
           <Spin size="large" />
           <p>{t('adSpaces.loading')}</p>
         </div>
       ) : error ? (
         <div className="error-container">
           <Alert
             message={t('adSpaces.errors.loadingFailed')}
             description={
               error.includes('You already own an active or pending NFT') ? t('adSpaces.alerts.alreadyOwnedDesc') :
               error.includes('Developers cannot purchase ad spaces they created') ? t('adSpaces.alerts.devOwnedDesc') :
               error.includes('Administrators cannot purchase ad spaces') ? t('adSpaces.alerts.adminCantBuyDesc') :
               error.includes('This ad space has already been purchased') ? t('adSpaces.errors.alreadyPurchased') :
               error.includes('Ad space not found or unavailable') ? t('adSpaces.errors.notFound') :
               error
             }
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
               {t('adSpaces.buttons.backToList')}
             </Button>
           </div>
         </div>
       ) : adSpace ? (
         <div className="fade-in">
           <AdSpaceForm
             adSpace={adSpace}
             onSubmit={handleSubmit}
             isLoading={submitting}
           />
         </div>
       ) : (
         <div className="error-container">
           <Alert
             message={t('adSpaces.errors.notFoundTitle')}
             description={t('adSpaces.errors.notFoundDesc')}
             type="error"
             showIcon
           />
           <div className="error-actions">
             <Button
               icon={<ArrowLeftOutlined />}
               onClick={handleBack}
             >
               {t('adSpaces.buttons.backToList')}
             </Button>
           </div>
         </div>
       )}
     </div>
   );
 };

 export default PurchaseAdSpacePage;