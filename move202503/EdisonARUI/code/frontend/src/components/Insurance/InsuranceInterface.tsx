import React, { useState, useEffect, useRef } from 'react';
import {
  Box, 
  Card, 
  Typography, 
  TextField, 
  Button, 
  styled, 
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
  ConnectButton,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { TOKENS } from '../../config/tokens';
import { INSURANCE_CONTRACT } from '../../config/contracts';
import { COMMON_CONTRACT } from '../../config/contracts';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { getCountryHistoricalData } from '../Explore/countryData';
import BugReportIcon from '@mui/icons-material/BugReport';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: '100%',
  margin: '20px auto',
  padding: '24px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '16px',
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 500,
}));

// 定义保险产品类型
interface InsuranceProduct {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverage: number;
  minDuration: number;
  maxDuration: number;
}

// 保险产品列表
const INSURANCE_PRODUCTS: InsuranceProduct[] = [
  {
    id: 'btc_hashrate',
    name: 'BTC Hashrate Volatility Insurance',
    description: '',
    icon: 'BTC',
    coverage: 0.8, // 80% coverage
    minDuration: 7, // min 7 days
    maxDuration: 90 // max 90 days
  }
];

interface InsuranceInterfaceProps {
  country?: string;  // 国家参数
  compact?: boolean; // 是否使用紧凑版本
}

// 添加日志管理类
class LogManager {
  static logs: string[] = [];
  
  static addLog(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = data 
      ? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
      : `[${timestamp}] ${message}`;
    
    this.logs.push(logMessage);
    console.log(logMessage); // 仍然在控制台显示，方便开发调试
  }
  
  static getAllLogs(): string {
    return this.logs.join('\n\n');
  }
  
  static downloadLogs(): void {
    const logContent = this.getAllLogs();
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insurance_logs_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  static clearLogs(): void {
    this.logs = [];
  }
}

const InsuranceInterface: React.FC<InsuranceInterfaceProps> = ({ country = 'Global', compact = false }) => {
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct>(INSURANCE_PRODUCTS[0]);
  const [amount, setAmount] = useState('1000');
  const [duration, setDuration] = useState(30); // 保单持续天数
  const [premium, setPremium] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countryRiskFactor, setCountryRiskFactor] = useState(1.0); // 国家风险因子
  
  // Sui DApp Kit hooks
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // Get token balance
  const token = TOKENS.find(t => t.symbol === TOKENS[1].symbol)!;
  const tokenBalance = useTokenBalance(token);

  // 根据国家计算风险因子
  useEffect(() => {
    if (country) {
      // 获取国家历史算力数据
      const historyData = getCountryHistoricalData(country);
      
      if (historyData.length > 0) {
        // 计算算力波动率作为风险指标
        const recentData = historyData.slice(-12); // 取最近12个月数据
        if (recentData.length >= 2) {
          // 计算算力波动的标准差
          const hashrates = recentData.map(d => d.absoluteHashRate);
          const avg = hashrates.reduce((a, b) => a + b, 0) / hashrates.length;
          const variance = hashrates.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / hashrates.length;
          const stdDev = Math.sqrt(variance);
          
          // 算力波动率 = 标准差 / 平均值
          const volatility = stdDev / avg;
          
          // 风险因子根据波动率调整，波动率越高，风险越大，保费越高
          setCountryRiskFactor(1 + volatility);
          console.log(`国家 ${country} 的风险因子: ${1 + volatility}`);
        }
      } else {
        // 如果没有数据，使用默认风险因子
        setCountryRiskFactor(1.0);
      }
    }
  }, [country]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAmount(value);
    calculatePremium(value, duration, selectedProduct);
  };

