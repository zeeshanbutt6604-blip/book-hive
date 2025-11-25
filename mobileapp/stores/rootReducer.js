import { combineReducers } from "redux";

import userReducer from "./user/userSlice";

const rootReducer = combineReducers({
  user: userReducer,
});

export default rootReducer;
