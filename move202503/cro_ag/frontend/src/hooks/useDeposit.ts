// import { QUERY_DEPOSIT_TX } from '@/api/query/query.constant';
// import { useCroAgSDK } from '@/context/CroAgSDKContext';
// import { useQuery } from '@tanstack/react-query';
// import { ApyData } from 'cro-sdk';

// export type PortfolioReq = {
//   apyData: ApyData;
//   type_in: string;
//   amount_in: bigint;
//   slippage: number;
//   address: string;
// };
// export const useDeposit = () => {
//   const sdk = useCroAgSDK();
//   return useMutation({
//     mutationFn: async ({
//       apyData: apyData,
//       type_in,
//       amount_in,
//       slippage,
//       address,
//     }: PortfolioReq) => {
//       const tx = await sdk.croDeposit(
//         apyData,
//         type_in,
//         amount_in,
//         slippage,
//         address
//       );
//       if (tx) {
//         return tx;
//       } else {
//         throw new Error('Transaction creation failed');
//       }
//     },
//   });
// };

// export const useDeposit_10s = (
//   type_in: string,
//   amount_in: bigint,
//   slippage: number,
//   apyData?: ApyData,
//   address?: string
// ) => {
//   const sdk = useCroAgSDK();
//   return useQuery({
//     queryKey: [
//       QUERY_DEPOSIT_TX,
//       type_in,
//       amount_in.toString(),
//       slippage,
//       apyData?.project || '' + apyData?.name,
//       address,
//     ],
//     queryFn: () => {
//       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//       return sdk.croDeposit(apyData!, type_in, amount_in, slippage, address!);
//     },
//     enabled: !!apyData && !!type_in && !!amount_in && !!slippage && !!address,
//     staleTime: 1000 * 10,
//     gcTime: 1000 * 60,
//     refetchInterval: 1000 * 10,
//   });
// };