  const handleDurationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as number;
    setDuration(value);
    calculatePremium(amount, value, selectedProduct);
  };

  // 计算保费
  const calculatePremium = (insuredAmount: string, durationInDays: number, product: InsuranceProduct) => {
    // 简单的保费计算公式：金额 * 天数 * 费率系数 * 国家风险因子
    const amount = parseFloat(insuredAmount) || 0;
    const baseRate = product.id === 'btc_hashrate' ? 0.0001 : 0.00015; // 每天基础费率
    const volatilityFactor = product.id === 'btc_hashrate' ? 1.2 : 1.5; // 波动因子
    
    // 保费 = 金额 * 天数 * 基础费率 * 波动因子 * 国家风险因子
    const calculatedPremium = amount * durationInDays * baseRate * volatilityFactor * countryRiskFactor;
    
    setPremium(calculatedPremium.toFixed(2));
  };

  // 添加Drawer状态管理
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);
  
  // 购买保险
  const handleBuyInsurance = async () => {
    LogManager.addLog('开始购买保险流程', { 
      currentAccount: currentAccount?.address, 
      selectedProduct: selectedProduct?.id,
      amount,
      duration,
      premium,
      country
    });

    if (!currentAccount) {
      setError('请先连接钱包');
      LogManager.addLog('错误: 钱包未连接');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const insuredAmount = Math.floor(parseFloat(amount) * Math.pow(10, token.decimals || 6));
      const premiumAmount = Math.floor(parseFloat(premium) * Math.pow(10, token.decimals || 6));

      // 获取用户钱包中的代币ID
      LogManager.addLog('查询用户钱包中的代币', {
        address: currentAccount.address,
        coinType: token.coinType
      });
      
      const coinObjects = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: token.coinType || '',
      });

      // 检查是否有足够的代币对象
      if (!coinObjects || coinObjects.data.length === 0 || 
          BigInt(coinObjects.data[0].balance) < BigInt(premiumAmount)) {
        const errorMsg = `没有足够的${token.symbol}代币支付保费`;
        setError(errorMsg);
        LogManager.addLog('错误: ' + errorMsg, {
          required: premiumAmount,
          available: coinObjects?.data[0]?.balance || 0
        });
        setLoading(false);
        return;
      }

      // 使用第一个足够金额的代币对象
      const coinObjectId = coinObjects.data[0].coinObjectId;

      // 创建交易区块
      const tx = new Transaction();

      // 调用mint_insurance函数，使用正确的Transaction API
      const premiumCoin = tx.splitCoins(tx.object(coinObjectId), [BigInt(premiumAmount)]);

      // 添加更详细的日志
      const txParams = {
        packageId: INSURANCE_CONTRACT.PACKAGE_ID,
        module: 'insurance',
        function: 'mint_insurance',
        policyManagerId: INSURANCE_CONTRACT.POLICY_MANAGER_ID,
        financePoolId: INSURANCE_CONTRACT.FINANCE_POOL_ID,
        insuranceCapId: INSURANCE_CONTRACT.INSURANCE_CAP_ID,
        insuredAmount,
        duration,
        premiumCoin,
        clockId: COMMON_CONTRACT.CLOCK
      };
      
      LogManager.addLog('交易参数详情', txParams);
      tx.moveCall({
        target: `${INSURANCE_CONTRACT.PACKAGE_ID}::insurance::mint_insurance`,
        arguments: [
          tx.object(INSURANCE_CONTRACT.POLICY_MANAGER_ID),
          tx.object(INSURANCE_CONTRACT.FINANCE_POOL_ID),
          tx.object(INSURANCE_CONTRACT.INSURANCE_CAP_ID),
          tx.pure.u64(BigInt(insuredAmount)),
          tx.pure.u64(BigInt(duration)),
          premiumCoin, // 使用精确金额的代币
          tx.object(COMMON_CONTRACT.CLOCK), // Clock对象ID
        ]
      });

      LogManager.addLog('创建交易对象');

      // 执行交易
      LogManager.addLog('准备签名并执行交易');
      signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (result: any) => {
          LogManager.addLog('交易成功', result);
          setSuccess(`成功购买保险！交易已提交`);
          setLoading(false);
        },
        onError: (err: any) => {
          LogManager.addLog('交易错误', err);
          setError(err.message || '交易失败');
          setLoading(false);
        }
      });
    } catch (err: any) {
      LogManager.addLog('处理异常', err);
      setError(err.message || '交易失败');
      setLoading(false);
    }
  };

  // 添加导出日志功能
  const handleExportLogs = () => {
    LogManager.downloadLogs();
  };

  // 查看保单
  const handleViewPolicy = () => {
    // 实现查看保单的功能
    console.log('查看保单');
  };

  // 保险理赔
  const handleClaimInsurance = () => {
    // 实现保险理赔的功能
    console.log('申请理赔');
  };

  return (
    <>
      <StyledCard>
        {/* 显示保险描述
        <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(194, 224, 255, 0.08)' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            保障BTC算力波动下跌时的收益损失
          </Typography>
        </Box> */}
        
        {/* 保险参数设置 */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Coverage Amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: <Typography>sBTC</Typography>
            }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Coverage Period</InputLabel>
            <Select
              value={duration}
              label="Coverage Period"
              onChange={handleDurationChange as any}
            >
              {[7, 14, 30, 60, 90].filter(days => 
                days >= selectedProduct.minDuration && 
                days <= selectedProduct.maxDuration
              ).map(days => (
                <MenuItem key={days} value={days}>{days} days</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* 显示计算的保费 */}
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
            <Grid container justifyContent="space-between">
              <Grid item>
                <Typography variant="body2">Estimated Premium:</Typography>
              </Grid>
              <Grid item>
                <Typography variant="body1" fontWeight="bold">
                  {premium} sBTC
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
        
        {/* 操作按钮 */}
        {currentAccount ? (
          <Box>
            <StyledButton 
              variant="contained" 
              color="primary"
              onClick={handleBuyInsurance}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Buy Insurance'}
            </StyledButton>
            
            {!compact && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    fullWidth
                    onClick={handleViewPolicy}
                  >
                    View My Policies
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    fullWidth
                    onClick={handleClaimInsurance}
                  >
                    File a Claim
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Please connect your wallet to buy insurance
            </Typography>
            <ConnectButton />
          </Box>
        )}
        
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
      </StyledCard>
      
      {/* 日志抽屉 */}
      <Drawer
        anchor="right"
        open={showLogDrawer}
        onClose={() => setShowLogDrawer(false)}
      >
        <Box sx={{ width: 450, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Transaction Logs</Typography>
            <Box>
              <IconButton size="small" onClick={handleExportLogs} title="Export Logs">
                <DownloadIcon />
              </IconButton>
              <IconButton size="small" onClick={() => LogManager.clearLogs()} title="Clear Logs">
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setShowLogDrawer(false)} title="Close">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ height: 'calc(100vh - 100px)', overflow: 'auto' }}>
            <List dense>
              {LogManager.logs.map((log, index) => (
                <ListItem key={index} sx={{ display: 'block', whiteSpace: 'pre-wrap', mb: 1 }}>
                  <ListItemText 
                    primary={log}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontFamily: 'monospace', 
                        fontSize: '0.85rem' 
                      } 
                    }}
                  />
                  <Divider />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default InsuranceInterface; 