import { useDispatch } from "react-redux";
export const undoableSelector = s => (s.present ? s.present : s);

const match = obj => obj[true]();

const payloadUnpacker = payload =>
  match({
    true: () => payload,
    [payload.length === 0]: () => undefined,
    [payload.length === 1]: () => payload[0]
  });

export const createActions = updaters =>
  Object.keys(updaters).reduce(
    (acc, type) => ({
      ...acc,
      [type]: (...payload) => ({
        type,
        payload: payloadUnpacker(payload)
      })
    }),
    {}
  );

export const createReducer = (actors, initialState) => (
  state = initialState,
  { type, payload } = {}
) => (type in actors ? actors[type](payload)(state) : state);

export const useEntityDispatch = entityId => {
  const dispatch = useDispatch();
  return action => {
    dispatch({ id: entityId, ...action });
  };
};

export const variants = ({ x, y, size }) => ({
  default: {
    x: console.tap(x * size, "varian"),
    y: y * size,
    transition: { ease: [0, 0, 0.36, 1], duration: 0.6 }
  },
  shake: {
    transition: { duration: 0.6 },
    x: [null, x * size - 4, x * size + 4, x * size - 8, x * size + 8, x * size]
  }
});
