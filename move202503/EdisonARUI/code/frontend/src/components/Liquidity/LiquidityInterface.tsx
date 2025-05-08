import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Card, Typography, Button, TextField, Stack, styled } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { TEST_TOKENS_CONTRACT } from '../../config/contracts';


const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: '480px',
  margin: '40px auto',
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

const LiquidityInterface: React.FC = () => {
  // Get current wallet account
  const currentAccount = useCurrentAccount();
  // Get Sui client
  const suiClient = useSuiClient();
  // Get transaction executor
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // User input states
  const [mintAmount, setMintAmount] = useState<string>("10000");
  const [stakeAmount, setStakeAmount] = useState<string>("1000");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("100");

  // Application states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStakeLoading, setIsStakeLoading] = useState<boolean>(false);
  const [stakeInfo, setStakeInfo] = useState<any | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Transaction success dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [successOperation, setSuccessOperation] = useState<string>("");

  // 新增状态
  const [testBtcAmount, setTestBtcAmount] = useState<string>("1000");
  const [testSuiAmount, setTestSuiAmount] = useState<string>("1000");
  const [isMinting, setIsMinting] = useState<boolean>(false);

  // Callback function to fetch wallet balance and stake information
  const fetchData = async () => {
    if (!currentAccount || !suiClient) {
      return;
    }

    try {
      // TODO: Implement fetchWalletBalance and fetchStakeInfo functions
      // await fetchWalletBalance(...);
      // await fetchStakeInfo(...);
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message || JSON.stringify(err)}`);
    }
  };

  // Fetch data when wallet connects or changes
  useEffect(() => {
    if (currentAccount) {
      fetchData();
    } else {
      // Clear data
      setWalletBalance(null);
      setStakeInfo(null);
    }
  }, [currentAccount, suiClient]);

  // Handle Mint operation
  // const handleMint = async () => {
  //   if (!currentAccount || !suiClient) {
  //     setError("Please connect wallet first");
  //     return;
  //   }

  //   const mintAmountValue = parseFloat(mintAmount);
  //   if (isNaN(mintAmountValue) || mintAmountValue <= 0) {
  //     setError("Please enter a valid mint amount");
  //     return;
  //   }

  //   try {
  //     setIsLoading(true);
  //     setError(null);

  //     // TODO: Implement mintGusdt function
  //     // await mintGusdt(...);

  //     setSuccessOperation("Mint");
  //     setShowSuccessDialog(true);
  //   } catch (err: any) {
  //     setError(`Mint failed: ${err.message || JSON.stringify(err)}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Handle Stake operation
  const handleStake = async () => {
    if (!currentAccount || !suiClient) {
      setError("Please connect wallet first");
      return;
    }

    const stakeAmountValue = parseFloat(stakeAmount);
    if (isNaN(stakeAmountValue) || stakeAmountValue <= 0) {
      setError("Please enter a valid stake amount");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement stakeGusdt function
      // await stakeGusdt(...);

      setSuccessOperation("Stake");
      setShowSuccessDialog(true);
    } catch (err: any) {
      setError(`Stake failed: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Unstake operation
  const handleUnstake = async () => {
    if (!currentAccount || !suiClient) {
      setError("Please connect wallet first");
      return;
    }

    const unstakeAmountValue = parseFloat(unstakeAmount);
    if (isNaN(unstakeAmountValue) || unstakeAmountValue <= 0) {
      setError("Please enter a valid unstake amount");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement unstakeGusdt function
      // await unstakeGusdt(...);

      setSuccessOperation("Unstake");
      setShowSuccessDialog(true);
    } catch (err: any) {
      setError(`Unstake failed: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 TEST_BTC 铸造
  const handleMintTestBtc = async () => {
    if (!currentAccount || !suiClient) {
      setError("Please connect wallet first");
      return;
    }

    const amount = parseFloat(testBtcAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid mint amount");
      return;
    }

    try {
      setIsMinting(true);
      setError(null);

      // 计算实际铸造数量（考虑精度）
      const mintAmount = Math.floor(amount * Math.pow(10, TEST_TOKENS_CONTRACT.TEST_BTC.DECIMALS));

      // 创建交易区块
      const tx = new Transaction();

      // @ts-ignore
      // 调用铸造函数
      tx.moveCall({
        target: `${TEST_TOKENS_CONTRACT.PACKAGE_ID}::${TEST_TOKENS_CONTRACT.TEST_BTC.MODULE}::mint`,
        arguments: [
          tx.object(TEST_TOKENS_CONTRACT.TEST_BTC.MINT_CAP_ID),
          tx.pure.u64(BigInt(mintAmount)),
          tx.pure.address(currentAccount.address)
        ]
      });

      console.log('铸造 TEST_BTC:', tx);

      // 执行交易
      signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (data: any) => {
          if (data && data.digest) {
            setSuccessOperation(`Mint ${amount} ${TEST_TOKENS_CONTRACT.TEST_BTC.SYMBOL}`);
            setTransactionId(data.digest);
            setShowSuccessDialog(true);
          }
          setIsMinting(false);
        },
        onError: (err: any) => {
          setError(`Wallet interaction failed: ${err instanceof Error ? err.message : String(err)}`);
          setIsMinting(false);
        }
      });
    } catch (err: any) {
      console.error('铸造错误:', err);
      setError(`Mint failed: ${err.message || JSON.stringify(err)}`);
      setIsMinting(false);
    }
  };

  // 处理 TEST_SUI 铸造
  const handleMintTestSui = async () => {
    if (!currentAccount || !suiClient) {
      setError("Please connect wallet first");
      return;
    }

    const amount = parseFloat(testSuiAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid mint amount");
      return;
    }

    try {
      setIsMinting(true);
      setError(null);

      // 计算实际铸造数量（考虑精度）
      const mintAmount = Math.floor(amount * Math.pow(10, TEST_TOKENS_CONTRACT.TEST_SUI.DECIMALS));

      // 创建交易区块
      const tx = new Transaction();

      // @ts-ignore
      // 调用铸造函数
      tx.moveCall({
        target: `${TEST_TOKENS_CONTRACT.PACKAGE_ID}::${TEST_TOKENS_CONTRACT.TEST_SUI.MODULE}::mint`,
        arguments: [
          tx.object(TEST_TOKENS_CONTRACT.TEST_SUI.MINT_CAP_ID),
          tx.pure.u64(BigInt(mintAmount)),
          tx.pure.address(currentAccount.address)
        ]
      });

      console.log('铸造 TEST_SUI:', tx);

      // 执行交易
      signAndExecuteTransaction({
        transaction: tx,
      }, {
        onSuccess: (data: any) => {
          if (data && data.digest) {
            setSuccessOperation(`Mint ${amount} ${TEST_TOKENS_CONTRACT.TEST_SUI.SYMBOL}`);
            setTransactionId(data.digest);
            setShowSuccessDialog(true);
          }
          setIsMinting(false);
        },
        onError: (err: any) => {
          setError(`Wallet interaction failed: ${err instanceof Error ? err.message : String(err)}`);
          setIsMinting(false);
        }
      });
    } catch (err: any) {
      console.error('铸造错误:', err);
      setError(`Mint failed: ${err.message || JSON.stringify(err)}`);
      setIsMinting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <StyledCard>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Test Token Mint
        </Typography>

        {/* 钱包状态 */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: currentAccount ? 'success.main' : 'error.main',
              }}
            />
            <Typography variant="body2">
              {currentAccount
                ? `Connected: ${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                : "Wallet not connected"}
            </Typography>
          </Box>
        </Stack>

        {/* TEST_BTC 铸造部分 */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Mint {TEST_TOKENS_CONTRACT.TEST_BTC.SYMBOL}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter amount"
              value={testBtcAmount}
              onChange={(e) => setTestBtcAmount(e.target.value)}
              disabled={isMinting}
            />
            <Button
              variant="contained"
              onClick={handleMintTestBtc}
              disabled={!currentAccount || isMinting}
              startIcon={<AddIcon />}
            >
              Mint
            </Button>
          </Box>
        </Stack>

        {/* TEST_SUI 铸造部分 */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Mint {TEST_TOKENS_CONTRACT.TEST_SUI.SYMBOL}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter amount"
              value={testSuiAmount}
              onChange={(e) => setTestSuiAmount(e.target.value)}
              disabled={isMinting}
            />
            <Button
              variant="contained"
              onClick={handleMintTestSui}
              disabled={!currentAccount || isMinting}
              startIcon={<AddIcon />}
            >
              Mint
            </Button>
          </Box>
        </Stack>

        {/* 错误显示 */}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {/* 交易成功对话框 */}
        {showSuccessDialog && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.main', borderRadius: 1 }}>
            <Typography color="white">
              {successOperation}
            </Typography>
            {transactionId && (
              <Typography variant="body2" color="white" sx={{ mt: 1 }}>
                Transaction ID: {transactionId}
              </Typography>
            )}
          </Box>
        )}
      </StyledCard>

      {/* Global Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            border-top: 2px solid #3B82F6;
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default LiquidityInterface; 