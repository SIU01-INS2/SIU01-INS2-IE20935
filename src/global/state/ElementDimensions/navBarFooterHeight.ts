import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxPayload } from "../ReducersPayload";

const initialState = 0;

const navBarFooterHeightSlice = createSlice({
  name: "navBarFooterHeight",
  initialState,
  reducers: {
    setNavBarFooterHeight(state, action: PayloadAction<ReduxPayload<number>>) {
      return action.payload.value;
    },
  },
});

export const { setNavBarFooterHeight } = navBarFooterHeightSlice.actions;
export default navBarFooterHeightSlice.reducer;
