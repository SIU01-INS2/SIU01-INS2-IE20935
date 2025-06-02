import { combineReducers } from "redux";
import headerHeightSlice from "./headerHeight";
import windowsHeightSlice from "./windowHeight";
import windowWidthSlice from "./windowWidth";
import navBarFooterHeightSlice from "./navBarFooterHeight";

const elementDimensions = combineReducers({
  headerHeight: headerHeightSlice,
  navBarFooterHeight: navBarFooterHeightSlice,
  windowHeight: windowsHeightSlice,
  windowWidth: windowWidthSlice,
});

export default elementDimensions;
