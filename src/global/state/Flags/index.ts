import { combineReducers } from "redux";
import sidebarIsOpenSlice from "./sidebarIsOpen";
import thereIsDataCouldBeLostSlice from "./thereIsDataCouldBeLost";

const flags = combineReducers({
  sidebarIsOpen: sidebarIsOpenSlice,
  dataCouldBeLost: thereIsDataCouldBeLostSlice,
});

export default flags;
