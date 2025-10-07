/**
 * Bot Event Handler
 * Gestisce gli eventi principali del bot Discord
 */

module.exports = (client) => {
  // Handler per messaggi
  client.on('messageCreate', async (message) => {
    // Ignora messaggi del bot
    if (message.author.bot) return;
    
    // Log attività utente
    const db = client.db;
    const stmt = db.prepare(`
      INSERT INTO users (user_id, username, discriminator, last_active, message_count)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
      ON CONFLICT(user_id) DO UPDATE SET 
        last_active = CURRENT_TIMESTAMP,
        message_count = message_count + 1
    `);
    
    try {
      stmt.run(message.author.id, message.author.username, message.author.discriminator);
    } catch (error) {
      console.error('Errore salvataggio utente:', error);
    }
    
    // Aggiorna statistiche giornaliere
    const today = new Date().toISOString().split('T')[0];
    const statsStmt = db.prepare(`
      INSERT INTO stats_daily (date, user_id, messages_sent)
      VALUES (?, ?, 1)
      ON CONFLICT(date, user_id) DO UPDATE SET
        messages_sent = messages_sent + 1
    `);
    
    try {
      statsStmt.run(today, message.author.id);
    } catch (error) {
      console.error('Errore aggiornamento stats:', error);
    }
  });
  
  // Handler per nuovi membri
  client.on('guildMemberAdd', async (member) => {
    console.log(`Nuovo membro: ${member.user.tag}`);
    
    // Log audit
    const db = client.db;
    const auditStmt = db.prepare(`
      INSERT INTO audit (event_type, user_id, guild_id, action)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      auditStmt.run('member_join', member.user.id, member.guild.id, 'User joined server');
    } catch (error) {
      console.error('Errore log audit:', error);
    }
  });
  
  // Handler per membri rimossi
  client.on('guildMemberRemove', async (member) => {
    console.log(`Membro uscito: ${member.user.tag}`);
    
    // Log audit
    const db = client.db;
    const auditStmt = db.prepare(`
      INSERT INTO audit (event_type, user_id, guild_id, action)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      auditStmt.run('member_leave', member.user.id, member.guild.id, 'User left server');
    } catch (error) {
      console.error('Errore log audit:', error);
    }
  });
  
  console.log('✅ Bot handlers caricati');
};
