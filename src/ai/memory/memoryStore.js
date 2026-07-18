// memoryStore.js — simple in-memory registry for created items
const memory = {
  categories: new Map(), // name -> id
  channels: new Map(),   // name -> id
  roles: new Map(),      // name -> id
};

function rememberCreatedItem(type, name, id) {
  if (!type || !name || !id) return;
  if (!memory[type]) return;
  memory[type].set(name, id);
}

function getItemId(type, name) {
  if (!memory[type]) return null;
  return memory[type].get(name) || null;
}

function listItems(type) {
  if (!memory[type]) return [];
  return Array.from(memory[type].entries()).map(([name, id]) => ({ name, id }));
}

function forgetItem(type, name) {
  if (!memory[type]) return;
  memory[type].delete(name);
}

module.exports = {
  rememberCreatedItem,
  getItemId,
  listItems,
  forgetItem,
};
