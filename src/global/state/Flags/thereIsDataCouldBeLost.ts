import { ReduxPayload } from "@/global/state/ReducersPayload";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = false;

const thereIsDataCouldBeLostSlice = createSlice({
  name: "dataCouldBeLost",
  initialState,
  reducers: {
    setDataCouldBeLost(state, action: PayloadAction<ReduxPayload<boolean>>) {
      return action.payload.value;
    },
  },
});

export const { setDataCouldBeLost } = thereIsDataCouldBeLostSlice.actions;
export default thereIsDataCouldBeLostSlice.reducer;
