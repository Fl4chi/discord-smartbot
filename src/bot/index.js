// src/bot/index.js
// Core bot initialization and event management

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { loadCommands } = require('../commands');
const { handleMessage } = require('../nlp');
const { logAction } = require('./moderation');
const { checkRaidProtection } = require('./antiraid');
const db = require('../store/db');

/**
 * Initialize Discord bot with all necessary intents and handlers
 * @param {string} token - Discord bot token
 * @returns {Client} Discord client instance
 */
function initBot(token) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildPresences
    ]
  });

  // Initialize commands collection
  client.commands = new Collection();

  // Load all commands
  loadCommands(client);

  // Bot ready event
  client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    
    // Set bot activity
    client.user.setActivity('AI Assistant | /help', { type: ActivityType.Playing });
    
    // Initialize database
    await db.init();
    console.log('✅ Database initialized');
  });

  // Handle interactions (slash commands)
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      // Log command usage
      await db.logCommand({
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
        commandName: interaction.commandName,
        timestamp: new Date()
      });

      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      const reply = { content: '❌ Errore durante l\'esecuzione del comando.', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  // Handle messages for NLP and moderation
  client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    try {
      // Check raid protection (anti-spam, anti-raid)
      const raidCheck = await checkRaidProtection(message);
      if (raidCheck.triggered) {
        await logAction(message.guild.id, 'auto_moderation', {
          userId: message.author.id,
          reason: raidCheck.reason,
          action: raidCheck.action
        });
        return; // Message was handled by anti-raid system
      }

      // Handle NLP conversation (only if bot is mentioned or in DM)
      if (message.mentions.has(client.user) || message.channel.type === 'DM') {
        await handleMessage(message, client);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle member join events
  client.on('guildMemberAdd', async (member) => {
    try {
      // Check for raid patterns
      await checkRaidProtection(member);
      
      // Log member join
      await db.logMemberJoin({
        userId: member.id,
        guildId: member.guild.id,
        timestamp: new Date()
      });

      // Send welcome message if configured
      const config = await db.getGuildConfig(member.guild.id);
      if (config?.welcomeChannelId) {
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel) {
          await channel.send(`👋 Benvenuto ${member}, nel server **${member.guild.name}**!`);
        }
      }
    } catch (error) {
      console.error('Error handling member join:', error);
    }
  });

  // Handle member leave events
  client.on('guildMemberRemove', async (member) => {
    try {
      await db.logMemberLeave({
        userId: member.id,
        guildId: member.guild.id,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling member leave:', error);
    }
  });

  // Handle errors
  client.on('error', (error) => {
    console.error('Discord client error:', error);
  });

  // Login to Discord
  client.login(token).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1);
  });

  return client;
}

module.exports = { initBot };
