import { useRef } from "react";
import _ from "lodash";
export default () => ({
  0: {
    startPosition: { x: 630, y: 400 },
    instructions:
      "M 630 400 Q 600 70 500 250 Q 350 580 200 250 Q 100 70 80 400 Q 80 510 350 525 Q 600 510 630 400 Z",
    ref: useRef(null),
    requirement: {}
  },
  1: {
    startPosition: { x: 443.48822021484375, y: 350.9056701660156 },
    instructions: "M443.48822021484375 350.9056701660156 l -50 -50 l 0 -100",
    ref: useRef(null),
    requirement: { engine: 50 },
    stroke: "black"
  },
  ..._.fromPairs(
    Array.from({ length: 20 }, (__, i) => [
      "_" + i,
      {
        startPosition: { x: 0, y: 0 },
        instructions: "M0 0 L 0 0",
        ref: useRef(null),
        requirement: { engine: 1000 }
      }
    ])
  )
});

export const findNearestPath = paths => ({ x, y, r }) => {
  const [nearestPath] = Object.entries(paths)
    .filter(([__, { startPosition }]) => {
      var a = x - startPosition.x;
      var b = y - startPosition.y;

      var c = Math.sqrt(a * a + b * b);
      return c < r;
    })
    .map(([id]) => id);
  return nearestPath;
};
