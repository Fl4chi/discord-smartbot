// src/jobs/retention.js
// Data retention and cleanup jobs

const cron = require('node-cron');
const db = require('../store/db');

/**
 * Start retention job scheduler
 * @param {Client} client - Discord client
 */
function startRetentionJobs(client) {
  console.log('📅 Starting retention jobs...');

  // Daily cleanup job - runs at 3 AM every day
  cron.schedule('0 3 * * *', async () => {
    console.log('🧹 Running daily cleanup job...');
    await runDailyCleanup(client);
  });

  // Weekly analytics job - runs every Sunday at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('📈 Running weekly analytics job...');
    await runWeeklyAnalytics(client);
  });

  // Hourly cache cleanup
  cron.schedule('0 * * * *', async () => {
    console.log('📦 Running cache cleanup...');
    await runCacheCleanup();
  });

  console.log('✅ Retention jobs started successfully');
}

/**
 * Run daily cleanup tasks
 * @param {Client} client - Discord client
 */
async function runDailyCleanup(client) {
  try {
    const startTime = Date.now();
    let cleanupStats = {
      guilds: 0,
      messages: 0,
      logs: 0
    };

    // Get all guilds the bot is in
    const guilds = client.guilds.cache;

    for (const [guildId, guild] of guilds) {
      try {
        // Clean up old messages (older than 30 days)
        await db.cleanupOldData(guildId, 30);
        cleanupStats.guilds++;

        // Clean up old temporary data
        await cleanupTempData(guildId);

      } catch (error) {
        console.error(`Error cleaning up guild ${guildId}:`, error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Daily cleanup completed in ${duration}s:`, cleanupStats);
  } catch (error) {
    console.error('Error in daily cleanup:', error);
  }
}

/**
 * Run weekly analytics generation
 * @param {Client} client - Discord client
 */
async function runWeeklyAnalytics(client) {
  try {
    const startTime = Date.now();
    const guilds = client.guilds.cache;

    for (const [guildId, guild] of guilds) {
      try {
        // Generate weekly statistics
        const stats = await db.getGuildStats(guildId);
        
        // Log statistics for monitoring
        console.log(`📊 Weekly stats for ${guild.name}:`, {
          modActions: stats.totalModActions,
          warnings: stats.totalWarnings,
          members: stats.totalMembers
        });

        // Optionally send report to designated channel
        const config = await db.getGuildConfig(guildId);
        if (config?.statsChannelId) {
          const channel = guild.channels.cache.get(config.statsChannelId);
          if (channel) {
            await channel.send(
              `📊 **Weekly Server Statistics**\n\n` +
              `🛡️ Moderation Actions: ${stats.totalModActions}\n` +
              `⚠️ Total Warnings: ${stats.totalWarnings}\n` +
              `👥 Total Members: ${stats.totalMembers}\n\n` +
              `*Report generated automatically*`
            );
          }
        }
      } catch (error) {
        console.error(`Error generating analytics for guild ${guildId}:`, error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Weekly analytics completed in ${duration}s`);
  } catch (error) {
    console.error('Error in weekly analytics:', error);
  }
}

/**
 * Run cache cleanup
 */
async function runCacheCleanup() {
  try {
    // This would integrate with your caching system
    // For now, it's a placeholder for future implementation
    console.log('✅ Cache cleanup completed');
  } catch (error) {
    console.error('Error in cache cleanup:', error);
  }
}

/**
 * Clean up temporary data
 * @param {string} guildId - Guild ID
 */
async function cleanupTempData(guildId) {
  try {
    // Clean up old temporary moderation data
    // This is a placeholder for custom cleanup logic
    
    // Example: Remove expired timeouts, clean up old session data, etc.
    console.log(`Cleaned temp data for guild ${guildId}`);
  } catch (error) {
    console.error('Error cleaning temp data:', error);
  }
}

/**
 * Manually trigger cleanup for a specific guild
 * @param {string} guildId - Guild ID
 * @param {number} days - Days of data to keep
 */
async function manualCleanup(guildId, days = 30) {
  try {
    await db.cleanupOldData(guildId, days);
    await cleanupTempData(guildId);
    console.log(`✅ Manual cleanup completed for guild ${guildId}`);
    return { success: true, message: `Cleanup completed for last ${days} days` };
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    return { success: false, message: 'Cleanup failed' };
  }
}

/**
 * Get retention statistics
 * @param {Client} client - Discord client
 * @returns {Promise<Object>}
 */
async function getRetentionStats(client) {
  try {
    const guilds = client.guilds.cache;
    let totalStats = {
      guilds: guilds.size,
      totalModActions: 0,
      totalWarnings: 0,
      totalMembers: 0
    };

    for (const [guildId] of guilds) {
      const stats = await db.getGuildStats(guildId);
      totalStats.totalModActions += stats.totalModActions || 0;
      totalStats.totalWarnings += stats.totalWarnings || 0;
      totalStats.totalMembers += stats.totalMembers || 0;
    }

    return totalStats;
  } catch (error) {
    console.error('Error getting retention stats:', error);
    return null;
  }
}

/**
 * Stop all retention jobs
 */
function stopRetentionJobs() {
  cron.getTasks().forEach((task) => task.stop());
  console.log('🛑 Retention jobs stopped');
}

module.exports = {
  startRetentionJobs,
  runDailyCleanup,
  runWeeklyAnalytics,
  runCacheCleanup,
  manualCleanup,
  getRetentionStats,
  stopRetentionJobs
};
