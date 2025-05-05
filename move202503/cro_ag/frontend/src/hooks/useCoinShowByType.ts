import { QUERY_COIN_SHOW_BY_TYPE } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { useQuery } from '@tanstack/react-query';

export const useCoinShowByType = (type: string, isModalOpen: boolean) => {
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_COIN_SHOW_BY_TYPE, type],
    queryFn: () => {
      return sdk.getCoinByType(type);
    },
    enabled: !!type && isModalOpen,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
