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

  const playerDownloaded = player.downloadedDocs || [];
  const isAndroid = player.isAndroid || false;

  const out = [];
  for (const doc of _docs.values()) {
    // If android, they see everything that is at least unlocked by master? 
    // No, user said "até pro android tem que baixar".
    // So if it's downloaded by THIS player, show it.
    
    if (playerDownloaded.includes(doc.id)) {
      out.push({
        id: doc.id,
        title: doc.title,
        sector: doc.sector || 'UNKNOWN',
        level: doc.level,
        visible: true,
        locked: false,
        author: doc.author,
        date: doc.date
      });
    }
  }
  return out;
}

function getDocumentAccess(playerId, documentId) {
  const player = state.players[playerId];
  const doc = _docs.get(documentId);
  if (!doc || !player) return false;

  console.log(`[ACCESS_CHECK] Player:${playerId} (Lvl:${player.level}, Android:${player.isAndroid}) Doc:${documentId} (Lvl:${doc.level})`);

  if (player.isAndroid) return true;
  return Number(doc.level) <= Number(player.level);
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
