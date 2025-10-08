const db = require('../store/db');
module.exports = {
  name: 'leaderboard',
  description: 'Visualizza la classifica degli utenti per XP',
  async execute(interaction) {
    const leaderboard = await db.getLeaderboard();
    let reply = '**Leaderboard XP:**\n';
    leaderboard.forEach((entry, i) => {
      reply += `${i+1}. <@${entry.userId}> — XP: ${entry.xp}\n`;
    });
    await interaction.reply(reply);
  }
};
