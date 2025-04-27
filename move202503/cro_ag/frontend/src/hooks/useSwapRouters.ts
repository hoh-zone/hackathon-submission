import { QUERY_SWAP_ROUTERS } from '@/api/query/query.constant';
import { useCroAgSDK } from '@/context/CroAgSDKContext';
import stringUtil from '@/utils/stringUtil';
import { useQuery } from '@tanstack/react-query';
import { ApyData, Coin, RouterData, RouterData7K, SwapResult } from 'cro-sdk';
import BN from 'bn.js';
import { divideBN } from '@/utils/divideBNUtil';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount } from '@mysten/dapp-kit';
import BNTobigint from '@/utils/BNTobiginUtil';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { slippage } from '@/store/feature/slippageSlice';
import { convertToBigInt } from '@/utils/formatUtil';
import { feeRates, updateFee } from '@/store/feature/feeRatesSlice';

const getDecimal = (
  swapAmount: string,
  swapAmountWithDecimal: string
): number => {
  if (swapAmount.startsWith('0')) {
    swapAmountWithDecimal = '0' + swapAmountWithDecimal;
  }
  if (swapAmount.indexOf('.') === -1) {
    return swapAmountWithDecimal.length - swapAmount.length;
  }
  return swapAmountWithDecimal.length - swapAmount.indexOf('.');
};
const valueDecimal = (amount: string, decimal: number) => {
  if (amount.indexOf('.') === -1) {
    for (let i = 0; i < decimal; i++) {
      amount = amount + '0';
    }
    return amount;
  }
  const df = amount.split('.')[1].length;
  decimal = decimal - df;

  if (amount.startsWith('0')) {
    amount = amount.slice(1);
  }
  for (let i = 0; i < decimal; i++) {
    amount = amount + '0';
  }
  amount = amount.replace('.', '');
  return amount;
};

export type AppRouterData_Route_path = {
  id: string;
  amount_in: string;
  amount_out: string;
  provider: string;
  from: {
    type: string;
  };
  target: {
    type: string;
  };
};
export type AppRouterData_Route = {
  iconUrl_in: string;
  iconUrl_out: string;
  name_in: string;
  name_out: string;
  amount_in: BN;
  amount_out: BN;
  ratio: string;
  path: AppRouterData_Route_path[];
};
export type AppRouterData = {
  from: {
    iconUrl: string;
    name: string;
    amount: bigint;
  };
  target: {
    iconUrl: string;
    name: string;
    amount: bigint;
  };
  routes: AppRouterData_Route[];
};

export type AppRouterDataItem = {
  routerData: AppRouterData;
  dex: string;
  tx?: Transaction;
  coinOut: bigint;
  amountDiff: bigint;
  ratio?: number;
};

