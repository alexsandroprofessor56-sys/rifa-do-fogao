const fs = require('fs');
const path = require('path');

const isVercel = !!process.env.VERCEL;

const DB_PATH = isVercel
  ? '/tmp/rifa-db.json'
  : path.join(__dirname, 'db.json');

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    cache = new Set(JSON.parse(raw));
  } catch {
    cache = new Set();
  }
  return cache;
}

function save() {
  if (!cache) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify([...cache]), 'utf-8');
  } catch (e) {
    console.error('Erro ao salvar db:', e.message);
  }
}

function getAll() {
  return [...load()];
}

function has(num) {
  return load().has(num);
}

function add(num) {
  const data = load();
  data.add(num);
  cache = data;
  save();
}

module.exports = { getAll, has, add };
