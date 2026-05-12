// server/tracker.js
const { state, sectorBaseTemperature } = require('./state');
const { getAdjacent, getSectorRelation, calculateAngle } = require('./sectors');

// Emit tracker updates via index.js broadcast (we'll set this from index.js)
let broadcastTrackerUpdateFn = () => {};
let broadcastTemperatureUpdateFn = () => {};

function setBroadcasters(trackerFn, tempFn) {
  broadcastTrackerUpdateFn = trackerFn;
  broadcastTemperatureUpdateFn = tempFn;
}

// Tick to move the organism
function patrolTick() {
  if (state.organism.mode !== 'patrol') return;

  const now = Date.now();
  const timeSinceMove = now - state.organism.lastMoveTime;

  // Decision to move or stop
  const shouldMove = Math.random() > 0.4; // 60% chance to move
  const waitTime = 30000 + Math.random() * 60000; // 30-90s wait

  if (timeSinceMove > waitTime && shouldMove) {
    const adjacentSectors = getAdjacent(state.organism.currentSector)
      .filter(s => state.organism.territory.includes(s));

    if (adjacentSectors.length > 0) {
      const nextSector = adjacentSectors[Math.floor(Math.random() * adjacentSectors.length)];
      moveOrganism(nextSector);
    }
  }
}

function moveOrganism(targetSector) {
  state.organism.previousSector = state.organism.currentSector;
  state.organism.currentSector = targetSector;
  state.organism.isMoving = true;
  state.organism.lastMoveTime = Date.now();

  updateTemperatures();

  // Fast movement - blip appears briefly, then disappears
  broadcastTrackerUpdateFn();

  // Stops after 2-4 seconds
  setTimeout(() => {
    state.organism.isMoving = false;
    broadcastTrackerUpdateFn(); // blip disappears
  }, 2000 + Math.random() * 2000);
}

// Update temperatures based on organism position
function updateTemperatures() {
  // Reset all to base
  Object.keys(sectorBaseTemperature).forEach(sector => {
    state.sectorTemperature[sector] = sectorBaseTemperature[sector];
  });

  // Organism increases current sector by 4.3°C
  if (state.sectorTemperature[state.organism.currentSector]) {
    state.sectorTemperature[state.organism.currentSector] += 4.3;
  }

  // Adjacent sectors +1.5°C
  getAdjacent(state.organism.currentSector).forEach(sector => {
    if (state.sectorTemperature[sector]) {
      state.sectorTemperature[sector] += 1.5;
    }
  });

  broadcastTemperatureUpdateFn();
}

// Scavenger automated movement
function scavengerTick() {
  const now = Date.now();
  
  state.scavengers.forEach(scav => {
    if (!scav.alive) return;
    
    const timeSinceMove = now - scav.lastMoveTime;
    const waitTime = 45000 + Math.random() * 30000; // 45-75s
    
    if (timeSinceMove > waitTime) {
      const adjacentSectors = getAdjacent(scav.currentSector);
      if (adjacentSectors.length > 0) {
        scav.currentSector = adjacentSectors[Math.floor(Math.random() * adjacentSectors.length)];
        scav.lastMoveTime = Date.now();
        broadcastTrackerUpdateFn();
      }
    }
  });
}

// Calculate what blips a player sees based on their current sector
function getBlipsForPlayer(playerId) {
  const player = state.players[playerId];
  if (!player || !player.sector) return [];

  const blips = [];

  // Organism (if moving OR in the same sector)
  const xenoRelation = getSectorRelation(player.sector, state.organism.currentSector);
  if (state.organism.isMoving || xenoRelation === 'same') {
    if (xenoRelation === 'same' || xenoRelation === 'adjacent') {
      blips.push({
        entity: 'organism',
        sector: xenoRelation,
        angle: calculateAngle(player.sector, state.organism.currentSector),
        distance: xenoRelation === 'same' ? 0.3 + Math.random() * 0.3 : 0.7 + Math.random() * 0.2,
        moving: state.organism.isMoving
      });
    }
  }

  // Scavengers
  state.scavengers.filter(s => s.alive).forEach(scavenger => {
    const relation = getSectorRelation(player.sector, scavenger.currentSector);
    if (relation === 'same' || relation === 'adjacent') {
      blips.push({
        entity: 'scavenger',
        id: scavenger.id,
        sector: relation,
        angle: calculateAngle(player.sector, scavenger.currentSector),
        distance: relation === 'same' ? 0.2 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3
      });
    }
  });

  // Other Players
  Object.values(state.players).forEach(other => {
    if (other.id === playerId || !other.online || !other.sector) return;
    const relation = getSectorRelation(player.sector, other.sector);
    if (relation === 'same' || relation === 'adjacent') {
      blips.push({
        entity: 'player',
        id: other.id,
        sector: relation,
        angle: calculateAngle(player.sector, other.sector),
        distance: relation === 'same' ? 0.2 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3
      });
    }
  });

  return blips;
}

// Loops
setInterval(patrolTick, 5000);
setInterval(scavengerTick, 5000);
setInterval(() => {
  broadcastTrackerUpdateFn();
}, 3000); // Constant ping every 3 seconds

module.exports = {
  getBlipsForPlayer,
  moveOrganism,
  setBroadcasters
};
