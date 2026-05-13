// server/sectors.js
'use strict';

const SECTORS = {
  A1: { name: 'Bridge', deck: 'A', x: 0, y: 2 },
  A2: { name: 'Comms Room', deck: 'A', x: 1, y: 1.5 },
  A3: { name: 'A-Deck Corridors', deck: 'A', x: 0, y: 1 },
  B1: { name: 'Medbay / Crew Quarters', deck: 'B', x: -1, y: 0.5 },
  B2: { name: 'B-Deck Living', deck: 'B', x: 0, y: 0 },
  B3: { name: 'B-Deck Storage', deck: 'B', x: 1, y: 0 },
  MAB: { name: 'Motion Array / Corridors', deck: 'M', x: 0, y: -0.5 },
  MBC: { name: 'Mezzanine B-C', deck: 'M', x: 0, y: -1 },
  C1: { name: 'Engineering', deck: 'C', x: -1, y: -2 },
  C2: { name: 'Cargo Hold', deck: 'C', x: 0, y: -2 },
  C3: { name: 'Mining Refinery', deck: 'C', x: 1, y: -2 }
};

const ADJACENCY = {
  A1: ['A3'],
  A2: ['A3'],
  A3: ['A1', 'A2', 'MAB'],
  B1: ['MAB'],
  B2: ['MAB'],
  B3: ['MAB'],
  MAB: ['A3', 'B1', 'B2', 'B3', 'MBC'],
  MBC: ['MAB', 'C1', 'C2', 'C3'],
  C1: ['C2', 'MBC'],
  C2: ['C1', 'C3', 'MBC'],
  C3: ['C2', 'MBC']
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

// Calculate angle between two sectors using coordinates
function calculateAngle(fromSector, toSector) {
  const s1 = SECTORS[fromSector];
  const s2 = SECTORS[toSector];
  if (!s1 || !s2) return 0;
  
  if (fromSector === toSector) return Math.random() * 360;

  const dx = s2.x - s1.x;
  const dy = s2.y - s1.y;
  
  // atan2 returns radians from the positive x-axis. 
  // We want 0 degrees to be "Up" (positive y-axis).
  // Math.atan2(dx, dy) will give us exactly that!
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  
  return angle;
}

module.exports = {
  SECTORS,
  ADJACENCY,
  getAdjacent,
  getSectorRelation,
  calculateAngle
};
