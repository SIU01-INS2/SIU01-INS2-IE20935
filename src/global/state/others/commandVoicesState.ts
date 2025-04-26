import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxPayload } from "../ReducersPayload";
import { CommandVoicesStates } from "@/interfaces/CommandVoicesState";

const initialState = CommandVoicesStates.IDLE;

const commandVoicesStateSlice = createSlice({
  name: "commandVoicesState",
  initialState,
  reducers: {
    setCommandVoicesState(
      state,
      action: PayloadAction<ReduxPayload<CommandVoicesStates>>
    ) {
      return action.payload.value;
    },
  },
});

const { setCommandVoicesState } = commandVoicesStateSlice.actions;

export { setCommandVoicesState };
export default commandVoicesStateSlice.reducer;
