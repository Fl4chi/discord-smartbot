const { EmbedBuilder } = require('discord.js');
const natural = require('natural');
const sentiment = require('sentiment');
const axios = require('axios');
const winston = require('winston');

// Logger per AI Moderation
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-moderation.log' }),
    new winston.transports.Console()
  ]
});

class AIModeration {
  constructor() {
    this.client = null;
    this.sentimentAnalyzer = new sentiment();
    this.spamDetector = {
      userMessages: new Map(),
      cleanupInterval: null
    };
    this.toxicWords = [
      // Lista parole tossiche (italiano e inglese)
      'stronzo', 'merda', 'cazzo', 'fottuti', 'bastardo',
      'shit', 'fuck', 'damn', 'bitch', 'asshole',
      'idiota', 'stupido', 'coglione', 'porco', 'schifo'
    ];
    this.suspiciousPatterns = [
      /https?:\/\/discord\.gg\/\w+/gi,  // Discord invites
      /https?:\/\/[\w-]+\.[\w]+/gi,      // General links
      /@everyone|@here/gi,              // Mass mentions
      /[A-Z]{10,}/g,                    // Excessive caps
      /(..)\1{4,}/g                     // Repeated characters
    ];
  }

  init(client) {
    this.client = client;
    this.startSpamCleanup();
    logger.info('AI Moderation System inizializzato');
  }

