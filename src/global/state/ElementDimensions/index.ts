import { combineReducers } from "redux";
import headerHeightSlice from "./headerHeight";
import windowsHeightSlice from './windowHeight';
import windowWidthSlice from './windowWidth';

const elementDimensions = combineReducers({
    headerHeight: headerHeightSlice,
    windowHeight: windowsHeightSlice,
    windowWidth: windowWidthSlice
});

export default elementDimensions;