export const useSwapRouters = (
  from: Coin,
  target: Coin,
  amount: string,
  decimals: number,
  reallyValueBigint: bigint,
  inView: boolean,
  type: string,
  refetchInterval: boolean,
  apyData?: ApyData
) => {
  const sdk = useCroAgSDK();
  const currentAccount = useCurrentAccount();
  const slippageSlice = useAppSelector(slippage);
  const feeRatesSlice = useAppSelector(feeRates);
  const dispatch = useAppDispatch();
  return useQuery<AppRouterDataItem[]>({
    queryKey: [
      QUERY_SWAP_ROUTERS,
      {
        from: from.type,
        target: target.type,
        amount,
        decimals,
        slippage:
          String(slippageSlice.slippageSwap) +
          '-' +
          String(slippageSlice.slippageLending),
        type,
        address: currentAccount?.address,
      },
    ],
    queryFn: () => {
      if (type === 'swap' && stringUtil.isNotEmpty(currentAccount?.address)) {
        if (feeRatesSlice.fee !== undefined) {
          return new Promise((resolve, reject) => {
            const swapRouters = sdk.swap_routers(
              from.type,
              target.type,
              reallyValueBigint,
              slippageSlice.slippageSwap,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              currentAccount!.address,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              feeRatesSlice.fee!
            );
            swapRouters
              .then((result) => {
                const dataItemList: AppRouterDataItem[] = [];
                for (let x = 0; x < result.length; x++) {
                  const cro: SwapResult = result[x];
                  if (cro.dex !== '7k') {
                    const routes_data: RouterData =
                      cro.routes_data as RouterData;
                    const data: AppRouterData = {
                      from: {
                        iconUrl: from.iconUrl,
                        name: from.name,
                        amount: cro?.total_amount_in || reallyValueBigint,
                      },
                      target: {
                        iconUrl: target.iconUrl,
                        name: target.name,
                        amount: cro?.total_amount_out, //************，******
                      },
                      routes: [],
                    };
                    for (let i = 0; i < (routes_data.routes.length || 0); i++) {
                      const item = routes_data.routes[i];
                      if (!item) {
                        throw new Error('error');
                      }
                      const newItem: AppRouterData_Route = {
                        iconUrl_in: from.iconUrl,
                        iconUrl_out: target.iconUrl,
                        name_in: from.name,
                        name_out: target.name,
                        amount_in: new BN(item.amount_in.toString()),
                        amount_out: new BN(item.amount_out.toString()),
                        ratio: cro?.total_amount_in
                          ? divideBN(
                              new BN(item.amount_in.toString()).mul(
                                new BN(100)
                              ),
                              new BN(cro?.total_amount_in.toString()),
                              10
                            )
                          : '',
                        path: [],
                      };
                      data.routes.push(newItem);
                      for (let j = 0; j < (item.path?.length || 0); j++) {
                        const itemInter = item.path?.[j];
                        const newItemInter: AppRouterData_Route_path = {
                          id: itemInter.id,
                          amount_in: itemInter.amountIn,
                          amount_out: itemInter.amountOut,
                          provider: itemInter.provider,
                          from: {
                            type: itemInter.from,
                          },
                          target: {
                            type: itemInter.target,
                          },
                        };
                        newItem.path.push(newItemInter);
                      }
                    }
                    if (data.routes.length === 0) {
                      if (data.target.amount === 0n) {
                        data.target.amount = data.from.amount;
                      }
                      const router: AppRouterData_Route = {
                        iconUrl_in: from.iconUrl,
                        iconUrl_out: target.iconUrl,
                        name_in: from.name,
                        name_out: target.name,
                        amount_in: new BN(data.from.amount.toString()),
                        amount_out: new BN(data.target.amount.toString()),
                        ratio: '100',
                        path: [],
                      };
                      data.routes.push(router);
                    }
                    if (result) {
                      if (x < 1) {
                        const obj = sdk.formatSwapRoutersResult(
                          result[0],
                          result[1].total_amount_out
                        );
                        const dataItem: AppRouterDataItem = {
                          routerData: data,
                          dex: cro.dex,
                          tx: cro.tx,
                          coinOut: data.target.amount,
                          amountDiff: obj.amountDiff,
                          ratio: 1,
                        };
                        // dataItem.routerData = data;
                        dataItemList.push(dataItem);
                      } else if (x == 1) {
                        const obj = sdk.formatSwapRoutersResult(
                          result[1],
                          result[1].total_amount_out
                        );
                        const dataItem: AppRouterDataItem = {
                          routerData: data,
                          dex: cro.dex,
                          tx: cro.tx,
                          coinOut: data.target.amount,
                          amountDiff: obj.amountDiff,
                          ratio: 1,
                        };
                        // dataItem.routerData = data;
                        dataItemList.push(dataItem);
                      } else if (x > 1) {
                        const obj = sdk.formatSwapRoutersResult(
                          result[x],
                          result[1].total_amount_out
                        );
                        const dataItem: AppRouterDataItem = {
                          routerData: data,
                          dex: cro.dex,
                          tx: cro.tx,
                          coinOut: data.target.amount,
                          amountDiff: obj.amountDiff,
                          ratio: 1,
                        };
                        // dataItem.routerData = data;
                        dataItemList.push(dataItem);
                      }
                    }
                  } else if (cro.dex === '7k') {
                    const routes_data: RouterData7K =
                      cro.routes_data as RouterData7K;
                    const decimal_a = getDecimal(
                      routes_data.swapAmount,
                      routes_data.swapAmountWithDecimal
                    );
                    const data: AppRouterData = {
                      from: {
                        iconUrl: from.iconUrl,
                        name: from.name,
                        amount: cro?.total_amount_in || reallyValueBigint,
                      },
                      target: {
                        iconUrl: target.iconUrl,
                        name: target.name,
                        amount: cro?.total_amount_out,
                      },
                      routes: [],
                    };
                    for (let i = 0; i < (routes_data.routes.length || 0); i++) {
                      const item = routes_data.routes[i];
                      if (!item) {
                        throw new Error('error');
                      }
                      const amount_in_decimal_str = valueDecimal(
                        item.tokenInAmount,
                        decimal_a
                      );
                      const amount_out_decimal_str = valueDecimal(
                        item.tokenOutAmount,
                        decimal_a
                      );
                      const newItem: AppRouterData_Route = {
                        iconUrl_in: from.iconUrl,
                        iconUrl_out: target.iconUrl,
                        name_in: from.name,
                        name_out: target.name,
                        amount_in: new BN(amount_in_decimal_str),
                        amount_out: new BN(amount_out_decimal_str),
                        ratio: cro?.total_amount_in
                          ? divideBN(
                              new BN(amount_in_decimal_str).mul(new BN(100)),
                              new BN(routes_data.swapAmountWithDecimal),
                              10
                            )
                          : '',
                        path: [],
                      };
                      data.routes.push(newItem);
                      for (let j = 0; j < (item.hops?.length || 0); j++) {
                        const itemInter = item.hops?.[j];
                        const newItemInter: AppRouterData_Route_path = {
                          id: j + '',
                          amount_in: itemInter.tokenInAmount,
                          amount_out: itemInter.tokenOutAmount,
                          provider: itemInter.pool.type,
                          from: {
                            type: itemInter.tokenIn,
                          },
                          target: {
                            type: itemInter.tokenOut,
                          },
                        };
                        newItem.path.push(newItemInter);
                      }
                    }
                    if (data.routes.length === 0) {
                      const router: AppRouterData_Route = {
                        iconUrl_in: from.iconUrl,
                        iconUrl_out: target.iconUrl,
                        name_in: from.name,
                        name_out: target.name,
                        amount_in: new BN(data.from.amount.toString()),
                        amount_out: new BN(data.target.amount.toString()),
                        ratio: '100',
                        path: [],
                      };
                      data.routes.push(router);
                    }
                    if (result) {
                      if (x < 1) {
                        const obj = sdk.formatSwapRoutersResult(
                          result[0],
                          result[1].total_amount_out
                        );
                        const dataItem: AppRouterDataItem = {
                          routerData: data,
                          dex: cro.dex,
                          tx: cro.tx,
                          coinOut: data.target.amount,
                          amountDiff: obj.amountDiff,
                          ratio: 1,
                        };
                        // dataItem.routerData = data;
                        dataItemList.push(dataItem);
                      } else if (x == 1) {
                        const obj = sdk.formatSwapRoutersResult(
                          result[1],
                          result[1].total_amount_out
                        );
                        const dataItem: AppRouterDataItem = {
                          routerData: data,
                          dex: cro.dex,
                          tx: cro.tx,
                          coinOut: data.target.amount,
                          amountDiff: obj.amountDiff,
                          ratio: 1,
                        };
                        // dataItem.routerData = data;
                        dataItemList.push(dataItem);
                      } else if (x > 1) {
                        const obj = sdk.formatSwapRoutersResult(
                          result[x],
                          result[1].total_amount_out
                        );
                        const dataItem: AppRouterDataItem = {
                          routerData: data,
                          dex: cro.dex,
                          tx: cro.tx,
                          coinOut: data.target.amount,
                          amountDiff: obj.amountDiff,
                          ratio: 1,
                        };
                        // dataItem.routerData = data;
                        dataItemList.push(dataItem);
                      }
                    }
                  }
                }
                resolve(dataItemList);
              })
              .catch((error) => {
                reject(error);
              });
          });
        } else {
          return Promise.resolve()
            .then(() => {
              return new Promise((resolve, reject) => {
                const feeRates = sdk.getFeeRates();
                feeRates
                  .then((result) => {
                    dispatch(updateFee(result));
                    resolve(result);
                  })
                  .catch((error) => {
                    reject(error);
                  });
              });
            })
            .then((result) => {
              return new Promise((resolve, reject) => {
                const swapRouters = sdk.swap_routers(
                  from.type,
                  target.type,
                  reallyValueBigint,
                  slippageSlice.slippageSwap,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  currentAccount!.address,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  result as number
                );
                swapRouters
                  .then((result) => {
                    const dataItemList: AppRouterDataItem[] = [];
                    for (let x = 0; x < result.length; x++) {
                      const cro: SwapResult = result[x];
                      if (cro.dex !== '7k') {
                        const routes_data: RouterData =
                          cro.routes_data as RouterData;
                        const data: AppRouterData = {
                          from: {
                            iconUrl: from.iconUrl,
                            name: from.name,
                            amount: cro?.total_amount_in || reallyValueBigint,
                          },
                          target: {
                            iconUrl: target.iconUrl,
                            name: target.name,
                            amount: cro?.total_amount_out, //************，******
                          },
                          routes: [],
                        };
                        for (
                          let i = 0;
                          i < (routes_data.routes.length || 0);
                          i++
                        ) {
                          const item = routes_data.routes[i];
                          if (!item) {
                            throw new Error('error');
                          }
                          const newItem: AppRouterData_Route = {
                            iconUrl_in: from.iconUrl,
                            iconUrl_out: target.iconUrl,
                            name_in: from.name,
                            name_out: target.name,
                            amount_in: new BN(item.amount_in.toString()),
                            amount_out: new BN(item.amount_out.toString()),
                            ratio: cro?.total_amount_in
                              ? divideBN(
                                  new BN(item.amount_in.toString()).mul(
                                    new BN(100)
                                  ),
                                  new BN(cro?.total_amount_in.toString()),
                                  10
                                )
                              : '',
                            path: [],
                          };
                          data.routes.push(newItem);
                          for (let j = 0; j < (item.path?.length || 0); j++) {
                            const itemInter = item.path?.[j];
                            const newItemInter: AppRouterData_Route_path = {
                              id: itemInter.id,
                              amount_in: itemInter.amountIn,
                              amount_out: itemInter.amountOut,
                              provider: itemInter.provider,
                              from: {
                                type: itemInter.from,
                              },
                              target: {
                                type: itemInter.target,
                              },
                            };
                            newItem.path.push(newItemInter);
                          }
                        }
                        if (data.routes.length === 0) {
                          if (data.target.amount === 0n) {
                            data.target.amount = data.from.amount;
                          }
                          const router: AppRouterData_Route = {
                            iconUrl_in: from.iconUrl,
                            iconUrl_out: target.iconUrl,
                            name_in: from.name,
                            name_out: target.name,
                            amount_in: new BN(data.from.amount.toString()),
                            amount_out: new BN(data.target.amount.toString()),
                            ratio: '100',
                            path: [],
                          };
                          data.routes.push(router);
                        }
                        if (result) {
                          if (x < 1) {
                            const obj = sdk.formatSwapRoutersResult(
                              result[0],
                              result[1].total_amount_out
                            );
                            const dataItem: AppRouterDataItem = {
                              routerData: data,
                              dex: cro.dex,
                              tx: cro.tx,
                              coinOut: data.target.amount,
                              amountDiff: obj.amountDiff,
                              ratio: 1,
                            };
                            // dataItem.routerData = data;
                            dataItemList.push(dataItem);
                          } else if (x == 1) {
                            const obj = sdk.formatSwapRoutersResult(
                              result[1],
                              result[1].total_amount_out
                            );
                            const dataItem: AppRouterDataItem = {
                              routerData: data,
                              dex: cro.dex,
                              tx: cro.tx,
                              coinOut: data.target.amount,
                              amountDiff: obj.amountDiff,
                              ratio: 1,
                            };
                            // dataItem.routerData = data;
                            dataItemList.push(dataItem);
                          } else if (x > 1) {
                            const obj = sdk.formatSwapRoutersResult(
                              result[x],
                              result[1].total_amount_out
                            );
                            const dataItem: AppRouterDataItem = {
                              routerData: data,
                              dex: cro.dex,
                              tx: cro.tx,
                              coinOut: data.target.amount,
                              amountDiff: obj.amountDiff,
                              ratio: 1,
                            };
                            // dataItem.routerData = data;
                            dataItemList.push(dataItem);
                          }
                        }
                      } else if (cro.dex === '7k') {
                        const routes_data: RouterData7K =
                          cro.routes_data as RouterData7K;
                        const decimal_a = getDecimal(
                          routes_data.swapAmount,
                          routes_data.swapAmountWithDecimal
                        );
                        const data: AppRouterData = {
                          from: {
                            iconUrl: from.iconUrl,
                            name: from.name,
                            amount: cro?.total_amount_in || reallyValueBigint,
                          },
                          target: {
                            iconUrl: target.iconUrl,
                            name: target.name,
                            amount: cro?.total_amount_out,
                          },
                          routes: [],
                        };
                        for (
                          let i = 0;
                          i < (routes_data.routes.length || 0);
                          i++
                        ) {
                          const item = routes_data.routes[i];
                          if (!item) {
                            throw new Error('error');
                          }
                          const amount_in_decimal_str = valueDecimal(
                            item.tokenInAmount,
                            decimal_a
                          );
                          const amount_out_decimal_str = valueDecimal(
                            item.tokenOutAmount,
                            decimal_a
                          );
                          const newItem: AppRouterData_Route = {
                            iconUrl_in: from.iconUrl,
                            iconUrl_out: target.iconUrl,
                            name_in: from.name,
                            name_out: target.name,
                            amount_in: new BN(amount_in_decimal_str),
                            amount_out: new BN(amount_out_decimal_str),
                            ratio: cro?.total_amount_in
                              ? divideBN(
                                  new BN(amount_in_decimal_str).mul(
                                    new BN(100)
                                  ),
                                  new BN(routes_data.swapAmountWithDecimal),
                                  10
                                )
                              : '',
                            path: [],
                          };
                          data.routes.push(newItem);
                          for (let j = 0; j < (item.hops?.length || 0); j++) {
                            const itemInter = item.hops?.[j];
                            const newItemInter: AppRouterData_Route_path = {
                              id: j + '',
                              amount_in: itemInter.tokenInAmount,
                              amount_out: itemInter.tokenOutAmount,
                              provider: itemInter.pool.type,
                              from: {
                                type: itemInter.tokenIn,
                              },
                              target: {
                                type: itemInter.tokenOut,
                              },
                            };
                            newItem.path.push(newItemInter);
                          }
                        }
                        if (data.routes.length === 0) {
                          const router: AppRouterData_Route = {
                            iconUrl_in: from.iconUrl,
                            iconUrl_out: target.iconUrl,
                            name_in: from.name,
                            name_out: target.name,
                            amount_in: new BN(data.from.amount.toString()),
                            amount_out: new BN(data.target.amount.toString()),
                            ratio: '100',
                            path: [],
                          };
                          data.routes.push(router);
                        }
                        if (result) {
                          if (x < 1) {
                            const obj = sdk.formatSwapRoutersResult(
                              result[0],
                              result[1].total_amount_out
                            );
                            const dataItem: AppRouterDataItem = {
                              routerData: data,
                              dex: cro.dex,
                              tx: cro.tx,
                              coinOut: data.target.amount,
                              amountDiff: obj.amountDiff,
                              ratio: 1,
                            };
                            // dataItem.routerData = data;
                            dataItemList.push(dataItem);
                          } else if (x == 1) {
                            const obj = sdk.formatSwapRoutersResult(
                              result[1],
                              result[1].total_amount_out
                            );
                            const dataItem: AppRouterDataItem = {
                              routerData: data,
                              dex: cro.dex,
                              tx: cro.tx,
                              coinOut: data.target.amount,
                              amountDiff: obj.amountDiff,
                              ratio: 1,
                            };
                            // dataItem.routerData = data;
                            dataItemList.push(dataItem);
                          } else if (x > 1) {
                            const obj = sdk.formatSwapRoutersResult(
                              result[x],
                              result[1].total_amount_out
                            );
                            const dataItem: AppRouterDataItem = {
                              routerData: data,
                              dex: cro.dex,
                              tx: cro.tx,
                              coinOut: data.target.amount,
                              amountDiff: obj.amountDiff,
                              ratio: 1,
                            };
                            // dataItem.routerData = data;
                            dataItemList.push(dataItem);
                          }
                        }
                      }
                    }
                    resolve(dataItemList);
                  })
                  .catch((error) => {
                    reject(error);
                  });
              });
            });
        }
      } else if (
        type === 'lending' &&
        stringUtil.isNotEmpty(currentAccount?.address)
      ) {
        return new Promise((resolve, reject) => {
          const swapRouters = sdk.croDeposit(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            apyData!,
            from.type,
            reallyValueBigint,
            slippageSlice.slippageLending,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            currentAccount!.address
          );
          swapRouters
            .then((result) => {
              const dataItemList: AppRouterDataItem[] = [];
              const data: AppRouterData = {
                from: {
                  iconUrl: from.iconUrl,
                  name: from.name,
                  amount:
                    BNTobigint(result?.routers?.amountIn || new BN(0)) ||
                    reallyValueBigint,
                },
                target: {
                  iconUrl: target.iconUrl,
                  name: target.name,
                  amount: BNTobigint(result?.routers?.amountOut || new BN(0)),
                },
                routes: [],
              };
              for (let i = 0; i < (result?.routers?.routes.length || 0); i++) {
                const item = result?.routers?.routes[i];
                if (!item) {
                  throw new Error('error');
                }
                const newItem: AppRouterData_Route = {
                  iconUrl_in: from.iconUrl,
                  iconUrl_out: target.iconUrl,
                  name_in: from.name,
                  name_out: target.name,
                  amount_in: item.amountIn,
                  amount_out: item.amountOut,
                  ratio: result?.routers?.amountIn
                    ? divideBN(
                        item.amountIn.mul(new BN(100)),
                        result?.routers?.amountIn,
                        10
                      )
                    : '',
                  path: [],
                };
                data.routes.push(newItem);
                for (let j = 0; j < (item.path?.length || 0); j++) {
                  const itemInter = item.path?.[j];
                  const newItemInter: AppRouterData_Route_path = {
                    id: itemInter.id,
                    amount_in: itemInter.amountIn,
                    amount_out: itemInter.amountOut,
                    provider: itemInter.provider,
                    from: {
                      type: itemInter.from,
                    },
                    target: {
                      type: itemInter.target,
                    },
                  };
                  newItem.path.push(newItemInter);
                }
              }
              if (data.routes.length === 0) {
                if (data.target.amount === 0n) {
                  data.target.amount = data.from.amount;
                }
                const router: AppRouterData_Route = {
                  iconUrl_in: from.iconUrl,
                  iconUrl_out: target.iconUrl,
                  name_in: from.name,
                  name_out: target.name,
                  amount_in: new BN(data.from.amount.toString()),
                  amount_out: new BN(data.target.amount.toString()),
                  ratio: '100',
                  path: [],
                };
                data.routes.push(router);
              }

              const dataItem: AppRouterDataItem = {
                routerData: data,
                dex: 'Cetus',
                tx: result?.tx,
                coinOut: data.target.amount,
                amountDiff: 0n,
                ratio: 1,
              };
              // dataItem.routerData = data;
              dataItemList.push(dataItem);
              resolve(dataItemList);
            })
            .catch((error) => {
              reject(error);
            });
        });
      } else {
        return new Promise((resolve, reject) => {
          const swapRouters = sdk.getSwapRouters(
            from.type,
            target.type,
            convertToBigInt(decimals, amount)
          );
          swapRouters
            .then((result) => {
              const dataItemList: AppRouterDataItem[] = [];
              if (
                !result ||
                result.routes === null ||
                result.routes.length === 0
              ) {
                resolve(dataItemList);
                return;
              }
              const data: AppRouterData = {
                from: {
                  iconUrl: from.iconUrl,
                  name: from.name,
                  amount:
                    BNTobigint(result?.amountIn || new BN(0)) ||
                    reallyValueBigint,
                },
                target: {
                  iconUrl: target.iconUrl,
                  name: target.name,
                  amount: BNTobigint(result?.amountOut || new BN(0)),
                },
                routes: [],
              };
              for (let i = 0; i < (result?.routes.length || 0); i++) {
                const item = result?.routes[i];
                if (!item) {
                  throw new Error('error');
                }
                const newItem: AppRouterData_Route = {
                  iconUrl_in: from.iconUrl,
                  iconUrl_out: target.iconUrl,
                  name_in: from.name,
                  name_out: target.name,
                  amount_in: item.amountIn,
                  amount_out: item.amountOut,
                  ratio: result?.amountIn
                    ? divideBN(
                        item.amountIn.mul(new BN(100)),
                        result?.amountIn,
                        10
                      )
                    : '',
                  path: [],
                };
                data.routes.push(newItem);
                for (let j = 0; j < (item.path?.length || 0); j++) {
                  const itemInter = item.path?.[j];
                  const newItemInter: AppRouterData_Route_path = {
                    id: itemInter.id,
                    amount_in: itemInter.amountIn,
                    amount_out: itemInter.amountOut,
                    provider: itemInter.provider,
                    from: {
                      type: itemInter.from,
                    },
                    target: {
                      type: itemInter.target,
                    },
                  };
                  newItem.path.push(newItemInter);
                }
              }
              if (data.routes.length === 0) {
                if (data.target.amount === 0n) {
                  data.target.amount = data.from.amount;
                }
                const router: AppRouterData_Route = {
                  iconUrl_in: from.iconUrl,
                  iconUrl_out: target.iconUrl,
                  name_in: from.name,
                  name_out: target.name,
                  amount_in: new BN(data.from.amount.toString()),
                  amount_out: new BN(data.target.amount.toString()),
                  ratio: '100',
                  path: [],
                };
                data.routes.push(router);
              }

              const dataItem: AppRouterDataItem = {
                routerData: data,
                dex: 'Cetus',
                tx: undefined,
                coinOut: data.target.amount,
                amountDiff: 0n,
                ratio: 1,
              };
              // dataItem.routerData = data;
              dataItemList.push(dataItem);
              resolve(dataItemList);
            })
            .catch((error) => {
              reject(error);
            });
        });
      }
    },
    enabled:
      (inView || stringUtil.isNotEmpty(currentAccount?.address)) &&
      stringUtil.isNotEmpty(from) &&
      stringUtil.isNotEmpty(target) &&
      stringUtil.isNotEmpty(amount) &&
      amount !== '0' &&
      (reallyValueBigint !== 0n || stringUtil.isEmpty(currentAccount?.address)),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime:
      type === 'swap' && stringUtil.isNotEmpty(currentAccount?.address)
        ? 1000 * 3
        : 1000 * 10,
    gcTime:
      type === 'swap' && stringUtil.isNotEmpty(currentAccount?.address)
        ? 1000 * 6
        : 1000 * 20,
    refetchInterval: refetchInterval
      ? type === 'swap' && stringUtil.isNotEmpty(currentAccount?.address)
        ? 1000 * 3
        : 1000 * 10
      : false,
    // refetchIntervalInBackground: true, //******
  });
};
