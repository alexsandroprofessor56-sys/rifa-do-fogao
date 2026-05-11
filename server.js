require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendToTelegram(name, phone, number) {
  const num = String(number).padStart(2, '0');
  const msg = `🎟️ *Nova venda na Rifa!*\n\n👤 *Nome:* ${name}\n📱 *Telefone:* ${phone}\n🔢 *Número:* ${num}\n💰 *Valor:* R$ 15,00\n⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    { chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' },
    { timeout: 15000 }
  );
}

app.get('/api/numeros', (req, res) => {
  res.json({ taken: store.getAll() });
});

app.post('/api/reservar', async (req, res) => {
  const { name, phone, number } = req.body;

  if (!name || !phone || !number) {
    return res.status(400).json({ error: 'Nome, telefone e número são obrigatórios.' });
  }

  if (number < 1 || number > 100) {
    return res.status(400).json({ error: 'Número inválido.' });
  }

  if (store.has(number)) {
    return res.status(409).json({ error: 'Este número já foi reservado.' });
  }

  store.add(number);

  try {
    await sendToTelegram(name, phone, number);
    res.json({ success: true, message: 'Número reservado com sucesso!' });
  } catch (error) {
    const detail = error.response?.data?.description || error.code || error.message || 'erro desconhecido';
    console.error('Erro Telegram:', detail);
    res.json({ success: true, message: 'Número reservado com sucesso!' });
  }
});

app.get('/api/pix', (req, res) => {
  res.json({ pixKey: process.env.PIX_KEY || '79998128177' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
