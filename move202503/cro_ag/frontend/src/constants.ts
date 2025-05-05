export const CURRENT_COIN_BTN_TYPES = [
  'lendingIn',
  'swapIn',
  'swapOut',
  'stakeIn',
  'stakeOut',
  'unStakeIn',
  'unStakeOut',
] as const;
export type CurrentCoinBtnType = (typeof CURRENT_COIN_BTN_TYPES)[number];
export type SelectCoinBtnProps = {
  btnType: CurrentCoinBtnType;
  onComplete?: () => void;
};
