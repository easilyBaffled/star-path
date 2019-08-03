import R from "ramda";
import { createActions, createReducer } from "../../util";

const intialState = [];

export const invalidMove = "invalidMove";

export const actors = {
  add: (...args) => s => s.concat(args),
  addInvalidMove: () => actors.add(invalidMove),
  set: (...args) => () => args,
  remove: (...args) => s => console.tap(s.filter(v => !args.includes(v)))
};

export const actions = createActions(actors);
export default createReducer(actors, intialState);

export const getValidation = s => s.validation;
export const isInvalidMove = R.pipe(
  getValidation,
  v => v.includes(invalidMove)
);
