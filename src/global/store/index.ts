import globalConstantsReducer from "../state/constants";
import elementDimensionsReducer from "../state/ElementDimensions/index";
import flagsReducer from "../state/Flags";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import othersReducer from "../state/others";

const rootReducer = combineReducers({
  globalConstants: globalConstantsReducer,
  elementsDimensions: elementDimensionsReducer,
  flags: flagsReducer,
  others: othersReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas rutas en el chequeo de serialización
        ignoredPaths: ["others.globalSocket.socket"],
        // Ignorar estas acciones
        ignoredActions: [
          "globalSocket/setGlobalSocket",
          "globalSocket/clearGlobalSocket",
        ],
      },
    });
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
