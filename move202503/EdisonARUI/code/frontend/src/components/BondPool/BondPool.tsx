import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Select,
  MenuItem,
  Button,
  styled,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TimePeriod,
  LockPeriod,
  generatePriceData,
  calculateAPY,
  calculateExpectedReturn,
  calculateTotalAtMaturity,
} from '../../utils/bondPoolHelpers';
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { TOKENS } from '../../config/tokens';
import { BOND_CONTRACT } from '../../config/contracts';
import { FUND_CONTRACT } from '../../config/contracts';
import { COMMON_CONTRACT } from '../../config/contracts';
import { useTokenBalance } from '../../hooks/useTokenBalance';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
}));

const TimeButton = styled(ToggleButton)(({ theme }) => ({
  padding: '4px 16px',
  borderRadius: theme.spacing(1),
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const BondPool: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1d');
  const [amount, setAmount] = useState('1000');
  const [lockPeriod, setLockPeriod] = useState<LockPeriod>('3');
  const [priceData, setPriceData] = useState(generatePriceData('1d'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bonds, setBonds] = useState<any[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [baseApy, setBaseApy] = useState<number>(0);

  // Sui DApp Kit hooks
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Get token balance
  const token = TOKENS.find(t => t.symbol === 'TEST_BTC')!;
  const tokenBalance = useTokenBalance(token);

  // 获取 base_apy
  const fetchBaseApy = async () => {
    try {
      const bondPoolObject = await suiClient.getObject({
        id: BOND_CONTRACT.BOND_POOL_ID,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (bondPoolObject.data?.content) {
        const fields = (bondPoolObject.data.content as any).fields;
        const apy = parseInt(fields.base_apy) / 100; // 转换为百分比
        setBaseApy(apy);
      }
    } catch (err) {
      console.error('获取 base_apy 失败:', err);
    }
  };

  useEffect(() => {
    fetchBaseApy();
  }, [suiClient]);

  // 更新价格数据
  useEffect(() => {
    setPriceData(generatePriceData(timePeriod));
  }, [timePeriod]);

  const handleTimePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: TimePeriod | null) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const apy = baseApy; // 使用从合约获取的 base_apy
  const expectedReturn = calculateExpectedReturn(parsedAmount, lockPeriod);
  const totalAtMaturity = calculateTotalAtMaturity(parsedAmount, lockPeriod);

  // 只保留购买债券逻辑
  const handleDeposit = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const amountValue = Math.floor(parseFloat(amount) * Math.pow(10, token.decimals || 6));
      // Get user's token in wallet
      const coinObjects = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: token.coinType || '',
      });
      if (!coinObjects || coinObjects.data.length === 0 || 
          BigInt(coinObjects.data[0].balance) < BigInt(amountValue)) {
        setError(`Not enough ${token.symbol} tokens`);
        setLoading(false);
        return;
      }
      const coinObjectId = coinObjects.data[0].coinObjectId;
      const tx = new Transaction();
      // 购买债券
      const paymentCoin = tx.splitCoins(tx.object(coinObjectId), [BigInt(amountValue)]);
      // 将lockPeriod（月）转换为秒
      const lockPeriodMonths = parseInt(lockPeriod);
      const maturitySeconds = lockPeriodMonths * 30 * 24 * 60 * 60; // 近似每月30天
      tx.moveCall({
        target: `${BOND_CONTRACT.PACKAGE_ID}::bond_pkg::buy_bond`,
        arguments: [
          tx.object(BOND_CONTRACT.BOND_POOL_ID),
          tx.object(FUND_CONTRACT.FINANCE_POOL_ID),
          tx.object(FUND_CONTRACT.BOND_CAP_ID),
          paymentCoin,
          tx.pure.u64(BigInt(maturitySeconds)),
          tx.object(COMMON_CONTRACT.CLOCK),
        ]
      });
      // 执行交易
      await signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (result) => {
          setSuccess('Bond purchased successfully!');
          setLoading(false);
        },
        onError: (error) => {
          setError(error.message || 'Transaction failed');
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setLoading(false);
    }
  };

  // 单独处理每行的withdraw
  const handleWithdraw = async (bond: any) => {
    if (!currentAccount) return;
    setWithdrawingId(bond.objectId);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${BOND_CONTRACT.PACKAGE_ID}::bond_pkg::redeem_bond`,
        arguments: [
          tx.object(BOND_CONTRACT.BOND_POOL_ID),
          tx.object(FUND_CONTRACT.FINANCE_POOL_ID),
          tx.object(FUND_CONTRACT.BOND_CAP_ID),
          tx.object(bond.objectId),
          tx.object(COMMON_CONTRACT.CLOCK),
        ]
      });
      await signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (result) => {
          setSuccess('Bond redeemed successfully!');
          setWithdrawingId(null);
        },
        onError: (error) => {
          setError(error.message || 'Redemption failed');
          setWithdrawingId(null);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Redemption failed');
      setWithdrawingId(null);
    }
  };

  // 获取用户历史BondNote
  const fetchUserBonds = async () => {
    if (!currentAccount) {
      setBonds([]);
      return;
    }
    let allObjects: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    const pageLimit = 50;
    while (hasNextPage) {
      const resp = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: { showContent: true, showType: true },
        cursor,
        limit: pageLimit,
      });
      allObjects = allObjects.concat(resp.data);
      cursor = resp.nextCursor ?? null;
      hasNextPage = resp.hasNextPage;
    }
    const bondNoteType = `${BOND_CONTRACT.PACKAGE_ID}::bond_pkg::BondNote`;
    const now = Math.floor(Date.now() / 1000);
    const bonds = allObjects
      .filter(obj => obj.data?.type?.includes(bondNoteType))
      .map(obj => {
        const fields = obj.data?.content?.fields;
        if (!fields) return null;
        const faceValue = parseInt(fields.face_value) / 1000000;
        const purchaseTime = parseInt(fields.purchase_time);
        const maturity = parseInt(fields.maturity);
        const endTime = purchaseTime + maturity;
        const status = now > endTime ? '可赎回' : '锁定中';
        return {
          objectId: obj.data.objectId,
          faceValue,
          purchaseTime,
          maturity,
          endTime,
          status,
        };
      })
      .filter(Boolean);
    setBonds(bonds);
  };

  useEffect(() => {
    fetchUserBonds();
  }, [currentAccount, suiClient, success]);

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        {/* <Typography variant="h5">Pricing</Typography> */}
        <ToggleButtonGroup
          value={timePeriod}
          exclusive
          onChange={handleTimePeriodChange}
          size="small"
        >
          <TimeButton value="1d">1d</TimeButton>
          <TimeButton value="1w">1w</TimeButton>
          <TimeButton value="1m">1m</TimeButton>
          <TimeButton value="6m">6m</TimeButton>
        </ToggleButtonGroup>
      </Box>

      <StyledCard>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Price Chart */}
          <Box sx={{ flex: 1, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                  domain={[935, 1110]}
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#1E88E5"
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          {/* Operation Panel */}
          <Box sx={{ width: 320 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Amount (TEST_BTC)
              </Typography>
              <TextField
                fullWidth
                value={amount}
                onChange={handleAmountChange}
                variant="outlined"
                size="small"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*',
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Lock Period
              </Typography>
              <Select
                fullWidth
                value={lockPeriod}
                onChange={(e) => setLockPeriod(e.target.value as LockPeriod)}
                size="small"
              >
                <MenuItem value="1">1 Month</MenuItem>
                <MenuItem value="3">3 Months</MenuItem>
                <MenuItem value="6">6 Months</MenuItem>
                <MenuItem value="12">12 Months</MenuItem>
              </Select>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Expected Return
                </Typography>
                <Typography variant="body1">
                  ${expectedReturn.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  APY
                </Typography>
                <Typography variant="body1">
                  {apy.toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Total at Maturity
                </Typography>
                <Typography variant="body1">
                  ${totalAtMaturity.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleDeposit}
              disabled={loading}
              sx={{
                backgroundColor: '#1E88E5',
                '&:hover': {
                  backgroundColor: '#1976D2',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Deposit'}
            </Button>
          </Box>
        </Box>
      </StyledCard>

      {/* 历史债券列表 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Bond Purchase History</Typography>
        {bonds.length === 0 ? (
          <Typography color="text.secondary">No bond history</Typography>
        ) : (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Amount (TEST_BTC)</Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Purchase Time</Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Maturity Time</Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1 }}>Status</Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1 }}></Box>
              </Box>
            </Box>
            <Box component="tbody">
              {bonds.map(bond => (
                <Box component="tr" key={bond.objectId}>
                  <Box component="td" sx={{ p: 1 }}>{bond.faceValue}</Box>
                  <Box component="td" sx={{ p: 1 }}>{new Date(bond.purchaseTime * 1000).toLocaleString()}</Box>
                  <Box component="td" sx={{ p: 1 }}>{new Date(bond.endTime * 1000).toLocaleString()}</Box>
                  <Box component="td" sx={{ p: 1 }}>{bond.status === '可赎回' ? 'Redeemable' : 'Locked'}</Box>
                  <Box component="td" sx={{ p: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={bond.status !== '可赎回' || withdrawingId === bond.objectId}
                      onClick={() => handleWithdraw(bond)}
                    >
                      {withdrawingId === bond.objectId ? <CircularProgress size={18} /> : 'Withdraw'}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* 错误和成功提示 */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BondPool; 