import _ from "lodash";
import R from "ramda";
import { createActions, createReducer } from "../../util";
import { actions as bodyActions } from "../attributes/body";

import shipReducer from "./ship";

export const actors = {
  initialize: initObj => s => ({ ...s, ...initObj }),
  createEntity: ({ type, id, data }) => entities => ({
    ...entities,
    [id]: {
      entityType: type,
      data
    }
  }),
  removeEntity: ({ id }) => entities => ({
    dead: { ...entities.dead, [id]: entities },
    live: R.omit([id], entities)
  }),
  // removeEntity: ({ id }) => entities =>
  //   Object.entries(entities).reduce(
  //     (acc, [k, v]) => (id === k ? acc : { ...acc, [k]: v }),
  //     {}
  //   ),
  clearTheDead: () => ({ dead, live }) => ({ dead: {}, live }),
  updateEntity: ({ id, updater }) => entities => ({
    ...entities,
    [id]:
      typeof updater === "function"
        ? updater(getEntity(id, entities))
        : { ...getEntity(id, entities), ...updater }
  }),
  "": () => s => s
};

export const actions = createActions(actors);

const initialState = {
  live: {
    player: {
      entityType: "ship",
      data: shipReducer()
    }
  },
  dead: {}
};

const typeReducerMap = {
  ship: shipReducer
};

const entitiesReducer = (entities = initialState, { type, id, payload }) => {
  if (!id) return entities;
  const { entityType, data } = entities.live[id];

  // if( !( entityType in reducerMap ) ) {
  //   throw new Error( `Improper Entity ${entityType} is not in the reducerMap` )
  // }

  if (type in actors) return actors[type]({ id, ...payload })(entities);

  return R.set(
    R.lensPath(["live", id, "data"]),
    typeReducerMap[entityType](data, { type, payload }),
    entities
  );
};

export default entitiesReducer;

export const getEntity = _.curry((id, s) => ({
  id,
  entityType: s.entities.live[id].entityType,
  ...s.entities.live[id].data
}));
export const getDeadEntity = _.curry((id, s) => s.entities.dead[id].data);
export const getEntitiesArray = s =>
  Object.entries(s.entities.live).map(([id, { entityType, data }]) => ({
    id,
    entityType,
    ...data
  }));
