require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const express = require('express');
const cron = require('node-cron');

// Inizializza MinfoAI Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

client.commands = new Collection();

// Inizializza database MinfoAI
const db = new Database('minfoai.db');
db.pragma('journal_mode = WAL');
client.db = db;

// Carica moduli AI
const aiModeration = require('./src/bot/aiModeration');
aiModeration.init(client);

// Carica comandi
const commandsPath = path.join(__dirname, 'src', 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

// Carica eventi Discord
const eventsPath = path.join(__dirname, 'src', 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

// Avvia dashboard web
const dashboard = require('./src/web/dashboard');
dashboard.start(client);

// Eventi base MinfoAI
client.once('ready', () => {
  console.log(`✅ MinfoAI Bot online come ${client.user.tag}`);
  console.log(`🤖 Serving ${client.guilds.cache.size} servers`);
  console.log(`🧠 AI Moderation: ATTIVA`);
  console.log(`🌐 Dashboard Web: http://localhost:${process.env.WEB_PORT || 3000}`);
  
  // Imposta attività del bot
  client.user.setActivity('MinfoAI - AI Moderation & XP', { type: 'WATCHING' });
});

// Handler interazioni comandi
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
    
    // Log utilizzo comandi per statistiche
    const dbModule = require('./src/store/db');
    dbModule.logCommandUsage(interaction.guildId, interaction.user.id, interaction.commandName);
    
  } catch (error) {
    console.error(`Errore comando ${interaction.commandName}:`, error);
    const errorMsg = 'Errore durante l\'esecuzione del comando MinfoAI.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
});

// Handler messaggi per XP e AI moderation
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  try {
    // Sistema XP
    const dbModule = require('./src/store/db');
    await dbModule.addXP(message.guildId, message.author.id, 1);
    
    // AI Moderation automatica
    await aiModeration.checkMessage(message);
    
  } catch (error) {
    console.error('Errore handler messaggio:', error);
  }
});

// Handler nuovi membri
client.on('guildMemberAdd', async member => {
  try {
    const dbModule = require('./src/store/db');
    await dbModule.initializeMember(member.guild.id, member.user.id);
    
    // Messaggio di benvenuto personalizzato
    const welcomeChannel = member.guild.systemChannel;
    if (welcomeChannel) {
      const embed = {
        color: 0x00ff00,
        title: '🎉 Benvenuto in MinfoAI!',
        description: `Ciao ${member.user.username}! Benvenuto nel server.\nInizia a guadagnare XP chattando e partecipando alle attività!`,
        timestamp: new Date(),
        footer: { text: 'MinfoAI Bot - Sistema XP Attivo' }
      };
      
      await welcomeChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Errore welcome member:', error);
  }
});

// Job periodici
cron.schedule('0 0 * * 0', () => {
  // Report settimanale automatico
  console.log('🔄 Esecuzione report settimanale MinfoAI...');
  const dbModule = require('./src/store/db');
  dbModule.generateWeeklyReport();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutdown MinfoAI Bot...');
  
  try {
    await client.destroy();
    db.close();
    console.log('✅ MinfoAI Bot disconnesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante shutdown:', error);
    process.exit(1);
  }
});

// Avvia MinfoAI Bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Errore login MinfoAI:', err);
  process.exit(1);
});
