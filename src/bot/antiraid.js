// src/bot/antiraid.js
// Anti-raid and anti-spam protection system

const { PermissionFlagsBits } = require('discord.js');
const db = require('../store/db');
const { banUser, timeoutUser, logAction } = require('./moderation');

// Raid detection cache
const raidCache = new Map();
const userJoinCache = new Map();
const messageBurstCache = new Map();

/**
 * Clean up old cache entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  const expiry = 60000; // 1 minute
  
  for (const [key, value] of userJoinCache.entries()) {
    if (now - value.timestamp > expiry) {
      userJoinCache.delete(key);
    }
  }
  
  for (const [key, value] of messageBurstCache.entries()) {
    if (now - value.timestamp > expiry) {
      messageBurstCache.delete(key);
    }
  }
}, 300000);

/**
 * Check if guild is under raid
 * @param {string} guildId - Guild ID
 * @returns {boolean}
 */
function isUnderRaid(guildId) {
  return raidCache.has(guildId) && raidCache.get(guildId).active;
}

/**
 * Activate raid mode for guild
 * @param {Guild} guild - Discord guild
 * @param {string} reason - Raid reason
 */
async function activateRaidMode(guild, reason) {
  try {
    raidCache.set(guild.id, {
      active: true,
      startTime: Date.now(),
      reason
    });

    await logAction(guild.id, 'raid_mode_activated', {
      guild,
      reason,
      moderatorId: 'SYSTEM'
    });

    // Increase verification level temporarily
    const currentLevel = guild.verificationLevel;
    if (currentLevel < 4) {
      await guild.setVerificationLevel(4, 'Anti-raid protection activated');
    }

    console.log(`🚨 Raid mode activated for guild ${guild.name}: ${reason}`);
    
    // Auto-deactivate after 30 minutes
    setTimeout(() => {
      deactivateRaidMode(guild.id);
    }, 30 * 60 * 1000);
  } catch (error) {
    console.error('Error activating raid mode:', error);
  }
}

/**
 * Deactivate raid mode for guild
 * @param {string} guildId - Guild ID
 */
async function deactivateRaidMode(guildId) {
  try {
    const raidData = raidCache.get(guildId);
    if (!raidData) return;

    raidCache.delete(guildId);

    await logAction(guildId, 'raid_mode_deactivated', {
      reason: 'Raid protection auto-deactivated',
      moderatorId: 'SYSTEM'
    });

    console.log(`✅ Raid mode deactivated for guild ${guildId}`);
  } catch (error) {
    console.error('Error deactivating raid mode:', error);
  }
}

/**
 * Check for suspicious join patterns (member join raid detection)
 * @param {GuildMember} member - New guild member
 * @returns {Promise<Object>}
 */
async function checkJoinRaid(member) {
  try {
    const config = await db.getGuildConfig(member.guild.id);
    if (!config?.antiraidEnabled) return { triggered: false };

    const guildId = member.guild.id;
    const now = Date.now();
    const timeWindow = 10000; // 10 seconds

    // Initialize or get join tracking
    if (!userJoinCache.has(guildId)) {
      userJoinCache.set(guildId, {
        joins: [],
        timestamp: now
      });
    }

    const joinData = userJoinCache.get(guildId);
    
    // Remove old joins outside time window
    joinData.joins = joinData.joins.filter(j => now - j.timestamp < timeWindow);
    
    // Add current join
    joinData.joins.push({
      userId: member.id,
      timestamp: now,
      accountAge: now - member.user.createdTimestamp
    });

    // Detection criteria
    const joinCount = joinData.joins.length;
    const newAccountCount = joinData.joins.filter(j => j.accountAge < 7 * 24 * 60 * 60 * 1000).length;
    const veryNewAccountCount = joinData.joins.filter(j => j.accountAge < 24 * 60 * 60 * 1000).length;

    // Raid thresholds
    const isRaid = 
      joinCount > 10 ||                    // More than 10 joins in 10 seconds
      newAccountCount > 5 ||               // More than 5 accounts < 7 days old
      veryNewAccountCount > 3;             // More than 3 accounts < 1 day old

    if (isRaid) {
      // Activate raid mode
      if (!isUnderRaid(guildId)) {
        await activateRaidMode(
          member.guild,
          `Suspicious join pattern: ${joinCount} joins in 10s, ${newAccountCount} new accounts`
        );
      }

      // Ban suspicious new accounts during raid
      if (member.user.createdTimestamp > now - 24 * 60 * 60 * 1000) {
        await banUser(
          member.guild,
          member.id,
          'Auto-ban: Account created during active raid (< 24h old)',
          'SYSTEM',
          1
        );

        return {
          triggered: true,
          reason: 'Raid detection - new account banned',
          action: 'User banned automatically'
        };
      }

      return {
        triggered: true,
        reason: 'Raid detection - monitoring active',
        action: 'Raid mode activated'
      };
    }

    // Check individual suspicious accounts
    const accountAge = now - member.user.createdTimestamp;
    const isSuspicious = 
      accountAge < 60 * 60 * 1000 ||       // Account < 1 hour old
      (!member.user.avatar && accountAge < 7 * 24 * 60 * 60 * 1000); // No avatar and < 7 days

    if (isSuspicious && config?.strictMode) {
      await member.kick('Auto-kick: Suspicious account (very new or incomplete profile)');
      
      await logAction(member.guild.id, 'auto_kick', {
        userId: member.id,
        reason: `Suspicious account: ${accountAge < 60 * 60 * 1000 ? 'Very new' : 'No avatar'}`,
        moderatorId: 'SYSTEM',
        guild: member.guild
      });

      return {
        triggered: true,
        reason: 'Suspicious account kicked',
        action: 'User kicked automatically'
      };
    }

    return { triggered: false };
  } catch (error) {
    console.error('Error checking join raid:', error);
    return { triggered: false };
  }
}

