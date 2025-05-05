import { QUERY_WITHDRAW_TX } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import { useQuery } from '@tanstack/react-query';
import { CroPortfolio } from 'cro-sdk';

// export type PortfolioReq = {
//   portfolioData: CroPortfolio;
//   amount: bigint;
//   address: string;
// };
// export const useWithdraw = () => {
//   const sdk = useCroAgSDK();
//   return useMutation({
//     mutationFn: async ({
//       portfolioData,
//       amount,
//     }: PortfolioReq): Promise<Transaction> => {
//       const tx = await sdk.croWithdraw(portfolioData, amount);
//       if (tx) {
//         return tx;
//       } else {
//         throw new Error('Transaction creation failed');
//       }
//     },
//   });
// };

export const useWithdraw_10s = (
  portfolioData: CroPortfolio | null,
  amount: bigint
) => {
  const sdk = useCroAgSDK();
  return useQuery({
    queryKey: [QUERY_WITHDRAW_TX, portfolioData?.coinType, amount.toString()],
    queryFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return sdk.croWithdraw(portfolioData!, amount);
    },
    enabled: !!portfolioData && amount > 0n,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60,
    refetchInterval: 1000 * 10,
  });
};
