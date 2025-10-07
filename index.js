require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const cron = require('node-cron');

// Inizializza client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

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

// Inizializza database
const db = new Database('bot.db');
db.pragma('journal_mode = WAL');
client.db = db;

// Carica bot handler
const botPath = path.join(__dirname, 'src', 'bot', 'handler.js');
if (fs.existsSync(botPath)) {
  require(botPath)(client);
}

// Carica jobs
const jobsPath = path.join(__dirname, 'src', 'jobs');
if (fs.existsSync(jobsPath)) {
  const jobFiles = fs.readdirSync(jobsPath).filter(file => file.endsWith('.js'));
  for (const file of jobFiles) {
    require(path.join(jobsPath, file))(client);
  }
}

// Eventi base
client.once('ready', () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Errore durante l\'esecuzione del comando.', ephemeral: true });
  }
});

// Avvia il bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Errore login:', err);
  process.exit(1);
});