  startSpamCleanup() {
    // Pulisce i dati spam ogni 5 minuti
    this.spamDetector.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [userId, data] of this.spamDetector.userMessages) {
        if (now - data.lastMessage > 300000) { // 5 minuti
          this.spamDetector.userMessages.delete(userId);
        }
      }
    }, 300000);
  }

  async checkMessage(message) {
    if (!message.guild || message.author.bot) return;

    try {
      const analysis = await this.analyzeMessage(message);
      
      if (analysis.shouldModerate) {
        await this.moderateMessage(message, analysis);
      }

      // Log analisi per miglioramenti futuri
      logger.info('Message analyzed', {
        userId: message.author.id,
        guildId: message.guild.id,
        analysis: analysis,
        content: message.content.substring(0, 100)
      });

    } catch (error) {
      logger.error('Errore nell\'analisi AI del messaggio:', error);
    }
  }

  async analyzeMessage(message) {
    const analysis = {
      toxicity: 0,
      spam: 0,
      sentiment: 0,
      suspiciousLinks: false,
      massiveCaps: false,
      reasons: [],
      shouldModerate: false,
      action: null
    };

    const content = message.content.toLowerCase();

    // 1. Analisi tossicità
    analysis.toxicity = this.analyzeToxicity(content);
    if (analysis.toxicity > 0.6) {
      analysis.reasons.push('Linguaggio tossico rilevato');
    }

    // 2. Rilevamento spam
    analysis.spam = this.detectSpam(message);
    if (analysis.spam > 0.7) {
      analysis.reasons.push('Comportamento spam rilevato');
    }

    // 3. Analisi sentiment
    const sentimentResult = this.sentimentAnalyzer.analyze(message.content);
    analysis.sentiment = sentimentResult.score;
    if (sentimentResult.score < -5) {
      analysis.reasons.push('Sentimento molto negativo');
    }

    // 4. Controllo link sospetti
    analysis.suspiciousLinks = this.checkSuspiciousLinks(message.content);
    if (analysis.suspiciousLinks) {
      analysis.reasons.push('Link sospetti rilevati');
    }

    // 5. Controllo caps massive
    analysis.massiveCaps = this.checkMassiveCaps(message.content);
    if (analysis.massiveCaps) {
      analysis.reasons.push('Uso eccessivo di maiuscole');
    }

    // Decisione moderazione
    if (analysis.toxicity > 0.8 || analysis.spam > 0.9) {
      analysis.shouldModerate = true;
      analysis.action = 'delete';
    } else if (analysis.toxicity > 0.6 || analysis.spam > 0.7 || analysis.suspiciousLinks) {
      analysis.shouldModerate = true;
      analysis.action = 'warn';
    }

    return analysis;
  }

  analyzeToxicity(content) {
    let toxicityScore = 0;
    const words = content.split(/\s+/);
    
    for (const word of words) {
      if (this.toxicWords.some(toxic => word.includes(toxic))) {
        toxicityScore += 0.3;
      }
    }

    return Math.min(toxicityScore, 1);
  }

  detectSpam(message) {
    const userId = message.author.id;
    const now = Date.now();
    
    if (!this.spamDetector.userMessages.has(userId)) {
      this.spamDetector.userMessages.set(userId, {
        messages: [],
        lastMessage: now
      });
    }

    const userData = this.spamDetector.userMessages.get(userId);
    userData.messages.push({ timestamp: now, content: message.content });
    userData.lastMessage = now;

    // Rimuovi messaggi più vecchi di 1 minuto
    userData.messages = userData.messages.filter(msg => 
      now - msg.timestamp < 60000
    );

    // Calcola score spam
    let spamScore = 0;
    
    // Molti messaggi in poco tempo
    if (userData.messages.length > 5) {
      spamScore += 0.4;
    }
    
    // Messaggi duplicati
    const uniqueMessages = new Set(userData.messages.map(m => m.content));
    if (uniqueMessages.size < userData.messages.length * 0.5) {
      spamScore += 0.3;
    }
    
    // Messaggio molto lungo
    if (message.content.length > 500) {
      spamScore += 0.2;
    }

    return Math.min(spamScore, 1);
  }

  checkSuspiciousLinks(content) {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  checkMassiveCaps(content) {
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    return capsCount > content.length * 0.6 && content.length > 10;
  }

  async moderateMessage(message, analysis) {
    try {
      const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('🤖 MinfoAI - Moderazione Automatica')
        .setDescription(`Messaggio moderato automaticamente`)
        .addFields(
          { name: '👤 Utente', value: `${message.author.tag}`, inline: true },
          { name: '📊 Score', value: `Tossicità: ${(analysis.toxicity * 100).toFixed(1)}%`, inline: true },
          { name: '⚠️ Motivi', value: analysis.reasons.join('\n') || 'N/A', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'MinfoAI Moderation System' });

      if (analysis.action === 'delete') {
        await message.delete();
        
        // Avviso in DM all'utente
        try {
          await message.author.send({
            embeds: [embed.setDescription('Il tuo messaggio è stato rimosso automaticamente dal sistema AI di moderazione.')]
          });
        } catch (dmError) {
          // Ignore se non può inviare DM
        }

        // Log nel canale di moderazione
        await this.sendModerationLog(message.guild, embed, message.content);
        
        // Timeout temporaneo per messaggi molto tossici
        if (analysis.toxicity > 0.9) {
          try {
            await message.member.timeout(300000, 'AI Moderation: contenuto altamente tossico'); // 5 minuti
          } catch (timeoutError) {
            logger.error('Errore timeout utente:', timeoutError);
          }
        }
        
      } else if (analysis.action === 'warn') {
        // Avviso pubblico
        const warningEmbed = new EmbedBuilder()
          .setColor('#ffa500')
          .setTitle('⚠️ Avviso Automatico')
          .setDescription(`${message.author}, il tuo messaggio contiene contenuto inappropriato.`)
          .addFields(
            { name: '📋 Motivi', value: analysis.reasons.join('\n'), inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'MinfoAI - Sistema AI Moderation' });

        await message.reply({ embeds: [warningEmbed] });
      }

      // Aggiorna statistiche database
      const dbModule = require('../store/db');
      await dbModule.logModerationAction({
        guildId: message.guild.id,
        userId: message.author.id,
        action: analysis.action,
        reason: analysis.reasons.join(', '),
        toxicityScore: analysis.toxicity,
        spamScore: analysis.spam,
        automated: true
      });

    } catch (error) {
      logger.error('Errore durante moderazione messaggio:', error);
    }
  }

  async sendModerationLog(guild, embed, originalContent) {
    try {
      // Cerca un canale di log
      const logChannel = guild.channels.cache.find(channel => 
        channel.name.includes('log') || 
        channel.name.includes('mod') ||
        channel.name === 'minfoai-logs'
      );

      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = embed
          .addFields({
            name: '💬 Contenuto Originale',
            value: originalContent.length > 1000 
              ? originalContent.substring(0, 1000) + '...' 
              : originalContent,
            inline: false
          });

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      logger.error('Errore invio log moderazione:', error);
    }
  }

  // Funzioni per gestione whitelist/blacklist
  async addToWhitelist(guildId, userId) {
    try {
      const dbModule = require('../store/db');
      await dbModule.addToModerationWhitelist(guildId, userId);
      logger.info(`Utente ${userId} aggiunto alla whitelist in ${guildId}`);
    } catch (error) {
      logger.error('Errore aggiunta whitelist:', error);
    }
  }

  async addToBlacklist(guildId, userId) {
    try {
      const dbModule = require('../store/db');
      await dbModule.addToModerationBlacklist(guildId, userId);
      logger.info(`Utente ${userId} aggiunto alla blacklist in ${guildId}`);
    } catch (error) {
      logger.error('Errore aggiunta blacklist:', error);
    }
  }

  // Statistiche AI Moderation
  async getStats(guildId) {
    try {
      const dbModule = require('../store/db');
      return await dbModule.getModerationStats(guildId);
    } catch (error) {
      logger.error('Errore recupero statistiche:', error);
      return null;
    }
  }

  // Cleanup al shutdown
  destroy() {
    if (this.spamDetector.cleanupInterval) {
      clearInterval(this.spamDetector.cleanupInterval);
    }
    logger.info('AI Moderation System disconnesso');
  }
}

// Istanza singleton
const aiModeration = new AIModeration();

module.exports = aiModeration;
