import { QUERY_COINS_SHOW } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useCoinsShow = () => {
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_COINS_SHOW],
    queryFn: () => {
      return sdk.getCoinsShow();
    },
    enabled: false, //******
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 ********* CoinsShow**** ***（*************） **5*****************.------
    gcTime: 1000 * 60 * 10, // 10 *******
  });
};

export const useFetchQueryCoinsShow = () => {
  //******useCoinsShow  *****，****************，*******
  const sdk = useCroAgSDK();
  const queryClient = useQueryClient();
  queryClient.fetchQuery({
    queryKey: [QUERY_COINS_SHOW],
    queryFn: () => {
      return sdk.getCoinsShow();
    },
  });
};
