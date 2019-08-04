import { combineReducers } from "redux";
import body from "../attributes/body";
import quality from "../attributes/quality";

export default combineReducers({
  body,
  target: () => true,
  quality
});
