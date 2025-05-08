import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { Token } from '../config/tokens';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';

export const useTokenBalance = (token: Token) => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  return useQuery({
    queryKey: ['balance', account?.address, token.symbol],
    queryFn: async () => {
      if (!account?.address || token.chain !== 'Sui') {
        return '0.0';
      }

      try {
        const { totalBalance } = await suiClient.getBalance({
          owner: account.address,
          coinType: token.symbol === 'SUI' ? SUI_TYPE_ARG : `${process.env.REACT_APP_PACKAGE_ID}::${token.symbol.toLowerCase()}::${token.symbol}`,
        });

        // Convert balance from MIST to SUI (1 SUI = 10^9 MIST)
        const balanceInSui = Number(totalBalance) / 1e9;
        return balanceInSui.toFixed(4);
      } catch (error) {
        console.error('Error fetching balance:', error);
        return '0.0';
      }
    },
    enabled: !!account?.address,
  });
}; 