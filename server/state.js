// server/state.js
'use strict';

// Defining base temperatures per sector
const sectorBaseTemperature = {
  A1: 22.0, A2: 22.0, A3: 21.0,
  B1: 22.0, B2: 21.0, B3: 21.0, MAB: 20.0,
  MBC: 19.0, // Mezzanine
  C1: 28.0, C2: 7.0, C3: 15.0 // C2 is cargo hold, naturally colder
};

const state = {
  // Nave
  shipTime: Date.now(),
  uptime: 0,
  accessLevel: 1,

  // Setores da nave (unificado com Master e PDT)
  sectors: {
    A1: { name: 'Bridge', deck: 'A' },
    A2: { name: 'Comms Room', deck: 'A' },
    A3: { name: 'A-Deck Corridors', deck: 'A' },
    B1: { name: 'Medbay / Crew Quarters', deck: 'B' },
    B2: { name: 'B-Deck Living', deck: 'B' },
    B3: { name: 'B-Deck Storage', deck: 'B' },
    MAB: { name: 'Motion Array / Corridors', deck: 'M' },
    MBC: { name: 'Mezzanine B-C', deck: 'M' },
    C1: { name: 'Engineering', deck: 'C' },
    C2: { name: 'Cargo Hold', deck: 'C' },
    C3: { name: 'Mining Refinery', deck: 'C' }
  },

  sectorTemperature: { ...sectorBaseTemperature },

  players: {}, // { [id]: { name, sector, online, stress, lastLocationUpdate, ... } }

  // Organism tracking
  organism: {
    currentSector: 'C2',
    previousSector: null,
    isMoving: false,
    mode: 'patrol', // 'patrol' | 'hunt'
    territory: ['C1', 'C2', 'C3', 'MBC'],
    huntTarget: null,
    lastMoveTime: Date.now(),
  },

  // Scavengers tracking
  scavengers: [
    { id: 1, name: 'Linh', currentSector: 'C3', alive: true, isMoving: true, lastMoveTime: Date.now() },
    { id: 2, name: 'Bauer', currentSector: 'C3', alive: true, isMoving: true, lastMoveTime: Date.now() },
    { id: 3, name: 'Nkosi', currentSector: 'C3', alive: true, isMoving: true, lastMoveTime: Date.now() },
    { id: 4, name: 'Yeva', currentSector: 'C3', alive: true, isMoving: true, lastMoveTime: Date.now() },
    { id: 5, name: 'Carver', currentSector: 'C3', alive: true, isMoving: true, lastMoveTime: Date.now() }
  ],

  // Alertas e estado
  alertActive: false,
  currentAlert: null,
  log: [],
  unlockedDocs: [],

  // Minigame systems availability (true = unlocked by master)
  unlockedSystems: {
    A1: { comms_lr: false },
    A2: { comms_local: false },
    A3: { lighting_a: false },
    B1: { life_support: false },
    B2: {},
    B3: {},
    MAB: { lighting_b: false, motion_tracker: false },
    MBC: { lighting_c: false },
    C1: { reactor: false, power_grid: false },
    C2: {},
    C3: { lifepods: false, door_control: false }
  },

  // Systems Status
  systems: {
    reactor: { online: false, integrity: 0.34 },
    power_grid: { online: false },
    life_support: { online: false, partial: false, o2Level: 19.8, co2Level: 0.04, tempC: 18.0, ventilation: 67 },
    lighting_a: { online: false },
    lighting_b: { online: false },
    lighting_c: { online: false },
    door_control: { online: false },
    comms_local: { online: false, frequency: 0 },
    motion_tracker: { online: false },
    comms_lr: { online: false },
    lifepods: { online: false },
    commsUnlockedGlobal: false
  }
};

function applyDelta(delta) {
  _merge(state, delta);
}

function _merge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      _merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

module.exports = { state, applyDelta, sectorBaseTemperature };
