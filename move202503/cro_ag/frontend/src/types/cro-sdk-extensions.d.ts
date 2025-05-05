// types/cro-sdk-extensions.d.ts
import BN from 'bn.js';
import 'cro-sdk'; // *****
import Decimal from 'decimal.js';
declare module 'cro-sdk' {
  // *** index.d.ts * Coin ******：
  // type Coin = { id: string; name: string; ... }
  // ************
  //   export type Coin = {
  //     id: number;
  //     show: number;
  //     type: string;
  //     name: string;
  //     symbol: string;
  //     decimals: number;
  //     iconUrl: string;
  //   };
  //   export type ApyData = {
  //   }
  type Path = {
    id: string;
    direction: boolean;
    provider: string;
    from: string;
    target: string;
    feeRate: number;
    amountIn: string;
    amountOut: string;
    version?: string;
    extendedDetails?: ExtendedDetails;
  };
  type Router = {
    path: Path[];
    amount_in: bigint;
    amount_out: bigint;
    initialPrice: Decimal;
  };
  type RouterError = {
    code: number;
    msg: string;
  };
  type RouterData = {
    amount_in: BN;
    amount_out: BN;
    routes: Router[];
  };
  type Hop = {
    poolId: string;
    pool: { type: string };
    tokenIn: string; //":"0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    tokenInAmount: string; //":"0.267515092",
    tokenOut: string; //":"0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI",
    tokenOutAmount: string; //":"0.265377115"
  };
  type Router7K = {
    hops: Hop[];
    tokenIn: string; //":"0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    tokenInAmount: string; //":"0.267515092",
    tokenOut: string; //":"0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    tokenOutAmount: string; //":"0.640694
  };
  type RouterData7K = {
    swapAmount: string;
    returnAmount: string;
    swapAmountWithDecimal: string;
    returnAmountWithDecimal: string;
    tokenIn: string;
    tokenOut: string;
    marketSp: string;
    routes: Router7K[];
    effectivePrice: number;
    effectivePriceReserved: number;
    priceImpact: number;
  };

  type SwapResult = {
    dex: string;
    total_amount_in: bigint;
    total_amount_out: bigint;
    routes_data: RouterData | RouterData7K;
    tx: Transaction;
  };
}
