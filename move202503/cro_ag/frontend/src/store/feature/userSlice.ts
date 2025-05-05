import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';

type UserType = { [props: string]: string | number | boolean };
export interface UserState {
  users: UserType[];
  total: number;
}
const initialState: UserState = {
  users: [],
  total: 0,
};

// createAsyncThunk******action，return****，**extraReducers***，*****：
// pending（***）、fulfilled（**）、rejected（**）
export const getUserData = createAsyncThunk('user/getList', async () => {
  const res = await fetch('https://api.github.com/search/users?q=wang').then(
    (res) => res.json()
  );
  return res;
});

// **** Slice
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Reducer ***** Immer *** Immutable **，***** state
    deleteUser: (state, { payload }) => {
      state.users = state.users.filter((user) => user.id !== payload);
      state.total -= 1;
    },
  },
  // extraReducers ** createAsyncThunk***
  extraReducers(builder) {
    builder
      .addCase(getUserData.pending, () => console.log('loading...'))
      // *******fulfilled** **********state*****
      .addCase(getUserData.fulfilled, (state, { payload }) => {
        state.users = payload.items;
        state.total = payload.total_count;
      })
      .addCase(getUserData.rejected, (_, err) => console.log('error', err));
  },
});

export const { deleteUser } = userSlice.actions;
export const selectUser = (state: RootState) => state.user.users;
export default userSlice.reducer;
