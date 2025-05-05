import { QUERY_SUI_TO_CSUI_BALANCE } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery } from '@tanstack/react-query';

export type StakeRsp = { value: string; tx: Transaction | null };
export const useSuiToCSuiPrice = (
  balance: number,
  reallyValueBigint: bigint,
  address: string | undefined
) => {
  const sdk = useCroAgSDK();

  return useQuery<StakeRsp>({
    queryKey: [
      QUERY_SUI_TO_CSUI_BALANCE,
      {
        balance,
      },
    ],
    queryFn: async () => {
      const priceResult = await sdk.getCSuiPrice();
      const cSui = (balance / priceResult).toFixed(9);
      if (!address) {
        return { value: cSui, tx: null } as StakeRsp;
      }
      const tx = await sdk.stake(address, reallyValueBigint);
      return { value: cSui, tx } as StakeRsp;
    },
    enabled: balance >= 0,
    staleTime: 0,
    gcTime: 2000,
    refetchInterval: 1000 * 1,
  });
};
