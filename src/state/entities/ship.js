import { combineReducers } from "redux";
import body from "../attributes/body";
import validation from "../attributes/validation";
import power from "../attributes/power";
import pathPosition from "../attributes/pathPosition";
export default combineReducers({
  body,
  validation,
  power,
  pathPosition
});
