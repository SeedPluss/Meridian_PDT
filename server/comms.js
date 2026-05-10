'use strict';

// Max messages per channel kept in memory
const MAX_MSGS = 50;

// channels: Map<string, Array<{author, text, ts, corrupted}>>
const channels = new Map();

function _ensure(ch) {
  if (!channels.has(ch)) channels.set(ch, []);
}

function addMessage(channel, author, text, corrupted = false) {
  _ensure(channel);
  const msgs = channels.get(channel);
  const msg = { author, text, ts: Date.now(), corrupted };
  msgs.push(msg);
  if (msgs.length > MAX_MSGS) msgs.shift();
  return msg;
}

function getHistory(channel) {
  _ensure(channel);
  return channels.get(channel).slice();
}

function getAllHistory() {
  const out = {};
  for (const [ch, msgs] of channels) out[ch] = msgs.slice();
  return out;
}

function corruptMessage(channel, index) {
  _ensure(channel);
  const msgs = channels.get(channel);
  if (!msgs[index]) return null;
  msgs[index].corrupted = true;
  msgs[index].text = _corrupt(msgs[index].text);
  return msgs[index];
}

function _corrupt(text) {
  const glitchChars = '█▓▒░�';
  return text.split('').map(c =>
    Math.random() < 0.35 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : c
  ).join('');
}

module.exports = { addMessage, getHistory, getAllHistory, corruptMessage };
