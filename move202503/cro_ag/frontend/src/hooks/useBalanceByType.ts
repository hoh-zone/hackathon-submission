import { QUERY_BALANCE_BY_TYPE } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { delayCallPromise } from '@/utils/delayCallPromise';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { Balance } from 'cro-sdk';

export const useBalanceByType = (type: string | null | undefined) => {
  const sdk = useCroAgSDK();
  const currentAccount = useCurrentAccount();
  return useQuery({
    queryKey: [
      QUERY_BALANCE_BY_TYPE,
      { address: currentAccount?.address, type },
    ],
    queryFn: () => {
      return sdk.getBalanceByType(currentAccount?.address || '', type || '');
    },
    enabled: !!currentAccount?.address && !!type,
    staleTime: 1000 * 60 * 5, // 5 ********* CoinsShow**** ***（*************） **5*****************.------
    gcTime: 1000 * 60 * 10, // 10 *******
    refetchInterval: false,
  });
};
export const invalidateBalanceByType = (queryClient: QueryClient) => {
  delayCallPromise(
    'invalidateBalanceByType',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_BALANCE_BY_TYPE],
        refetchType: 'all',
      });
    },
    3000
  );
};
export const setQueryData_balanceByType = (
  queryClient: QueryClient,
  type: string | null | undefined,
  amount: bigint,
  address: string
) => {
  if (!type) {
    return;
  }
  queryClient.setQueryData(
    [QUERY_BALANCE_BY_TYPE, { address, type }],
    (oldData: Balance) => ({
      ...oldData,
      balance: amount,
    })
  );
};
