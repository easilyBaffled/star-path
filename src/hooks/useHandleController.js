import React, { useEffect, useState, useCallback, useRef } from "react";

import _ from "lodash";
// import "./styles.css";
import { useEventListener } from "./useEventHandler";

console.tap = (v, l = "") => (console.log(l, v), v);

const drag = (radius, cx, cy) => ({ x, y }) => {
  var dx = x - cx;
  var dy = y - cy;

  var scale = radius / Math.sqrt(dx * dx + dy * dy);

  return {
    x: dx * scale + cx,
    y: dy * scale + cy
  };
};

const find_angle = (p0, p1, c) => {
  var p0c = Math.sqrt(Math.pow(c.x - p0.x, 2) + Math.pow(c.y - p0.y, 2)); // p0->c (b)
  var p1c = Math.sqrt(Math.pow(c.x - p1.x, 2) + Math.pow(c.y - p1.y, 2)); // p1->c (a)
  var p0p1 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2)); // p0->p1 (c)
  return (
    (180 / Math.PI) *
    Math.acos((p1c * p1c + p0c * p0c - p0p1 * p0p1) / (2 * p1c * p0c))
  );
};

const arcLength = (angle, r) => (angle / 360) * (2 * Math.PI * r);

const ControllerSVG = ({
  toggleRecord,
  svgRef,
  rockPos,
  onArcChange,
  paperPos = { x: 0, y: 0 },
  scissorPos = { x: 0, y: 0 },
  r = 45,
  vSize = 100,
  circ = 2 * Math.PI * r,
  ...svgProps
}) => {
  useEventListener("mouseup", () => toggleRecord(false));

  const center = { x: vSize / 2, y: vSize / 2 };

  let rcs = find_angle(rockPos, scissorPos, center);
  let scp = find_angle(scissorPos, paperPos, center);
  let rcp = find_angle(rockPos, paperPos, center);

  let d = { rcs, scp, rcp };
  if (rcs + scp + rcp < 360) {
    const [largest, ...rest] = Object.entries({ rcs, scp, rcp }).sort(
      ([_, a], [__, b]) => b - a
    );

    d = _.fromPairs([[largest[0], 360 - largest[1]], ...rest]);
  }

  const rockToScissor = arcLength(d.rcs, r);
  const scissorToPaper = arcLength(d.scp, r);
  const paperToRock = arcLength(d.rcp, r);

  useEffect(() => {
    onArcChange({
      rock: (rockToScissor / circ) * 100,
      paper: (scissorToPaper / circ) * 100,
      scissor: (paperToRock / circ) * 100
    });
  }, [rockToScissor, scissorToPaper, paperToRock, circ, onArcChange]);

  return (
    <svg
      key="control"
      height="100"
      width="100"
      // viewBox={`0 0 ${vSize} ${vSize}`}
      ref={svgRef}
      style={{
        position: "fixed",
        top: "calc( 50vh - 50px)",
        left: "calc( 50vw - 50px)"
      }}
      {...svgProps}
    >
      <circle
        key="debu"
        cx="50"
        cy="50"
        r={r}
        strokeWidth="5"
        stroke="#01bbec"
        fill="tomato"
      />
      <path
        key="rockToScissor"
        d={`
          M ${rockPos.x} ${rockPos.y}
          A ${r},${r} 0 ${
          rockToScissor < scissorToPaper + paperToRock ? 0 : 1
        } 0 ${scissorPos.x} ${scissorPos.y}
        `}
        stroke="black"
        stroke-width="5"
        fill="none"
      />
      <path
        key="paperToRock"
        d={`
          M ${paperPos.x} ${paperPos.y}
          A ${r},${r} 0 ${
          paperToRock < scissorToPaper + rockToScissor ? 0 : 1
        } 0 ${rockPos.x} ${rockPos.y}
        `}
        stroke="blue"
        stroke-width="5"
        fill="none"
      />
      <path
        key="scissorToPaper"
        d={`
          M ${scissorPos.x} ${scissorPos.y}
          A ${r},${r} 0 ${
          scissorToPaper < rockToScissor + paperToRock ? 0 : 1
        }0 ${paperPos.x} ${paperPos.y}
        `}
        stroke="green"
        stroke-width="5"
        fill="none"
      />
      <circle
        key="rockHandle"
        cx={rockPos.x}
        cy={rockPos.y}
        r="7"
        stroke="white"
        strokeWidth="3"
        onMouseDown={() => toggleRecord("rock")}
      />
      <circle
        key="paperHandle"
        cx={paperPos.x}
        cy={paperPos.y}
        r="7"
        fill="blue"
        stroke="white"
        strokeWidth="3"
        onMouseDown={() => toggleRecord("paper")}
      />
      <circle
        key="scissorHandle"
        cx={scissorPos.x}
        cy={scissorPos.y}
        r="7"
        fill="green"
        stroke="white"
        strokeWidth=""
        onMouseDown={() => toggleRecord("scissor")}
      />
    </svg>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const useHandleController = ({
  vSize = 100,
  radius = (vSize * 0.9) / 2,
  onArcChange
}) => {
  const svgRef = useRef(null);
  const dragControl = drag(radius, vSize / 2, vSize / 2);
  const [powerLevels, setPowerLevels] = useState({
    rock: 0,
    paper: 0,
    scissor: 0
  });

  const [rockPos, setRockPos] = useState(dragControl({ x: 40, y: 75 }));
  const [paperPos, setPaperPos] = useState(dragControl({ x: 0, y: 0 }));
  const [scissorPos, setScissorPos] = useState(dragControl({ x: 200, y: 200 }));
  const [record, toggleRecord] = useState(false);

  const handler = useCallback(
    ({ clientX, clientY }) => {
      const svgBox = svgRef.current.getBoundingClientRect();
      const pos = dragControl({
        x: clientX - svgBox.left,
        y: clientY - svgBox.top
      });

      const transformers = {
        [false]: () => "",
        rock: () => setRockPos(pos),
        paper: () => setPaperPos(pos),
        scissor: () => setScissorPos(pos)
      };

      transformers[record]();
    },
    [record, dragControl]
  );

  useEventListener("mousemove", handler);

  const Controller = (props = {}) => (
    <ErrorBoundary>
      <ControllerSVG
        {...props}
        rockPos={rockPos}
        svgRef={svgRef}
        toggleRecord={toggleRecord}
        paperPos={paperPos}
        scissorPos={scissorPos}
        onArcChange={onArcChange || setPowerLevels}
      />
    </ErrorBoundary>
  );
  return { Controller, powerLevels };
};

export default useHandleController;
