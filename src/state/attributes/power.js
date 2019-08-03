import { createActions, createReducer } from "../../util";

const initialState = {
  totalPower: 100,
  engine: 34,
  weapons: 33,
  sheilds: 33
};

export const actors = {
  setTotalPower: totalPower => s => ({
    ...s,
    totalPower
  }),
  reduceTotalPower: reduction => s => ({
    ...s,
    totalPower: s.totalPower - reduction
  }),
  increaseTotalPower: addition => s => ({
    ...s,
    totalPower: s.totalPower - addition
  }),
  setPowerLevels: powerLevels => s => ({
    ...s,
    ...powerLevels
  }),
  setEnginePower: power => actors.setPowerLevels({ engine: power }),
  setWeaponsPower: power => actors.setPowerLevels({ weapons: power }),
  setSheildsPower: power => actors.setPowerLevels({ sheilds: power })
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getEnginePower = s => s.power.totalPower * (s.power.engine / 100);
export const getEngineLevels = s => s.power.engine;
export const getWeaponsLevels = s => s.power.weapons;
export const getSheildsLevels = s => s.power.sheilds;
