import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxPayload } from "../ReducersPayload";

const initialState = 0;

const headerHeightSlice = createSlice({
  name: "headerHeight",
  initialState,
  reducers: {
    setHeaderHeight(state, action: PayloadAction<ReduxPayload<number>>) {
      return action.payload.value;
    },
  },
});

export const { setHeaderHeight } = headerHeightSlice.actions;
export default headerHeightSlice.reducer;
