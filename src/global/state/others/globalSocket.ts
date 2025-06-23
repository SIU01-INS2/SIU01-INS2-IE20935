import { ReduxPayload } from "@/global/state/ReducersPayload";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Definir una interfaz para el estado del socket
interface SocketState {
  socket: SocketIOClient.Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: SocketState = {
  socket: null,
  isConnected: false,
  connectionError: null,
};

const globalSocketSlice = createSlice({
  name: "globalSocket",
  initialState,
  reducers: {
    setGlobalSocket(
      state,
      action: PayloadAction<ReduxPayload<SocketIOClient.Socket>>
    ) {
      state.socket = action.payload.value;
      state.isConnected = true;
      state.connectionError = null;
    },
    clearGlobalSocket(state) {
      state.socket = null;
      state.isConnected = false;
      state.connectionError = null;
    },
    setConnectionError(
      state,
      action: PayloadAction<ReduxPayload<string | null>>
    ) {
      state.connectionError = action.payload.value;
      state.isConnected = false;
    },
    setConnectionStatus(state, action: PayloadAction<ReduxPayload<boolean>>) {
      state.isConnected = action.payload.value;
    },
  },
});

export const {
  setGlobalSocket,
  clearGlobalSocket,
  setConnectionError,
  setConnectionStatus,
} = globalSocketSlice.actions;

export default globalSocketSlice.reducer;
