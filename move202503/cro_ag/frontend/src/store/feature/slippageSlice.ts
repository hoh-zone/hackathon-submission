import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '..';
import { CURRENT_COIN_BTN_TYPES } from '@/constants';

// **
export interface SlippageOut {
  slippageLending: number;
  slippageSwap: number;
}
// *****
const initialState: SlippageOut = {
  slippageLending:
    Number(localStorage.getItem(CURRENT_COIN_BTN_TYPES[0])) || 0.01,
  slippageSwap:
    Number(localStorage.getItem(CURRENT_COIN_BTN_TYPES[1])) || 0.005,
};
// ****Slice**
export const slippageSlice = createSlice({
  name: 'slippage',
  // `createSlice` ** `initialState` ********
  initialState,
  // **reducer*****
  reducers: {
    updateSlippageLending: (state, action: PayloadAction<number>) => {
      state.slippageLending = action.payload;
      localStorage.setItem(
        CURRENT_COIN_BTN_TYPES[0],
        action.payload.toString()
      );
    },
    updateSlippageSwap: (state, action: PayloadAction<number>) => {
      state.slippageSwap = action.payload;
      localStorage.setItem(
        CURRENT_COIN_BTN_TYPES[1],
        action.payload.toString()
      );
    },
  },
});
// ****，**redux*actions **dispatch****
export const { updateSlippageLending, updateSlippageSwap } =
  slippageSlice.actions;

// *******
export const slippage = (state: RootState) => state.slippageSlice;

// **reducer
export default slippageSlice.reducer;
