/**
 * Comando Ping - Template base per comandi
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Risponde con Pong! e mostra la latenza del bot'),
  
  async execute(interaction) {
    const sent = await interaction.reply({ 
      content: 'Pong! ⏳', 
      fetchReply: true 
    });
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    
    await interaction.editReply(
      `🏓 Pong!\n` +
      `📊 Latenza: ${latency}ms\n` +
      `💓 API Latenza: ${apiLatency}ms`
    );
    
    // Log comando utilizzato
    const db = interaction.client.db;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const stmt = db.prepare(`
        INSERT INTO stats_daily (date, user_id, commands_used)
        VALUES (?, ?, 1)
        ON CONFLICT(date, user_id) DO UPDATE SET
          commands_used = commands_used + 1
      `);
      stmt.run(today, interaction.user.id);
    } catch (error) {
      console.error('Errore log comando:', error);
    }
  }
};
