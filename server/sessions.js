'use strict';

// In-memory session store.
// sessions: Map<sessionId, SessionRecord>
// wsToSession: Map<ws, sessionId>  (reverse lookup on disconnect)

const sessions    = new Map();
const wsToSession = new Map();

let _notifyMaster = null;

function setNotifier(fn) {
  _notifyMaster = fn;
}

function createSession(ws, { username, faction, level, sector, cardOwner }) {
  // One session per ws — replace if reconnecting
  const existing = wsToSession.get(ws);
  if (existing) {
    const old = sessions.get(existing);
    if (old && old.legacyTimer) clearTimeout(old.legacyTimer);
    sessions.delete(existing);
  }

  const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record = {
    id,
    username,
    faction,
    level,
    sector: sector || 'UNKNOWN',
    cardOwner: cardOwner || null,
    loginAt: Date.now(),
    legacyTimer: null,
  };
  sessions.set(id, record);
  wsToSession.set(ws, id);

  // Seegson legacy: fire alert to master after 5 minutes
  if (faction === 'seegson') {
    record.legacyTimer = setTimeout(() => {
      if (_notifyMaster) {
        _notifyMaster({
          type: 'LEGACY_ACCESS_ALERT',
          payload: { sessionId: id, username, cardOwner, loginAt: record.loginAt },
        });
      }
    }, 5 * 60 * 1000);
  }

  _broadcastSessions();
  return id;
}

function removeSession(ws) {
  const id = wsToSession.get(ws);
  if (!id) return;
  const record = sessions.get(id);
  if (record && record.legacyTimer) clearTimeout(record.legacyTimer);
  sessions.delete(id);
  wsToSession.delete(ws);
  _broadcastSessions();
}

function updateSector(ws, sector) {
  const id = wsToSession.get(ws);
  if (!id) return;
  const record = sessions.get(id);
  if (record) { record.sector = sector; _broadcastSessions(); }
}

function getSessionList() {
  return Array.from(sessions.values()).map(r => ({
    id: r.id, username: r.username, faction: r.faction,
    level: r.level, sector: r.sector, cardOwner: r.cardOwner,
    loginAt: r.loginAt,
  }));
}

function _broadcastSessions() {
  if (_notifyMaster) _notifyMaster({ type: 'SESSION_UPDATE', payload: getSessionList() });
}

module.exports = { setNotifier, createSession, removeSession, updateSector, getSessionList };
