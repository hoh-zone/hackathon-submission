import { QUERY_NFT_TOP } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { delayCallPromise } from '@/utils/delayCallPromise';
import stringUtil from '@/utils/stringUtil';
import {
  InfiniteData,
  QueryClient,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { LeaderboardResponse } from 'cro-sdk';

// ** APY *** Hook
export const useNftTop = (page: number) => {
  const sdk = useCroAgSDK();
  return useQuery<LeaderboardResponse>({
    queryKey: [QUERY_NFT_TOP, page],
    queryFn: () => {
      return sdk.getTop(page);
    },
    enabled: stringUtil.isNotEmpty(page),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 1,
  });
};
export type LeaderboardEntryShow = {
  rank: string;
  address: string;
  points: string;
  key: string;
};
export type NftItem = {
  data: LeaderboardEntryShow[];
  nextPage: number;
  total: number;
  currentPage: number;
};
export const useNftTopNew = () => {
  const sdk = useCroAgSDK();
  return useInfiniteQuery<
    NftItem,
    Error,
    InfiniteData<NftItem>,
    (typeof QUERY_NFT_TOP)[],
    number
  >({
    queryKey: [QUERY_NFT_TOP],
    queryFn: async ({ pageParam }) => {
      const dataLength = 10;
      const top = await sdk.getTop(pageParam);
      const item = top.data ?? { total: 100, list: [] };
      const itemNew: NftItem = {
        data: [],
        nextPage: pageParam + 1,
        total: item.total,
        currentPage: pageParam,
      };
      for (let i = 0; i < dataLength; i++) {
        const dataItem: LeaderboardEntryShow = {
          rank: '',
          address: '',
          points: '',
          key: '',
        };
        if (item.list.length > i) {
          dataItem.rank = item.list[i].rank + '';
          dataItem.address = `${item.list[i].address.substring(
            0,
            8
          )}.....${item.list[i].address.slice(-8)}`;
          dataItem.points = item.list[i].points + '';
          dataItem.key = item.list[i].address;
        } else {
          dataItem.rank = `●`;
          dataItem.address = '';
          dataItem.points = '';
          dataItem.key = i + '';
        }
        itemNew.data.push(dataItem);
      }
      return itemNew;
    },
    initialPageParam: 1, // ****
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.flatMap((p) => p.data).length;
      if (loadedCount < lastPage.total) {
        return lastPage.nextPage;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 1,
  });
};

export const invalidateNftTop = (queryClient: QueryClient) => {
  delayCallPromise(
    'invalidateNftTop',
    () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_NFT_TOP],
        refetchType: 'all',
      });
    },
    3000
  );
};
