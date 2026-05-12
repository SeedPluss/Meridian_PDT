// server/index.js
'use strict';

const express = require('express');
const http = require('http');
const { WebSocketServer, OPEN } = require('ws');
const path = require('path');
const { state, applyDelta } = require('./state');
const { getCharacter, getCharacterById } = require('./characters');
const { getBlipsForPlayer, moveOrganism, setBroadcasters } = require('./tracker');
const { getSystemBriefing, unlockSystem, resolveRepair } = require('./systems');
const documents = require('./documents');

documents.loadDocuments();

const PORT = process.env.PORT || 3000;
const MASTER_KEY = process.env.MASTER_KEY || 'alienfofinho123';
console.log('[DEBUG] Sistema iniciado. Chave Master configurada:', MASTER_KEY);

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
const masters = new Set();

function broadcast(msg, excludeWs = null) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === OPEN) ws.send(data);
  });
}

function broadcastToPlayers(msg, excludeWs = null) {
  const data = JSON.stringify(msg);
  clients.forEach((info, ws) => {
    if (info.role === 'player' && ws !== excludeWs && ws.readyState === OPEN) ws.send(data);
  });
}

function broadcastToMasters(msg) {
  const data = JSON.stringify(msg);
  if (masters.size === 0) console.log('[WS] Nenhum mestre conectado para receber:', msg.type);
  masters.forEach(ws => {
    if (ws.readyState === OPEN) {
      ws.send(data);
      console.log(`[WS] Enviado ${msg.type} para Master.`);
    }
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

  // Heartbeat para o Render não derrubar a conexão
  const pingInterval = setInterval(() => {
    if (ws.isAlive === false) {
      clearInterval(pingInterval);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
    clients.delete(ws);
    masters.delete(ws);
    console.log('[WS] Conexão encerrada.');
  });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    console.log('[WS] Recebido:', msg.type, 'de', clients.get(ws)?.role);

    const info = clients.get(ws);

    switch (msg.type) {
      case 'MASTER_AUTH': {
        if (msg.key === MASTER_KEY) {
          clients.set(ws, { role: 'master', id: 'master' });
          masters.add(ws);
          sendTo(ws, { type: 'FULL_STATE', state });
          console.log('[AUTH] Mestre autenticado com sucesso.');
        } else {
          console.error('[AUTH] Tentativa de autenticação Master falhou: chave incorreta.');
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
          const existing = state.players[char.id];
          state.players[char.id] = {
            id: char.id,
            name: char.nome,
            role: char.cargo,
            nome: char.nome, // Para compatibilidade com PDTHeader
            cargo: char.cargo,
            pdtId: char.pdtId,
            level: char.nivel,
            skills: char.skills,
            sector: (existing && existing.sector) || 'A1',
            stress: (existing && existing.stress) || 0,
            stress_max: char.stress_max,
            isAndroid: char.isAndroid,
            online: true,
            lastLocationUpdate: Date.now()
          };
          
          sendTo(ws, { 
            type: 'LOGIN_OK', 
            character: { ...char, isAndroid: undefined } 
          });
          broadcastToMasters({ type: 'FULL_STATE', state });
          console.log(`[LOGIN] ${char.nome} logado.`);
        } else {
          sendTo(ws, { type: 'LOGIN_ERR', msg: 'CREDENCIAS INVÁLIDAS' });
        }
        break;
      }

      case 'RESUME_SESSION': {
        const { characterId } = msg;
        let pData = state.players[characterId];
        console.log(`[RESUME] Tentativa de retomar: ${characterId}`);
        
        if (!pData) {
          console.log(`[RESUME] Jogador ${characterId} não está no estado. Restaurando...`);
          const char = getCharacterById(characterId);
          if (char) {
            state.players[characterId] = {
              id: char.id,
              name: char.nome,
              role: char.cargo,
              nome: char.nome,
              cargo: char.cargo,
              pdtId: char.pdtId,
              level: char.nivel,
              skills: char.skills,
              sector: 'A1',
              stress: 0,
              stress_max: char.stress_max,
              isAndroid: char.isAndroid,
              online: true,
              lastLocationUpdate: Date.now()
            };
            pData = state.players[characterId];
          }
        }

        if (pData) {
          info.role = 'player';
          info.id = characterId;
          pData.online = true;
          sendTo(ws, { type: 'SESSION_RESUMED', character: pData });
          sendTo(ws, { type: 'FULL_STATE', state });
          broadcastToMasters({ type: 'FULL_STATE', state });
          console.log(`[RESUME] SUCESSO: ${pData.name} retomou conexão.`);
        } else {
          console.log(`[RESUME] FALHA: ID inválido ${characterId}`);
          sendTo(ws, { type: 'SESSION_ERR', msg: 'Sessão expirada. Faça login novamente.' });
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
        broadcastToMasters({ type: 'FULL_STATE', state });
        clients.forEach((c, targetWs) => {
          if ((!targetPlayerId || targetPlayerId === 'TODOS' || c.id == targetPlayerId) && targetWs.readyState === OPEN) {
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
        const playerKey = Object.keys(state.players).find(k => k == targetPlayerId);
        if (playerKey) {
          state.players[playerKey].sector = sector;
          state.players[playerKey].lastLocationUpdate = Date.now();
          broadcastToMasters({ type: 'FULL_STATE', state });
          // Notify the player
          clients.forEach((c, targetWs) => {
            if (c.id == targetPlayerId && targetWs.readyState === OPEN) {
              sendTo(targetWs, { type: 'NOTIFY_SECTOR_MOVE', sector });
            }
          });
        }
        break;
      }

      case 'MASTER_ADJ_STRESS': {
        if (info.role !== 'master') break;
        const { targetPlayerId, delta } = msg;
        const playerKey = Object.keys(state.players).find(k => k == targetPlayerId);
        if (playerKey) {
          state.players[playerKey].stress = Math.max(0, (state.players[playerKey].stress || 0) + delta);
          broadcastToMasters({ type: 'FULL_STATE', state });
          // Notify the player
          clients.forEach((c, targetWs) => {
            if (c.id == targetPlayerId && targetWs.readyState === OPEN) {
              sendTo(targetWs, { type: 'STRESS_UPDATE', stress: state.players[playerKey].stress });
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
        const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const motherMsg = { 
          type: 'MOTHER_MSG', voice, text 
        };
        const historyMsg = {
          type: 'COMMS_MESSAGE',
          message: {
            channel: 'GERAL',
            sender: voice === 'W-Y' ? 'W-Y MOTHER' : 'MOTHER',
            text: text,
            time: timeStr,
            type: 'system',
            timestamp: Date.now()
          }
        };

        clients.forEach((c, targetWs) => {
          const pState = state.players[c.id];
          const isTarget = (
            targetPlayerId === 'TODOS' || 
            c.id == targetPlayerId || 
            (pState && pState.sector === targetPlayerId)
          );
          if (isTarget && targetWs.readyState === OPEN) {
            sendTo(targetWs, motherMsg);
            sendTo(targetWs, historyMsg);
          }
        });
        // Also send to Master history
        broadcastToMasters(historyMsg);
        break;
      }

      case 'MASTER_SEND_SECRET': {
        if (info.role !== 'master') break;
        const { targetPlayerId, text } = msg;
        clients.forEach((c, targetWs) => {
          const isTarget = (c.id == targetPlayerId);
          if (isTarget && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'SECRET_NOTE', text });
          }
        });
        break;
      }

      case 'MASTER_COUNTDOWN': {
        if (info.role !== 'master') break;
        const { text, duration, targetPlayerId } = msg;
        clients.forEach((c, targetWs) => {
          const pState = state.players[c.id];
          const isTarget = (
            !targetPlayerId || 
            targetPlayerId === 'TODOS' || 
            c.id == targetPlayerId || 
            (pState && pState.sector === targetPlayerId)
          );
          if (isTarget && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'COUNTDOWN_START', text, duration });
          }
        });
        break;
      }

      case 'MASTER_VIBRATE': {
        if (info.role !== 'master') break;
        const { targetPlayerId } = msg;
        clients.forEach((c, targetWs) => {
          const pState = state.players[c.id];
          const isTarget = (
            targetPlayerId === 'TODOS' || 
            c.id == targetPlayerId || 
            (pState && pState.sector === targetPlayerId)
          );
          if (isTarget && targetWs.readyState === OPEN) {
            sendTo(targetWs, { type: 'VIBRATE_SILENT' });
          }
        });
        break;
      }
      
      // CHAT messages
      case 'CHAT_SEND': {
        const { channel, text } = msg;
        if (!text) break;
        const authorName = state.players[info.id]?.name || 'UNKNOWN';
        const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newMsg = { 
          channel: channel || 'GERAL', 
          sender: authorName, 
          text, 
          time: timeStr, 
          type: 'crew', 
          timestamp: Date.now() 
        };
        
        console.log(`[CHAT] ${authorName} @ ${channel || 'GERAL'}: ${text}`);

        if (channel === 'W-Y') {
          // Restricted WY channel logic
          clients.forEach((c, targetWs) => {
            if ((c.role === 'master' || state.players[c.id]?.isAndroid) && targetWs.readyState === OPEN) {
              sendTo(targetWs, { type: 'COMMS_MESSAGE', message: newMsg });
            }
          });
        } else {
          // Standard broadcast
          const commsMsg = { type: 'COMMS_MESSAGE', message: newMsg };
          // Enviar para TODOS os jogadores (exceto quem enviou, pois tem eco local)
          broadcastToPlayers(commsMsg, ws);
          // Garantir que os Mestres recebam
          broadcastToMasters(commsMsg);
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

      case 'MASTER_REQUEST_SYNC': {
        if (info.role === 'master' || msg.key === MASTER_KEY) {
          sendTo(ws, { type: 'FULL_STATE', state });
          console.log('[MASTER] Sincronismo forçado realizado.');
        } else {
          console.log('[MASTER] Sincronismo negado: não autorizado.');
        }
        break;
      }

      default:
        console.log('[WS] Unknown message type:', msg.type);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    masters.delete(ws);
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
