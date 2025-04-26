import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxPayload } from "../ReducersPayload";

const initialState = 0;

const windowWidthSlice = createSlice({
  name: "windowWidth",
  initialState,
  reducers: {
    setWindowWidth(state, action: PayloadAction<ReduxPayload<number>>) {
      return action.payload.value;
    },
  },
});

export const { setWindowWidth } = windowWidthSlice.actions;
export default windowWidthSlice.reducer;
