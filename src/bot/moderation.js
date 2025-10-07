// src/bot/moderation.js
// Comprehensive moderation system with auto-moderation features for staff

const { PermissionFlagsBits, EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../store/db');

/**
 * Check if user has moderation permissions
 * @param {GuildMember} member - Guild member to check
 * @returns {boolean}
 */
function hasModPermissions(member) {
  return member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
         member.permissions.has(PermissionFlagsBits.BanMembers) ||
         member.permissions.has(PermissionFlagsBits.KickMembers) ||
         member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Log moderation action to database and modlog channel
 * @param {string} guildId - Guild ID
 * @param {string} action - Action type
 * @param {Object} details - Action details
 */
async function logAction(guildId, action, details) {
  try {
    // Save to database
    await db.logModeration({
      guildId,
      action,
      moderatorId: details.moderatorId || 'SYSTEM',
      userId: details.userId,
      reason: details.reason || 'No reason provided',
      timestamp: new Date()
    });

    // Send to modlog channel if configured
    const config = await db.getGuildConfig(guildId);
    if (config?.modlogChannelId) {
      const guild = details.guild || await details.client.guilds.fetch(guildId);
      const channel = guild.channels.cache.get(config.modlogChannelId);
      
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(`🛡️ Moderation Action: ${action.toUpperCase()}`)
          .setColor(getActionColor(action))
          .addFields(
            { name: 'User', value: `<@${details.userId}> (${details.userId})`, inline: true },
            { name: 'Moderator', value: details.moderatorId === 'SYSTEM' ? 'AutoMod' : `<@${details.moderatorId}>`, inline: true },
            { name: 'Reason', value: details.reason || 'No reason provided', inline: false }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
}

/**
 * Get color for action type
 * @param {string} action - Action type
 * @returns {number}
 */
function getActionColor(action) {
  const colors = {
    'ban': 0xFF0000,
    'kick': 0xFF6600,
    'timeout': 0xFFAA00,
    'warn': 0xFFFF00,
    'unmute': 0x00FF00,
    'unban': 0x00AAFF,
    'auto_moderation': 0xFF00FF
  };
  return colors[action] || 0x808080;
}

/**
 * Ban a user from the guild
 * @param {Guild} guild - Discord guild
 * @param {string} userId - User ID to ban
 * @param {string} reason - Ban reason
 * @param {string} moderatorId - Moderator ID
 * @param {number} deleteMessageDays - Days of messages to delete (0-7)
 */
async function banUser(guild, userId, reason, moderatorId, deleteMessageDays = 1) {
  try {
    await guild.members.ban(userId, {
      reason: `${reason} | Moderator: ${moderatorId}`,
      deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
    });

    await logAction(guild.id, 'ban', {
      userId,
      moderatorId,
      reason,
      guild
    });

    return { success: true, message: `User <@${userId}> has been banned.` };
  } catch (error) {
    console.error('Error banning user:', error);
    return { success: false, message: 'Failed to ban user. Check bot permissions.' };
  }
}

/**
 * Kick a user from the guild
 * @param {Guild} guild - Discord guild
 * @param {string} userId - User ID to kick
 * @param {string} reason - Kick reason
 * @param {string} moderatorId - Moderator ID
 */
async function kickUser(guild, userId, reason, moderatorId) {
  try {
    const member = await guild.members.fetch(userId);
    await member.kick(`${reason} | Moderator: ${moderatorId}`);

    await logAction(guild.id, 'kick', {
      userId,
      moderatorId,
      reason,
      guild
    });

    return { success: true, message: `User <@${userId}> has been kicked.` };
  } catch (error) {
    console.error('Error kicking user:', error);
    return { success: false, message: 'Failed to kick user. Check bot permissions.' };
  }
}

/**
 * Timeout a user (mute)
 * @param {Guild} guild - Discord guild
 * @param {string} userId - User ID to timeout
 * @param {number} duration - Duration in milliseconds
 * @param {string} reason - Timeout reason
 * @param {string} moderatorId - Moderator ID
 */
async function timeoutUser(guild, userId, duration, reason, moderatorId) {
  try {
    const member = await guild.members.fetch(userId);
    await member.timeout(duration, `${reason} | Moderator: ${moderatorId}`);

    await logAction(guild.id, 'timeout', {
      userId,
      moderatorId,
      reason: `${reason} (Duration: ${Math.floor(duration / 60000)}m)`,
      guild
    });

    return { success: true, message: `User <@${userId}> has been timed out for ${Math.floor(duration / 60000)} minutes.` };
  } catch (error) {
    console.error('Error timing out user:', error);
    return { success: false, message: 'Failed to timeout user. Check bot permissions.' };
  }
}

/**
 * Warn a user
 * @param {Guild} guild - Discord guild
 * @param {string} userId - User ID to warn
 * @param {string} reason - Warning reason
 * @param {string} moderatorId - Moderator ID
 */
async function warnUser(guild, userId, reason, moderatorId) {
  try {
    // Save warning to database
    await db.addWarning({
      guildId: guild.id,
      userId,
      moderatorId,
      reason,
      timestamp: new Date()
    });

    await logAction(guild.id, 'warn', {
      userId,
      moderatorId,
      reason,
      guild
    });

    // Try to DM the user
    try {
      const user = await guild.client.users.fetch(userId);
      await user.send(`⚠️ You have been warned in **${guild.name}**\nReason: ${reason}`);
    } catch (dmError) {
      // User has DMs disabled
    }

    // Get warning count
    const warnings = await db.getUserWarnings(guild.id, userId);
    
    return { 
      success: true, 
      message: `User <@${userId}> has been warned. Total warnings: ${warnings.length}` 
    };
  } catch (error) {
    console.error('Error warning user:', error);
    return { success: false, message: 'Failed to warn user.' };
  }
}

/**
 * Check for invite links in message
 * @param {string} content - Message content
 * @returns {boolean}
 */
function containsInvite(content) {
  const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/gi;
  return inviteRegex.test(content);
}

/**
 * Check for spam patterns
 * @param {Message} message - Discord message
 * @returns {Promise<Object>}
 */
async function checkSpam(message) {
  try {
    const config = await db.getGuildConfig(message.guild.id);
    if (!config?.antispamEnabled) return { isSpam: false };

    const userId = message.author.id;
    const guildId = message.guild.id;
    
    // Get recent messages from this user
    const recentMessages = await db.getRecentMessages(guildId, userId, 10000); // Last 10 seconds
    
    // Spam detection criteria
    const messageCount = recentMessages.length + 1;
    const duplicateCount = recentMessages.filter(m => m.content === message.content).length;
    const mentionCount = message.mentions.users.size;
    
    // Spam thresholds
    const isSpam = 
      messageCount > 5 ||                    // More than 5 messages in 10 seconds
      duplicateCount > 3 ||                  // More than 3 identical messages
      mentionCount > 5;                      // More than 5 mentions in one message
    
    if (isSpam) {
      return {
        isSpam: true,
        reason: messageCount > 5 ? 'Message flooding' :
                duplicateCount > 3 ? 'Duplicate messages' :
                'Excessive mentions'
      };
    }
    
    // Store message for spam checking
    await db.storeMessage({
      guildId,
      userId,
      messageId: message.id,
      content: message.content,
      timestamp: new Date()
    });
    
    return { isSpam: false };
  } catch (error) {
    console.error('Error checking spam:', error);
    return { isSpam: false };
  }
}

/**
 * Handle auto-moderation for messages
 * @param {Message} message - Discord message
 * @returns {Promise<Object>}
 */
async function handleAutoMod(message) {
  try {
    // Skip if user has mod permissions
    if (hasModPermissions(message.member)) {
      return { triggered: false };
    }

    const config = await db.getGuildConfig(message.guild.id);
    
    // Check for invite links
    if (config?.antiInviteEnabled && containsInvite(message.content)) {
      await message.delete().catch(() => {});
      await timeoutUser(
        message.guild,
        message.author.id,
        5 * 60 * 1000, // 5 minutes
        'Auto-mod: Posting invite links',
        'SYSTEM'
      );
      
      return {
        triggered: true,
        reason: 'Invite link detected',
        action: 'Message deleted, user timed out for 5 minutes'
      };
    }
    
    // Check for spam
    const spamCheck = await checkSpam(message);
    if (spamCheck.isSpam) {
      await message.delete().catch(() => {});
      await timeoutUser(
        message.guild,
        message.author.id,
        10 * 60 * 1000, // 10 minutes
        `Auto-mod: ${spamCheck.reason}`,
        'SYSTEM'
      );
      
      return {
        triggered: true,
        reason: spamCheck.reason,
        action: 'Message deleted, user timed out for 10 minutes'
      };
    }
    
    return { triggered: false };
  } catch (error) {
    console.error('Error in auto-moderation:', error);
    return { triggered: false };
  }
}

/**
 * Get user's moderation history
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function getUserModHistory(guildId, userId) {
  try {
    return await db.getUserModHistory(guildId, userId);
  } catch (error) {
    console.error('Error getting mod history:', error);
    return [];
  }
}

/**
 * Clean up old messages and warnings
 * @param {string} guildId - Guild ID
 * @param {number} days - Days to keep
 */
async function cleanup(guildId, days = 30) {
  try {
    await db.cleanupOldData(guildId, days);
    console.log(`✅ Cleaned up data older than ${days} days for guild ${guildId}`);
  } catch (error) {
    console.error('Error cleaning up data:', error);
  }
}

module.exports = {
  hasModPermissions,
  logAction,
  banUser,
  kickUser,
  timeoutUser,
  warnUser,
  containsInvite,
  checkSpam,
  handleAutoMod,
  getUserModHistory,
  cleanup
};
