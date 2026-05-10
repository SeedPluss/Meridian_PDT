// server/sectors.js
'use strict';

const SECTORS = {
  A1: { name: 'Bridge', deck: 'A' },
  A2: { name: 'Comms Room', deck: 'A' },
  A_corridors: { name: 'A-Deck Corridors', deck: 'A' },
  B1: { name: 'Medbay / Crew Quarters', deck: 'B' },
  B_corridors: { name: 'B-Deck Corridors', deck: 'B' },
  MBC: { name: 'Mezzanine B-C', deck: 'M' },
  C1: { name: 'Engineering', deck: 'C' },
  C2: { name: 'Cargo Hold', deck: 'C' },
  C3: { name: 'Mining Refinery', deck: 'C' }
};

const ADJACENCY = {
  A1: ['A_corridors'],
  A2: ['A_corridors'],
  A_corridors: ['A1', 'A2', 'B_corridors'],
  B1: ['B_corridors'],
  B_corridors: ['B1', 'A_corridors', 'MBC'],
  MBC: ['B_corridors', 'C1', 'C2'],
  C1: ['C2', 'MBC'],
  C2: ['C1', 'C3', 'MBC'],
  C3: ['C2']
};

function getAdjacent(sectorId) {
  return ADJACENCY[sectorId] || [];
}

// Check relationship between two sectors (same, adjacent, or distant)
function getSectorRelation(sectorA, sectorB) {
  if (sectorA === sectorB) return 'same';
  if (getAdjacent(sectorA).includes(sectorB)) return 'adjacent';
  return 'distant';
}

// Calculate angle between two sectors. Just a hardcoded visualization mapping.
function calculateAngle(fromSector, toSector) {
  // A simple deterministic hash to keep the angle consistent for the same pair
  const hash = (fromSector.charCodeAt(0) + (toSector.charCodeAt(0) || 0)) * 43 % 360;
  return hash;
}

module.exports = {
  SECTORS,
  ADJACENCY,
  getAdjacent,
  getSectorRelation,
  calculateAngle
};
