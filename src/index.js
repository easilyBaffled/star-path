import React, { useState, useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { devToolsEnhancer } from "redux-devtools-extension";
import { createStore } from "redux";
import { Provider, useSelector, useDispatch } from "react-redux";

import { motion } from "framer-motion";
import cs from "console.tap";
import "./styles.css";
import useHandleController from "./hooks/useHandleController";
import reducer, {
  isAnimating,
  actions as directorActions
} from "./state/director";
import { getEntitiesArray, getEntity } from "./state/entities/entities";
import { getRadius } from "./state/attributes/body";
import {
  getEnginePower,
  meetsPowerRequirements,
  actions as powerActions,
  getPowerLevels
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
  pathRef && pathRef.ref.current
    ? pathRef.ref.current.getPointAtLength(len)
    : { x: 0, y: 0 };

const Entity = ({ id, moving, ...e }) => {
  const dispatch = useEntityDispatch(id);
  const radius = getRadius(e);
  const enginePower = getEnginePower(e);
  const { paths, findNearestPath } = useContext(PathsContext);

  const path = paths[getPathId(e)];

  const lengthAlongPath = getLength(e);

  const { x, y } = getPositionFromPath(path, lengthAlongPath);

  useEffect(() => {
    const nearestPathId = findNearestPath({ x, y, r: radius });

    if (
      nearestPathId &&
      nearestPathId !== getPathId(e) &&
      meetsPowerRequirements(paths[nearestPathId].requirement, e)
    )
      dispatch(pathPositionActions.changePath(nearestPathId));

    if (lengthAlongPath < 10000 && !moving)
      dispatch(pathPositionActions.increaseLength(enginePower));
  }, [moving, dispatch, enginePower, lengthAlongPath]);

  const variants = {
    move: {
      transition: { ease: "linear", duration: 0.2 },
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
      cx={getPositionFromPath(path, 0).x}
      cy={getPositionFromPath(path, 0).y}
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

const PowerLevels = () => {
  const { totalPower, engine, weapons, shields } = useSelector(s =>
    getPowerLevels(getEntity("player", s))
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        bottom: "10vh",
        left: 0,
        right: 0,
        fontSize: 26
      }}
    >
      <code>{Math.floor(totalPower)}</code>
      <code style={{ color: "black" }}>{Math.floor(engine)}</code>
      <code style={{ color: "blue" }}>{Math.floor(weapons)}</code>
      <code style={{ color: "green" }}>{Math.floor(shields)}</code>
    </div>
  );
};

const Game = ({ paths }) => {
  const playerDispatch = useEntityDispatch("player");
  const { Controller } = useHandleController({
    onArcChange: ({ rock, paper, scissor }) => {
      playerDispatch(
        powerActions.setPowerLevels({
          engine: rock,
          weapons: paper,
          shields: scissor
        })
      );
    }
  });
  return (
    <div className="App">
      <Controller />
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
      <PowerLevels />
    </div>
  );
};

function App() {
  const paths = usePaths();

  return (
    <PathsContext.Provider
      value={{ paths, findNearestPath: findNearestPath(paths) }}
    >
      <Provider store={store}>
        <Game paths={paths} />
      </Provider>
    </PathsContext.Provider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
