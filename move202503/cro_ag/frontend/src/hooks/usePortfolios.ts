import { QUERY_PORTFOLIOS } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { delayCallPromise } from '@/utils/delayCallPromise';
import stringUtil from '@/utils/stringUtil';
import { QueryClient, useQuery } from '@tanstack/react-query';

export const usePortfolios = (sender: string | undefined) => {
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_PORTFOLIOS, sender],
    queryFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return sdk.fetchAllPortfolios(sender!);
    },
    enabled: stringUtil.isNotEmpty(sender),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
export const invalidatePortfolios = (queryClient: QueryClient) => {
  delayCallPromise(
    'invalidatePortfolios',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_PORTFOLIOS],
        refetchType: 'all',
      });
    },
    3000
  );
};
