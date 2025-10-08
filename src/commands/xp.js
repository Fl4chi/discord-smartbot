const db = require('../store/db');
module.exports = {
  name: 'xp',
  description: 'Visualizza XP, livello e badge',
  async execute(interaction) {
    const { xp, level, badges } = await db.getUserGamification(interaction.user.id);
    await interaction.reply(`XP: ${xp} | Livello: ${level} | Badge: ${badges.join(', ')}`);
  }
};
