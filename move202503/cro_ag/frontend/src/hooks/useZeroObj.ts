import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { QUERY_ZERO_OBJ } from '@/api/query/query.constant';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/dist/cjs/client';
import { delayCallPromise } from '@/utils/delayCallPromise';

export type ZeroObjRsp = { dataList: CoinStruct[]; tx: Transaction | null };
export const useZeroObj = (address: string | undefined) => {
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_ZERO_OBJ, address],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const listResult = await sdk.get_zero_objs(address!);
      if (listResult.length > 0) {
        const tx = await sdk.zero_obj_mint(listResult);
        return { dataList: listResult, tx } as ZeroObjRsp;
      } else {
        return null;
      }
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 2,
  });
};
export const invalidateZeroObj = (queryClient: QueryClient) => {
  // setTimeout(() => {
  //   queryClient.invalidateQueries({
  //     queryKey: [QUERY_ZERO_OBJ],
  //     refetchType: 'all',
  //   });
  // }, 3000);

  delayCallPromise(
    'invalidateZeroObj',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_ZERO_OBJ],
        refetchType: 'all',
      });
      // queryClient.refetchQueries({ queryKey: [QUERY_ZERO_OBJ] });
    },
    3000
  );
};
