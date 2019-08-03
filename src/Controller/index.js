import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import "./styles.css";
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

// utilities
function getLength(x0, y0, x1, y1) {
  // returns the length of a line segment
  const x = x1 - x0;
  const y = y1 - y0;
  return Math.sqrt(x * x + y * y);
}

function getDegAngle(x0, y0, x1, y1) {
  const y = y1 - y0;
  const x = x1 - x0;
  return Math.atan2(y, x);
}

function find_angle(p0, p1, c) {
  var p0c = Math.sqrt(Math.pow(c.x - p0.x, 2) + Math.pow(c.y - p0.y, 2)); // p0->c (b)
  var p1c = Math.sqrt(Math.pow(c.x - p1.x, 2) + Math.pow(c.y - p1.y, 2)); // p1->c (a)
  var p0p1 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2)); // p0->p1 (c)
  return (
    (180 / Math.PI) *
    Math.acos((p1c * p1c + p0c * p0c - p0p1 * p0p1) / (2 * p1c * p0c))
  );
}

const arcLength = (angle, r) => (angle / 360) * (2 * Math.PI * r);

const getAngleRelativeTo = (cx, cy) => (p1, p2) => {
  const res =
    (180 / Math.PI) *
    (getDegAngle(cx, cy, p1.x, p1.y) - getDegAngle(cx, cy, p2.x, p2.y));

  return res;
};
const Control = ({
  toggleRecord,
  svgRef,
  rockPos,
  paperPos = { x: 0, y: 0 },
  scissorPos = { x: 0, y: 0 },
  r = 45,
  circ = 2 * Math.PI * r,
  vSize = 100
}) => {
  useEffect(() => {
    window.addEventListener("mouseup", () => toggleRecord(false));
  }, []);
  const center = { x: vSize / 2, y: vSize / 2 };

  let rcs = find_angle(rockPos, scissorPos, { x: 50, y: 50 });
  let scp = find_angle(scissorPos, paperPos, { x: 50, y: 50 });
  let rcp = find_angle(rockPos, paperPos, { x: 50, y: 50 });

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

  return (
    <svg
      key="control"
      height="100"
      width="100"
      viewBox={`0 0 ${vSize} ${vSize}`}
      ref={svgRef}
      style={{
        position: "fixed",
        top: "calc( 50vh - 50px)",
        left: "calc( 50vw - 50px)"
      }}
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

function App() {
  const dragControl = drag(45, 50, 50);

  const svgRef = useRef(null);
  const [rockPos, setRockPos] = useState(dragControl({ x: 40, y: 75 }));
  const [paperPos, setPaperPos] = useState(dragControl({ x: 0, y: 0 }));

  const [scissorPos, setScissorPos] = useState(dragControl({ x: 200, y: 200 }));

  const [record, toggleRecord] = useState(false);

  // React.useEffect(() => {
  //   new ConfettiCannon();
  // }, []);

  const handler = useCallback(
    ({ clientX, clientY, clientHeight, clientWidth, target }) => {
      const svgBox = svgRef.current.getBoundingClientRect();
      // const rockBox = rock.current.getBoundingClientRect();
      // const paperBox = paper.current.getBoundingClientRect();
      // const scissorBox = scisor.current.getBoundingClientRect();
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

  return (
    <div className="App">
      <Control
        key="controlComponent"
        rockPos={rockPos}
        svgRef={svgRef}
        toggleRecord={toggleRecord}
        paperPos={paperPos}
        scissorPos={scissorPos}
      />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
