import globalConstantsReducer from "../state/constants";
import elementDimensionsReducer from "../state/ElementDimensions/index";
import flagsReducer from "../state/Flags";
import { combineReducers, configureStore } from "@reduxjs/toolkit";

const rootReducer = combineReducers({
  globalConstants: globalConstantsReducer,
  elementsDimensions: elementDimensionsReducer,
  flags: flagsReducer,
});

const store = configureStore({ reducer: rootReducer });

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
