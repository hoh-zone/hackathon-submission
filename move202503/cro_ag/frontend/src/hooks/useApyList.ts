import { QUERY_APY_LIST } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import stringUtil from '@/utils/stringUtil';
import { useQuery } from '@tanstack/react-query';
import { ApyType, ProjectType } from 'cro-sdk';

// ** APY *** Hook
export const useApyList = (apyType: ApyType, projectType: ProjectType) => {
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_APY_LIST, apyType, projectType], // ** apyType * projectType
    queryFn: () => {
      return sdk.getApyList(apyType, projectType);
    },
    enabled: stringUtil.isNotEmpty(apyType),
    staleTime: 1000 * 60 * 20, // 5 ********* apy*********5*****************
    gcTime: 1000 * 60 * 60, // 10 *******
  });
};
