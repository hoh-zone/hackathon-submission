import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Coin, CSUI, SUI } from 'cro-sdk';

// **
export interface CoinOut {
  coinLendingIn: Coin;
  coinSwapIn: Coin;
  coinSwapOut: Coin;
  coinStakeIn: Coin;
  coinStakeOut: Coin;
  coinUnStakeIn: Coin;
  coinUnStakeOut: Coin;
}
// *****
const initialState: CoinOut = {
  coinLendingIn: {
    decimals: 9,
    iconUrl:
      'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/sui-coin.svg/public',
    id: 308,
    name: 'SUI',
    show: 4,
    symbol: 'SUI',
    type: SUI,
  },
  coinSwapIn: {
    decimals: 9,
    iconUrl:
      'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/sui-coin.svg/public',
    id: 308,
    name: 'SUI',
    show: 4,
    symbol: 'SUI',
    type: SUI,
  },
  coinSwapOut: {
    decimals: 6,
    iconUrl: 'https://circle.com/usdc-icon',
    id: 6,
    name: 'USDC',
    show: 3,
    symbol: 'USDC',
    type: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  },
  coinStakeIn: {
    decimals: 9,
    iconUrl:
      'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/sui-coin.svg/public',
    id: 308,
    name: 'SUI',
    show: 4,
    symbol: 'SUI',
    type: SUI,
  },
  coinUnStakeIn: {
    decimals: 9,
    iconUrl: 'https://cro-ag.pages.dev/csui.png',
    id: 4467,
    name: 'cSUI',
    show: 99,
    symbol: 'cSUI',
    type: CSUI,
  },
  coinStakeOut: {
    decimals: 9,
    iconUrl: 'https://cro-ag.pages.dev/csui.png',
    id: 4467,
    name: 'cSUI',
    show: 99,
    symbol: 'cSUI',
    type: CSUI,
  },
  coinUnStakeOut: {
    decimals: 9,
    iconUrl:
      'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/sui-coin.svg/public',
    id: 308,
    name: 'SUI',
    show: 4,
    symbol: 'SUI',
    type: SUI,
  },
};
// ****Slice**
export const currentCoinTypeSlice = createSlice({
  name: 'currentCoinType',
  // `createSlice` ** `initialState` ********
  initialState,
  // **reducer*****
  reducers: {
    updateCurrentCoinLendingIn: (state, action: PayloadAction<Coin>) => {
      state.coinLendingIn = action.payload;
    },
    updateCurrentCoinSwapIn: (state, action: PayloadAction<Coin>) => {
      state.coinSwapIn = action.payload;
    },
    updateCurrentCoinSwapOut: (state, action: PayloadAction<Coin>) => {
      state.coinSwapOut = action.payload;
    },
    updateCurrentCoinStakeIn: (state, action: PayloadAction<Coin>) => {
      state.coinStakeIn = action.payload;
    },
    updateCurrentCoinStakeOut: (state, action: PayloadAction<Coin>) => {
      state.coinStakeOut = action.payload;
    },
    updateCurrentCoinUnStakeIn: (state, action: PayloadAction<Coin>) => {
      state.coinUnStakeIn = action.payload;
    },
    updateCurrentCoinUnStakeOut: (state, action: PayloadAction<Coin>) => {
      state.coinUnStakeOut = action.payload;
    },
  },
});
// ****，**redux*actions **dispatch****
export const {
  updateCurrentCoinLendingIn,
  updateCurrentCoinSwapIn,
  updateCurrentCoinSwapOut,
  updateCurrentCoinStakeIn,
  updateCurrentCoinStakeOut,
  updateCurrentCoinUnStakeIn,
  updateCurrentCoinUnStakeOut,
} = currentCoinTypeSlice.actions;

// *******
export const currentCoinType = (state: RootState) => state.coinType;

// **reducer
export default currentCoinTypeSlice.reducer;
