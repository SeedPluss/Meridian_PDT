// server/index.js
'use strict';

const express = require('express');
const http = require('http');
const { WebSocketServer, OPEN } = require('ws');
const path = require('path');
const { state, applyDelta } = require('./state');
const { getCharacter } = require('./characters');
const { getBlipsForPlayer, moveOrganism, setBroadcasters } = require('./tracker');
const { getSystemBriefing, unlockSystem, resolveRepair } = require('./systems');
const documents = require('./documents');

documents.loadDocuments();

const PORT = process.env.PORT || 3000;
const MASTER_KEY = process.env.MASTER_KEY || 'meridian-master';

const app = express();
app.use(express.json());

// Servir estáticos
app.use(express.static(path.join(__dirname, '..', 'public', 'player')));
app.use('/shared', express.static(path.join(__dirname, '..', 'public', 'shared')));
app.use('/master', express.static(path.join(__dirname, '..', 'public', 'master')));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'player', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();

function broadcast(msg, excludeWs = null) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === OPEN) ws.send(data);
  });
}

function broadcastToPlayers(msg) {
  const data = JSON.stringify(msg);
  clients.forEach((info, ws) => {
    if (info.role === 'player' && ws.readyState === OPEN) ws.send(data);
  });
}

function broadcastToMasters(msg) {
  const data = JSON.stringify(msg);
  clients.forEach((info, ws) => {
    if (info.role === 'master' && ws.readyState === OPEN) ws.send(data);
  });
}

function sendTo(ws, msg) {
  if (ws.readyState === OPEN) ws.send(JSON.stringify(msg));
}

