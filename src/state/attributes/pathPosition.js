import R from "ramda";
import { createActions, createReducer } from "../../util";

const pathPosition = R.lensPath(["pathPosition"]);
const lenPos = R.lensPath(["lengthPosition"]);
const pathId = R.lensPath(["pathId"]);

const initialState = {
  lengthPosition: 0,
  pathId: 0
};

export const actors = {
  setLength: l => R.set(lenPos, l),
  increaseLength: addition => R.over(lenPos, l => l + addition),
  decreaseLength: reduction => R.over(lenPos, l => l - reduction),
  changePath: newId => R.set(pathId, newId)
};

export const actions = createActions(actors);
export default createReducer(actors, initialState);

const getter = (...lenses) =>
  R.compose(
    pathPosition,
    ...lenses
  );

export const getLength = R.view(getter(lenPos));
export const getPathId = R.view(getter(pathId));
