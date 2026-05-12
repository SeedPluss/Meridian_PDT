// server/systems.js
const { state } = require('./state');

// Minigames configuration
const SYSTEMS = {
  power_grid: {
    id: 'power_grid',
    name: 'Power Grid',
    sector: 'C1',
    skill: 'Tecnologia',
    difficulty: 'ALTA',
    description: 'Roteamento de circuito elétrico de alta tensão dos decks principais.',
    repairEstimates: '3-5 minutos',
    minigame: 'manual_reroute'
  },
  life_support: {
    id: 'life_support',
    name: 'Life Support',
    sector: 'B1',
    skill: 'Medicina',
    difficulty: 'ALTA',
    description: 'Substituição de fusíveis e reequilíbrio de gases e temperatura.',
    repairEstimates: '4-6 minutos',
    minigame: 'pressure_balance'
  },
  comms_local: {
    id: 'comms_local',
    name: 'Comms Local',
    sector: 'A2',
    skill: 'Tecnologia',
    difficulty: 'NORMAL',
    description: 'Substituição de chips e sintonia de rádio-frequência.',
    repairEstimates: '2-4 minutos',
    minigame: 'reboot_sequence'
  },
  motion_tracker: {
    id: 'motion_tracker',
    name: 'Motion Tracker Network',
    sector: 'B_corridors',
    skill: 'Percepção',
    difficulty: 'NORMAL',
    description: 'Boot sequence e calibração de sensores ultrassônicos.',
    repairEstimates: '1-2 minutos',
    minigame: 'reboot_sequence' // Fallback to reboot_sequence if no specific minigame
  },
  lighting_a: {
    id: 'lighting_a',
    name: 'Lighting - Deck A',
    sector: 'A_corridors',
    skill: 'Tecnologia',
    difficulty: 'NORMAL',
    description: 'Restauração de cabos e reconfiguração de fusíveis de luz.',
    repairEstimates: '2-3 minutos',
    minigame: 'circuit_match'
  },
  lighting_b: {
    id: 'lighting_b',
    name: 'Lighting - Deck B',
    sector: 'B_corridors',
    skill: 'Tecnologia',
    difficulty: 'NORMAL',
    description: 'Restauração de cabos e reconfiguração de fusíveis de luz.',
    repairEstimates: '2-3 minutos',
    minigame: 'circuit_match'
  },
  lighting_c: {
    id: 'lighting_c',
    name: 'Lighting - Deck C',
    sector: 'MBC',
    skill: 'Tecnologia',
    difficulty: 'ALTA',
    description: 'Restauração extensa de cabos (Dano severo no Deck C).',
    repairEstimates: '3-4 minutos',
    minigame: 'circuit_match'
  },
  door_control: {
    id: 'door_control',
    name: 'Door Control Override',
    sector: 'C3',
    skill: 'Tecnologia',
    difficulty: 'NORMAL',
    description: 'Override de segurança e bypass de trava de portas.',
    repairEstimates: '2-4 minutos',
    minigame: 'circuit_match_doors'
  },
  reactor: {
    id: 'reactor',
    name: 'Reactor Stabilization',
    sector: 'C1',
    skill: 'Tecnologia',
    difficulty: 'ALTA',
    description: 'Sequência de comandos de núcleo e estabilização paralela de pressão.',
    repairEstimates: '5-8 minutos',
    minigame: 'system_stabilizer'
  },
  comms_lr: {
    id: 'comms_lr',
    name: 'Comms Long Range',
    sector: 'A2',
    skill: 'Percepção',
    difficulty: 'ALTA',
    description: 'Calibração estelar e alinhamento de antena de longa distância.',
    repairEstimates: '3-5 minutos',
    minigame: 'manual_reroute' // Fallback
  },
  lifepods: {
    id: 'lifepods',
    name: 'Lifepods / Doca',
    sector: 'C3',
    skill: 'Tecnologia',
    difficulty: 'ALTA',
    description: 'Autorização, abastecimento simultâneo e definição de coordenadas.',
    repairEstimates: '4-6 minutos',
    minigame: 'reboot_sequence' // Fallback
  }
};

function getSystemBriefing(playerId, systemId) {
  const base = SYSTEMS[systemId];
  if (!base) return null;

  const player = state.players[playerId];
  
  let briefing = {
    ...base,
    playerSkillLevel: player && player.skills.includes(base.skill) ? player.level : 0,
    systemKey: systemId,
    label: base.name
  };

  if (player && player.isAndroid) {
    briefing.androidDiagnostic = {
      sectorTemperature: state.sectorTemperature[player.sector] || 20.0,
      estimatedRepairTime: base.repairEstimates,
      systemIntegrity: state.systems[systemId]?.integrity || 100,
      integrityWarning: (state.systems[systemId]?.integrity || 100) < 50
    };
  }

  return briefing;
}

function unlockSystem(sector, systemId) {
  if (state.unlockedSystems[sector]) {
    state.unlockedSystems[sector][systemId] = true;
  }
}

function resolveRepair(systemId, success) {
  if (state.systems[systemId]) {
    state.systems[systemId].online = success;
    if(success) state.systems[systemId].integrity = 100;
  }
}

module.exports = {
  SYSTEMS,
  getSystemBriefing,
  unlockSystem,
  resolveRepair
};
