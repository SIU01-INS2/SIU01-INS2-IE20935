import { combineReducers } from "redux";
import urlAPISlice from "./urlAPI";

const globalConstantsReducer = combineReducers({
  urlAPI: urlAPISlice,
});

export default globalConstantsReducer;
