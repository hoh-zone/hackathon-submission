import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '..';

// **
export interface AppState {
  count: number;
}
// *****
const initialState: AppState = {
  count: 0,
};
// ****Slice**
export const appSlice = createSlice({
  name: 'app',
  // `createSlice` ** `initialState` ********
  initialState,
  // **reducer*****
  reducers: {
    incremented: (state) => {
      state.count += 1;
    },
    // payload********
    decremented: (state, action: PayloadAction<number>) => {
      state.count -= action.payload;
    },
  },
});
// ****，**redux*actions **dispatch****
export const { incremented, decremented } = appSlice.actions;

// *******
export const selectCount = (state: RootState) => state.app.count;

// **reducer
export default appSlice.reducer;
