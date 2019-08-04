import { useRef } from "react";
import * as R from "ramda";
import _ from "lodash";
import { combineReducers } from "redux";
import { createActions } from "../util";
import entities, {
  getEntity,
  getDeadEntity,
  getEntitiesArray,
  actors as entityActors
} from "./entities/entities";
import { actors as move, getPosition, getRadius } from "./attributes/body";
import { actions as validate } from "./attributes/validation";
import { actions as pathing, getPathId } from "./attributes/pathPosition";
import { createCollider, getCollisionAction } from "./attributes/collider";
import { getWeaponPower } from "./attributes/power";
import shipReducer from "./entities/ship";
import pathPosition from "./attributes/pathPosition";
const actors = {
  doneAnimating: id => s => ({
    ...s,
    isAnimating: { ...s.isAnimating, [id]: false }
  })
};

export const actions = createActions(actors);

const reducers = combineReducers({
  entities,
  isAnimating: (v = {}) => v,
  validation: (v = {}) => v,
  paths: (v = {}) => v
});

const isMinDistance = (p1, p2, dist) =>
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) < dist;

const isColliding = _.curry((e1, p1, e2) => {
  const r1 = getRadius(e1);

  const r2 = getRadius(e2);
  const p2 = getPosition(e2);

  return (
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) < r1 + r2
  );
});

const collisionTesting = (s, p1, id) => {
  const actingEntity = getEntity(id, s);
  if (_.isEmpty(actingEntity)) return s;

  const collisions = getEntitiesArray(s, id).filter(
    isColliding(actingEntity, p1)
  );
  if (collisions.length === 0) return s;

  const filteredActions = collisions.concat(actingEntity).map(e => ({
    id: e.id,
    ...getCollisionAction(e)
  }));

  const responseGroup = filteredActions.reduce(
    (std, action) => (action.other ? std.concat(action.other) : std),
    []
  );

  const collisionActions = filteredActions.map(({ id, self, other }) => {
    const [first, second] = R.splitWhen(R.equals(other), responseGroup);

    return console
      .tap(
        [...first, self, ...second.slice(1)]
          .filter(v => v)
          .map(a => ({
            ...a,
            id
          }))
      )
      .filter(({ id, ignore }) => id !== ignore);
  });

  const newEntities = collisionActions.reduce(
    (e, actions) => actions.reduce(entities, e),
    s.entities
  );

  return { ...s, entities: newEntities };
};

const weponsCheck = (s, p1) => {
  const player = getEntity("player", s);
  if (_.isEmpty(player)) return s;

  const newPaths = getEntitiesArray(s, "player")
    .filter(e => isMinDistance(p1, getPosition(e), getWeaponPower(player) * 3))
    .map(t => getPosition(t))
    .reduce(
      (paths, endPos) =>
        `M ${p1.x} ${p1.y} L ${endPos.x} ${endPos.y}` in s.paths
          ? paths
          : {
              ...paths,
              [`M ${p1.x} ${p1.y} L ${endPos.x} ${endPos.y}`]: {
                startPosition: p1,
                instructions: `M ${p1.x} ${p1.y} L ${endPos.x} ${endPos.y}`,
                fill: "none",
                stroke: "none",
                //ref: useRef(null),
                requirement: {}
              }
            },
      {}
    );

  if (_.isEmpty(newPaths)) return s;

  const newEntities = _.fromPairs(
    Object.entries(newPaths).map(([id]) => [
      ["projectile" + id],
      {
        entityType: "ship",
        data: {
          ...shipReducer(),
          collider: createCollider({
            self: { type: "removeEntity" },
            other: { type: "removeEntity", ignore: "player" }
          }),
          pathPosition: {
            lengthPosition: 0,
            pathId: id
          }
        }
      }
    ])
  );

  return {
    ...s,
    paths: { ...s.paths, ...newPaths },
    entities: entityActors.addEntities(newEntities)(s.entities)
  };
};

const director = (
  state = { isAnimating: {}, validation: {}, paths: {} },
  prevState = { isAnimating: {}, validation: {}, paths: {} },
  { type, payload, id } = {}
) =>
  R.pipe(
    s =>
      type in actors
        ? actors[type](payload)(s)
        : type in move || type in pathing
        ? { ...s, isAnimating: { ...prevState.isAnimating, [id]: true } }
        : { ...s, isAnimating: prevState.isAnimating },

    s => (type !== "increaseLength" ? s : collisionTesting(s, payload[1], id)),

    s =>
      type !== "increaseLength" || id !== "player"
        ? s
        : weponsCheck({ ...s, paths: prevState.paths || {} }, payload[1], id),
    s => {
      if (type !== "removeEntity") return s;
      const e = getDeadEntity(id, s);

      const pathId = getPathId(e);

      const path = s.paths[pathId];

      const paths = {
        ...R.omit([pathId], s.paths),
        [path.originalId]: {
          ...path,
          startPosition: { x: 0, y: 0 },
          instructions: "M0 0 L 0 0"
        }
      };

      return { ...s, paths };
    }
  )(state);
const directedApp = (...args) => {
  const dirArgs = _.cloneDeep(args);

  console.group(
    ...(args[1].type !== "setPowerLevels"
      ? ["director args", args[1].type, dirArgs]
      : [""])
  );
  try {
    if (args[1].type === "increaseLength") {
      const [len, pos] = args[1].payload;
      args[1].payload = len;
    }

    //if (flag > 2) return args[0];

    const res = console.tap(director(reducers(...args), ...dirArgs), "res");
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
