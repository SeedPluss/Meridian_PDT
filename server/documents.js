// server/documents.js
'use strict';

const fs = require('fs');
const path = require('path');
const { state } = require('./state');

const DATA_DIR = path.join(__dirname, 'data', 'documents');
let _docs = new Map();

function loadDocuments() {
  _docs.clear();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // create a dummy document for test if empty
    const dummy = {
      id: "DOC-WY06", title: "W-Y OPERATIONS OVERRIDE", sector: "A2", level: 3,
      content: "Override command: [AUTHORIZE] [BYPASS] [OVERRIDE] [EXECUTE]"
    };
    fs.writeFileSync(path.join(DATA_DIR, 'doc-wy06.json'), JSON.stringify(dummy));
    _docs.set(dummy.id, dummy);
  } else {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      const doc = JSON.parse(raw);
      _docs.set(doc.id, doc);
    }
  }
}

function getIndex(playerId) {
  const player = state.players[playerId];
  if (!player) return [];

  const playerLevel = player.level || 1;
  const isAndroid = player.isAndroid || false;

  const out = [];
  for (const doc of _docs.values()) {
    // If android, they have access to everything (level 3/unrestricted)
    // The prompt says: Android — acesso nível 3 automático
    const hasAccess = isAndroid || doc.level <= playerLevel || doc.visible;
    const isUnlocked = hasAccess; // docs requested by ID. The index shows what they found/unlocked.

    // Docs only show in index if they are unlocked for this player explicitly by master, 
    // or if the player is Android and looking at it?
    // "O ?? é intencional... Organizados por setor... Ordenados por hora"
    // We will list all unlocked docs.
    
    if (state.unlockedDocs.includes(doc.id) || isAndroid) {
      out.push({
        id: doc.id,
        title: doc.title,
        sector: doc.sector || 'UNKNOWN',
        level: doc.level,
        visible: true,
        locked: false
      });
    }
  }
  return out;
}

function getDocumentAccess(playerId, documentId) {
  const player = state.players[playerId];
  const doc = _docs.get(documentId);
  if (!doc || !player) return false;

  if (player.isAndroid) return true;
  return doc.level <= player.level;
}

function getDoc(id) {
  return _docs.get(id) || null;
}

function unlockDoc(id) {
  if (!_docs.has(id)) return false;
  if (!state.unlockedDocs.includes(id)) {
    state.unlockedDocs.push(id);
  }
  return true;
}

function injectDoc(doc) {
  _docs.set(doc.id, doc);
}

module.exports = { loadDocuments, getIndex, getDocumentAccess, getDoc, unlockDoc, injectDoc };
