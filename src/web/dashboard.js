const express = require('express');
const db = require('../store/db');
const app = express();

app.get('/stats', async (req, res) => {
  const stats = await db.getBotStats();
  res.json(stats);
});

app.get('/settings', async (req, res) => {
  const settings = await db.getAllSettings();
  res.json(settings);
});

app.listen(8080, () => console.log('MinfoAI Web Dashboard online su http://localhost:8080'));
