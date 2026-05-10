'use strict';

// Crew cards: physical QR props printed by master.
// Code format: XXXX-XXXX-XXXX (case-insensitive, dashes stripped for comparison).
// faction: 'seegson' — unlocks original docs, triggers silent legacy flag.
const CARDS = [
  {
    code: 'MRDX-7F3K-AZZT',
    name: 'Dr. Vasquez, C.',
    role: 'Chief Medical Officer',
    sector: 'B3',
    faction: 'seegson',
    level: 3,
    unlockedDocs: ['RES-001', 'RES-002'],
  },
  {
    code: 'MRDX-2B9R-QLTV',
    name: 'Kowalski, M.',
    role: 'Chief Engineer',
    sector: 'C1',
    faction: 'seegson',
    level: 3,
    unlockedDocs: ['RES-001', 'OPS-001', 'OPS-002'],
  },
  {
    code: 'MRDX-5H1W-PXNM',
    name: 'Chen, R.',
    role: 'Navigation Officer',
    sector: 'A1',
    faction: 'seegson',
    level: 2,
    unlockedDocs: ['OPS-001'],
  },
  {
    code: 'MRDX-8K4J-RNSD',
    name: 'Reyes, D.',
    role: 'Security Chief',
    sector: 'B4',
    faction: 'seegson',
    level: 2,
    unlockedDocs: ['OPS-001', 'OPS-002'],
  },
  {
    code: 'MRDX-3F7C-VWKP',
    name: 'Osei, T.',
    role: 'Cargo Specialist',
    sector: 'C2',
    faction: 'seegson',
    level: 3,
    unlockedDocs: ['RES-001', 'RES-002', 'OPS-001'],
  },
];

function lookupCard(rawCode) {
  const normalized = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return CARDS.find(c => c.code.replace(/-/g, '') === normalized) || null;
}

module.exports = { CARDS, lookupCard };
