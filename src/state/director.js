import * as R from "ramda";
import { combineReducers } from "redux";
import { createActions } from "../util";
import entities, { getEntity } from "./entities/entities";
import { actors as move, getPosition } from "./attributes/body";
import { actions as validate } from "./attributes/validation";
import { actions as pathing } from "./attributes/pathPosition";
const actors = {
  doneAnimating: id => s => ({ ...s, isAnimating: false })
};

export const actions = createActions(actors);

const reducers = combineReducers({
  entities
});
let testFlag = 2;
const director = (
  state = { isAnimating: false, validation: {}, locations: {} },
  prevState = { validation: {}, locations: {} },
  { type, payload, id } = {}
) =>
  R.pipe(
    s => {
      if (!(type in move)) return s;
      const { x, y } = getPosition(getEntity(id, s));
      if (y >= 2) {
        return reducers(prevState, { id, ...validate.addInvalidMove() });
        //entities(s.entities, validate.add("invalid move"));
      }
      return s;
      // return y > 10 ? prevState : s;
    },
    s => ({
      ...s,
      isAnimating: type in move || type in pathing //!(type === "doneAnimating"),
    })
  )(state);
const directedApp = (...args) => {
  console.groupCollapsed("director args", args[1].type, args);
  try {
    const res = console.tap(director(reducers(...args), ...args));
    console.groupEnd();
    return res;
    //return director(reducers(...args), ...args);
  } catch (e) {
    console.groupEnd();
    console.error(...args);
    throw e;
  }
};
export default directedApp;

export const isAnimating = s => s.isAnimating;