// Conectar as funções do tracker.js aos broadcasters do index.js
setBroadcasters(
  () => {
    // tracker update
    clients.forEach((info, ws) => {
      if (info.role === 'player' && ws.readyState === OPEN) {
        if (!state.systems.motion_tracker.online) {
          sendTo(ws, { type: 'TRACKER_UPDATE', blips: [], sensorOnline: false });
        } else {
          const blips = getBlipsForPlayer(info.id);
          sendTo(ws, { type: 'TRACKER_UPDATE', blips, sensorOnline: true });
        }
      }
    });
    broadcastToMasters({ type: 'MASTER_TRACKER_UPDATE', organism: state.organism, scavengers: state.scavengers });
  },
  () => {
    // temperature update
    broadcastToMasters({ type: 'MASTER_TEMP_UPDATE', temps: state.sectorTemperature });
    // Also send to android
    clients.forEach((info, ws) => {
      if (info.role === 'player' && state.players[info.id]?.isAndroid && ws.readyState === OPEN) {
        sendTo(ws, { type: 'ANDROID_TEMP_UPDATE', temps: state.sectorTemperature });
      }
    });
  }
);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  clients.set(ws, { role: 'player', id: 'unknown' });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const info = clients.get(ws);

    switch (msg.type) {
      case 'MASTER_AUTH': {
        if (msg.key === MASTER_KEY) {
          clients.set(ws, { role: 'master', id: 'master' });
          sendTo(ws, { type: 'FULL_STATE', state });
        } else {
          sendTo(ws, { type: 'ERROR', msg: 'unauthorized' });
        }
        break;
      }

      case 'LOGIN': {
        const { username, password } = msg;
        const char = getCharacter(username, password);
        if (char) {
            info.role = 'player';
            info.id = char.id;
            state.players[char.id] = {
              id: char.id,
              name: char.nome,
              role: char.cargo,
              level: char.nivel,
              skills: char.skills,
              sector: 'A1', // default starting sector
              stress: 0,
              stress_max: char.stress_max,
              isAndroid: char.isAndroid,
              online: true,
              lastLocationUpdate: Date.now()
            };
          
          sendTo(ws, { 
            type: 'LOGIN_OK', 
            character: { ...char, isAndroid: undefined } // hide android flag
          });
          broadcastToMasters({ type: 'FULL_STATE', state });
        } else {
          sendTo(ws, { type: 'LOGIN_ERR', msg: 'CREDENCIAS INVÁLIDAS' });
        }
        break;
      }

      case 'SECTOR_MOVE': {
        if (info.role !== 'player') break;
        const toSector = msg.sector;
        if (state.sectors[toSector]) {
          if (state.players[info.id]) {
            state.players[info.id].sector = toSector;
            state.players[info.id].lastLocationUpdate = Date.now();
            sendTo(ws, { type: 'SECTOR_MOVE_OK', sector: toSector });
            broadcastToMasters({ type: 'FULL_STATE', state });
            
            // Check if any system here is unlocked but they haven't seen it
            // Send vibration
            sendTo(ws, { type: 'SYSTEMS_AVAILABLE', systems: state.unlockedSystems[toSector] });
          }
        }
        break;
      }

      case 'DOC_DOWNLOAD': {
        const { documentId } = msg;
        const hasAccess = documents.getDocumentAccess(info.id, documentId);
        if (hasAccess) {
          const doc = documents.getDoc(documentId);
          sendTo(ws, { type: 'DOC_DOWNLOAD_OK', doc });
        } else {
          sendTo(ws, { type: 'DOC_DOWNLOAD_ERR', msg: 'CREDENCIAL INSUFICIENTE' });
        }
        break;
      }

      case 'DOC_LIST_REQUEST': {
        const list = documents.getIndex(info.id);
        sendTo(ws, { type: 'DOC_LIST', docs: list });
        break;
      }

      case 'SYSTEM_BRIEFING_REQUEST': {
        const { systemId } = msg;
        const briefing = getSystemBriefing(info.id, systemId);
        if (briefing) {
          sendTo(ws, { type: 'SYSTEM_BRIEFING', briefing });
        }
        break;
      }

      case 'MINIGAME_RESULT': {
        const { systemId, success } = msg;
        resolveRepair(systemId, success);
        if (!success && state.players[info.id]) {
          state.players[info.id].stress += 1;
        }
        broadcastToMasters({ type: 'FULL_STATE', state });
        break;
      }

      // --- MASTER COMMANDS ---
      case 'MASTER_UNLOCK_SYS': {
        if (info.role !== 'master') break;
        const { sector, systemId, targetPlayerId } = msg;
        unlockSystem(sector, systemId);
        clients.forEach((c, targetWs) => {
          if (c.id === targetPlayerId && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'NOTIFY_SYS_UNLOCKED', systemId });
          }
        });
        broadcastToMasters({ type: 'FULL_STATE', state });
        break;
      }

      case 'MASTER_UNLOCK_DOC': {
        if (info.role !== 'master') break;
        const { documentId, targetPlayerId } = msg;
        documents.unlockDoc(documentId);
        clients.forEach((c, targetWs) => {
          if ((!targetPlayerId || c.id === targetPlayerId) && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'NOTIFY_DOC_UNLOCKED', documentId });
            const list = documents.getIndex(c.id);
            sendTo(targetWs, { type: 'DOC_LIST', docs: list });
          }
        });
        break;
      }

      case 'MASTER_XENO_HUNT': {
        if (info.role !== 'master') break;
        const { targetPlayerId } = msg;
        const playerSector = state.players[targetPlayerId]?.sector;
        if (playerSector) {
          state.organism.mode = 'hunt';
          state.organism.huntTarget = targetPlayerId;
          moveOrganism(playerSector);
          
          setTimeout(() => {
            state.organism.mode = 'patrol';
            state.organism.huntTarget = null;
          }, 120000); // 2 minutes hunt
        }
        broadcastToMasters({ type: 'FULL_STATE', state });
        break;
      }

      case 'MASTER_MOVE_ORGANISM': {
        if (info.role !== 'master') break;
        const { sector } = msg;
        moveOrganism(sector);
        broadcastToMasters({ type: 'FULL_STATE', state });
        break;
      }

      case 'MASTER_MOVE_PLAYER': {
        if (info.role !== 'master') break;
        const { targetPlayerId, sector } = msg;
        if (state.players[targetPlayerId]) {
          state.players[targetPlayerId].sector = sector;
          state.players[targetPlayerId].lastLocationUpdate = Date.now();
          broadcastToMasters({ type: 'FULL_STATE', state });
          // Notify the player too if they are connected
          clients.forEach((c, targetWs) => {
            if (c.id === targetPlayerId && targetWs.readyState === OPEN) {
              sendTo(targetWs, { type: 'NOTIFY_SECTOR_MOVE', sector });
            }
          });
        }
        break;
      }

      case 'MASTER_ADJ_STRESS': {
        if (info.role !== 'master') break;
        const { targetPlayerId, delta } = msg;
        if (state.players[targetPlayerId]) {
          state.players[targetPlayerId].stress = Math.max(0, state.players[targetPlayerId].stress + delta);
          broadcastToMasters({ type: 'FULL_STATE', state });
          // Notify the player
          clients.forEach((c, targetWs) => {
            if (c.id === targetPlayerId && targetWs.readyState === OPEN) {
              sendTo(targetWs, { type: 'STRESS_UPDATE', stress: state.players[targetPlayerId].stress });
            }
          });
        }
        break;
      }

      case 'MASTER_KILL_SCAVENGER': {
        if (info.role !== 'master') break;
        const { scavengerId } = msg;
        const scav = state.scavengers.find(s => s.id === scavengerId);
        if (scav) {
          scav.alive = false;
          broadcastToMasters({ type: 'FULL_STATE', state });
        }
        break;
      }

      case 'MASTER_SEND_MOTHER': {
        if (info.role !== 'master') break;
        const { targetPlayerId, voice, text } = msg;
        clients.forEach((c, targetWs) => {
          if ((!targetPlayerId || c.id === targetPlayerId || targetPlayerId === 'TODOS') && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'MOTHER_MSG', voice, text });
          }
        });
        break;
      }

      case 'MASTER_SEND_SECRET': {
        if (info.role !== 'master') break;
        const { targetPlayerId, text } = msg;
        clients.forEach((c, targetWs) => {
          if (c.id === targetPlayerId && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'SECRET_MSG', text });
          }
        });
        break;
      }

      case 'MASTER_COUNTDOWN': {
        if (info.role !== 'master') break;
        const { text, duration, targetPlayerId } = msg;
        clients.forEach((c, targetWs) => {
          if ((!targetPlayerId || c.id === targetPlayerId || targetPlayerId === 'TODOS') && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'COUNTDOWN_START', text, duration });
          }
        });
        break;
      }

      case 'MASTER_VIBRATE': {
        if (info.role !== 'master') break;
        const { targetPlayerId } = msg;
        clients.forEach((c, targetWs) => {
          if (c.id === targetPlayerId && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'VIBRATE_SILENT' });
          }
        });
        break;
      }
      
      // CHAT messages
      case 'CHAT_SEND': {
        const { channel, text } = msg;
        if (!channel || !text) break;
        const authorName = state.players[info.id]?.name || 'UNKNOWN';
        const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newMsg = { 
          channel, 
          sender: authorName, 
          text, 
          time: timeStr, 
          type: 'crew', 
          timestamp: Date.now() 
        };
        
        // WY channel is restricted
        if (channel === 'W-Y') {
          if (info.role === 'master' || state.players[info.id]?.isAndroid) {
            clients.forEach((c, targetWs) => {
              if ((c.role === 'master' || state.players[c.id]?.isAndroid) && targetWs.readyState === OPEN) {
                sendTo(targetWs, { type: 'COMMS_MESSAGE', message: newMsg });
              }
            });
          }
        } else {
          // Broadcast to all except sender (PDT has local echo)
          broadcast({ type: 'COMMS_MESSAGE', message: newMsg }, ws);
          // Ensure Master gets it (Master doesn't have local echo for player messages)
          broadcastToMasters({ type: 'COMMS_MESSAGE', message: newMsg });
        }
        break;
      }

      // Android specific queries
      case 'ANDROID_TEAM_LOCATIONS': {
        if (state.players[info.id]?.isAndroid) {
          const locations = Object.values(state.players).map(p => ({
            name: p.name,
            sector: p.sector,
            lastUpdate: p.lastLocationUpdate
          }));
          sendTo(ws, { type: 'TEAM_LOCATIONS_RESULT', locations });
        }
        break;
      }

      default:
        console.log('[WS] Unknown message type:', msg.type);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => console.error('[WS] Error:', err.message));
});

// Heartbeat
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MERIDIAN SERVER RUNNING ON PORT ${PORT}`);
});
