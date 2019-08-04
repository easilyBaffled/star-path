import * as R from "ramda";
import _ from "lodash";
import React, { useState, useContext, useEffect } from "react";
import ReactDOM from "react-dom";
import { devToolsEnhancer } from "redux-devtools-extension";
import { createStore } from "redux";
import { Provider, useSelector, useDispatch, shallowEqual } from "react-redux";

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

const time = 0.6;

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

const usePositionFromPath = (path, lengthAlongPath) => {
  const [position, setPosition] = useState(
    getPositionFromPath(path, lengthAlongPath)
  );

  useEffect(() => {
    setPosition(getPositionFromPath(path, lengthAlongPath));
  }, [path, lengthAlongPath]);

  return position;
};

const Entity = React.memo(({ id, moving, ...e }) => {
  const dispatch = useEntityDispatch(id);
  const radius = getRadius(e);
  const { paths, findNearestPath } = useContext(PathsContext);

  const path = paths[getPathId(e)];

  const lengthAlongPath = getLength(e);

  const { x, y } = usePositionFromPath(path, lengthAlongPath);

  useEffect(() => {
    const nearestPathId = findNearestPath({ x, y, r: radius });
    if (nearestPathId && nearestPathId !== getPathId(e)) {
      console.log(paths[nearestPathId].requirement, e.power);
    }

    if (
      nearestPathId &&
      nearestPathId !== getPathId(e) &&
      meetsPowerRequirements(paths[nearestPathId].requirement, e)
    )
      dispatch(pathPositionActions.changePath(nearestPathId));

    if (lengthAlongPath < 1000 && !moving)
      dispatch(pathPositionActions.increaseLength(getEnginePower(e)));
  }, [moving, dispatch, lengthAlongPath]);

  const variants = {
    move: {
      cx: x,
      cy: y
    },
    shake: {
      transition: { duration: time },
      cx: [null, x - 4, x + 4, x - 8, x + 8, x]
    }
  };

  return (
    <motion.circle
      key={id}
      className="box"
      cx={x}
      cy={y}
      r={radius}
      style={{
        fill: "tomato",
        z: 0
      }}
      transition={{ ease: "linear", duration: time }}
      animate={variants[isInvalidMove(e) ? "shake" : "move"]}
      onAnimationComplete={useAnimationEndAction(
        id,
        isInvalidMove(e)
          ? () => dispatch(validate.remove(invalidMove))
          : undefined
      )}
    />
  );
});

const Test = () => {
  const moving = useSelector(isAnimating);
  // console.log("ISMOVING", moving);
  // const e = useSelector(getEntity("player"));
  // const ignorePower = R.omit(["power"]);
  // return <Entity key={"player"} moving={moving} {...ignorePower(e)} />;

  return useSelector(getEntitiesArray, shallowEqual).map(e => (
    <Entity key={e.id} {...e} moving={moving} />
  ));
};

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

const HandleController = ({ paths }) => {
  //const dispatch = useDispatch();
  const playerDispatch = useEntityDispatch("player");
  const { Controller } = useHandleController({
    onArcChange: ({ rock, paper, scissor }) => {
      //console.log(...[rock, paper, scissor].map(Math.ceil));
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
      <PowerLevels />
    </div>
  );
};

const SVG = React.memo(({ paths }) => (
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
));

function App() {
  const paths = usePaths();

  return (
    <PathsContext.Provider
      value={{ paths, findNearestPath: findNearestPath(paths) }}
    >
      <Provider store={store}>
        <div className="App">
          <HandleController />
          <SVG paths={paths} />
        </div>
      </Provider>
    </PathsContext.Provider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
