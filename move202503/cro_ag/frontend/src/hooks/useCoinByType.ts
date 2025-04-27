import { QUERY_COIN_SHOW_BY_TYPE_1 } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { useQuery } from '@tanstack/react-query';

export const useCoinByType = (type?: string) => {
  const sdk = useCroAgSDK();
  const query = useQuery({
    queryKey: [QUERY_COIN_SHOW_BY_TYPE_1, type || 'default'],
    queryFn: () => {
      return sdk.getCoinByType(type || '');
    },
    enabled: !!type,
    staleTime: 1000 * 60 * 100,
    gcTime: 1000 * 60 * 150,
  });
  if (query?.data?.code === 200) {
    return query?.data?.data?.[0];
  } else {
    return null;
  }
};
