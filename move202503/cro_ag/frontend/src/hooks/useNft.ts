import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { QUERY_GET_OWNED_NFT } from '@/api/query/query.constant';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { Balance, POINTS, RankResponse } from 'cro-sdk';
import { delayCallPromise } from '@/utils/delayCallPromise';

export type ZeroObjRsp = {
  type: string;
  rankDetail?: RankResponse;
  nftId?: string;
  pointsBalance?: Balance;
  tx?: Transaction | null;
};
export const useNft = (
  address: string | undefined,
  referral_address?: string
) => {
  const sdk = useCroAgSDK();
  return useQuery<ZeroObjRsp>({
    queryKey: [QUERY_GET_OWNED_NFT, address, referral_address],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const ownNftResult = await sdk.getOwnedNft(address!);
      if (ownNftResult) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const rankDetail = await sdk.getRank(address!);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const pointsBalance = await sdk.getBalanceByType(address!, POINTS);
        return {
          type: 'old',
          rankDetail,
          pointsBalance,
          nftId: ownNftResult,
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (
          !referral_address ||
          referral_address == '' ||
          referral_address?.length === 66
        ) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const tx = await sdk.mint_nft(address!, referral_address);
          return { type: 'new', tx };
        } else {
          return { type: 'new', tx: null };
        }
      }
    },
    enabled: !!address,
    staleTime: 1000 * 2,
    gcTime: 1000 * 60 * 2,
  });
};
export const invalidateGetOwnedNft = (queryClient: QueryClient) => {
  delayCallPromise(
    'invalidateGetOwnedNft',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_GET_OWNED_NFT],
        refetchType: 'all',
      });
    },
    3000
  );
};
