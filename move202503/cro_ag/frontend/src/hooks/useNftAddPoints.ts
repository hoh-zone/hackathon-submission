import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { QUERY_NFT_ADD_POINTS } from '@/api/query/query.constant';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { convertToBigInt } from '@/utils/formatUtil';
import { delayCallPromise } from '@/utils/delayCallPromise';

export type ZeroObjRsp = {
  txPoints: Transaction | null;
};
export const useNftAddPoints = (
  address: string | undefined,
  points: number | undefined,
  decimals: number | undefined,
  nftId: string | undefined
) => {
  const sdk = useCroAgSDK();
  return useQuery<ZeroObjRsp>({
    queryKey: [QUERY_NFT_ADD_POINTS, address, points, nftId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const txPoints = await sdk.add_points(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        address!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        nftId!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        convertToBigInt(decimals!, String(points))
      );
      return {
        txPoints,
      };
    },
    enabled: !!address && !!points && points > 0,
    staleTime: 1000 * 2,
    gcTime: 1000 * 60 * 2,
  });
};
export const invalidateAddPoints = (queryClient: QueryClient) => {
  delayCallPromise(
    'invalidateAddPoints',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_NFT_ADD_POINTS],
        refetchType: 'all',
      });
    },
    3000
  );
};
