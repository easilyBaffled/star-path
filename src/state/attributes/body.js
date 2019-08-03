import { createActions, createReducer } from "../../util";
const initialState = {
  x: 0,
  y: 0,
  r: 10
};

export const actors = {
  initialize: initObj => s => ({ ...s, ...initObj }),
  by: (...args) => {
    if (args.length === 1 && typeof args[0] === "object") {
      const { x: dx = 0, y: dy = 0 } = args[0];
      return ({ x, y, r }) => ({ x: x + dx, y: y + dy, r });
    } else {
      const [dx = 0, dy = 0] = args;

      return ({ x, y, r }) => ({ x: x + dx, y: y + dy, r });
    }
  },
  to: (nextX, nextY) => ({ x, y }) => ({ x: nextX, y: nextY || y }),
  up: (y = -1) => actors.by({ y: y > 0 ? -1 * y : y }),
  down: (y = 1) => actors.by({ y: y < 0 ? -1 * y : y }),
  left: (x = -1) => actors.by({ x: x > 0 ? -1 * x : x }),
  right: (x = 1) => actors.by({ x: x < 0 ? -1 * x : x }),
  "": () => s => s
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);
export const getPosition = s => ({ x: s.body.x, y: s.body.y });
export const getRadius = s => s.body.r;
