const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const takenNumbers = new Set();

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
  res.json({ taken: [...takenNumbers] });
});

app.post('/api/reservar', async (req, res) => {
  const { name, phone, number } = req.body;

  if (!name || !phone || !number) {
    return res.status(400).json({ error: 'Nome, telefone e número são obrigatórios.' });
  }

  if (number < 1 || number > 100) {
    return res.status(400).json({ error: 'Número inválido.' });
  }

  if (takenNumbers.has(number)) {
    return res.status(409).json({ error: 'Este número já foi reservado.' });
  }

  takenNumbers.add(number);

  try {
    await sendToTelegram(name, phone, number);
    res.json({ success: true, message: 'Número reservado com sucesso!' });
  } catch (error) {
    const detail = error.response?.data?.description || error.code || error.message || 'erro';
    console.error('Erro Telegram:', detail);
    res.json({ success: true, message: 'Número reservado com sucesso!' });
  }
});

app.get('/api/pix', (req, res) => {
  res.json({ pixKey: process.env.PIX_KEY || '79998128177' });
});

module.exports = app;
