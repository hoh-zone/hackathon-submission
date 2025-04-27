import { CURRENT_COIN_BTN_TYPES, CurrentCoinBtnType } from '@/constants';
import { CoinOut } from '@/store/feature/currentCoinTypeSlice';
import { Coin } from 'cro-sdk';

export const coinByCons = (
  btnType: CurrentCoinBtnType,
  currentCoin: CoinOut
): Coin | undefined => {
  if (btnType === CURRENT_COIN_BTN_TYPES[0]) {
    return currentCoin.coinLendingIn;
  } else if (btnType === CURRENT_COIN_BTN_TYPES[1]) {
    return currentCoin.coinSwapIn;
  } else if (btnType === CURRENT_COIN_BTN_TYPES[2]) {
    return currentCoin.coinSwapOut;
  } else if (btnType === CURRENT_COIN_BTN_TYPES[3]) {
    return currentCoin.coinStakeIn;
  } else if (btnType === CURRENT_COIN_BTN_TYPES[4]) {
    return currentCoin.coinStakeOut;
  } else if (btnType === CURRENT_COIN_BTN_TYPES[5]) {
    return currentCoin.coinUnStakeIn;
  } else if (btnType === CURRENT_COIN_BTN_TYPES[6]) {
    return currentCoin.coinUnStakeOut;
  }
};
