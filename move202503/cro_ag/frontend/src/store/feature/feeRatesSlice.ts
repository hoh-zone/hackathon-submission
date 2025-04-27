import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '..';

export interface FeeRatesOut {
  fee: number | undefined;
}
const initialState: FeeRatesOut = {
  fee: undefined,
};
export const feeRatesSlice = createSlice({
  name: 'feeRates',
  initialState,
  reducers: {
    updateFee: (state, action: PayloadAction<number>) => {
      state.fee = action.payload;
    },
  },
});
export const { updateFee } = feeRatesSlice.actions;

export const feeRates = (state: RootState) => state.feeRatesSlice;

export default feeRatesSlice.reducer;
