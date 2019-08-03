import React, { useState, useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { devToolsEnhancer } from "redux-devtools-extension";
import { createStore } from "redux";
import { Provider, useSelector, useDispatch } from "react-redux";

import { motion } from "framer-motion";
import cs from "console.tap";
import "./styles.css";
import reducer, {
  isAnimating,
  actions as directorActions
} from "./state/director";
import { getEntitiesArray } from "./state/entities/entities";
import { getRadius } from "./state/attributes/body";
import {
  getEnginePower,
  meetsPowerRequirements
} from "./state/attributes/power";
import {
  actions as pathPositionActions,
  getPathId,
  getLength
} from "./state/attributes/pathPosition";
import {
  actions as validate,
  isInvalidMove,
  invalidMove
} from "./state/attributes/validation";
import { useEntityDispatch } from "./util";
import usePaths, { findNearestPath } from "./usePaths";
console = cs;

const PathsContext = React.createContext();

const useAnimationEndAction = (id, additionalDispatch) => {
  const dispatch = useDispatch();
  return () => {
    if (additionalDispatch) additionalDispatch();
    dispatch(directorActions.doneAnimating(id));
  };
};

const store = createStore(reducer, devToolsEnhancer());

const getPositionFromPath = (pathRef, len) =>
  pathRef && pathRef.current
    ? pathRef.current.getPointAtLength(len)
    : { x: 0, y: 0 };

const Entity = ({ id, moving, ...e }) => {
  const radius = getRadius(e);
  const enginePower = getEnginePower(e);
  const { paths, findNearestPath } = useContext(PathsContext);
  const path = paths[getPathId(e)];

  const lengthAlongPath = getLength(e);
  console.log("p", getPathId(e), path, lengthAlongPath, enginePower);

  const { x, y } = getPositionFromPath(path, lengthAlongPath);

  const dispatch = useEntityDispatch(id);

  useEffect(() => {
    const nearestPathId = findNearestPath({ x, y, r: radius });
    if (
      nearestPathId &&
      nearestPathId !== getPathId(e) &&
      meetsPowerRequirements(paths[nearestPathId].requirements, e)
    )
      dispatch(pathPositionActions.changePath(nearestPathId));

    if (lengthAlongPath < 5000 && !moving)
      dispatch(pathPositionActions.increaseLength(enginePower));
  }, [moving, dispatch, enginePower, lengthAlongPath]);
  console.log({ x, y });
  const variants = {
    move: {
      transition: { ease: "linear", duration: 0.6 },
      cx: x,
      cy: y
    },
    shake: {
      transition: { duration: 0.6 },
      cx: [null, x - 4, x + 4, x - 8, x + 8, x]
    }
  };

  return (
    <motion.circle
      key={id}
      className="box"
      cx={getPositionFromPath(0)}
      cy={getPositionFromPath(0)}
      r={radius}
      style={{
        fill: "tomato",
        z: 0
      }}
      animate={variants[isInvalidMove(e) ? "shake" : "move"]}
      onAnimationComplete={useAnimationEndAction(
        id,
        isInvalidMove(e)
          ? () => dispatch(validate.remove(invalidMove))
          : undefined
      )}
    />
  );
};

const Test = React.forwardRef((props, ref) => {
  const moving = useSelector(isAnimating);
  return useSelector(getEntitiesArray).map(e => (
    <Entity ref={ref} key={e.id} {...e} moving={moving} />
  ));
});

function App() {
  const paths = usePaths();

  return (
    <PathsContext.Provider
      value={{ paths, findNearestPath: findNearestPath(paths) }}
    >
      <Provider store={store}>
        <div className="App">
          <svg viewBox="0 0 700 600" height="50vh" width="50vw">
            {Object.entries(paths).map(([id, { instructions, ref }]) => (
              <path
                key={id}
                stroke="#0268B1"
                strokeWidth="5"
                fill="none"
                ref={ref}
                d={instructions}
              />
            ))}
            <Test />
          </svg>
          <h1>Hello CodeSandbox</h1>
          <h2>Start editing to see some magic happen!</h2>
        </div>
      </Provider>
    </PathsContext.Provider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
