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
import {
  actions as entityActions,
  getEntitiesArray,
  getEntity
} from "./state/entities/entities";
import { getRadius, getPosition } from "./state/attributes/body";
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

const time = 0.1;

const PathsContext = React.createContext();

const useAnimationEndAction = (id, additionalDispatch) => {
  const dispatch = useDispatch();
  return () => {
    if (additionalDispatch) additionalDispatch();
    dispatch(directorActions.doneAnimating(id));
  };
};

const store = createStore(reducer, devToolsEnhancer());

const getRotationOfPathSegment = (pathRef, len) => {
  if (!pathRef.ref.current) return 0;
  const point = pathRef.ref.current.getPointAtLength(len);
  const point2 = pathRef.ref.current.getPointAtLength(
    (len + 2) % pathRef.ref.current.getTotalLength()
  );
  const angle = Math.atan2(point2.y - point.y, point2.x - point.x);
  return (angle * 180) / Math.PI;
};

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

const Entity = React.memo(({ id, moving, paths, ...e }) => {
  const dispatch = useEntityDispatch(id);
  const radius = getRadius(e);
  const { findNearestPath } = useContext(PathsContext);

  const path = paths[getPathId(e)];

  if (!path || !path.ref.current) {
    useAnimationEndAction(id);
    return <g />;
  }
  const lengthAlongPath = getLength(e);

  if (id !== "player" && lengthAlongPath >= path.ref.current.getTotalLength()) {
    dispatch(entityActions.removeEntity({ id }));
  }

  const { x, y } = usePositionFromPath(path, lengthAlongPath);

  useEffect(() => {
    const nearestPathId = findNearestPath({ x, y, r: radius });
    if (
      nearestPathId &&
      String(nearestPathId) !== String(getPathId(e)) &&
      meetsPowerRequirements(paths[nearestPathId].requirement, e)
    )
      dispatch(pathPositionActions.changePath(nearestPathId));

    if (lengthAlongPath < 100000 && !moving) {
      dispatch(pathPositionActions.increaseLength(getEnginePower(e), { x, y }));
    }
  }, [moving, dispatch, lengthAlongPath]);

  const variants = {
    move: {
      cx: x,
      cy: y,
      opacity: 1
      // rotate:
    },
    shake: {
      transition: { duration: time },
      cx: [null, x - 4, x + 4, x - 8, x + 8, x]
    }
  };

  return (
    <motion.circle
      id={id}
      key={id}
      className="box"
      cx={x}
      cy={y}
      opacity={0}
      r={radius}
      style={{
        fill: id === "player" ? "tomato" : "green",

        z: 0
        // transform: `rotate(${getRotationOfPathSegment(
        //   path,
        //   lengthAlongPath
        // )} ${x} ${y})`
      }}
      transition={{ ease: "linear", duration: time }}
      animate={variants[isInvalidMove(e) ? "shake" : "move"]}
      onAnimationComplete={useAnimationEndAction(
        id,
        isInvalidMove(e)
          ? () => dispatch(validate.remove(invalidMove))
          : undefined
      )}
    >
      ^
    </motion.circle>
  );
});

const Obstacle = ({ ...e }) => {
  const r = getRadius(e);
  const { x, y } = getPosition(e);

  return <circle id={e.id} cx={x} cy={y} r={r} fill="darkgrey" />;
};

const Test = ({ paths }) => {
  const moving = useSelector(isAnimating);

  return useSelector(getEntitiesArray, shallowEqual).map(e =>
    ({
      obstacle: () => <Obstacle key={e.id} {...e} />,
      ship: () => (
        <Entity key={e.id} {...e} moving={moving[e.id]} paths={paths} />
      )
    }[e.entityType]())
  );
};

const PowerLevels = () => {
  const player = useSelector(getEntity("player"));
  if (_.isEmpty(player)) return <div />;
  const { totalPower, engine, weapons, shields } = getPowerLevels(player);
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
      <code style={{ color: "green" }}>{Math.floor(weapons)}</code>
      <code style={{ color: "blue" }}>{Math.floor(shields)}</code>
    </div>
  );
};

const HandleController = ({ paths }) => {
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
      <PowerLevels />
    </div>
  );
};

const SVG = React.memo(({ paths, newP }) => {
  const [pPaths, setPPaths] = useState([]);
  const extraPaths = Object.entries(useSelector(s => s.paths || {}));

  const totalPaths = {
    ...paths,
    ..._.fromPairs(
      extraPaths.map(([id, path], i) => [
        id,
        {
          ...path,
          ref: paths["_" + i].ref
        }
      ])
    )
  };

  return (
    <svg viewBox="0 0 700 600" height="50vh" width="50vw">
      <path
        stroke="tomato"
        strokeWidth="5"
        fill="none"
        d={`M ${newP.x1} ${newP.y1} L ${newP.x2} ${newP.y2}`}
      />
      {Object.entries(totalPaths)
        .filter(([__, p]) => p.instructions !== "M0 0 L 0 0")
        .map(([id, { instructions, ref, ...pathProps }]) => (
          <path
            key={id}
            stroke="#0268B1"
            strokeWidth="5"
            fill="none"
            ref={ref}
            {...pathProps}
            d={instructions}
          />
        ))}
      <Test paths={totalPaths} />
    </svg>
  );
});

function App() {
  const paths = usePaths();
  const [newP, createP] = useState("");
  return (
    <PathsContext.Provider
      value={{ paths, findNearestPath: findNearestPath(paths), createP }}
    >
      <Provider store={store}>
        <div className="App">
          <HandleController />
          <SVG paths={paths} newP={newP} />
        </div>
      </Provider>
    </PathsContext.Provider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
