import { combineReducers } from "redux";
import currentGoogleDriveFotoldSlice from "./currentGoogleDriveFotoId";
import fechaHoraActualRealSlice from "./fechaHoraActualReal";
import commandVoicesStateSlice from "./commandVoicesState";
import globalSocketSlice from "./globalSocket";

const others = combineReducers({
  globalSocket: globalSocketSlice,
  currentGoogleDriveFotold: currentGoogleDriveFotoldSlice,
  fechaHoraActualReal: fechaHoraActualRealSlice,
  commandVoicesState: commandVoicesStateSlice,
});

export default others;
