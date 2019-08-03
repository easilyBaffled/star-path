import { createActions, createReducer } from "../../util";

const initialState = {
  totalPower: 100,
  engine: 34,
  weapons: 33,
  shields: 33
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
  setSheildsPower: power => actors.setPowerLevels({ shields: power })
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getEnginePower = s => s.power.totalPower * (s.power.engine / 100);
export const getWeaponPower = s => s.power.totalPower * (s.power.weapons / 100);
export const getSheildsPower = s =>
  s.power.totalPower * (s.power.shields / 100);

export const getPowerLevels = s => s.power;
export const getEngineLevels = s => s.power.engine;
export const getWeaponsLevels = s => s.power.weapons;
export const getSheildsLevels = s => s.power.shields;
export const meetsPowerRequirements = (
  { engine = 0, weapons = 0, shields = 0 },
  s
) =>
  getEnginePower(s) >= engine &&
  getWeaponPower(s) >= weapons &&
  getSheildsPower(s) >= shields;
