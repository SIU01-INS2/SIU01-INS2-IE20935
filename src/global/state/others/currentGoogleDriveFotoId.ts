import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxPayload } from "../ReducersPayload";

const initialState: string | null = null;

const currentGoogleDriveFotold = createSlice({
  name: "currentGoogleDriveFotold",
  initialState: initialState as string | null,
  reducers: {
    setCurrentGoogleDriveFotold: (
      state,
      action: PayloadAction<ReduxPayload<string | null>>
    ) => {
      return action.payload.value;
    },
  },
});

export const { setCurrentGoogleDriveFotold } = currentGoogleDriveFotold.actions;
export default currentGoogleDriveFotold.reducer;
//
