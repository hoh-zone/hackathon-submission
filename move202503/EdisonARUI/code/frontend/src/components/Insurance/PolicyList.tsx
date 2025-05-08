import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip, 
  CircularProgress, 
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { INSURANCE_CONTRACT } from '../../config/contracts';
import { Transaction } from '@mysten/sui/transactions';
import { COMMON_CONTRACT } from '../../config/contracts';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogManager from '../../utils/LogManager';

// 样式化组件
const PolicyCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '12px',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[3],
  },
}));

// 定义保单类型
interface Policy {
  id: string;
  insuredAmount: number;
  premium: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'claimed' | 'redeemed';
  coveragePercentage: number;
  nftId?: string;
}

// 格式化日期函数
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 保单状态标签颜色映射
const statusColorMap = {
  active: 'success',
  claimed: 'primary',
  redeemed: 'default'
};

const PolicyList: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openClaimDialog, setOpenClaimDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimReason, setClaimReason] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  
  // Sui DApp Kit hooks
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // 从区块链加载保单数据
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentAccount) {
        setPolicies([]);
        setLoading(false);
        return;
      }

      LogManager.addLog('开始获取保单，当前账户:', currentAccount.address);
      LogManager.addLog('保险合约地址:', INSURANCE_CONTRACT.PACKAGE_ID);

      // 1. 分页获取用户拥有的所有对象，直到全部获取完毕
      let allObjects: any[] = [];
      let cursor: string | null = null;
      let hasNextPage = true;
      const pageLimit = 50; // 可根据Sui后端最大支持调整

      while (hasNextPage) {
        const resp = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showContent: true,
            showType: true,
          },
          cursor: cursor,
          limit: pageLimit,
        });
        allObjects = allObjects.concat(resp.data);
        cursor = resp.nextCursor ?? null;
        hasNextPage = resp.hasNextPage;
      }

      // LogManager.addLog('用户拥有的所有对象（分页后）:', allObjects);
      
      // 检查对象类型
      allObjects.forEach((obj, index) => {
        if (obj.data?.type === `${INSURANCE_CONTRACT.PACKAGE_ID}::insurance_nft::InsuranceNFT`) {
          LogManager.addLog(`找到的保险NFT:`, obj.data?.objectId);
        }
      });

      // 过滤出保险NFT
      const insuranceNFTs = allObjects.filter(obj => 
        obj.data?.type.includes(`${INSURANCE_CONTRACT.PACKAGE_ID}::insurance_nft::InsuranceNFT`)
      );

      LogManager.addLog('找到的保险NFT数量:', insuranceNFTs.length);
      LogManager.addLog('保险NFT详情:', insuranceNFTs);

      if (insuranceNFTs.length === 0) {
        LogManager.addLog('未找到保险NFT');
        setPolicies([]);
        setLoading(false);
        return;
      }

      // 2. 获取PolicyManager对象
      const policyManagerObject = await suiClient.getObject({
        id: INSURANCE_CONTRACT.POLICY_MANAGER_ID,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      if (!policyManagerObject.data) {
        throw new Error('无法获取PolicyManager对象');
      }

      LogManager.addLog('PolicyManager对象:', policyManagerObject);
      
      // 提取policies表的ID
      const policiesTableId = policyManagerObject.data.content as any;
      const policiesId = policiesTableId?.fields?.policies?.fields?.id?.id;
      
      if (!policiesId) {
        throw new Error('无法获取policies表ID');
      }
      
      LogManager.addLog('Policies表ID:', policiesId);

      // 3. 调用查询动态字段的RPC以获取保单信息
      const userPolicies: Policy[] = [];

      for (const nft of insuranceNFTs) {
        if (!nft.data?.objectId) continue;

        try {
          LogManager.addLog('查询NFT关联保单:', nft.data.objectId);
          
          // 从NFT对象中获取policy_id
          const policyId = nft.data?.content?.fields?.policy_id;
          
          if (!policyId) {
            LogManager.addLog('NFT中未找到policy_id字段:', nft.data.objectId);
            continue;
          }
          
          LogManager.addLog('从NFT中获取到保单ID:', policyId);
          
          // 使用动态字段API查询保单 - 使用正确的表ID作为parentId
          const policyFieldObject = await suiClient.getDynamicFieldObject({
            parentId: policiesId, // 使用policies表ID，而不是PolicyManager对象ID
            name: {
              type: "0x2::object::ID", // 键类型
              value: policyId // 保单ID
            }
          });
          
          LogManager.addLog('动态字段查询结果:', policyFieldObject);
          
          if (policyFieldObject.data) {
            // 使用类型断言获取动态字段内容
            const dynamicField = policyFieldObject.data.content as unknown as {
              type: string;
              dataType: string;
              fields: {
                name: { type: string; value: string };
                value: {
                  id: string;
                  amount: string;
                  duration: string;
                  start_time: string;
                  premium: string;
                  owner: string;
                  status: string;
                }
              }
            };
            
            // 详细记录动态字段结构，帮助调试
            LogManager.addLog('动态字段详细内容:', JSON.stringify(dynamicField));
            
            if (dynamicField?.fields?.value) {
              const policyData = dynamicField.fields.value as unknown as {
                type: string;
                fields?: {
                  id: string;
                  amount: string;
                  duration: string;
                  start_time: string;
                  premium: string;
                  owner: string;
                  status: number | string;
                }
              };
              
              LogManager.addLog('保单动态字段数据:', policyData);
              
              // 检查并记录ID值 - 正确访问字段路径
              const policyFields = policyData.fields;
              LogManager.addLog('保单字段:', policyFields);
              
              if (!policyFields) {
                LogManager.addLog('保单字段数据为空');
                continue;
              }
              
              // 现在正确访问各个字段
              const policyIdStr = policyFields.id || nft.data?.content?.fields?.policy_id || 'Unknown ID';
              
              // 将区块链时间戳（秒）转换为JavaScript日期
              const startTimeMs = parseInt(policyFields.start_time) * 1000;
              const startDate = new Date(startTimeMs);
              const durationDays = parseInt(policyFields.duration);
              const endDate = new Date(startTimeMs + durationDays * 24 * 60 * 60 * 1000);
              
              // 确定保单状态
              let status: 'active' | 'claimed' | 'redeemed';
              switch (parseInt(String(policyFields.status))) {
                case 0: status = 'active'; break;
                case 1: status = 'claimed'; break;
                case 2: status = 'redeemed'; break;
                default: status = 'active';
              }
              
              // 确保属性名与Policy接口匹配
              userPolicies.push({
                id: policyIdStr, // 使用已经处理过的ID
                insuredAmount: parseInt(policyFields.amount) / 1000000, // 字段名需匹配接口
                premium: parseInt(policyFields.premium) / 1000000,
                startDate,
                endDate,
                status,
                coveragePercentage: 0.8,
                nftId: nft.data.objectId // 保留NFT ID用于后续claim和redeem操作
              });
              
              LogManager.addLog('成功解析保单:', {
                id: policyIdStr,
                amount: policyFields.amount,
                premium: policyFields.premium,
                startTime: policyFields.start_time
              });
            } else {
              LogManager.addLog('动态字段不包含保单值数据');
            }
          } else {
            LogManager.addLog('未找到NFT对应的保单动态字段:', policyId);
          }
        } catch (err) {
          LogManager.addLog(`获取动态字段失败:`, err);
        }
      }

      LogManager.addLog('最终获取到的保单:', userPolicies);
      setPolicies(userPolicies);
      setLoading(false);
    } catch (err: any) {
      LogManager.addLog('获取保单失败:', err);
      setError('获取保单失败: ' + (err.message || '未知错误'));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [currentAccount, suiClient]);

  // 处理申请理赔
  const handleOpenClaimDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setOpenClaimDialog(true);
  };

  const handleCloseClaimDialog = () => {
    setOpenClaimDialog(false);
    setSelectedPolicy(null);
    setClaimAmount('');
    setClaimReason('');
  };

  const handleSubmitClaim = async () => {
    if (!selectedPolicy || !currentAccount || !selectedPolicy.nftId) return;
    
    try {
      setClaimLoading(true);
      
      // 将理赔金额转换为合约所需的微单位
      const claimAmountMicro = Math.floor(parseFloat(claimAmount) * 1000000);

      // 创建理赔交易
      const tx = new Transaction();
      
      // 将理赔原因转换为字节数组作为proof
      const proofBytes = Array.from(new TextEncoder().encode(claimReason));
      
      tx.moveCall({
        target: `${INSURANCE_CONTRACT.PACKAGE_ID}::insurance::claim`,
        arguments: [
          tx.object(INSURANCE_CONTRACT.POLICY_MANAGER_ID),
          tx.object(INSURANCE_CONTRACT.FINANCE_POOL_ID),
          tx.object(INSURANCE_CONTRACT.INSURANCE_CAP_ID),
          tx.pure.id(selectedPolicy.id),
          tx.pure.vector('u8', proofBytes),
          tx.object(COMMON_CONTRACT.CLOCK)
        ]
      });

      console.log('理赔交易:', tx);

      // 执行交易
      await signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (result) => {
          console.log('理赔交易成功:', result);
          
          // 更新本地保单状态
          setPolicies(prev => 
            prev.map(p => 
              p.id === selectedPolicy.id 
                ? { ...p, status: 'claimed' as const } 
                : p
            )
          );
          
          handleCloseClaimDialog();
        },
        onError: (error) => {
          console.error('理赔交易失败:', error);
          setError('理赔申请失败: ' + (error.message || '未知错误'));
        }
      });
      
      setClaimLoading(false);
    } catch (err: any) {
      console.error('理赔申请失败:', err);
      setError('理赔申请失败: ' + (err.message || '未知错误'));
      setClaimLoading(false);
    }
  };

  // 处理赎回保单
  const handleRedeem = async (policy: Policy) => {
    if (!currentAccount || !policy.nftId) return;
    
    try {
      setLoading(true);
      
      // 创建赎回交易
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${INSURANCE_CONTRACT.PACKAGE_ID}::insurance::redeem`,
        arguments: [
          tx.object(INSURANCE_CONTRACT.POLICY_MANAGER_ID),
          tx.object(INSURANCE_CONTRACT.FINANCE_POOL_ID),
          tx.object(INSURANCE_CONTRACT.INSURANCE_CAP_ID),
          tx.pure.id(policy.nftId),
          tx.object(COMMON_CONTRACT.CLOCK)
        ]
      });

      console.log('赎回交易:', tx);

      // 执行交易
      await signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (result) => {
          console.log('赎回交易成功:', result);
          
          // 更新本地保单状态，从列表中移除
          setPolicies(prev => prev.filter(p => p.id !== policy.id));
        },
        onError: (error) => {
          console.error('赎回交易失败:', error);
          setError('保单赎回失败: ' + (error.message || '未知错误'));
        }
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error('保单赎回失败:', err);
      setError('保单赎回失败: ' + (err.message || '未知错误'));
      setLoading(false);
    }
  };

  // 计算保单剩余天数
  const getRemainingDays = (endDate: Date): number => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!currentAccount) {
    return (
      <Box>
        <Typography variant="body1" textAlign="center" my={4}>
          Please connect your wallet to view your policies
        </Typography>
      </Box>
    );
  }

  if (policies.length === 0) {
    return (
      <Box>
        <Typography variant="body1" textAlign="center" my={4}>
          You have not purchased any insurance policies yet
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <IconButton 
            onClick={fetchPolicies} 
            disabled={loading}
            color="primary"
            title="Refresh Policy List"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <IconButton 
          onClick={fetchPolicies} 
          disabled={loading}
          color="primary"
          title="Refresh Policy List"
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          我的保单 ({policies.length})
        </Typography>
      </Box> */}
      
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!loading && !error && currentAccount && policies.length === 0 && (
        <Box>
          <Typography variant="body1" textAlign="center" my={4}>
            You have not purchased any insurance policies yet
          </Typography>
        </Box>
      )}
      
      {!loading && !currentAccount && (
        <Box>
          <Typography variant="body1" textAlign="center" my={4}>
            Please connect your wallet to view your policies
          </Typography>
        </Box>
      )}
      
      {policies.map(policy => (
        <PolicyCard key={policy.id || 'unknown'}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                {/* <Typography variant="h6">
                  BTC算力波动保险
                </Typography> */}
                <Chip 
                  label={policy.status === 'active' ? 'Active' : policy.status === 'claimed' ? 'Claimed' : 'Redeemed'} 
                  color={statusColorMap[policy.status] as any}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Policy ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {policy.id ? `${policy.id.substring(0, 10)}...` : 'Unknown ID'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Coverage Amount
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {policy.insuredAmount} sBTC
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Coverage Period
                </Typography>
                <Typography variant="body2">
                  {formatDate(policy.startDate)} to {formatDate(policy.endDate)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Premium
                </Typography>
                <Typography variant="body2">
                  {policy.premium} sBTC
                </Typography>
              </Grid>
              
              {policy.status === 'active' && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Days Remaining
                  </Typography>
                  <Typography variant="body2" color={getRemainingDays(policy.endDate) < 7 ? 'error.main' : 'inherit'}>
                    {getRemainingDays(policy.endDate)} days
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Coverage Scope
                </Typography>
                <Typography variant="body2">
                  {policy.coveragePercentage * 100}% Price Volatility Loss
                </Typography>
              </Grid>
              
              {policy.status === 'active' && (
                <Grid item xs={12} mt={1} display="flex" justifyContent="flex-end" gap={1}>
                  <Button 
                    variant="contained" 
                    size="small"
                    color="primary"
                    onClick={() => handleOpenClaimDialog(policy)}
                  >
                    File a Claim
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </PolicyCard>
      ))}
      
      {/* 理赔申请对话框 */}
      <Dialog open={openClaimDialog} onClose={handleCloseClaimDialog} maxWidth="sm" fullWidth>
        <DialogTitle>File Insurance Claim</DialogTitle>
        <DialogContent>
          {selectedPolicy && (
            <>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Policy Info:
                </Typography>
                <Typography variant="body2">
                  Insurance Type: BTC Hashrate Volatility
                </Typography>
                <Typography variant="body2">
                  Coverage Amount: {selectedPolicy.insuredAmount} sBTC
                </Typography>
              </Box>
              
              <TextField
                label="Claim Reason"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                margin="normal"
                placeholder="Please describe the reason and situation in detail..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClaimDialog} disabled={claimLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitClaim} 
            variant="contained" 
            color="primary"
            disabled={claimLoading || !claimReason}
          >
            {claimLoading ? <CircularProgress size={24} /> : 'Submit Claim'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PolicyList; 