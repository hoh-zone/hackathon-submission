import React, { useState } from 'react';
import {
  Box,
  Card,
  IconButton,
  Tab,
  Tabs,
  Button,
  styled,
  Typography,
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { TOKENS, SWAP_TOKENS, BRIDGE_PAIRS, Token } from '../../config/tokens';
import { SWAP_CONTRACT, TEST_TOKENS_CONTRACT } from '../../config/contracts';
import TokenSelector from '../common/TokenSelector';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  ConnectButton,
} from '@mysten/dapp-kit';

// 确保类型安全的 Token 实例
type RequiredTokenProps = Required<Pick<Token, 'address' | 'decimals' | 'coinType'>>;
type RequiredToken = Token & RequiredTokenProps;

// 使用配置文件中的合约地址
const CONTRACT_ADDRESS = {
  SWAP: SWAP_CONTRACT.PACKAGE_ID,
  BRIDGE: TEST_TOKENS_CONTRACT.PACKAGE_ID,
};

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

const SwapInterface: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [fromValue, setFromValue] = useState('0.0');
  const [toValue, setToValue] = useState('0.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sui DApp Kit hooks
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // For Swap mode
  const [fromSwapToken, setFromSwapToken] = useState<RequiredToken>(SWAP_TOKENS[0] as RequiredToken);
  const [toSwapToken, setToSwapToken] = useState<RequiredToken>(SWAP_TOKENS[1] as RequiredToken);
  
  // For Bridge mode
  const [bridgePair, setBridgePair] = useState({
    from: BRIDGE_PAIRS[0].from as RequiredToken,
    to: BRIDGE_PAIRS[0].to as RequiredToken,
  });

  // Get token balances
  const fromTokenBalance = useTokenBalance(tab === 0 ? fromSwapToken : bridgePair.from);
  const toTokenBalance = useTokenBalance(tab === 0 ? toSwapToken : bridgePair.to);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    // Reset values when switching modes
    setFromValue('0.0');
    setToValue('0.0');
    if (newValue === 0) {
      // Swap mode
      setFromSwapToken(SWAP_TOKENS[0] as RequiredToken);
      setToSwapToken(SWAP_TOKENS[1] as RequiredToken);
    } else {
      // Bridge mode
      setBridgePair({
        from: BRIDGE_PAIRS[0].from as RequiredToken,
        to: BRIDGE_PAIRS[0].to as RequiredToken,
      });
    }
  };

  const handleSwapDirection = () => {
    if (tab === 0) {
      // Swap mode
      setFromSwapToken(toSwapToken);
      setToSwapToken(fromSwapToken);
    } else {
      // Bridge mode
      setBridgePair({
        from: bridgePair.to,
        to: bridgePair.from,
      });
    }
    setFromValue(toValue);
    setToValue(fromValue);
  };

  const handleSwapTokenChange = (position: 'from' | 'to', token: Token) => {
    if (tab === 0) {
      // Swap mode
      const tokenWithRequired = token as RequiredToken;
      
      if (position === 'from') {
        if (token.symbol === toSwapToken.symbol) {
          setToSwapToken(fromSwapToken);
        }
        setFromSwapToken(tokenWithRequired);
      } else {
        if (token.symbol === fromSwapToken.symbol) {
          setFromSwapToken(toSwapToken);
        }
        setToSwapToken(tokenWithRequired);
      }
    } else {
      // Bridge mode
      const newPair = BRIDGE_PAIRS.find(pair => 
        position === 'from' 
          ? pair.from.symbol === token.symbol 
          : pair.to.symbol === token.symbol
      );
      if (newPair) {
        setBridgePair({
          from: newPair.from as RequiredToken,
          to: newPair.to as RequiredToken
        });
      }
    }
  };

  // 处理 Swap 交易
  const handleSwap = async () => {
    console.log('当前钱包状态:', { 
      currentAccount, 
      fromToken: fromSwapToken,
      toToken: toSwapToken,
      amount: fromValue
    });

    if (!currentAccount) {
      setError('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const amount = Math.floor(parseFloat(fromValue) * Math.pow(10, fromSwapToken.decimals));

      // 构建交易数据
      const transaction = {
        kind: "moveCall",
        data: {
          packageObjectId: CONTRACT_ADDRESS.SWAP,
          module: "move_swap",
          function: "swap",
          typeArguments: [fromSwapToken.coinType, toSwapToken.coinType],
          arguments: [
            fromSwapToken.address,
            amount.toString(),
            "0",
            currentAccount.address,
          ],
        }
      };

      console.log('交易数据:', transaction);

      const result = await signAndExecuteTransaction({
        transaction: transaction as any,
      });

      console.log('交易结果:', result);
      setLoading(false);
    } catch (err: any) {
      console.error('交易错误:', err);
      setError(err.message || '交易失败');
      setLoading(false);
    }
  };

  // 处理 Bridge 交易
  const handleBridge = async () => {
    if (!currentAccount) {
      setError('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const amount = Math.floor(parseFloat(fromValue) * Math.pow(10, bridgePair.from.decimals));

      // 构建交易数据
      const transaction = {
        kind: "moveCall",
        data: {
          packageObjectId: CONTRACT_ADDRESS.BRIDGE,
          module: "sbtc",
          function: bridgePair.from.chain === 'Bitcoin' ? 'mint' : 'burn',
          typeArguments: [],
          arguments: bridgePair.from.chain === 'Bitcoin' 
            ? [
                amount.toString(),
                bridgePair.from.address,
                [], // btc_proof
                [], // signatures
              ]
            : [
                bridgePair.from.address,
                bridgePair.to.address,
              ],
        }
      };

      console.log('交易数据:', transaction);

      const result = await signAndExecuteTransaction({
        transaction: transaction as any,
      });

      console.log('交易结果:', result);
      setLoading(false);
    } catch (err: any) {
      console.error('交易错误:', err);
      setError(err.message || '交易失败');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <StyledCard>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Swap" />
          <Tab label="Bridge" />
        </Tabs>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tab === 0 ? 'Swap Tokens' : 'Bridge Transfer'}
          </Typography>

          <TokenSelector
            label="From"
            token={tab === 0 ? fromSwapToken : bridgePair.from}
            balance={fromTokenBalance.data || '0.0'}
            value={fromValue}
            availableTokens={tab === 0 ? SWAP_TOKENS : TOKENS.filter(t => t.chain === 'Bitcoin')}
            onChange={setFromValue}
            onTokenChange={(token) => handleSwapTokenChange('from', token)}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
            <IconButton
              onClick={handleSwapDirection}
              sx={{
                backgroundColor: 'background.default',
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <SwapVertIcon />
            </IconButton>
          </Box>

          <TokenSelector
            label="To"
            token={tab === 0 ? toSwapToken : bridgePair.to}
            balance={toTokenBalance.data || '0.0'}
            value={toValue}
            availableTokens={tab === 0 
              ? SWAP_TOKENS.filter(t => t.symbol !== fromSwapToken.symbol)
              : TOKENS.filter(t => t.chain === 'Sui')}
            onChange={setToValue}
            onTokenChange={(token) => handleSwapTokenChange('to', token)}
          />

          {!currentAccount ? (
            <Box sx={{ mt: 3 }}>
              <ConnectButton />
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <StyledButton
                variant="contained"
                color="primary"
                disabled={loading || parseFloat(fromValue) <= 0}
                onClick={tab === 0 ? handleSwap : handleBridge}
              >
                {loading ? 'Processing...' : tab === 0 ? 'Swap' : 'Transfer'}
              </StyledButton>
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </StyledCard>
    </Box>
  );
};

export default SwapInterface; 