const sessions = {};

function newId() {
  return Math.random().toString(36).slice(2);
}

export function createSession() {
  const id = newId();
  sessions[id] = { id, messages: [] };
  return sessions[id];
}

export function getSession(id) {
  return sessions[id];
}

export function addMessage(id, msg) {
  sessions[id].messages.push(msg);
}
