import { combineReducers } from "redux";
import currentGoogleDriveFotoldSlice from "./currentGoogleDriveFotoId";
import fechaHoraActualRealSlice from "./fechaHoraActualReal";
import commandVoicesStateSlice from "./commandVoicesState";

const others = combineReducers({
  currentGoogleDriveFotold: currentGoogleDriveFotoldSlice,
  fechaHoraActualReal: fechaHoraActualRealSlice,
  commandVoicesState: commandVoicesStateSlice,
});

export default others;