/**
 * Check for message burst attacks
 * @param {Message} message - Discord message
 * @returns {Promise<Object>}
 */
async function checkMessageBurst(message) {
  try {
    const config = await db.getGuildConfig(message.guild.id);
    if (!config?.antiraidEnabled) return { triggered: false };

    const guildId = message.guild.id;
    const channelId = message.channel.id;
    const now = Date.now();
    const timeWindow = 5000; // 5 seconds
    const cacheKey = `${guildId}-${channelId}`;

    // Initialize or get burst tracking
    if (!messageBurstCache.has(cacheKey)) {
      messageBurstCache.set(cacheKey, {
        messages: [],
        timestamp: now
      });
    }

    const burstData = messageBurstCache.get(cacheKey);
    
    // Remove old messages outside time window
    burstData.messages = burstData.messages.filter(m => now - m.timestamp < timeWindow);
    
    // Add current message
    burstData.messages.push({
      userId: message.author.id,
      timestamp: now
    });

    // Burst detection criteria
    const messageCount = burstData.messages.length;
    const uniqueUsers = new Set(burstData.messages.map(m => m.userId)).size;

    // If many messages from few users = coordinated attack
    const isBurst = messageCount > 20 && uniqueUsers < 5;

    if (isBurst) {
      // Get the spammers
      const userCounts = {};
      burstData.messages.forEach(m => {
        userCounts[m.userId] = (userCounts[m.userId] || 0) + 1;
      });

      // Timeout users with high message counts
      for (const [userId, count] of Object.entries(userCounts)) {
        if (count > 5) {
          const member = await message.guild.members.fetch(userId).catch(() => null);
          if (member && !member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await timeoutUser(
              message.guild,
              userId,
              15 * 60 * 1000, // 15 minutes
              'Auto-mod: Coordinated message burst attack',
              'SYSTEM'
            );
          }
        }
      }

      // Slow mode if not already enabled
      const channel = message.channel;
      if (channel.rateLimitPerUser === 0) {
        await channel.setRateLimitPerUser(10, 'Anti-raid: Message burst detected');
      }

      return {
        triggered: true,
        reason: 'Message burst attack detected',
        action: 'Spammers timed out, slow mode enabled'
      };
    }

    return { triggered: false };
  } catch (error) {
    console.error('Error checking message burst:', error);
    return { triggered: false };
  }
}

/**
 * Main raid protection check (for messages)
 * @param {Message|GuildMember} target - Message or Member to check
 * @returns {Promise<Object>}
 */
async function checkRaidProtection(target) {
  try {
    // Check if it's a member join event
    if (target.constructor.name === 'GuildMember') {
      return await checkJoinRaid(target);
    }
    
    // Check if it's a message event
    if (target.constructor.name === 'Message') {
      // Check message burst
      const burstCheck = await checkMessageBurst(target);
      if (burstCheck.triggered) return burstCheck;

      // If under raid mode, be more aggressive
      if (isUnderRaid(target.guild.id)) {
        const member = target.member;
        const accountAge = Date.now() - target.author.createdTimestamp;
        
        // Auto-timeout very new accounts during raid
        if (accountAge < 60 * 60 * 1000 && !member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          await target.delete().catch(() => {});
          await timeoutUser(
            target.guild,
            target.author.id,
            30 * 60 * 1000, // 30 minutes
            'Auto-mod: New account posting during raid',
            'SYSTEM'
          );
          
          return {
            triggered: true,
            reason: 'Raid mode active - new account restricted',
            action: 'Message deleted, user timed out'
          };
        }
      }
    }

    return { triggered: false };
  } catch (error) {
    console.error('Error in raid protection:', error);
    return { triggered: false };
  }
}

/**
 * Manually activate raid mode (for staff)
 * @param {Guild} guild - Discord guild
 * @param {string} reason - Reason for activation
 */
async function manualRaidMode(guild, reason = 'Manual activation by staff') {
  await activateRaidMode(guild, reason);
}

/**
 * Manually deactivate raid mode (for staff)
 * @param {string} guildId - Guild ID
 */
async function manualDeactivateRaidMode(guildId) {
  await deactivateRaidMode(guildId);
}

/**
 * Get raid statistics for guild
 * @param {string} guildId - Guild ID
 * @returns {Object}
 */
function getRaidStats(guildId) {
  const joinData = userJoinCache.get(guildId);
  const isRaid = raidCache.get(guildId);
  
  return {
    raidModeActive: isUnderRaid(guildId),
    raidData: isRaid || null,
    recentJoins: joinData?.joins.length || 0,
    joinHistory: joinData?.joins || []
  };
}

module.exports = {
  checkRaidProtection,
  checkJoinRaid,
  checkMessageBurst,
  activateRaidMode,
  deactivateRaidMode,
  manualRaidMode,
  manualDeactivateRaidMode,
  isUnderRaid,
  getRaidStats
};
