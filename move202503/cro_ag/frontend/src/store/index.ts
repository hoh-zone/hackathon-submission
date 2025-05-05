import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import appReducer from './feature/appSlice';
import userSlice from './feature/userSlice';
import currentCoinTypeSlice from './feature/currentCoinTypeSlice';
import slippageSlice from './feature/slippageSlice';
import feeRatesSlice from './feature/feeRatesSlice';
// **store
export const store = configureStore({
  // feature******reducer *********
  reducer: {
    app: appReducer,
    user: userSlice,
    coinType: currentCoinTypeSlice,
    slippageSlice,
    feeRatesSlice,
  },
  // ***
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  // redux-devtools-extension****
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
