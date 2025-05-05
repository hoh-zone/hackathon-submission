import {
  QUERY_ALL_BALANCE,
  QUERY_COIN_SHOW_BY_TYPE_1,
} from '@/api/query/query.constant';
import { useSuiClient } from '@mysten/dapp-kit';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coin, CoinResponse } from 'cro-sdk';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { delayCallPromise } from '@/utils/delayCallPromise';
export type AllCoinsBalanceItem = {
  coinType: string;
  balance: bigint;
  coin?: Coin;
};
export const useAllBalance = (address: string | undefined, inView: boolean) => {
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_ALL_BALANCE, address],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const allCoins = await client.getAllCoins({ owner: address! });

      const balanceMap: Record<string, bigint> = {};
      const list: AllCoinsBalanceItem[] = [];
      for (const coin of allCoins.data) {
        const coinType = coin.coinType;
        const balance = BigInt(coin.balance);

        if (balanceMap[coinType]) {
          balanceMap[coinType] += balance;
        } else {
          balanceMap[coinType] = balance;
        }
      }

      for (const [coinType, balance] of Object.entries(balanceMap)) {
        let coin = queryClient.getQueryData<CoinResponse>([
          QUERY_COIN_SHOW_BY_TYPE_1,
          coinType,
        ]);
        if (!coin) {
          coin = await sdk.getCoinByType(coinType);
          queryClient.setQueryData(
            [QUERY_COIN_SHOW_BY_TYPE_1, coinType],
            (oldData: CoinResponse) => ({
              ...oldData,
              ...coin,
            })
          );
        }
        if (coin?.data?.[0] && balance > 0n) {
          const item: AllCoinsBalanceItem = {
            coinType,
            balance,
            coin: coin?.data?.[0],
          };
          list.push(item);
        }
      }
      return list;
    },
    enabled: !!address && inView,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const invalidateAllBalance = (queryClient: QueryClient) => {
  delayCallPromise(
    'invalidateAllBalance',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_ALL_BALANCE],
        refetchType: 'all',
      });
    },
    3000
  );
};
