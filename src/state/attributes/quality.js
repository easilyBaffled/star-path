import { createActions, createReducer } from "../../util";
import * as R from "ramda";

const initialState = {};

const qLens = R.lensPath(["quality"]);
const withProp = (...propNames) =>
  R.pipe(
    qLens,
    R.lensPath(propNames)
  );

export const actors = {
  set: ({ v, propName }) => R.set(withProp(propName), v),
  increase: ({ v, propName }) =>
    R.over(withProp(propName), original => original + v),
  decrease: ({ v, propName }) =>
    R.over(withProp(propName), original => original - v)
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getQuality = () => R.view(qLens);
