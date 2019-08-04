import _ from "lodash";
import * as R from "ramda";
import { createActions } from "../../util";
import { createCollider } from "../attributes/collider";
import shipReducer from "./ship";
import obstacleReducer from "./obstacle";

export const actors = {
  initialize: initObj => s => ({ ...s, ...initObj }),
  addEntities: newE => R.over(R.lensPath(["live"]), e => ({ ...e, ...newE })),
  createEntity: ({ type, id, data }) => entities => ({
    ...entities,
    [id]: {
      entityType: type,
      data
    }
  }),
  removeEntity: ({ id }) => entities => ({
    dead: { ...entities.dead, [id]: entities.live[id] },
    live: R.omit([id], entities.live)
  }),
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
      data: {
        ...shipReducer(),
        collider: createCollider({
          self: { type: "removeEntity" },
          other: null
        })
      }
    },
    o1: {
      entityType: "obstacle",
      data: {
        ...shipReducer(),
        collider: createCollider({
          self: null,
          other: { type: "removeEntity" }
        }),
        body: { x: 500, y: 500, r: 15 }
      }
    }
  },
  dead: {}
};

const typeReducerMap = {
  ship: shipReducer,
  obstacle: obstacleReducer
};

const entitiesReducer = (entities = initialState, { type, id, payload }) => {
  if (!id || id in entities.dead) return entities;

  const { entityType, data } = entities.live[id];

  if (type in actors) {
    return actors[type]({ id, ...payload })(entities);
  }

  return R.set(
    R.lensPath(["live", id, "data"]),

    typeReducerMap[entityType](data, { type, payload }),

    entities
  );
};

export default entitiesReducer;

export const getEntity = _.curry((id, s) =>
  s.entities.live[id]
    ? {
        id,
        entityType: s.entities.live[id].entityType,
        ...s.entities.live[id].data
      }
    : {}
);
export const getDeadEntity = _.curry((id, s) => s.entities.dead[id].data);
export const getEntitiesArray = (s, ...ignore) =>
  Object.entries(s.entities.live)
    .map(([id, { entityType, data }]) => ({
      id,
      entityType,
      ...data
    }))
    .filter(({ id }) => !ignore.includes(id));
