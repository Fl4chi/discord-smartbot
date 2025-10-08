const db = require('../store/db');
module.exports = {
  name: 'mission',
  description: 'Completa la missione giornaliera e ottieni XP!',
  async execute(interaction) {
    const result = await db.completeDailyMission(interaction.user.id);
    if (result.success) {
      await interaction.reply(`Missione completata! Guadagni ${result.xp} XP e il badge ${result.badge}`);
    } else {
      await interaction.reply('Hai già completato la missione di oggi! Riprova domani.');
    }
  }
};
