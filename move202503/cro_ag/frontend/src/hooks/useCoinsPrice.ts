import { QUERY_COINS_PRICE } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery } from '@tanstack/react-query';
import { PriceInfo } from 'cro-sdk';

export type StakeRsp = { value: string; tx: Transaction | null };
export const useCoinsPrice = (inView: boolean) => {
  const sdk = useCroAgSDK();

  return useQuery<Record<string, PriceInfo>>({
    queryKey: [QUERY_COINS_PRICE],
    queryFn: async () => {
      const priceResult = await sdk.getAllPriceInfo();
      const priceMap: Record<string, PriceInfo> = {};
      for (let i = 0; i < priceResult.data.length; i++) {
        const priceInfo: PriceInfo = priceResult.data[i];
        // const price = priceInfo.last_price * Math.pow(10, priceInfo.expo);
        priceMap[priceInfo.coin_type] = priceInfo;
      }
      return priceMap;
    },
    enabled: inView,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 10,
  });
};
