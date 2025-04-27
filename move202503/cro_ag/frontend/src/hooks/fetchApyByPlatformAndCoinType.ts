import { QUERY_APY_BY_PLATFORM_AND_COIN_TYPE } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { useQuery } from '@tanstack/react-query';

export const fetchApyByPlatformAndCoinType = (
  platform?: string,
  coinType?: string
) => {
  const sdk = useCroAgSDK();
  const query = useQuery({
    queryKey: [QUERY_APY_BY_PLATFORM_AND_COIN_TYPE, platform, coinType],
    queryFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return sdk.fetchApyByPlatformAndCoinType(platform!, coinType!);
    },
    enabled: !!platform && !!coinType,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });
  if (query?.data?.code === 200) {
    return query?.data?.data?.[0];
  } else {
    return null;
  }
};
